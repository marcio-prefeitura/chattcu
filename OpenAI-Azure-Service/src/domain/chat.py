from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from src.domain.papel_enum import PapelEnum
from src.domain.schemas import ChatOut, MessageOut

from .mensagem import Mensagem, elastic_para_mensage_dict


class Credencial(BaseModel):
    aplicacao_origem: str
    usuario: str


class Chat(BaseModel):
    id: str = None
    usuario: str
    titulo: str
    data_criacao: datetime
    data_ultima_iteracao: datetime
    fixado: bool = False
    apagado: bool = False
    arquivado: bool = False
    mensagens: List[Mensagem]
    credencial: Credencial


def elastic_para_chat_dict(dado, com_mensagem: bool = False) -> ChatOut | None:
    if dado:
        chat = ChatOut(
            id=dado["_id"],
            usuario=dado["_source"]["chat"]["usuario"],
            titulo=dado["_source"]["chat"]["titulo"],
            data_ultima_iteracao=dado["_source"]["chat"]["data_ultima_iteracao"],
            fixado=dado["_source"]["chat"]["fixado"],
            arquivado=dado["_source"]["chat"]["arquivado"],
            mensagens=None,
        )

        mensagens: Optional[List[MessageOut]] = []

        if com_mensagem and len(dado["_source"]["mensagens"]) > 0:
            for msg in dado["_source"]["mensagens"]:
                if msg["papel"] != PapelEnum.SYSTEM.value:
                    mensagens.append(elastic_para_mensage_dict(msg))

        chat.mensagens = mensagens

        return chat
    return None
