import base64
import io
import logging
import mimetypes

from opentelemetry import trace

from src.conf.env import configs
from src.infrastructure.azure_blob.azure_blob import AzureBlob
from src.infrastructure.elasticsearch.elasticsearch import ElasticSearch
from src.infrastructure.env import INDICE_ELASTIC
from src.util.upload_util import calcula_hash

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

VERBOSE = True


from src.infrastructure.env import CONTAINER_NAME


@tracer.start_as_current_span("create_elastic_search")
def __create_elastic_search():
    return ElasticSearch(
        configs.ELASTIC_LOGIN,
        configs.ELASTIC_PASSWORD,
        configs.ELASTIC_URL,
        INDICE_ELASTIC,
    )


async def salva_imagem_no_blob(imagens):
    blob = AzureBlob()
    for img_base64 in imagens:
        imagem_binario = base64.b64decode(img_base64)
        logger.info("Imagem convertida para binario")
        mime_type = "image/jpeg"
        extensao = mimetypes.guess_extension(mime_type) or ".jpg"

        arquivo_simulado = io.BytesIO(imagem_binario)

        hash_arquivo = await calcula_hash(arquivo_simulado)

        hash_arquivo = f"{hash_arquivo}-{len(imagem_binario)}"
        nome_blob = f"{hash_arquivo}{extensao}"

        logger.info(f"Nome do Blob: {nome_blob}")
        logger.info(f"Hash: {hash_arquivo}")
        logger.info(f"Extensão: {extensao}")
        logger.info(f"Size: {len(imagem_binario)} bytes")

        await blob.upload_blob(CONTAINER_NAME, data=imagem_binario, filename=nome_blob)


async def get_imagem_do_blob(id_imagem):
    blob = AzureBlob()
    try:
        imagem_binario = await blob.download_blob(CONTAINER_NAME, id_imagem)
        return imagem_binario

    except Exception as e:
        logger.error(f"Erro ao baixar o blob: {e}")
        return None


@tracer.start_as_current_span("buscar_imagem")
async def buscar_imagem(chat_id, msg_id, id_imagem, login: str):
    # Chama a função que busca mensagens por chat e código
    if chat_id and msg_id:
        # Não passamos 'id_imagem' aqui, pois não é necessário nessa consulta
        mensagens = await __create_elastic_search().buscar_imagem(
            chat_id=chat_id, msg_id=msg_id, id_imagem=id_imagem, login=login
        )
        if mensagens != None:
            if isinstance(mensagens[0], dict):  # Ensure the first item is a dictionary
                id_imagem = mensagens[0].get("id_imagem")
                if id_imagem:
                    logger.info(f"ID da imagem extraído: {id_imagem}")
                    imagem_como_binario = await get_imagem_do_blob(id_imagem)
                    logger.info(
                        f"First 100 bytes of the image data: {imagem_como_binario[:20]}"
                    )
                    return imagem_como_binario  # Ou qualquer outro dado relevante
        else:
            return None
    raise ValueError("Identificador de chat inválido!")


def binario_to_base64(imagem_binario: bytes) -> str:
    """Convert image binary data to a base64 string."""
    imagem_base64 = base64.b64encode(imagem_binario).decode("utf-8")
    return imagem_base64
