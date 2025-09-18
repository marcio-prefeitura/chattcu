import json
import logging
import time
from typing import Any, List, Optional

from langchain.callbacks.manager import CallbackManagerForRetrieverRun
from langchain.schema import Document
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
from src.infrastructure.env import INDEX_NAME_NORMAS

logger = logging.getLogger(__name__)


class NormasRetriever(BaseRetriever, BaseChatTCURetriever):
    top_k: Optional[int] = None
    system_message: Mensagem
    usr_roles: Any
    prompt_usuario: str
    llm: Any

    def set_system_message(self, system_message: Mensagem):
        self.system_message = system_message

    def set_usr_roles(self, usr_roles=[]):
        self.usr_roles = usr_roles

    def set_prompt_usuario(self, prompt_usuario: str):
        self.prompt_usuario = prompt_usuario

    def set_llm(self, llm):
        self.llm = llm

    async def _get_filtro(self):
        try:
            prompt = (
                "Responda obrigatoriamente com json sem markdown (campos: ano_inicial, "
                + "ano_final, pergunta) qual o ano descrito no prompt do usuário "
                + "(no formato numérico e caso não tenha informação responda com null) "
                + "e qual é o termo ou tópico principal da seguinte pergunta "
                + "(remover informação de ano e responda com o mínimo de palavras possíveis "
                + "para uso em uma engine de busca) citada no texto a seguir: \n{prompt}"
            )

            chain = (
                ChatPromptTemplate.from_template(prompt) | self.llm | StrOutputParser()
            )

            resp = await chain.ainvoke({"prompt": self.prompt_usuario})

            logger.info(resp)

            # converte a resposta
            resp = json.loads(resp)

            logger.info(resp)
        except json.JSONDecodeError as error:
            logger.error(error)
            resp = {
                "pergunta": self.prompt_usuario,
                "ano_inicial": None,
                "ano_final": None,
            }

        filtro = ""

        if resp["ano_inicial"]:
            filtro += f"ano_norma ge '{resp['ano_inicial']}'"

        if resp["ano_final"]:
            if filtro != "":
                filtro += " and "

            filtro += f"ano_norma le '{resp['ano_final']}'"

        # para evitar erro de busca de trechos sem pergunta ou com pergunta vazia
        if resp["pergunta"] is None or resp["pergunta"] == "":
            resp["pergunta"] = self.prompt_usuario

        return filtro, resp

    async def processar(self) -> List[Document]:
        logger.info("Normas Retriever")
        logger.info(f"PromptUSR: {self.prompt_usuario}")

        inicio = time.time()

        filtro, resp = await self._get_filtro()

        # define a fonte de informação antecipadamente para registro de que entrou na tool
        self.system_message.arquivos_busca = "Normativos do TCU"

        cogs = CognitiveSearch(
            index_name=INDEX_NAME_NORMAS, chunk_size=1, usr_roles=self.usr_roles
        )

        logger.info(f">> {self.top_k} - Top k")

        similarity_docs = await cogs.buscar_trechos_relevantes(
            search_text=resp["pergunta"],
            query_type="semantic",
            query_language="pt-br",
            semantic_configuration_name="semantic-normas",
            query_caption="extractive",
            filtro=filtro if filtro else None,
            selecao=["id", "titulo", "trecho", "linkPesquisaIntegrada"],
            search_fields=["titulo", "trecho"],
            top=self.top_k,
        )

        i = 0
        docs = []
        trechos = []

        async for doc in similarity_docs:
            id_trecho = source = (
                doc["titulo"].replace("\n", "").replace("\r", "") + "_" + str(i + 1)
            )

            conteudo = (
                id_trecho
                + "; linkPesquisaIntegrada: "
                + doc["linkPesquisaIntegrada"]
                + "; trecho: "
                + doc["trecho"].replace("\n", "").replace("\r", "")
            )

            conteudo_to_replace_on_trecho = (
                id_trecho
                + "; linkPesquisaIntegrada: "
                + doc["linkPesquisaIntegrada"]
                + "; trecho: "
            )

            docs.append(
                Document(
                    page_content=conteudo,
                    metadata={"source": source},
                )
            )

            trechos.append(
                Trecho(
                    pagina_arquivo=None,
                    conteudo=conteudo.replace(conteudo_to_replace_on_trecho, ""),
                    parametro_tamanho_trecho=len(doc["trecho"]),
                    search_score=doc["@search.score"],
                    id_registro=source,
                    link_sistema=doc["linkPesquisaIntegrada"],
                )
            )

            i += 1

        logger.info(">> TRECHOS RESGATADOS EM NormasRetriever")
        # define os demais atributos
        self.system_message.trechos = trechos
        self.system_message.parametro_tipo_busca = TipoBuscaEnum.BM25
        self.system_message.parametro_nome_indice_busca = NomeIndiceEnum.NORMATIVOS
        self.system_message.parametro_quantidade_trechos_relevantes_busca = self.top_k

        fim = time.time()

        logger.info(f"## Tempo total do Normas Retriver: {(fim - inicio)}")

        return docs

    async def _aget_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        return await self.processar()

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        pass

    async def execute(self, historico: Optional[List[BaseMessage]] = None):
        return await self.processar()
