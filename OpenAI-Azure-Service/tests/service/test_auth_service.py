import base64
import json
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from fastapi import HTTPException

from src.infrastructure.security_tokens import AuthMethod
from src.service.auth_service import (
    atualizar_access_token_por_refresh_token,
    autenticar_por_azure_jwt,
    autenticar_por_tkn_java,
    autenticar_por_tkn_portal,
    autenticar_servico,
    autenticar_servico_token_2019,
    gerar_link_login,
    gerar_tonken_login_senha_usr_siga,
    gerar_tonken_login_senha_usr_siga_com_cache_redis,
    get_token,
    verify_decode_entraid_token,
    verify_decode_siga_token,
)

logger = logging.getLogger(__name__)


class TestAuthService:

    @pytest.mark.asyncio
    async def test_verify_decode_entraid_token_valid(self):
        with patch(
            "src.service.auth_service.verify_decode_siga_token",
            return_value=MagicMock(login="test_login"),
        ) as mock_siga:
            with patch("jwt.PyJWKClient.get_signing_key_from_jwt") as mock_jwks:
                mock_jwks.return_value = MagicMock(key="testkey")
                with patch(
                    "jwt.decode",
                    return_value={
                        "azpacr": AuthMethod.SystemWithSecret,
                        "raw_token": "test_token",
                        "siga_culs": "teste",
                        "siga_nuls": "value2",
                        "siga_clot": "value3",
                        "siga_slot": "value4",
                        "siga_lot": "value5",
                        "siga_luls": "test_login",
                        "aud": "testeaud",
                        "azp": "test",
                    },
                ) as mock_decode:
                    result = await verify_decode_entraid_token(
                        "fake_token", "x_tkn", "x_ufp"
                    )
                    assert result is not None
                    mock_decode.assert_called_once()
                    mock_siga.assert_called_once()

    @pytest.mark.asyncio
    async def test_verify_decode_entraid_token_invalid(self):
        with patch("jwt.decode", side_effect=jwt.DecodeError("Not enough segments")):
            with pytest.raises(Exception):
                await verify_decode_entraid_token("fake_token", "x_tkn", "x_ufp")

    @pytest.mark.asyncio
    async def test_get_token_valid(self):
        with patch(
            "src.service.auth_service.verify_decode_entraid_token",
            return_value=MagicMock(),
        ) as mock_verify:
            mock_verify.return_value = MagicMock(raw_token="valid_token")
            result = await get_token("Bearer fake_token", x_tkn="x_tkn", x_ufp="x_ufp")
            assert result is not None
            mock_verify.assert_called_once_with("fake_token", "x_tkn", "x_ufp")

    @pytest.mark.asyncio
    async def test_get_token_invalid(self):
        with patch(
            "src.service.auth_service.verify_decode_entraid_token",
            side_effect=HTTPException(status_code=401),
        ):
            with pytest.raises(HTTPException):
                await get_token("Bearer fake_token", x_tkn="x_tkn")

    @pytest.mark.asyncio
    async def test_autenticar_servico_success(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"tokenJwt": "jwt_token"})
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await autenticar_servico("user_logged", "recurso_computacional")
            assert result == "jwt_token"
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_autenticar_servico_failure(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 400
            mock_response.json = MagicMock(return_value={"error": "invalid_request"})
            mock_post.return_value.__aenter__.return_value = mock_response

            with pytest.raises(Exception):
                await autenticar_servico("user_logged", "recurso_computacional")

    @pytest.mark.asyncio
    async def test_verify_decode_siga_token(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(
                return_value={
                    "login": "test_login",
                    "other_field": "value",
                    "mensagens": [
                        {
                            "codigoParaUsoCliente": base64.b64encode(
                                json.dumps(
                                    {
                                        "login": "test_login",
                                        "siga_culs": "teste",
                                        "siga_nuls": "value2",
                                        "siga_clot": "value3",
                                        "siga_slot": "value4",
                                        "siga_lot": "value5",
                                        "siga_luls": "test_login",
                                    }
                                ).encode()
                            ).decode(),
                            "mensagem": "Token JWT validado com sucesso",
                        }
                    ],
                }
            )
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await verify_decode_siga_token(
                "fake_token_jwt", "fake_user_fingerprint"
            )
            assert result is not None
            assert result.login == "test_login"
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_autenticar_servico_token_2019(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(
                return_value={"userFingerPrint": "fingerprint"}
            )
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await autenticar_servico_token_2019("token", "ufp", ["recurso"])
            assert result["userFingerPrint"] == "fingerprint"
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_gerar_link_login(self):
        result = await gerar_link_login("/path", "localhost")
        assert "localhost" in result

    @pytest.mark.asyncio
    async def test_autenticar_por_azure_jwt(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.text = AsyncMock(return_value='{"tkn": "token"}')
            mock_response.json = AsyncMock(return_value={"tkn": "token"})
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await autenticar_por_azure_jwt("id_token", "client_id")
            assert result == "token"
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_autenticar_por_tkn_portal(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(
                return_value={
                    "userFingerPrint": "fingerprint",
                    "tokenJwt": "tokenTest",
                    "refreshToken": "refreshTest",
                    "mensagens": [
                        {
                            "codigoParaUsoCliente": "autenticacao-persistida",
                            "mensagem": "Token JWT validado com sucesso",
                        }
                    ],
                }
            )
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await autenticar_por_tkn_portal("tkn")
            assert result["userFingerPrint"] == "fingerprint"

    @pytest.mark.asyncio
    async def test_autenticar_por_tkn_java(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(
                return_value={
                    "userFingerPrint": "fingerprint",
                    "tokenJwt": "tokenTest",
                    "refreshToken": "refreshTest",
                    "mensagens": [
                        {
                            "codigoParaUsoCliente": "autenticacao-persistida",
                            "mensagem": "Token JWT validado com sucesso",
                        }
                    ],
                }
            )
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await autenticar_por_tkn_java("tkn")
            assert result["userFingerPrint"] == "fingerprint"

    @pytest.mark.asyncio
    async def test_atualizar_access_token_por_refresh_token(self):
        with patch("aiohttp.ClientSession.post") as mock_post, patch(
            "aiohttp.ClientSession.get"
        ) as mock_get:
            mock_post_response = MagicMock()
            mock_post_response.status = 200
            mock_post_response.json = AsyncMock(
                return_value={
                    "userFingerPrint": "fingerprint",
                    "tokenJwt": "tokenTest",
                    "refreshToken": "refreshTest",
                    "mensagens": [
                        {
                            "codigoParaUsoCliente": "autenticacao-persistida",
                            "mensagem": "Token JWT validado com sucesso",
                        }
                    ],
                }
            )
            mock_post.return_value.__aenter__.return_value = mock_post_response

            mock_get_response = MagicMock()
            mock_get_response.status = 200
            mock_get_response.json = AsyncMock(
                return_value={
                    "accessToken": "jwt_token",
                    "userFingerPrint": "fingerprint",
                    "refreshToken": "refresh_token",
                }
            )
            mock_get.return_value.__aenter__.return_value = mock_get_response

            result = await atualizar_access_token_por_refresh_token("fingerprint")
            assert result["userFingerPrint"] == "fingerprint"

    @pytest.mark.asyncio
    async def test_gerar_tonken_login_senha_usr_siga(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(
                return_value={
                    "userFingerPrint": "fingerprint",
                    "tokenJwt": "jwt_token",
                    "refreshToken": "refreshTest",
                    "mensagens": [
                        {
                            "codigoParaUsoCliente": "autenticacao-persistida",
                            "mensagem": "Token JWT validado com sucesso",
                        }
                    ],
                }
            )
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await gerar_tonken_login_senha_usr_siga(
                "login", "senha", ["recurso"]
            )
            assert result["tokenJwt"] == "jwt_token"
            mock_post.assert_called_once()

    @pytest.mark.asyncio
    async def test_gerar_tonken_login_senha_usr_siga_com_cache_redis(self):
        with patch("aiohttp.ClientSession.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(
                return_value={
                    "tokenJwt": "jwt_token",
                    "userFingerPrint": "fingerprint",
                    "refreshToken": "refresh_token",
                    "mensagens": [
                        {
                            "codigoParaUsoCliente": "autenticacao-persistida",
                            "mensagem": "Token JWT validado com sucesso",
                        }
                    ],
                }
            )
            mock_post.return_value.__aenter__.return_value = mock_response

            result = await gerar_tonken_login_senha_usr_siga_com_cache_redis(
                "login", "senha"
            )
            assert result["tokenJwt"] == "jwt_token"
