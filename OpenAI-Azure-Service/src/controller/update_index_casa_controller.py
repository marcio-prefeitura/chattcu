import logging
from typing import List

from fastapi import APIRouter, Depends, Request
from opentelemetry import trace

from src.domain.schemas import ServicoSegedam, ServicoSegedamList
from src.infrastructure.role_checker import RoleChecker
from src.infrastructure.roles import APEX, COMUM, DESENVOLVEDOR
from src.service.segedam_service import autaliza_integral, autaliza_parcial

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

router = APIRouter()


@router.post(
    "/update/parcial",
    include_in_schema=False,
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, APEX]))],
)
@tracer.start_as_current_span("atualizacao_parcial")
async def atualizacao_parcial(servicos: ServicoSegedamList, request: Request):
    usr_roles = request.state.decoded_token.roles
    await autaliza_parcial(servicos.root, usr_roles=usr_roles)


@router.post(
    "/update/integral",
    include_in_schema=False,
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, APEX]))],
)
@tracer.start_as_current_span("atualizacao_integral")
async def atualizacao_integral(servicos: ServicoSegedamList, request: Request):
    usr_roles = request.state.decoded_token.roles
    await autaliza_integral(servicos.root, usr_roles=usr_roles)
