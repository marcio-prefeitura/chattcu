import pytest

from src.infrastructure.roles import DESENVOLVEDOR
from src.infrastructure.security_tokens import DecodedEntraIDToken, DecodedToken


@pytest.fixture
def token_data():
    return {
        "siga_culs": "teste",
        "siga_nuls": "teste",
        "siga_clot": "teste",
        "siga_slot": "teste",
        "siga_lot": "teste",
        "siga_luls": "MOCKED_LOGIN",
        "siga_roles": [],
    }


@pytest.fixture
def decoded_token(token_data):
    return DecodedToken.model_validate(token_data)


@pytest.fixture
def decoded_token_com_role(token_data):
    token_data["siga_roles"] = [DESENVOLVEDOR]
    return DecodedToken.model_validate(token_data)
