import pytest

from src.infrastructure.token import Token


class TestToken:

    @pytest.fixture
    def raw_token_sistema(self):
        return {
            "tus": "SISTEMA",
            "culs": "user_code",
            "nuls": "user_name",
            "clot": "lot_code",
            "slot": "lot_name",
            "lot": "full_lot_name",
            "luls": "user_login",
            "sloo": "lot_name",
            "loo": "full_lot_name",
            "roles": ["admin", "user"],
        }

    @pytest.fixture
    def raw_token_sistema_not_tus(self):
        return {
            "culs": "user_code",
            "nuls": "user_name",
            "clot": "lot_code",
            "slot": "lot_name",
            "lot": "full_lot_name",
            "luls": "user_login",
            "sloo": "lot_name",
            "loo": "full_lot_name",
            "siga_culs": "siga_culs",
            "roles": ["admin", "user"],
        }

    @pytest.fixture
    def raw_token_user(self):
        return {
            "tus": "USER",
            "cod": "user_code",
            "nus": "user_name",
            "clot": "lot_code",
            "slot": "lot_name",
            "lot": "full_lot_name",
            "sub": "user_login",
            "siga_culs": "siga_culs",
            "siga_nuls": "siga_nuls",
            "siga_clot": "siga_clot",
            "siga_luls": "siga_luls",
            "roles": ["admin", "user"],
        }

    @pytest.fixture
    def raw_token_user_not_tus(self):
        return {
            "cod": "user_code",
            "nus": "user_name",
            "clot": "lot_code",
            "slot": "lot_name",
            "lot": "full_lot_name",
            "sub": "user_login",
            "siga_culs": "siga_culs",
            "siga_nuls": "siga_nuls",
            "siga_clot": "siga_clot",
            "siga_luls": "siga_luls",
            "siga_lot": "siga_lot",
            "siga_slot": "siga_slot",
            "roles": ["admin", "user"],
        }

    def test_get_codigo_usuario_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_codigo_usuario() == "user_code"

    def test_get_codigo_usuario_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_codigo_usuario() == "user_code"

    def test_get_codigo_usuario_user_not_tus(self, raw_token_sistema_not_tus):
        token = Token(raw_token_sistema_not_tus)
        assert token.get_codigo_usuario() == "siga_culs"

    def test_get_nome_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_nome() == "user_name"

    def test_get_nome_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_nome() == "user_name"

    def test_get_nome_user_not_tus(self, raw_token_user_not_tus):
        token = Token(raw_token_user_not_tus)
        assert token.get_nome() == "siga_nuls"

    def test_get_codigo_lotacao_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_codigo_lotacao() == "lot_code"

    def test_get_codigo_lotacao_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_codigo_lotacao() == "lot_code"

    def test_get_codigo_lotacao_user_not_tus(self, raw_token_user_not_tus):
        token = Token(raw_token_user_not_tus)
        assert token.get_codigo_lotacao() == "siga_clot"

    def test_get_lotacao_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_lotacao() == "lot_name"

    def test_get_lotacao_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_lotacao() == "lot_name"

    def test_get_lotacao_user_not_tus(self, raw_token_user_not_tus):
        token = Token(raw_token_user_not_tus)
        assert token.get_lotacao() == "siga_slot"

    def test_get_nome_lotacao_completo_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_nome_lotacao_completo() == "full_lot_name"

    def test_get_nome_lotacao_completo_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_nome_lotacao_completo() == "full_lot_name"

    def test_get_nome_lotacao_completo_user_not_tus(self, raw_token_user_not_tus):
        token = Token(raw_token_user_not_tus)
        assert token.get_nome_lotacao_completo() == "siga_lot"

    def test_get_login_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_login() == "user_login"

    def test_get_login_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_login() == "user_login"

    def test_get_login_user_not_tus(self, raw_token_user_not_tus):
        token = Token(raw_token_user_not_tus)
        assert token.get_login() == "siga_luls"

    def test_get_roles_sistema(self, raw_token_sistema):
        token = Token(raw_token_sistema)
        assert token.get_roles() == ["admin", "user"]

    def test_get_roles_user(self, raw_token_user):
        token = Token(raw_token_user)
        assert token.get_roles() == ["admin", "user"]
