from typing import List, Optional

from pydantic import BaseModel


class Categoria(BaseModel):
    id: int | str | None = None
    nome: str


class Especialista(BaseModel):
    id: int | str | None = None
    autor: str
    label: str
    value: str | None = None
    selected: bool = False
    quebra_gelo: List[str]
    descricao: str
    icon: str
    data_criacao: Optional[str] = None
    instrucoes: str | None = None
    categoria: Categoria | None = None


class TotalEspecialistasPorCategoria(BaseModel):
    total: int
    categoria: str
