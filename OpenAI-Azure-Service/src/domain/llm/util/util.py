import logging
import re
from typing import List

import tiktoken
from opentelemetry import trace

from src.domain.trecho import Trecho

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("get_ministros")
def get_ministros() -> List[str]:
    ministros = []
    # ativos
    ministros.append("ANTONIO ANASTASIA")
    ministros.append("AROLDO CEDRAZ")
    ministros.append("AUGUSTO NARDES")
    ministros.append("AUGUSTO SHERMAN")
    ministros.append("BENJAMIN ZYMLER")
    ministros.append("BRUNO DANTAS")
    ministros.append("JHONATAN DE JESUS")
    ministros.append("JORGE OLIVEIRA")
    ministros.append("MARCOS BEMQUERER")
    ministros.append("VITAL DO RÊGO")
    ministros.append("WALTON ALENCAR RODRIGUES")
    ministros.append("WEDER DE OLIVEIRA")
    # inativos
    ministros.append("ADHEMAR PALADINI GHISI")
    ministros.append("ADYLSON MOTTA")
    ministros.append("ANA ARRAES")
    ministros.append("ANDRÉ DE CARVALHO")
    ministros.append("GUILHERME PALMEIRA")
    ministros.append("HUMBERTO GUIMARÃES SOUTO")
    ministros.append("IRAM SARAIVA")
    ministros.append("JOSÉ JORGE")
    ministros.append("JOSÉ MUCIO MONTEIRO")
    ministros.append("LINCOLN MAGALHÃES DA ROCHA")
    ministros.append("MARCOS VINICIOS VILAÇA")
    ministros.append("OCTÁVIO GALLOTTI")
    ministros.append("RAIMUNDO CARREIRO")
    ministros.append("UBIRATAN AGUIAR")
    ministros.append("VALMIR CAMPELO")

    return ministros


@tracer.start_as_current_span("get_ministros_as_string")
def get_ministros_as_string() -> str:
    return ", ".join(get_ministros())


@tracer.start_as_current_span("filtrar_trechos_utilizados")
def filtrar_trechos_utilizados(trechos: List[Trecho], texto: str) -> List[Trecho]:
    trechos_encontrados = re.findall(r"\[([^]]+)\]", texto)
    trechos_utilizados = []

    for i, trecho in enumerate(trechos):

        if trecho.id_registro in trechos_encontrados:
            trechos_utilizados.append(trecho)
        # cobre situações onde a ref é [Arquivo .....]
        elif f"{trecho.id_registro.replace('Arquivo ', '')}" in trechos_encontrados:
            trechos_utilizados.append(trecho)
        # cobre situações onde a ref é [^1^]
        elif f"^{i+1}^" in trechos_encontrados:
            trechos_utilizados.append(trecho)
        # cobre situações onde a ref é [^1]
        elif f"^{i+1}" in trechos_encontrados:
            trechos_utilizados.append(trecho)
        # cobre situações onde a ref é [1]
        elif f"{i+1}" in trechos_encontrados:
            trechos_utilizados.append(trecho)

    return trechos_utilizados


@tracer.start_as_current_span("num_tokens_from_string")
def num_tokens_from_string(string: str, encoding_name: str = "cl100k_base") -> int:
    """Returns the number of tokens in a text string."""

    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))

    return num_tokens
