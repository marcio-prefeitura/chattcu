from typing import List

from pydantic import BaseModel

from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum


class Agent(BaseModel):
    msg_sistema: str
    parametro_tipo_busca: TipoBuscaEnum | None
    parametro_nome_indice_busca: NomeIndiceEnum | None
    use_llm_chain: bool
    tools: List[str]
    arquivos_busca: str | None = None
