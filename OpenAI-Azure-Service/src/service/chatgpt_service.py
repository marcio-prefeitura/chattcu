import logging
from typing import List, Optional

from opentelemetry import trace

from src.conf.env import configs
from src.domain.agent_core import AgentCore
from src.domain.llm.rag.engine_factory import EngineFactory
from src.domain.schemas import (
    ChatGptInput,
    FiltrosChat,
    PaginatedChatsResponse,
    ReagirInput,
)
from src.exceptions import ServiceException
from src.infrastructure.elasticsearch.elasticsearch import ElasticSearch
from src.infrastructure.env import INDICE_ELASTIC
from src.infrastructure.mongo.compatilhamento_mongo import CompartilhamentoMongo
from src.infrastructure.security_tokens import DecodedToken
from src.service.image_service import salva_imagem_no_blob
from src.service.quota_service import get_quota

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

VERBOSE = True


@tracer.start_as_current_span("create_elastic_search")
def __create_elastic_search():
    return ElasticSearch(
        configs.ELASTIC_LOGIN,
        configs.ELASTIC_PASSWORD,
        configs.ELASTIC_URL,
        INDICE_ELASTIC,
    )


@tracer.start_as_current_span("executar_prompt")
async def executar_prompt(
    chat_input: ChatGptInput,
    token: DecodedToken,
    app_origem: str,
    chat_id: Optional[str],
    client_app_header: str,
):
    logger.info(
        f"chamou o executar prompt com o tool: {chat_input.tool_selecionada} usuário: {token.login}"
    )
    if chat_input.imagens:
        await salva_imagem_no_blob(chat_input.imagens)
    if (
        chat_input.parametro_modelo_llm
        and chat_input.parametro_modelo_llm.startswith("o1")
        and client_app_header == "chat-tcu-playground"
    ):
        chat_input.stream = False

    # invoca o serviço de quota para verificar se a quota de suo do modelo foi atingida
    if chat_input.parametro_modelo_llm and chat_input.parametro_modelo_llm.startswith(
        "Claude"
    ):
        response = await get_quota("claude-aws-quota")
        amount = response["Amount"]

        if amount in (0, "0"):
            logger.error("Quota de Claude atingida.")
            raise ServiceException("Quota para uso do modelo selecionado foi atingida.")

    engine: AgentCore = EngineFactory.create_engine(
        chat_id=chat_id,
        chat_input=chat_input,
        token=token,
        app_origem=app_origem,
        client_app_header=client_app_header,
    )
    return await engine.executar_prompt()


# @TODO limitar pelo app_origem
@tracer.start_as_current_span("buscar_chat")
async def buscar_chat(chat_id, login: str):
    if chat_id:
        chat = await __create_elastic_search().buscar_chat(chat_id=chat_id, login=login)
        return chat

    raise ValueError("Identificador de chat inválido!")


# @TODO limitar pelo app_origem
@tracer.start_as_current_span("renomear")
async def renomear(chat_id: str, novo_titulo: str):
    if chat_id and novo_titulo:

        await __create_elastic_search().renomear(
            chat_id=chat_id, novo_titulo=novo_titulo
        )
    else:
        raise ValueError("Identificador de chat ou titulo inválido!")


@tracer.start_as_current_span("apagar_todos")
async def apagar_todos(usuario: str, app_origem: str, chatids: List[str]):
    if usuario:
        es = __create_elastic_search()
        if chatids:
            logger.info(f"Dentro de Apagar todos com id {chatids}")
            await es.apagar_todos(
                usuario=usuario, app_origem=app_origem, chatids=chatids
            )

            await CompartilhamentoMongo.remover_todos_enviados_por_chats_ids(
                usr=usuario, ids_chats=chatids
            )
    else:
        raise ValueError("Não foi possível identificar o usuário!")


@tracer.start_as_current_span("alterna_fixar_por_ids")
async def alterna_fixar_por_ids(
    usuario: str, chatids: List[str], fixar: bool, app_origem: str
):
    if usuario:
        return await __create_elastic_search().alterna_fixar_chats_por_ids(
            usuario=usuario, chatids=chatids, fixar=fixar, app_origem=app_origem
        )

    raise ValueError("Não foi possível identificar o usuário!")


@tracer.start_as_current_span("alterna_arquivar_por_ids")
async def alterna_arquivar_por_ids(
    usuario: str, chatids: List[str], arquivar: bool, app_origem: str
):
    if usuario:
        logger.info(f"metodo alterna arquivar {arquivar}")
        return await __create_elastic_search().alterna_arquivar_chats_por_ids(
            usuario=usuario, chatids=chatids, arquivar=arquivar, app_origem=app_origem
        )

    raise ValueError("Não foi possível identificar o usuário!")


@tracer.start_as_current_span("adicionar_feedback")
async def adicionar_feedback(
    entrada: ReagirInput, chat_id: str, cod_mensagem: str, app_origem: str, usuario: str
):
    if chat_id and cod_mensagem:
        await __create_elastic_search().adicionar_feedback(
            entrada=entrada,
            chat_id=chat_id,
            cod_mensagem=cod_mensagem,
            app_origem=app_origem,
            usuario=usuario,
        )
    else:
        raise ValueError("Identificador da mensagem ou feedback inválido!")


@tracer.start_as_current_span("listar_chats_paginados")
async def listar_chats_paginados(
    login: str, app_origem: str, filtros: FiltrosChat
) -> PaginatedChatsResponse:
    if login:
        return await __create_elastic_search().listar_chats_paginado(
            login=login,
            app_origem=app_origem,
            com_msgs=False,
            filtros=filtros,
        )

    raise ValueError("Não foi possível identificar o usuário!")
