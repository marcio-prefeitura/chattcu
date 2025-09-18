import hashlib
from io import BytesIO
from typing import BinaryIO

from opentelemetry import trace

from src.domain.schemas import ItemSistema

tracer = trace.get_tracer(__name__)


def write_data_in_temporary_file(data: BytesIO, temp_file) -> str:
    """Write the data in a temporary file and return the file path."""

    while True:
        # Lê 4 KB por vez
        chunk = data.read(4096)
        if not chunk:
            break
        temp_file.write(chunk)

    temp_file.seek(0)


@tracer.start_as_current_span("calcula_hash")
async def calcula_hash(arquivo: BinaryIO):
    sha256 = hashlib.sha256()
    # 4 KB, por exemplo
    block_size = 4096

    while True:
        bloco = arquivo.read(block_size)
        if not bloco:
            break
        sha256.update(bloco)

    return sha256.hexdigest()


@tracer.start_as_current_span("parse_item")
def parse_item(item):
    return ItemSistema(
        id=str(item["_id"]),
        nome=item["nome"],
        usuario=item["usuario"],
        st_removido=item["st_removido"],
        id_pasta_pai=(
            str(item["id_pasta_pai"])
            if item["id_pasta_pai"] != -1
            else item["id_pasta_pai"]
        ),
        data_criacao=item["data_criacao"],
        st_arquivo=item["st_arquivo"],
        tamanho=item["tamanho"] if "tamanho" in item else None,
        tipo_midia=item["tipo_midia"] if "tipo_midia" in item else None,
        nome_blob=item["nome_blob"] if "nome_blob" in item else None,
        status=item["status"] if "status" in item else None,
    )
