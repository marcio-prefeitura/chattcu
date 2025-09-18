import logging
from io import BytesIO
from typing import BinaryIO, Optional

from azure.core.exceptions import ResourceExistsError
from azure.storage.blob.aio import BlobClient, BlobServiceClient, ContainerClient
from opentelemetry import trace

from src.conf.env import configs

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

CONNECT_STR = (
    f"DefaultEndpointsProtocol=https;AccountName={configs.AZURE_BLOB_STG_NAME};"
    + f"AccountKey={configs.AZURE_BLOB_STG_KEY};"
    + "EndpointSuffix=core.windows.net"
)


class AzureBlob:
    @tracer.start_as_current_span("__get_blob_service_client")
    def __get_blob_service_client(self):
        return BlobServiceClient.from_connection_string(CONNECT_STR)

    @tracer.start_as_current_span("verifica_existencia_container")
    async def verifica_existencia_container(self, container_name: str):
        container_client: ContainerClient = None
        blob_service_client: BlobServiceClient = None

        try:
            container_name = container_name.lower()

            logger.info(f"Verificando a existencia do container: {container_name}")

            blob_service_client = self.__get_blob_service_client()

            container_client = blob_service_client.get_container_client(
                container=container_name
            )
            existe = await container_client.exists()

            if existe:
                logger.info(f"O container ({container_name}) já existe!")
            else:
                logger.info(f"O container ({container_name}) NÃO existe!")

            return existe
        except Exception as error:
            logger.error(error)
            raise error
        finally:
            if container_client:
                await container_client.close()

            if blob_service_client:
                await blob_service_client.close()

    @tracer.start_as_current_span("verifica_existencia_arquivo_container")
    async def verifica_existencia_arquivo_container(
        self, file_name: str, container_name: str
    ):
        container_client: ContainerClient = None
        blob_service_client: BlobServiceClient = None
        blob_client: BlobClient = None

        existe = False

        try:
            if await self.verifica_existencia_container(container_name):
                blob_service_client = self.__get_blob_service_client()

                container_client = blob_service_client.get_container_client(
                    container=container_name
                )

                blob_client = container_client.get_blob_client(file_name)

                existe = await blob_client.exists()
        except Exception as exp:
            logger.error(exp)
        finally:
            if blob_client:
                await blob_client.close()

            if container_client:
                await container_client.close()

            if blob_service_client:
                await blob_service_client.close()

        return existe

    @tracer.start_as_current_span("cria_container")
    async def cria_container(self, container_name: str):
        container_name = container_name.lower()

        container_client: ContainerClient = None
        blob_service_client: BlobServiceClient = None
        status = None

        try:
            logger.info(f"Criando o container: {container_name}")

            blob_service_client = self.__get_blob_service_client()

            container_client = blob_service_client.get_container_client(
                container=container_name
            )

            status = await container_client.create_container()
        except Exception as exp:
            logger.error(exp)
        finally:
            if container_client:
                await container_client.close()

            if blob_service_client:
                await blob_service_client.close()

        return status

    # https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-upload-python
    @tracer.start_as_current_span("upload_blob")
    async def upload_blob(
        self, container_name: str, filename: str = None, data: Optional[BinaryIO] = None
    ):
        container_name = container_name.lower()

        blob_service_client: BlobServiceClient = None
        container_client: ContainerClient = None
        blob_client: BlobClient = None

        try:
            logger.info(
                f"Tentando enviar arquivo ({filename}) para o container ({container_name})"
            )

            if not await self.verifica_existencia_container(container_name):
                await self.cria_container(container_name)

            blob_service_client = self.__get_blob_service_client()

            container_client = blob_service_client.get_container_client(
                container=container_name
            )

            if not await self.verifica_existencia_arquivo_container(
                file_name=filename, container_name=container_name
            ):
                logger.info(
                    f"O arquivo ({filename}) não existe no container ({container_name})"
                )
                logger.info("Enviando diretamente os dados recebidos")

                blob_client = await container_client.upload_blob(
                    name=filename, data=data, overwrite=False
                )
        except ResourceExistsError:
            logger.warning(
                f"O arquivo '{filename}' já existe no container '{container_name}'."
            )
        except Exception as exp:
            logger.error(exp)
            raise exp
        finally:
            if blob_client:
                await blob_client.close()

            if container_client:
                await container_client.close()

            if blob_service_client:
                await blob_service_client.close()

    @tracer.start_as_current_span("recupera_blobs")
    async def recupera_blobs(self, container_name: str):
        container_name = container_name.lower()

        blob_service_client: BlobServiceClient = None
        container_client: ContainerClient = None
        blobs = []

        try:
            logger.info(
                f"Carregando a lista de arquivos do container: {container_name}"
            )

            if not await self.verifica_existencia_container(container_name):
                raise Exception("O usuário não possui arquivos processados")

            blob_service_client = self.__get_blob_service_client()

            container_client = blob_service_client.get_container_client(
                container=container_name
            )

            async for blob in container_client.list_blobs():
                logger.info(f"{blob.name}\n")
                blobs.append(blob.name)
        except Exception as exp:
            logger.error(exp)
        finally:
            if container_client:
                await container_client.close()

            if blob_service_client:
                await blob_service_client.close()

        return blobs

    @tracer.start_as_current_span("download_blob")
    async def download_blob(self, container_name: str, filename: str):
        container_name = container_name.lower()

        logger.info(filename)

        if not await self.verifica_existencia_arquivo_container(
            file_name=filename, container_name=container_name
        ):
            raise Exception("O arquivo desejado não encontra-se no repositório")

        blob_service_client: BlobServiceClient = None
        blob_client: BlobClient = None

        try:
            blob_service_client = self.__get_blob_service_client()

            blob_client = blob_service_client.get_blob_client(
                container=container_name, blob=filename
            )

            download_stream = await blob_client.download_blob()

            return await download_stream.readall()
        except Exception as exp:
            logger.error(exp)
        finally:
            if blob_client:
                await blob_client.close()

            if blob_service_client:
                await blob_service_client.close()

    @tracer.start_as_current_span("download_blob_as_stream")
    async def download_blob_as_stream(self, container_name: str, filename: str):
        data = await self.download_blob(
            container_name=container_name, filename=filename
        )
        return BytesIO(data)
