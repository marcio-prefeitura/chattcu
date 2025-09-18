import logging
import time
import traceback
import uuid
from typing import List

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorizedQuery
from langchain_openai.embeddings.azure import AzureOpenAIEmbeddings
from openai import AsyncAzureOpenAI
from opentelemetry import trace

from src.conf.env import configs
from src.infrastructure.env import MODELO_EMBEDDING_002
from src.infrastructure.roles import DESENVOLVEDOR, PREVIEW

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class CognitiveSearch:
    @tracer.start_as_current_span("__init__CognitiveSearch")
    def __init__(
        self,
        index_name: str,
        chunk_size: int,
        azure_search_key=configs.AZURE_SEARCH_SISTEMAS_KEY,
        azure_search_url=configs.AZURE_SEARCH_SISTEMAS_URL,
        chunk_overlap: int = 0,
        usr_roles=[],
        login: str = None,
    ):
        logger.info(f"Indice Selecionado: {index_name}")

        self.azure_search_key = azure_search_key
        self.azure_search_url = azure_search_url

        self.azure_credential = AzureKeyCredential(self.azure_search_key)
        self.index_name = index_name
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.usr_roles = usr_roles
        self.login = login

        self.api_key = configs.APIM_OPENAI_API_KEY
        self.api_base = configs.APIM_OPENAI_API_BASE
        self.modelo_embeddding = MODELO_EMBEDDING_002

    def get_embeddings_langchain(self):
        embeddings_openai = AzureOpenAIEmbeddings(
            api_key=self.api_key,
            deployment=self.modelo_embeddding,
            azure_endpoint=self.api_base,
            openai_api_type=configs.OPENAI_API_TYPE,
            headers={
                "usuario": self.login if self.login else "",
                "desenvol": str(DESENVOLVEDOR in self.usr_roles).lower(),
            },
            default_headers={
                "usuario": self.login if self.login else "",
                "desenvol": str(DESENVOLVEDOR in self.usr_roles).lower(),
            },
        )

        return embeddings_openai

    def __get_api_and_deployment(self):
        # api e modelo padrão
        api = "2023-05-15"
        deployment = self.modelo_embeddding

        # api e modelo no caso de exceção
        if self.index_name == "sistema_casa-embedding-3-large":
            api = "2023-12-01-preview"
            deployment = "text-embedding-3-large"

        return api, deployment

    @tracer.start_as_current_span("_get_embeddings")
    def _get_embeddings(self, execution_id):
        api, deployment = self.__get_api_and_deployment()

        embeddings_openai = AsyncAzureOpenAI(
            api_version=api,
            azure_endpoint=self.api_base,
            azure_deployment=deployment,
            api_key=self.api_key,
            default_headers={
                "usuario": self.login if self.login else "",
                "desenvol": str(DESENVOLVEDOR in self.usr_roles).lower(),
                "execution_id": str(execution_id),
            },
        )

        return embeddings_openai.embeddings

    @tracer.start_as_current_span("_get_search_client")
    def _get_search_client(self):
        endpoint_url = self.azure_search_url

        search_client = SearchClient(
            endpoint=endpoint_url,
            index_name=self.index_name,
            credential=self.azure_credential,
        )

        return search_client

    @tracer.start_as_current_span("_popular_indice")
    async def _popular_indice(self, sections):
        inicio = time.time()

        logger.info("Populando o indice")

        search_client = self._get_search_client()

        try:
            i = 0
            batch = []

            for sec in sections:
                batch.append(sec)

                i += 1

                if i % 100 == 0:
                    results = await search_client.upload_documents(documents=batch)
                    succeeded = sum([1 for r in results if r.succeeded])

                    logger.info(
                        f"\tIndexed {len(results)} sections, {succeeded} succeeded"
                    )

                    batch = []

            if batch:
                results = await search_client.upload_documents(documents=batch)
                succeeded = sum([1 for r in results if r.succeeded])

                logger.info(f"\tIndexed {len(results)} sections, {succeeded} succeeded")

            fim = time.time()
            logger.info(
                f"Tempo total gasto persistindo as seções no indice: {(fim - inicio)}"
            )
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error
        finally:
            await search_client.close()

    @tracer.start_as_current_span("_get_vetores")
    async def _get_vetores(self, question, top, fields: str = "conteudoVector"):
        logger.info(question)

        emb = await self._get_embeddings(execution_id=uuid.uuid4()).create(
            input=question, model=self.modelo_embeddding
        )

        vectors = [
            VectorizedQuery(
                vector=emb.data[0].embedding,
                k_nearest_neighbors=top,
                fields=fields,
            )
        ]

        return vectors

    @tracer.start_as_current_span("buscar_trechos_relevantes")
    async def buscar_trechos_relevantes(
        self,
        **kwargs,
    ):
        search_text = kwargs.get("search_text", None)
        filtro = kwargs.get("filtro", None)
        selecao = kwargs.get("selecao", None)
        search_fields = kwargs.get("search_fields", None)
        top = kwargs.get("top")
        using_vectors = kwargs.get("using_vectors", False)
        query_type = kwargs.get("query_type", None)
        query_language = kwargs.get("query_language", None)
        semantic_configuration_name = kwargs.get("semantic_configuration_name", None)
        query_caption = kwargs.get("query_caption", None)
        inicio = time.time()

        search_client = self._get_search_client()

        vetores = None
        res = None

        try:
            if using_vectors:
                vetores = await self._get_vetores(search_text, top)

            logger.info(
                f"\nIndex Name: {self.index_name}"
                + f"\nSearch Text: {search_text}"
                + f"\nFiltro: {filtro}"
                + f"\nSelecao: {selecao}"
                + f"\nSearch Fields: {search_fields}"
                + f"\nTop: {top}"
                + f"\nUsing Vectors: {using_vectors}"
                + f"\nquery_type: {query_type}"
                + f"\nquery_language: {query_language}"
                + f"\nsemantic_configuration_name: {semantic_configuration_name}"
                + f"\nquery_caption: {query_caption}"
            )

            res = await search_client.search(
                query_type=query_type,
                semantic_configuration_name=semantic_configuration_name,
                query_caption=query_caption,
                search_text=search_text,
                select=selecao,
                filter=filtro,
                top=top,
                vector_queries=vetores,
                search_fields=search_fields,
            )

        except Exception as error:
            traceback.print_exc()

            raise error
        finally:
            await search_client.close()

        fim = time.time()

        logger.info(f"## Tempo total da busca de trechos relevantes: {(fim - inicio)}")

        return res
