from typing import List, Optional

from pydantic import BaseModel


class AgentConfig(BaseModel):
    id: int | str | None = None
    labelAgente: str
    valueAgente: str | None = None
    selected: bool = False
    quebraGelo: List[str]
    autor: str
    descricao: str
    icon: str
    dataCriacao: Optional[str] = None
    stRemovido: bool | None = None
    isAgentDefault: bool | None = None
    instrucoes: str | None = None
