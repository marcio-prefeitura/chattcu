import logging
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from src.domain.schemas import MessageOut

from .feedback import Feedback, elastic_para_feedback, elastic_para_feedback_dict
from .nome_indice_enum import NomeIndiceEnum
from .papel_enum import PapelEnum
from .tipo_busca_enum import TipoBuscaEnum
from .trecho import Trecho, elastic_para_trecho

logger = logging.getLogger(__name__)


def create_trechos(dado):
    trechos = []
    if "trechos" in dado and len(dado["trechos"]) > 0:
        for trecho in dado["trechos"]:
            trechos.append(elastic_para_trecho(trecho))
    return trechos


def get_especialista_utilizado(dado):
    return dado["especialista_utilizado"] if "especialista_utilizado" in dado else None


def get_arquivos_selecionados(dado):
    return (
        [item.strip() for item in str(dado["arquivos_selecionados"]).split(",")]
        if "arquivos_selecionados" in dado
        else []
    )


def get_imagens(dado):
    imagens = [item["id_imagem"] for item in dado] if dado else []
    return imagens


class Mensagem(BaseModel):
    chat_id: str = None
    codigo: str
    papel: PapelEnum
    conteudo: str
    data_envio: datetime
    favoritado: bool = False
    feedback: Feedback = None
    parametro_tipo_busca: TipoBuscaEnum | None = None
    parametro_quantidade_trechos_relevantes_busca: int | None = None
    parametro_nome_indice_busca: NomeIndiceEnum | None = None
    parametro_modelo_llm: str | None = None
    parametro_versao_modelo_llm: str | None = None
    arquivos_busca: str | None = None
    arquivos_selecionados: List[str] | None = None
    arquivos_selecionados_prontos: List[str] | None = None
    trechos: list[Trecho] = []
    especialista_utilizado: str | None
    imagens: Optional[List[str]] = []


def elastic_para_mensage(dado) -> Mensagem:
    if dado:
        msg = Mensagem(
            feedback=elastic_para_feedback(dado["feedback"]),
            codigo=dado["codigo"],
            papel=PapelEnum[dado["papel"]],
            data_envio=datetime.strptime(dado["data_envio"], "%Y-%m-%d %H:%M:%S"),
            conteudo=dado["conteudo"],
            favoritado=dado["favoritado"],
            parametro_tipo_busca=TipoBuscaEnum(dado["parametro_tipo_busca"]),
            parametro_quantidade_trechos_relevantes_busca=dado[
                "parametro_quantidade_trechos_relevantes_busca"
            ],
            parametro_nome_indice_busca=NomeIndiceEnum(
                dado["parametro_nome_indice_busca"]
            ),
            parametro_modelo_llm=dado["parametro_modelo_llm"],
            parametro_versao_modelo_llm=dado["parametro_versao_modelo_llm"],
            arquivos_busca=dado["arquivos_busca"],
            arquivos_selecionados=get_arquivos_selecionados(dado),
            arquivos_selecionados_prontos=[
                item.strip()
                for item in str(dado["arquivos_selecionados_prontos"]).split(",")
            ],
            trechos=[],
            especialista_utilizado=get_especialista_utilizado(dado),
            imagens=get_imagens(dado["imagens"]),
        )
        return msg
    return None


def elastic_para_mensage_dict(dado) -> MessageOut | None:
    if not dado:
        return None

    def create_message_out(dado):
        return MessageOut(
            feedback=(
                elastic_para_feedback_dict(dado["feedback"])
                if "feedback" in dado
                else ""
            ),
            codigo=dado["codigo"],
            papel=dado["papel"],
            conteudo=dado["conteudo"],
            favoritado=dado["favoritado"],
            arquivos_busca=dado["arquivos_busca"] if "arquivos_busca" in dado else "",
            arquivos_selecionados=get_arquivos_selecionados(dado),
            arquivos_selecionados_prontos=(
                [
                    item.strip()
                    for item in str(dado["arquivos_selecionados_prontos"]).split(",")
                ]
                if "arquivos_selecionados_prontos" in dado
                else []
            ),
            trechos=[],
            especialista_utilizado=get_especialista_utilizado(dado),
            parametro_modelo_llm=(
                dado["parametro_modelo_llm"]
                if "parametro_modelo_llm" in dado and dado["parametro_modelo_llm"]
                else None
            ),
            imagens=get_imagens(dado["imagens"]) if "imagens" in dado else [],
        )

    msg = create_message_out(dado)
    msg.trechos = create_trechos(dado)
    if msg.papel == "USER":
        logger.info(f"LOG Retorno mensagem {msg}")
    return msg
