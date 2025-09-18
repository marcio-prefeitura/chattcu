import logging
import traceback
from typing import List

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from opentelemetry import trace

from ..domain.agent_config import AgentConfig
from ..domain.schemas import ResponseException, ResponsePadrao
from ..infrastructure.role_checker import RoleChecker
from ..infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW
from ..service.agent_service import inserir_agent, listar_agents_disponiveis

tracer = trace.get_tracer(__name__)
router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/listar",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=List[AgentConfig],
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
    name="Retorna a lista de agentes disponíveis",
)
@tracer.start_as_current_span("listar_agents")
async def listar_agents(request: Request):
    usuario = request.state.decoded_token.login

    try:
        logger.info(f"Resgatando agentes disponíveis: {usuario}")

        lista = await listar_agents_disponiveis(usuario)

        return lista
    except Exception as erro:
        logger.error(f"Erro ao listar agents {usuario}: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao listar agents: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.post(
    "",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=AgentConfig,
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
    name="Adiciona um novo agente",
    description="""Endpoint para adicionar um novo agente""",
)
@tracer.start_as_current_span("adiciona_agent")
async def adiciona_agent(agent: AgentConfig, request: Request):
    try:
        usuario = request.state.decoded_token.login

        return await inserir_agent(agent, usuario)
    except Exception as erro:
        logger.error(f"Erro ao criar agent: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao criar agent: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )
