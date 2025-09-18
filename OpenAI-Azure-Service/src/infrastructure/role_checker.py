from typing import List

from fastapi import Depends, HTTPException, Request, status
from opentelemetry import trace

from src.infrastructure.security_tokens import DecodedToken
from src.service.auth_service import get_token

tracer = trace.get_tracer(__name__)


class RoleChecker:
    @tracer.start_as_current_span("__init__RoleChecker")
    def __init__(self, allowed_roles: List):
        self.allowed_roles = allowed_roles

    @tracer.start_as_current_span("__call__")
    def __call__(self, request: Request, token: DecodedToken = Depends(get_token)):
        if token is None or not set(token.roles) & set(self.allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário Sem permissão para realizar operação.",
            )

        request.state.decoded_token = token
