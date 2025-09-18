import logging
import time
from typing import Any, List, Optional

from langchain import schema
from langchain.callbacks.manager import (
    AsyncCallbackManagerForRetrieverRun,
    CallbackManagerForRetrieverRun,
)
from langchain.docstore.document import Document
from langchain.schema.retriever import BaseRetriever
from langchain_core.messages.base import BaseMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from src.domain.llm.retriever.base_chattcu_retriever import BaseChatTCURetriever
from src.domain.mensagem import Mensagem
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum
from src.domain.trecho import Trecho
from src.infrastructure.cognitive_search.cognitive_search import CognitiveSearch
from src.infrastructure.env import INDEX_NAME_SISTEMA_CASA

logger = logging.getLogger(__name__)


class AdmSearchRetriever(BaseRetriever, BaseChatTCURetriever):
    system_message: Mensagem
    usr_roles: Any
    login: str
    llm: Any
    prompt_usuario: str
    top_k: Optional[int] = None
    """Number of results to retrieve. Set to None to retrieve all results."""

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        pass

    async def _aget_relevant_documents(
        self, query: str, *, run_manager: AsyncCallbackManagerForRetrieverRun
    ) -> List[schema.Document]:
        self.prompt_usuario = query
        return await self.get_trechos_relevantes()

    async def _get_pergunta_parafraseada(self, query):
        prompt = """Otimize o texto extraindo qual é o termo ou tópico principal \
            do texto que será indicado abaixo e responda com o mínimo de palavras possíveis \
            para uso em uma engine de busca.

            Observação 1: Não adicione mais conteúdo; 
            Observação 2: As palavras tidas como entidades: TCU, Tribunal e Tribunal de Contas da União devem ser omitidas, \
                          na reformulação do texto uma vez que todo conteúdo disponível se refere a estas;
            Observação 3: Remova artigos e termos comuns como "o que", "qual", "quando", e stopwords como "o", "a", "os", "as". \
                          deixe apenas palavras-chave relevantes para uma busca textual precisa.  
            Segue o texto para reformulação:\n{query}"""

        chain = ChatPromptTemplate.from_template(prompt) | self.llm | StrOutputParser()

        resp = await chain.ainvoke({"query": query})

        logger.info(f">>> Pergunta parafraseada: {resp}")
        return resp

    async def get_trechos_relevantes(self):
        inicio = time.time()

        self.system_message.arquivos_busca = "Sistema CASA"

        cogs = CognitiveSearch(
            index_name=INDEX_NAME_SISTEMA_CASA,
            chunk_size=1,
            usr_roles=self.usr_roles,
            login=self.login,
        )

        pergunta_parafraseada = await self._get_pergunta_parafraseada(
            self.prompt_usuario
        )

        similarity_docs = await cogs.buscar_trechos_relevantes(
            search_text=pergunta_parafraseada,
            filtro=None,
            selecao=[
                "nome_servico",
                "como_solicitar",
                "publico_alvo",
                "requisitos",
                "categoria",
                "link_sistema",
                "palavras_chave",
                "descricao_servico",
                "codigo_servico",
            ],
            search_fields=None,
            top=self.top_k,
            using_vectors=True,
        )

        docs = []
        trechos = []

        async for doc in similarity_docs:
            conteudo = (
                doc["nome_servico"]
                + ": "
                + doc["descricao_servico"].replace("\n", "").replace("\r", "")
                + "; como solicitar o serviço: "
                + doc["como_solicitar"].replace("\n", "").replace("\r", "")
                + "; link do sistema para solicitar o serviço: "
                + doc["link_sistema"].replace("\r", "")
                + "; público alvo do serviço: "
                + doc["publico_alvo"].replace("\n", "").replace("\r", "")
                + "; link com mais informações: "
                + "https://casa.apps.tcu.gov.br/servico/"
                + str(doc["codigo_servico"])
            )

            docs.append(
                Document(
                    page_content=conteudo,
                    metadata={"source": doc["nome_servico"]},
                )
            )

            trechos.append(
                Trecho(
                    pagina_arquivo=None,
                    conteudo=conteudo,
                    parametro_tamanho_trecho=None,
                    search_score=doc["@search.score"],
                    id_registro=doc["nome_servico"],
                    link_sistema=doc["link_sistema"],
                )
            )

        self.system_message.trechos = trechos
        self.system_message.parametro_tipo_busca = TipoBuscaEnum.ADA
        self.system_message.parametro_nome_indice_busca = NomeIndiceEnum.CASA
        self.system_message.parametro_quantidade_trechos_relevantes_busca = self.top_k

        fim = time.time()

        logger.info(f"## Tempo total do Retriver: {(fim - inicio)}")

        return docs

    async def execute(self, historico: Optional[List[BaseMessage]] = None):
        return await self.get_trechos_relevantes()
