from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException, Request

from src.infrastructure.role_checker import RoleChecker
from src.infrastructure.security_tokens import DecodedToken


class TestRoleChecker:

    @pytest.fixture
    def mock_request(self):
        request = MagicMock(spec=Request)
        request.state = MagicMock()
        return request

    @pytest.fixture
    def mock_token(self):
        return DecodedToken(
            roles=["admin", "user"],
            login="test_user",
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )

    @pytest.fixture
    def mock_token_no_roles(self):
        return DecodedToken(
            roles=[],
            login="test_user",
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )

    @pytest.mark.asyncio
    def test_role_checker_with_allowed_role(self, mock_request, mock_token):
        role_checker = RoleChecker(
            allowed_roles=["admin"],
        )
        role_checker(mock_request, mock_token)
        assert mock_request.state.decoded_token == mock_token

    @pytest.mark.asyncio
    def test_role_checker_without_allowed_role(self, mock_request, mock_token_no_roles):
        role_checker = RoleChecker(allowed_roles=["admin"])
        with pytest.raises(HTTPException) as exc_info:
            role_checker(mock_request, mock_token_no_roles)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Usuário Sem permissão para realizar operação."

    @pytest.mark.asyncio
    def test_role_checker_with_no_token(self, mock_request):
        role_checker = RoleChecker(allowed_roles=["admin"])
        with pytest.raises(HTTPException) as exc_info:
            role_checker(mock_request, None)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Usuário Sem permissão para realizar operação."
