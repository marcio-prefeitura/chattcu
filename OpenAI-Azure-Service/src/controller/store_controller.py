import logging
import time
import traceback
from typing import List

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from opentelemetry import trace

from ..domain.schemas import (
    FiltrosEspecialistas,
    PaginatedEspecialistResponse,
    ResponseException,
    ResponsePadrao,
)
from ..domain.store import Categoria, Especialista, TotalEspecialistasPorCategoria
from ..infrastructure.role_checker import RoleChecker
from ..infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW
from ..service.store_service import (
    contador_especialistas_por_categoria,
    inserir_especialista,
    listar_categorias_disponiveis,
    listar_especialistas_por,
)

tracer = trace.get_tracer(__name__)
router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/especialista",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=Especialista,
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
    name="Cria um novo especialista",
    description="""Endpoint para criar um novo especialista na store""",
)
@tracer.start_as_current_span("criar_especialista")
async def criar_especialista(especialista: Especialista, request: Request):
    try:
        usuario = request.state.decoded_token.login

        return await inserir_especialista(especialista, usuario)
    except Exception as erro:
        logger.error(f"Erro ao criar especialista: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao criar especialista: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get(
    "/especialistas",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=PaginatedEspecialistResponse,
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
    name="Retorna os especialistas de acordo com os filtros informados, de forma paginada",
)
@tracer.start_as_current_span("listar_especialistas_paginados")
async def listar_especialistas_paginados(
    request: Request, filtros: FiltrosEspecialistas = Depends()
) -> PaginatedEspecialistResponse | JSONResponse:
    usuario = request.state.decoded_token.login

    try:
        inicio = time.time()

        especialistas = await listar_especialistas_por(login=usuario, filtros=filtros)

        fim = time.time()
        logger.info(f"Tempo total gasto para retornar especialistas: {(fim - inicio)}")

        return especialistas
    except Exception as erro:
        logger.error(f"Erro ao recuperar especialistas: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao recuperar especialistas: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get(
    "/categorias",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=List[Categoria],
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
    name="Retorna a lista de categorias disponíveis",
)
@tracer.start_as_current_span("listar_categorias")
async def listar_categorias(request: Request):
    usuario = request.state.decoded_token.login

    try:
        logger.info(f"Listando categorias disponíveis: {usuario}")

        lista = await listar_categorias_disponiveis(usuario)

        return lista
    except Exception as erro:
        logger.error(f"Erro ao listar categorias {usuario}: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao listar categorias: {erro}"},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get(
    "/especialistas/totais",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=List[TotalEspecialistasPorCategoria],
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
    name="Retorna o total de especiaslistas de acordo com a categoria",
)
@tracer.start_as_current_span("total_especialistas_por_categoria")
async def total_especialistas_por_categoria(
    request: Request,
) -> List[TotalEspecialistasPorCategoria] | JSONResponse:
    usuario = request.state.decoded_token.login

    try:
        inicio = time.time()

        total = await contador_especialistas_por_categoria(login=usuario)

        fim = time.time()
        logger.info(
            f"Tempo total gasto para retornar totais de especialistas: {(fim - inicio)}"
        )

        return total
    except Exception as erro:
        logger.error(f"Erro ao recuperar totais de especialistas: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao recuperar totais de especialistas: {erro}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )
