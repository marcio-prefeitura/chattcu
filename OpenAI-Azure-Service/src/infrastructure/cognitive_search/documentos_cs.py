import logging
import re
import time
import traceback
import uuid
from tempfile import SpooledTemporaryFile

from azure.search.documents.indexes.models import *
from langchain.text_splitter import CharacterTextSplitter
from opentelemetry import trace
from tqdm import tqdm

from src.domain.schemas import GabiResponse
from src.infrastructure.cognitive_search.cognitive_search import CognitiveSearch
from src.infrastructure.cognitive_search.local_file_processor import LocalFileProcessor
from src.infrastructure.security_tokens import DecodedToken

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class DocumentoCS(CognitiveSearch):

    @tracer.start_as_current_span("__text_spliter")
    async def __text_spliter(self, pages):
        if pages is None:
            logger.error("Pages is None")
            return []
        inicio = time.time()
        logger.info(f"Realiza o text spliter em {len(pages)} páginas")

        text_splitter = CharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separator=" ",
            length_function=len,
        )

        trechos = text_splitter.split_documents(pages)

        fim = time.time()

        logger.info(
            f"Tempo total gasto quebrando as páginas em 'trechos' para indexação: {(fim - inicio)}"
        )
        logger.info(f"{len(trechos)} trechos.")

        return trechos

    @tracer.start_as_current_span("__gera_secao")
    async def __gera_secao(
        self,
        id_secao,
        trecho,
        pagina_arquivo,
        numero_pagina,
        hash_arquivo,
        tamanho_trecho,
        execution_id,
    ):
        emb = await self._get_embeddings(execution_id).create(
            input=trecho, model=self.modelo_embeddding
        )

        return {
            "id": id_secao,
            "trecho": trecho,
            "pagina_arquivo": pagina_arquivo,
            "numero_pagina": numero_pagina,
            "hash": hash_arquivo,
            "tamanho_trecho": tamanho_trecho,
            "trechoVector": emb.data[0].embedding,
        }

    @tracer.start_as_current_span("__criar_secoes")
    async def __criar_secoes(self, real_filename: str, user_filename: str, trechos):
        inicio = time.time()

        logger.info(f"Criando as {len(trechos)} seções")

        execution_id = uuid.uuid4()

        sections = []

        for i, doc in enumerate(
            tqdm(trechos, desc="Criando Seções...", total=len(trechos))
        ):
            sections.append(
                await self.__gera_secao(
                    id_secao=re.sub(
                        "[^0-9a-zA-Z_-]",
                        "_",
                        f"{real_filename}-{i if doc.metadata['page'] != 'RESUMO' else 'RESUMO'}",
                    ),
                    trecho=doc.page_content,
                    pagina_arquivo=re.sub(
                        "[^0-9a-zA-Z_-]",
                        "_",
                        f"{user_filename}-{doc.metadata['page']}",
                    ),
                    numero_pagina=(
                        doc.metadata["page"] if doc.metadata["page"] != "RESUMO" else 0
                    ),
                    hash_arquivo=real_filename,
                    tamanho_trecho=(
                        self.chunk_size
                        if doc.metadata["page"] != "RESUMO"
                        else len(doc.page_content)
                    ),
                    execution_id=execution_id,
                )
            )

        fim = time.time()
        logger.info(
            f"Tempo total gasto criando as seções para indexação: {(fim - inicio)}"
        )

        return sections

    @tracer.start_as_current_span("_get_vetores")
    async def _get_vetores(self, question, top):
        return await super()._get_vetores(
            question=question, top=top, fields="trechoVector"
        )

    @tracer.start_as_current_span("verifica_existencia_documento")
    async def verifica_existencia_documento(self, filename: str):
        try:
            inicio = time.time()

            res = await self.buscar_trechos_relevantes(
                search_text="*",
                top=1,
                filtro=f"hash eq '{filename}'",
                selecao=None,
                search_fields=None,
            )

            existe = False

            async for _ in res:
                existe = True

            if existe:
                logger.info(f"Há documentos com o hash '{filename}' no índice.")
            else:
                logger.info(f"Não há documentos com o hash '{filename}' no índice.")

            fim = time.time()
            logger.info(
                f"Tempo total gasto verificando existência no AI Search: {(fim - inicio)}"
            )

            return existe
        except Exception as error:
            traceback.print_exc()

            raise error

    # @tracer.start_as_current_span("__trigger_azure_func")
    # async def __trigger_azure_func(
    #     self,
    #     func_role: str,
    #     func_url: str,
    #     container_name: str,
    #     blob_name: str,
    #     token: DecodedToken,
    # ) -> str:
    #     async with aiohttp.ClientSession(raise_for_status=True) as session:
    #         logger.info(f'Acionando a função "{func_role}"')
    #
    #         resp = await session.post(
    #             url=func_url,
    #             json={
    #                 "container_name": container_name,
    #                 "blob_name": blob_name,
    #                 "usuario": token.login,
    #                 "desenvol": str(DESENVOLVEDOR in token.roles).lower(),
    #             },
    #         )
    #         status_url = resp.headers["Location"]
    #
    #         logger.info(f'A função "{func_role}" foi acionada com sucesso!')
    #
    #         return status_url

    # async def __get_azure_func_status(self, status_url: str, func_role: str) -> str:
    #     async with aiohttp.ClientSession(raise_for_status=True) as session:
    #         while True:
    #             await asyncio.sleep(3)
    #             async with session.get(url=status_url) as resp:
    #                 json_resp = await resp.json()
    #                 status = json_resp["runtimeStatus"]
    #
    #                 logger.info(f"Status atual da função '{func_role}': \"{status}\"")
    #
    #                 if status in ["Failed", "Terminated", "Suspended"]:
    #                     raise AzureFunctionError(json_resp)
    #
    #                 if status == "Completed":
    #                     return status
    #                 else:
    #                     continue

    @tracer.start_as_current_span("persiste_documentos")
    async def persiste_documentos(
        self,
        real_filename: str,
        user_filename: str,
        content_bytes: SpooledTemporaryFile | GabiResponse,
        extensao: str,
        token: DecodedToken,
    ):
        try:
            inicio = time.time()

            if not await self.verifica_existencia_documento(real_filename):
                # comentado para não executar a indexação no AI Search pelas functions durante a apresentação da Monique
                # if (
                #     DESENVOLVEDOR in self.usr_roles
                #     or PREVIEW in self.usr_roles
                #     or configs.PROFILE == "local"
                # ) and isinstance(content_bytes, SpooledTemporaryFile):
                #     async with asyncio.TaskGroup() as tg:
                #         resumo_task = tg.create_task(
                #             self.__trigger_azure_func(
                #                 func_role="indexar-resumo",
                #                 func_url=configs.AZURE_FUNC_INDEX_RESUMO,
                #                 container_name=CONTAINER_NAME,
                #                 blob_name=real_filename,
                #                 token=token,
                #             )
                #         )
                #         trechos_task = tg.create_task(
                #             self.__trigger_azure_func(
                #                 func_role="indexar-trechos",
                #                 func_url=configs.AZURE_FUNC_INDEX_TRECHOS,
                #                 container_name=CONTAINER_NAME,
                #                 blob_name=real_filename,
                #                 token=token,
                #             )
                #         )
                #         resumo_status_url = await resumo_task
                #         trechos_status_url = await trechos_task

                #         tg.create_task(
                #             self.__get_azure_func_status(
                #                 status_url=resumo_status_url,
                #                 func_role="indexar-resumo",
                #             )
                #         )
                #         tg.create_task(
                #             self.__get_azure_func_status(
                #                 status_url=trechos_status_url,
                #                 func_role="indexar-trechos",
                #             )
                #         )
                # else:
                await LocalFileProcessor.process(
                    content_bytes=content_bytes,
                    extensao=extensao,
                    real_filename=real_filename,
                    user_filename=user_filename,
                    token=token,
                    fn_create_section=self.__criar_secoes,
                    fn_text_spliter=self.__text_spliter,
                    fn_populate_intex=self._popular_indice,
                )

                logger.info(
                    f"Tempo total gasto pra indexar o documento no AI Search: {(time.time() - inicio)}"
                )
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error

    # @tracer.start_as_current_span("delete_document")
    # async def delete_document(self, document: str, user: str):
    #     logger.info(
    #         f"Removing sections from '{document}' from search index '{self.index_name}'"
    #     )
    #
    #     search_client = self._get_search_client()
    #
    #     try:
    #         while True:
    #             filtro = None if document is None else f"hash eq '{document}'"
    #
    #             res = await search_client.search(
    #                 "", filter=filtro, top=1000, include_total_count=True
    #             )
    #
    #             if await res.get_count() == 0:
    #                 break
    #
    #             res = await search_client.delete_documents(
    #                 documents=[{"id": doc["id"]} async for doc in res]
    #             )
    #
    #             logger.info(f"\tRemoved {len(res)} sections from index")
    #
    #             time.sleep(2)
    #     except Exception as error:
    #         logger.error(error)
    #     finally:
    #         await search_client.close()
