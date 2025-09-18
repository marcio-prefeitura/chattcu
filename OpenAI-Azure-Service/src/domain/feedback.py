from pydantic import BaseModel

from src.domain.schemas import FeedbackOut

from .reacao_enum import ReacaoEnum


class Feedback(BaseModel):
    cod_mensagem: str = ""
    conteudo: str
    reacao: ReacaoEnum
    ofensivo: bool = False
    inveridico: bool = False
    nao_ajudou: bool = False


def elastic_para_feedback(dado) -> Feedback:
    if dado:
        feed = Feedback(
            conteudo=dado["conteudo"],
            nao_ajudou=dado["nao_ajudou"],
            inveridico=dado["inveridico"],
            ofensivo=dado["ofensivo"],
            reacao=ReacaoEnum[dado["reacao"]],
        )

        return feed
    return None


def elastic_para_feedback_dict(dado) -> FeedbackOut | None:
    if dado:
        feed = FeedbackOut(
            conteudo=dado["conteudo"],
            nao_ajudou=dado["nao_ajudou"],
            inveridico=dado["inveridico"],
            ofensivo=dado["ofensivo"],
            reacao=dado["reacao"] if dado["reacao"] else "",
        )

        return feed
    return None
