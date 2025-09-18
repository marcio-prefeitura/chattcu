import base64
import io
import mimetypes

from src.util.upload_util import calcula_hash


async def base64_to_blob_name(img_base64):
    imagem_binario = base64.b64decode(img_base64)
    mime_type = "image/jpeg"
    extensao = mimetypes.guess_extension(mime_type) or ".jpg"
    arquivo_simulado = io.BytesIO(imagem_binario)
    hash_arquivo = await calcula_hash(arquivo_simulado)
    hash_arquivo = f"{hash_arquivo}-{len(imagem_binario)}"
    nome_blob = f"{hash_arquivo}{extensao}"
    return nome_blob
