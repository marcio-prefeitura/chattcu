import logging
from typing import List

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from opentelemetry import trace

from src.domain.schemas import (
    InOutputModelOut,
    ModelOut,
    ResponseException,
    ResponsePadrao,
)
from src.infrastructure.env import MODELOS
from src.infrastructure.role_checker import RoleChecker
from src.infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW
from src.infrastructure.security_tokens import DecodedToken

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
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
    name="Retorna uma determinada conversa do usuário",
)
@tracer.start_as_current_span("listar_modelos_disponiveis")
async def listar_modelos_disponiveis(request: Request):
    def get_models() -> List[ModelOut]:
        token: DecodedToken = request.state.decoded_token
        usr: str = token.login

        models = []

        for key, value in MODELOS.items():
            if value["disponivel"]:
                models.append(
                    ModelOut(
                        name=key,
                        description=value["description"],
                        icon=value["icon"],
                        is_beta=value["is_beta"],
                        max_words=value["max_words"],
                        stream_support=value["stream_support"],
                        inputs=InOutputModelOut.model_validate(value["inputs"]),
                        outputs=InOutputModelOut.model_validate(value["outputs"]),
                    )
                )

        return models

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"modelos": [model.model_dump() for model in get_models()]},
    )
