import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.conf.env import configs


class Documento(BaseModel):
    codigo: int
    numero_ordem_peca: int
    tipo_documento: str
    assunto: Optional[str]
    data_hora_juntada: datetime
    quantidade_paginas: Optional[int]
    codigo_confidencialidade: int
    confidencialidade: str
    link_documento: str


def documento_assembly(documento_externo) -> Documento:
    url_sistema_gerenciador_documentos = re.sub(r"\/$", "", configs.SISTEMA_GER_DOC_URL)

    return Documento(
        codigo=documento_externo["codigo"],
        numero_ordem_peca=documento_externo["numeroOrdemPeca"],
        tipo_documento=documento_externo["tipoDocumento"],
        assunto=documento_externo["assunto"],
        data_hora_juntada=documento_externo["dataHora"],
        quantidade_paginas=documento_externo["quantidadePaginas"],
        codigo_confidencialidade=documento_externo["codigoConfidencialidade"],
        confidencialidade=documento_externo["confidencialidade"],
        link_documento=(
            f"{url_sistema_gerenciador_documentos}"
            + f"/documentos/codigo/{documento_externo['codigoDocumentoGestao']}"
        ),
    )
