import json
import logging
import time
from datetime import datetime
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
from src.domain.llm.util.util import get_ministros_as_string
from src.domain.mensagem import Mensagem
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum
from src.domain.trecho import Trecho
from src.infrastructure.cognitive_search.cognitive_search import CognitiveSearch
from src.infrastructure.env import FUSO_HORARIO, INDEX_NAME_JURISPRUDENCIA

logger = logging.getLogger(__name__)


class JurisprudenciaSearchRetriever(BaseRetriever, BaseChatTCURetriever):
    system_message: Mensagem
    usr_roles: Any
    prompt_usuario: str
    llm: Any

    top_k: Optional[int] = None
    """Number of results to retrieve. Set to None to retrieve all results."""

    class Config:
        arbitrary_types_allowed = True

    def set_system_message(self, system_message: Mensagem):
        self.system_message = system_message

    def set_usr_roles(self, usr_roles=[]):
        self.usr_roles = usr_roles

    def set_prompt_usuario(self, prompt_usuario: str):
        self.prompt_usuario = prompt_usuario

    def set_llm(self, llm):
        self.llm = llm

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        pass

    async def __get_filtro(self):
        resp = None
        try:
            prompt = (
                "A data e hora atual é {data_atual}, para caso precise. "
                "Responda obrigatoriamente com json sem markdown (campos: ano_inicial, "
                + "ano_final, autor e pergunta) quais os anos inicial e final "
                + "descritos no prompt do usuário "
                + "(no formato numérico e caso não tenha informação responda com null), "
                + "qual o nome do autor (ministro relator ou revisor) da jurisprudência "
                + "(os autores devem ser APENAS dessa lista: "
                + get_ministros_as_string()
                + ". Se não puder escolher, retorne nulo) "
                + "e qual é o termo ou tópico principal da seguinte pergunta (remover "
                + "informação de ano e do autor e responda com o mínimo de palavras possíveis "
                + "para uso em uma engine de busca) "
                + "citada no texto a seguir: \n{prompt}"
            )

            chain = (
                ChatPromptTemplate.from_template(prompt) | self.llm | StrOutputParser()
            )

            resp = await chain.ainvoke(
                {
                    "prompt": self.prompt_usuario,
                    "data_atual": datetime.now(FUSO_HORARIO).strftime("%d.%m.%Y %H:%M"),
                }
            )

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
                "autor": None,
            }

        filtro = ""

        if resp["ano_inicial"]:
            filtro += f"anoacordao ge '{resp['ano_inicial']}'"

        if resp["ano_final"]:
            if filtro != "":
                filtro += " and "

            filtro += f"anoacordao le '{resp['ano_final']}'"

        if resp["autor"]:
            if filtro != "":
                filtro += " and "

            filtro += f"autortese eq '{resp['autor']}'"

        # para evitar erro de busca de trechos sem pergunta ou com pergunta vazia
        if resp["pergunta"] is None or resp["pergunta"] == "":
            resp["pergunta"] = self.prompt_usuario

        return filtro, resp

    async def _aget_relevant_documents(
        self, query: str, *, run_manager: AsyncCallbackManagerForRetrieverRun
    ) -> List[schema.Document]:
        return await self.get_trechos_relevantes()

    async def get_trechos_relevantes(self):
        logger.info("Jurisprudência Retriever")
        logger.info(f"PromptUSR: {self.prompt_usuario}")

        inicio = time.time()

        # define a fonte de informação antecipadamente para registro de que entrou na tool
        self.system_message.arquivos_busca = "Jurisprudência Selecionada"

        cogs = CognitiveSearch(
            index_name=INDEX_NAME_JURISPRUDENCIA, chunk_size=1, usr_roles=self.usr_roles
        )

        filtro, resp = await self.__get_filtro()

        similarity_docs = await cogs.buscar_trechos_relevantes(
            search_text=resp["pergunta"],
            filtro=filtro,
            selecao=[
                "id",
                "trecho",
                "enunciado",
                "id_jurisprudencia",
                "numacordao",
                "anoacordao",
                "colegiado",
                "linkPesquisaIntegrada",
                "funcaoautortese",
                "autortese",
            ],
            search_fields=["trecho"],
            top=self.top_k,
            using_vectors=False,
        )

        i = 0
        docs = []
        trechos = []

        async for doc in similarity_docs:
            id_trecho = (
                "Acórdão "
                + doc["numacordao"]
                + "/"
                + doc["anoacordao"]
                + "-"
                + doc["colegiado"]
                + " - "
                + str(doc["funcaoautortese"]).title()
                + "(a) Ministro(a) "
                + str(doc["autortese"]).title()
                + "_"
                + str(i + 1)
            )
            conteudo = (
                id_trecho + ": " + doc["trecho"].replace("\n", "").replace("\r", "")
            )

            # docs.append(conteudo)
            docs.append(
                Document(
                    page_content=conteudo,
                    metadata={"source": id_trecho},
                )
            )

            trechos.append(
                Trecho(
                    pagina_arquivo=None,
                    conteudo=doc["trecho"].replace("\n", "").replace("\r", ""),
                    parametro_tamanho_trecho=1500,
                    search_score=doc["@search.score"],
                    id_registro=id_trecho,
                    link_sistema=doc["linkPesquisaIntegrada"],
                )
            )

            i += 1

        logger.info(">> TRECHOS RESGATADOS EM JurisprudenciaSearchRetriever")
        # define os demais atributos
        self.system_message.trechos = trechos
        self.system_message.parametro_tipo_busca = TipoBuscaEnum.BM25
        self.system_message.parametro_nome_indice_busca = NomeIndiceEnum.JURIS
        self.system_message.parametro_quantidade_trechos_relevantes_busca = self.top_k

        fim = time.time()

        logger.info(f"## Tempo total do Retriver: {(fim - inicio)}")

        return docs

    async def execute(self, historico: Optional[List[BaseMessage]] = None):
        return await self.get_trechos_relevantes()
