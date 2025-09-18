import asyncio
import datetime
import json
import logging
import time
import traceback
from asyncio import CancelledError
from typing import Optional

from fastapi import APIRouter, Depends, Request, WebSocket, status
from fastapi.responses import JSONResponse
from fastapi.websockets import WebSocketState
from opentelemetry import trace

from src.domain.enum.type_channel_redis_enum import TypeChannelRedisEnum
from src.domain.schemas import (
    AtualizarChatInput,
    BulkAtualizarChatInput,
    ChatGptInput,
    ChatOut,
    FiltrosChat,
    ImageBase64Out,
    PaginatedChatsResponse,
    ReagirInput,
    ResponseException,
    ResponsePadrao,
)
from src.exceptions import BusinessException
from src.infrastructure.realtimeaudio.openai_realtime_client import OpenAIRealTimeClient
from src.infrastructure.realtimeaudio.tools_realtime import TOOLS
from src.infrastructure.realtimeaudio.util_realtime import ConfigRealtime, UtilStreams
from src.infrastructure.redis.redis_chattcu import RedisClient
from src.infrastructure.role_checker import RoleChecker
from src.infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW
from src.messaging.mensagem_chatstop_redis import MensagemChatStopRedis
from src.service.chatgpt_service import (
    adicionar_feedback,
    alterna_arquivar_por_ids,
    alterna_fixar_por_ids,
    apagar_todos,
    buscar_chat,
    executar_prompt,
    listar_chats_paginados,
    renomear,
)
from src.service.image_service import binario_to_base64, buscar_imagem

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

router = APIRouter()
client_redis = RedisClient()


@router.post(
    "/",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Realiza uma iteração simples com o LLM",
    description="Realiza uma iteração simples com o LLM",
)
@router.post(
    "/{chat_id}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
        status.HTTP_200_OK: {
            "content": {
                "text/event-stream": {
                    "schema": {
                        "type": "string",
                        "example": """
                        {
                            \"chat_id\": \"string\",
                            \"chat_titulo\": \"string\",
                            \"codigo_prompt\": \"string\",
                            \"response\": "string",
                            \"codigo_response\": \"string\",
                            \"trechos\": [],
                            \"arquivos_busca\": \"string\"
                        }\\n\\n
                        """,
                    }
                }
            },
            "description": """
                Esta rota retorna um stream de dados no formato media-type: `text/event-stream`.
                Obs.: O retorno é `text/event-stream` e os dados são separados por `\\n\\n` um split deste pode ser utilizado.
                É necessário criar um **acumulador** (buffer) para parsear corretamente sob demanda para **Json**, 
                uma vez que o streaming pode não conter os objetos em sua totalidade no evento recém-chegado.
                [Exemplo em Javascript usando ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
                """,
            "media_type": "text/event-stream",
        },
    },
    name="Realiza uma iteração simples com o LLM",
)
@tracer.start_as_current_span("protected_prompt")
async def protected_prompt(
    chatgpt_input: ChatGptInput, request: Request, chat_id: Optional[str] = None
):
    app_origem = "CHATTCU"

    client_app_header = request.headers.get("X-Client-App")
    if client_app_header != "chat-tcu-playground":
        client_app_header = "outros-clientes"

    try:
        inicio = time.time()

        resposta = None

        resposta = await executar_prompt(
            chat_id=chat_id,
            chat_input=chatgpt_input,
            token=request.state.decoded_token,
            app_origem=app_origem,
            client_app_header=client_app_header,
        )

        fim = time.time()

        if not chatgpt_input.stream:
            logger.info(f"Tempo total da requisição sem stream: {(fim - inicio)}")

        if resposta:
            return resposta
        elif resposta == "":
            raise CancelledError(
                "Cancelamento da atual chamada efetuada pelo por evento!"
            )

    except CancelledError as ce:
        logger.warning(f"Cancelamento da atual chamada efetuada pelo por evento! {ce}")
        return JSONResponse(
            content={"status": 0, "mensagem": f"Operação cancelada por evento: {ce}"},
            status_code=status.HTTP_412_PRECONDITION_FAILED,
        )

    except Exception as erro:
        logger.error(f"Erro ao enviar prompt com log: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao enviar mensagem: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get(
    "/{chat_id}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    responses={
        status.HTTP_200_OK: {"model": ChatOut},
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Retorna uma determinada conversa do usuário",
)
@tracer.start_as_current_span("get_chat")
async def get_chat(request: Request, chat_id: str):
    app_origem = "CHATTCU"

    try:
        inicio = time.time()

        # a requisição foi realizada para retornar somente um chat
        if chat_id:
            usuario = request.state.decoded_token.login

            chat = await buscar_chat(chat_id, usuario)

            fim = time.time()
            logger.info(
                f"Tempo total gasto para retornar o chat com suas mensagens: {(fim - inicio)}"
            )

            return chat

        return JSONResponse(
            content={"status": 0, "mensagem": "Erro ao resgatar chat."},
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as erro:
        logger.error(f"Erro ao resgatar chat: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao resgatar chat: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get(
    "/",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=PaginatedChatsResponse,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Retorna as conversas do usuário, sem as mensagens, de forma paginada",
)
@tracer.start_as_current_span("listar_chats")
async def list_chats(
    request: Request, filtros: FiltrosChat = Depends()
) -> PaginatedChatsResponse | JSONResponse:
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login

    try:
        inicio = time.time()

        logger.info(f"Resgatando chats do usuário: {usuario}")

        lista = await listar_chats_paginados(usuario, app_origem, filtros)

        fim = time.time()
        logger.info(
            f"Tempo total gasto para retornar somente os chats sem as mensagens: {(fim - inicio)}"
        )

        return lista
    except Exception as erro:
        logger.error(f"Erro ao resgatar chats: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao resgatar chats: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.delete(
    "/{chat_id}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Apaga uma determinada conversa do usuário",
)
@tracer.start_as_current_span("apagar_chat")
async def apagar_chat(chat_id: str, request: Request):
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login
    logger.info(f"Deltetando o chat no back {chat_id}")

    try:
        await apagar_todos(usuario=usuario, app_origem=app_origem, chatids=[chat_id])

        return JSONResponse(
            content={"status": 1, "mensagem": "Chat apagado com sucesso!"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as erro:
        logger.error(f"Erro ao apagar chat: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao apagar chat: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.delete(
    "/bulk-delete/",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Apaga as conversas do usuário informadas por filtros",
)
@tracer.start_as_current_span("apagar_chats_por_filtros")
async def apagar_chats_por_id(data: FiltrosChat, request: Request):
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login

    try:
        data.page = None
        data.per_page = None
        chats_paginados = await listar_chats_paginados(usuario, app_origem, data)
        chat_ids = [chat.id for chat in chats_paginados.chats]
        await apagar_todos(usuario=usuario, app_origem=app_origem, chatids=chat_ids)

        return JSONResponse(
            content={"status": 1, "mensagem": "Histórico apagado com sucesso!"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as erro:
        logger.error(f"Erro ao apagar histórico: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao apagar histórico: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.put(
    "/{chat_id}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Renomeia, fixa ou desfixa, arquiva ou desarquiva uma conversa do usuário",
)
@tracer.start_as_current_span("atualizar_chat")
async def atualizar_chat(chat_id: str, entrada: AtualizarChatInput, request: Request):
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login
    response_content = {"status": 0, "mensagem": "Erro ao atualizar chat!"}
    status_code = status.HTTP_400_BAD_REQUEST

    try:
        if entrada.titulo and chat_id:
            await renomear(chat_id, entrada.titulo)
            response_content = (
                {"status": 1, "mensagem": "Chat renomeado com sucesso!"},
            )
            status_code = status.HTTP_200_OK

        if entrada.fixado is not None and chat_id:
            await alterna_fixar_por_ids(
                usuario=usuario,
                app_origem=app_origem,
                chatids=[chat_id],
                fixar=entrada.fixado,
            )
            response_content = {
                "status": 1,
                "mensagem": f"Chat {'fixado' if entrada.fixado else 'desafixado'} com sucesso!",
            }
            status_code = status.HTTP_200_OK

        if entrada.arquivado is not None and chat_id:
            await alterna_arquivar_por_ids(
                usuario,
                app_origem=app_origem,
                chatids=[chat_id],
                arquivar=entrada.arquivado,
            )
            response_content = {
                "status": 1,
                "mensagem": f"Chat {'arquivado' if entrada.arquivado else 'desarquivado'} com sucesso!",
            }
            status_code = status.HTTP_200_OK

    except Exception as erro:
        logger.error(f"Erro ao renomear chat: {erro}")
        traceback.print_exc()
        response_content = {"status": 0, "mensagem": f"Erro ao renomear chat: {erro}"}
        status_code = status.HTTP_400_BAD_REQUEST

    return JSONResponse(content=response_content, status_code=status_code)


@router.put(
    "/bulk-update/",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    # response_model=ResponsePadrao,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Atualiza as conversas do usuário com os ids informados",
)
@tracer.start_as_current_span("bulk_atualizar_chats")
async def bulk_atualizar_chats(entrada: FiltrosChat, request: Request):
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login
    entrada.page = None
    entrada.per_page = None
    chats_paginados = await listar_chats_paginados(usuario, app_origem, entrada)
    chat_ids = [chat.id for chat in chats_paginados.chats]
    try:
        logger.info(f"Entrada valores {entrada}")
        if entrada.fixados is not None:
            await alterna_fixar_por_ids(
                usuario=usuario,
                app_origem=app_origem,
                chatids=chat_ids,
                fixar=not entrada.fixados,
            )
            logger.info(f"Valor entrada fixar: {entrada.fixados}")
            return JSONResponse(
                content={
                    "status": 1,
                    "mensagem": f"Chats {'fixados' if entrada.fixados else 'desafixados'} com sucesso!",
                },
                status_code=status.HTTP_200_OK,
            )

        if entrada.arquivados is not None:
            logger.info(f"If arquivar {entrada.arquivados}")
            await alterna_arquivar_por_ids(
                usuario,
                app_origem=app_origem,
                chatids=chat_ids,
                arquivar=not entrada.arquivados,
            )
            logger.info(f"Valor entrada arquivar: {entrada.arquivados}")
            return JSONResponse(
                content={
                    "status": 1,
                    "mensagem": f"Chats {'arquivados' if entrada.arquivados else 'desarquivados'} com sucesso!",
                },
                status_code=status.HTTP_200_OK,
            )
    except Exception as erro:
        logger.error(f"Erro ao desafixar chats: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao desafixar chats: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.put(
    "/{chat_id}/mensagem/{msg_id}/feedback",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Registra a reção do usuário à uma mensagem",
)
@tracer.start_as_current_span("reagir_mensagem")
async def reagir_mensagem(
    chat_id: str, msg_id: str, entrada: ReagirInput, request: Request
):
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login
    try:
        if chat_id and msg_id:
            await adicionar_feedback(
                entrada=entrada,
                chat_id=chat_id,
                cod_mensagem=msg_id,
                app_origem=app_origem,
                usuario=usuario,
            )

            return JSONResponse(
                content={"status": 1, "mensagem": "Feedback adicionado com sucesso!"},
                status_code=status.HTTP_200_OK,
            )

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": "Erro ao identificar o chat ou a mensagem.",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as erro:
        logger.error(f"Erro ao definir feedback de mensagem: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao definir feedback de mensagem: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.post(
    "/stop/{correlacao_chamada_id}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Cria evento de parada execução de processamento de resposta do chat.",
)
@tracer.start_as_current_span("parar_processamento_resposta")
async def parar_processamento_resposta(correlacao_chamada_id, request: Request):
    """
    Cria um evento broadcast no REDIS que irá parar o processamento de resposta do chat
    caso este ainda esteja em execução, parando o processamento do chat.
    """
    app_origem = "CHATTCU"
    usuario = request.state.decoded_token.login
    try:
        if not correlacao_chamada_id:
            return JSONResponse(
                content={
                    "status": status.HTTP_400_BAD_REQUEST,
                    "mensagem": "Atenção a requisição deve possuir correlacao_chamada_id!",
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(
            f"Recebido stop processamento de correlacao_chamada_id: {correlacao_chamada_id}"
        )

        mensagem = MensagemChatStopRedis(
            channel_subscricao=TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value,
            correlacao_chamada_id=correlacao_chamada_id,
            usuario=usuario,
            origem=app_origem,
            data_hora=datetime.datetime.now(),
        )

        client_redis.publish_message(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL, mensagem.model_dump_json()
        )

        return JSONResponse(
            content={
                "status": status.HTTP_200_OK,
                "mensagem": "Operação de cancelamento realizada com sucesso!",
            },
            status_code=status.HTTP_200_OK,
        )

    except Exception as erro:
        logger.error(f"Erro ao tentar parar chamada: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao tentar parar chamada: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.websocket(
    "/ws-realtime-audio",
    name="Websocket para comunicação de áudio em tempo real, (beta/preview)",
)
@tracer.start_as_current_span("ws_realtime_audio")
async def ws_realtime_audio(websocket: WebSocket):
    """
    Este endpoint é responsável por estabelecer uma conexão websocket para comunicação de áudio em tempo real
    com a a API de áudio do OpenAI.

    Para realizar a primeira conexão é enviar o primeiro evento com o type:
        {type:'auth_config', token:'entraIDToken', config_instructions: {}} em até X segundos.

    Caso o token seja válido um evento de retorno será enviado com o type: {type:'backend-authorized.done'}.
    """
    try:
        await websocket.accept()

        # aguarda a primeira mensagem para validação de auth inicial
        auth_payload = await asyncio.wait_for(websocket.receive_text(), timeout=4.0)
        auth_decoded_data = await UtilStreams.validar_payload(auth_payload)

        # TODO: remover hardcoded de usuários autorizados
        if auth_decoded_data.login not in [
            "X05740283744",
            "X96235071191",
            "X29153049802",
        ]:
            raise BusinessException(
                message="Usuário não autorizado para acessar o websocket áudio.",
                code=4003,
            )

        # TODO: esses eventos deverão ser migrados para ENUM's || namedtuple || Classes.
        if auth_decoded_data:
            await websocket.send_text(json.dumps({"type": "backend-authorized.done"}))

        client_instructions = UtilStreams.get_config_instructions_from_payload(
            auth_payload
        )

        print(f"Configurações de SESSION recebidas: {client_instructions}")

        browser_receive_stream = UtilStreams.websocket_stream(websocket)

        logger.info(
            f"Conexão websocket estabelecida com sucesso! [{auth_decoded_data.login}]"
        )
        config = ConfigRealtime()
        agent = OpenAIRealTimeClient(
            api_key=config.api_key,
            config_instruction=client_instructions,
            url=config.url,
            tools=TOOLS,
            login_user=auth_decoded_data.login,
        )

        await agent.aconnect(
            browser_receive_stream, websocket.send_text, websocket.close
        )

    except BusinessException as be:
        await websocket.send_text(
            json.dumps(
                {
                    "type": "backend-business-error",
                    "message": be.message,
                    "code": be.code,
                }
            )
        )
        await websocket.close(code=be.code, reason=be.message)
    except Exception as e:
        logger.error(f"Erro em ws_realtime_audio: {e}")
    finally:
        if websocket.client_state == WebSocketState.CONNECTED:
            websocket.close(code=1011)


# TODO Retirar o include_in_schema e alterar o Perfil no lançamento da versão
@router.get(
    "/{chat_id}/mensagem/{msg_id}/imagem/{id_imagem}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    responses={
        status.HTTP_200_OK: {"model": ImageBase64Out},
        status.HTTP_400_BAD_REQUEST: {"model": ResponsePadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Retorna uma imagem de uma mensagem do usuário",
    include_in_schema=False,
)
@tracer.start_as_current_span("get_imagem")
async def get_imagem(request: Request, chat_id: str, msg_id: str, id_imagem: str):
    app_origem = "CHATTCU"

    try:
        inicio = time.time()

        if chat_id and msg_id and id_imagem:
            usuario = request.state.decoded_token.login

            imagem_como_binario = await buscar_imagem(
                chat_id, msg_id, id_imagem, usuario
            )

            if imagem_como_binario:
                fim = time.time()
                logger.info(
                    f"Tempo total gasto para retornar o chat com suas mensagens: {(fim - inicio)}"
                )

                imagem_base64 = binario_to_base64(imagem_como_binario)

                return JSONResponse(
                    content={"image_base64": imagem_base64},
                    status_code=status.HTTP_200_OK,
                )

            return JSONResponse(
                content={"status": 0, "mensagem": "Imagem não encontrada."},
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return JSONResponse(
            content={"status": 0, "mensagem": "Erro ao resgatar imagem."},
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as erro:
        logger.error(f"Erro ao resgatar imagem: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao resgatar imagem: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )
