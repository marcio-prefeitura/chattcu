import logging
import traceback
from typing import List

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from opentelemetry import trace

from src.domain.schemas import (
    ChatOut,
    CompartilhamentoIn,
    CompartilhamentoOut,
    ResponseException,
    ResponsePadrao,
)
from src.exceptions import BusinessException
from src.infrastructure.role_checker import RoleChecker
from src.infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW
from src.service.compartilhamento_service import (
    assumir_chat,
    atualiza_chat_compartilhamento,
    compartilha_chat,
    exclui_compartilhamento,
    exclui_todos_compartilhamentos_enviados,
    lista_compartilhados_pelo_usuario,
    retorna_compartilhamento,
    retorna_compartilhamento_by_chatid,
)

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

router = APIRouter()


@router.get(
    "/sharing/{id_compartilhamento}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=CompartilhamentoOut,
    status_code=status.HTTP_200_OK,
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
    name="Retorna um determinado compartilhamento do usuário",
    description="""Retorna um determinado compartilhamento do usuário""",
)
@tracer.start_as_current_span("get_compartilhamento")
async def get_compartilhamento(id_compartilhamento: str, request: Request):
    try:
        usuario = request.state.decoded_token.login

        return await retorna_compartilhamento(id_compartilhamento, usuario)
    except Exception as erro:
        logger.error(f"Erro ao retornar compartilhamento: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao retornar compartilhamento: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get(
    "/chat/{id_chat}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=CompartilhamentoOut,
    status_code=status.HTTP_200_OK,
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
    name="Retorna um compartilhamento por id_chat.",
    description="""Retorna um compartilhamento por id_chat.""",
)
@tracer.start_as_current_span("get_compartilhamento_by_chat_id")
async def get_compartilhamento_by_chat_id(id_chat: str, request: Request):
    """controller: retorna um compartilhamento de chat por chat_id caso exista."""
    try:
        usuario = request.state.decoded_token.login
        compartilhamento = await retorna_compartilhamento_by_chatid(id_chat, usuario)

        return compartilhamento

    except BusinessException as be:
        return JSONResponse(
            content={
                "status": be.code,
                "mensagem": be.message,
            },
            status_code=be.code,
        )
    except Exception as erro:
        logger.error(f"Erro ao verificar existência de compartilhamento: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "mensagem": "Erro ao verificar existência de compartilhamento.",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.patch(
    "/chat/{id_compartilhamento}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=CompartilhamentoOut,
    status_code=status.HTTP_201_CREATED,
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
    name="Atualiza o o chat do compartilhamento existente",
    description="""Atualiza o o chat do compartilhamento existente pelo id_compartilhamento.""",
)
@tracer.start_as_current_span("atualiza_chat_do_compartilhamento")
async def atualiza_chat_do_compartilhamento(id_compartilhamento, request: Request):
    try:
        usuario = request.state.decoded_token.login
        sucesso = await atualiza_chat_compartilhamento(id_compartilhamento, usuario)

        if sucesso:
            return JSONResponse(
                content={
                    "status": status.HTTP_201_CREATED,
                    "mensagem": "Link do chat atualizado com sucesso.",
                },
                status_code=status.HTTP_201_CREATED,
            )
        else:
            raise BusinessException(
                "Link do chat não atualizado ou não encontrado.",
                code=status.HTTP_404_NOT_FOUND,
            )

    except BusinessException as be:
        return JSONResponse(
            content={
                "status": be.code,
                "mensagem": be.message,
            },
            status_code=be.code,
        )

    except Exception as erro:
        logger.error(f"Erro ao atualizar link do chat: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "mensagem": f"Erro ao atualizar link chat: {erro}",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post(
    "/chat",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=CompartilhamentoOut,
    status_code=status.HTTP_201_CREATED,
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
    name="Compartilha um determinado chat do usuário",
    description="""Compartilha um determinado chat do usuário""",
)
@tracer.start_as_current_span("adiciona_compartilhamento")
async def adiciona_compartilhamento(
    compartilhamento: CompartilhamentoIn, request: Request
):
    try:
        usuario = request.state.decoded_token.login

        return await compartilha_chat(compartilhamento, usuario)
    except Exception as erro:
        logger.error(f"Erro ao compartilhar chat: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao compartilhar chat: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.delete(
    "/sharing",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
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
    name="Exclui todos os compartilhamentos de chats enviados pelo usuário",
    description="""Exclui todos os compartilhamentos de chats enviados pelo usuário""",
)
@tracer.start_as_current_span("delete_todos_compartilhamentos_enviados")
async def delete_todos_compartilhamentos_enviados(request: Request):
    try:
        usuario = request.state.decoded_token.login

        await exclui_todos_compartilhamentos_enviados(usuario)

        return JSONResponse(
            content={
                "status": 1,
                "mensagem": "Todos os compartilhamentos enviados excluídos com sucesso",
            },
            status_code=status.HTTP_200_OK,
        )
    except Exception as erro:
        logger.error(f"Erro ao excluir compartilhamentos enviados: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao excluir compartilhamentos enviados: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.delete(
    "/sharing/{id_compartilhamento}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
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
    name="Exclui um determinado compartilhamento de chat do usuário",
    description="""Exclui um determinado compartilhamento de chat do usuário""",
)
@tracer.start_as_current_span("delete_compartilhamento")
async def delete_compartilhamento(id_compartilhamento: str, request: Request):
    try:
        usuario = request.state.decoded_token.login

        await exclui_compartilhamento(id_compartilhamento, usuario)

        return JSONResponse(
            content={"status": 1, "mensagem": "Compartilhamento excluído com sucesso"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as erro:
        logger.error(f"Erro ao excluir compartilhamento: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao excluir compartilhamento: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get(
    "/sharing",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=List[CompartilhamentoOut],
    status_code=status.HTTP_200_OK,
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
    name="Lista todos os compartilhamentos realizados pelo usuário",
    description="""Lista todos os compartilhamentos realizados pelo usuário""",
)
@tracer.start_as_current_span("lista_compartilhamentos_do_usuario")
async def lista_compartilhamentos_do_usuario(request: Request):
    try:
        usuario = request.state.decoded_token.login

        return await lista_compartilhados_pelo_usuario(usuario)
    except Exception as erro:
        logger.error(
            f"Erro ao listar compartilhamentos originados pelo usuário: {erro}"
        )
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao listar compartilhamentos originados pelo usuário: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.post(
    "/sharing/{id_compartilhamento}/continue",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ChatOut,
    status_code=status.HTTP_201_CREATED,
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
    name="Continua uma determinada conversa compartilhada",
    description="""Continua uma determinada conversa compartilhada""",
)
@tracer.start_as_current_span("continua_conversa")
async def continua_conversa(id_compartilhamento: str, request: Request):
    try:
        usuario = request.state.decoded_token.login

        return await assumir_chat(
            id_compartilhamento=id_compartilhamento, login=usuario
        )
    except Exception as error:
        logger.error(f"Erro ao continuar chat compartilhado: {error}")
        traceback.print_stack()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao continuar chat compartilhado: {error}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )
