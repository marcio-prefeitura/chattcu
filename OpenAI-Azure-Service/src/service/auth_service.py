import base64
import json
import logging
import re
import traceback
from datetime import datetime, timedelta
from typing import Annotated, List

import aiohttp
import jwt
from fastapi import Header, HTTPException, status
from fastapi.responses import JSONResponse
from jwt import PyJWKClient
from opentelemetry import trace

from src.conf.env import configs
from src.infrastructure.env import (
    HEADERS,
    PADDING,
    RECURSO_COMPUTACIONAL,
    RECURSO_COMPUTACIONAL_AUTHJWT,
    VALIDADE_REFRESH_TOKEN,
)
from src.infrastructure.security_tokens import (
    AuthMethod,
    DecodedEntraIDToken,
    DecodedToken,
)

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("verify_decode_entraid_token")
async def verify_decode_entraid_token(
    token: str, x_tkn: str | None, x_ufp: str | None
) -> DecodedEntraIDToken:
    url = "https://login.microsoftonline.com/bf158188-9a11-44c2-b7fc-21e85613ba27/discovery/v2.0/keys"
    try:
        jwks_client = PyJWKClient(
            url,
        )
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_signature": True, "verify_aud": False},
            audience=configs.AUDIENCE,
        )

        logger.info("Token EntraID validado com sucesso!")

        if data:
            data["raw_token"] = token

            if (
                x_ufp
                and x_tkn
                and (
                    data["azpacr"]
                    in [AuthMethod.SystemWithSecret, AuthMethod.SystemWithCert]
                )
            ):
                siga_decoded = await verify_decode_siga_token(x_tkn, x_ufp)

                data["siga_luls"] = siga_decoded.login

            return DecodedEntraIDToken(**data)
    except jwt.ExpiredSignatureError as exc:
        traceback.print_exc()
        raise jwt.ExpiredSignatureError("Token Entra ID expirado!") from exc
    except Exception:
        traceback.print_exc()
        raise jwt.InvalidTokenError("Token EntraID inválido!") from exc

    raise jwt.InvalidTokenError("Token EntraID inválido!")


@tracer.start_as_current_span("verify_decode_siga_token")
async def verify_decode_siga_token(
    token_jwt: str, user_fingerprint: str
) -> DecodedToken:
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.post(
            f"{configs.AUTH_JWT_MS_URL}/api/v1/token-jwt/validar",
            headers=HEADERS,
            json={"tokenJwt": token_jwt, "userFingerPrint": user_fingerprint},
            timeout=timeout,
        ) as response:
            data = await response.json()
            if (
                response.status != 200
                or data["mensagens"][0]["mensagem"] != "Token JWT validado com sucesso"
            ):
                raise jwt.InvalidTokenError("Token Siga inválido!")

            data = json.loads(
                base64.b64decode(
                    f"{data['mensagens'][0]['codigoParaUsoCliente']}{PADDING}"
                )
            )
            logger.info("Token Siga validado com sucesso!")
            return DecodedToken(**data)


@tracer.start_as_current_span("get_token")
async def get_token(
    authorization: Annotated[str, Header()],
    x_ufp: Annotated[str | None, Header()] = None,
    x_tkn: Annotated[str | None, Header()] = None,
) -> DecodedToken | None:

    try:
        token = authorization.split()[1]

        logger.info("Autenticação via EntraID")
        decoded_entraid_token = await verify_decode_entraid_token(token, x_tkn, x_ufp)
        return decoded_entraid_token
    except Exception as exc:
        raise HTTPException(status_code=401) from exc


@tracer.start_as_current_span("autenticar_servico")
async def autenticar_servico(usuario_logado_servico_origem: str, recurso_computacional):
    logger.info(f"usuário logado na origem: {usuario_logado_servico_origem}")

    url = re.sub(r"\/$", "", configs.AUTENTICACAO_REST_URL)

    body = {
        "username": configs.USUARIO_SISTEMA,
        "password": configs.SENHA_SISTEMA,
        "codRecursoComputacional": recurso_computacional,
        "usuarioLogadoServicoOrigem": usuario_logado_servico_origem,
    }

    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{url}/auth/token-jwt", json=body, timeout=timeout
        ) as response:
            # Lança uma exceção se o código de status não for 2xx
            response.raise_for_status()

            json_result = await response.json()

            if "tokenJwt" not in json_result or not json_result["tokenJwt"]:
                logger.info("Não foi gerado o token solicitado!")

            return json_result["tokenJwt"]


@tracer.start_as_current_span("autenticar_servico_token_2019")
async def autenticar_servico_token_2019(
    token_usuario_logado_servico_origem: str,
    ufp_usuario_logado_servico_origem: str,
    recurso_computacional: List[str],
):
    HEADERS["Authorization"] = f"Bearer {token_usuario_logado_servico_origem}"
    HEADERS["X-UFP"] = ufp_usuario_logado_servico_origem

    url = re.sub(r"\/$", "", configs.AUTH_JWT_MS_URL)

    body = {
        "loginSistema": configs.USUARIO_SISTEMA,
        "senha": configs.SENHA_SISTEMA,
        "listaRecursosComputacionais": recurso_computacional,
        "userFingerPrintUsuarioOrigem": ufp_usuario_logado_servico_origem,
        "tokenJwtUsuarioOrigem": token_usuario_logado_servico_origem,
    }

    # 20 seconds
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{url}/api/v1/token-jwt/por-login-sistema-com-usuario-na-origem",
            json=body,
            timeout=timeout,
        ) as response:
            # Lança uma exceção se o código de status não for 2xx
            response.raise_for_status()

            return await response.json()


@tracer.start_as_current_span("gerar_link_login")
async def gerar_link_login(pathname: str, origin: str, context: bool = True):
    # fixedEncodeURIComponent
    ambiente = (
        "LOCAL"
        if "localhost" in origin
        else "prod" if "prod" in configs.PROFILE else "dev"
    )
    contexto = "/login?" if context else "?"

    return (
        f"{configs.SIGA_EXTERNO_URL}/?ambiente={ambiente}"
        + f"&contexto={contexto}&maquina={origin}&URL={pathname}"
    )


@tracer.start_as_current_span("autenticar_por_azure_jwt")
async def autenticar_por_azure_jwt(id_token: str, client_id: str):
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.post(
            f"https://sso.apps.tcu.gov.br/rest/tkn/converter-azure-jwt-para-tkn-portal",
            json={"id_token": id_token, "client_id": client_id},
            timeout=timeout,
        ) as result:
            logger.info(
                f"https://sso.apps.tcu.gov.br/rest/tkn/converter-azure-jwt-para-tkn-portal"
            )
            logger.info({"id_token": id_token, "client_id": client_id})

            logger.info(await result.text())

            json_result = await result.json()

            return json_result["tkn"]


@tracer.start_as_current_span("autenticar_por_tkn_portal")
async def autenticar_por_tkn_portal(tkn: str):
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.post(
            f"http://auth-jwt.producao.rancher.tcu.gov.br/api/v1/token-jwt/por-token-portal-tcu",
            json={
                "cifrar": True,
                "tokenPortalTcu": tkn,
                "listaRecursosComputacionais": RECURSO_COMPUTACIONAL,
            },
            timeout=timeout,
        ) as result:
            json_result = await result.json()
            await persiste_autenticacao_no_redis(
                token_jwt=json_result["tokenJwt"],
                user_finger_print=json_result["userFingerPrint"],
                refresh_token=json_result["refreshToken"],
            )

            return {"userFingerPrint": json_result["userFingerPrint"]}


@tracer.start_as_current_span("autenticar_por_tkn_java")
async def autenticar_por_tkn_java(tkn: str):
    try:
        # 20 seconds
        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{configs.AUTH_JWT_MS_URL}/api/v1/token-jwt/por-tkn-login-integrado",
                json={
                    "cifrar": True,
                    "tkn": tkn,
                    "listaRecursosComputacionais": RECURSO_COMPUTACIONAL,
                },
                timeout=timeout,
            ) as result:
                # Lança uma exceção se o código de status não for 2xx
                result.raise_for_status()

                json_result = await result.json()

                await persiste_autenticacao_no_redis(
                    token_jwt=json_result["tokenJwt"],
                    user_finger_print=json_result["userFingerPrint"],
                    refresh_token=json_result["refreshToken"],
                )

                return {"userFingerPrint": json_result["userFingerPrint"]}
    except Exception as err:
        logger.error(f"Erro ao fazer a requisição: {err}")
        logger.error(traceback.print_exc())

        return JSONResponse(
            content={"status": None, "mensagemErro": str(err)},
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@tracer.start_as_current_span("atualizar_access_token_por_refresh_token")
async def atualizar_access_token_por_refresh_token(user_finger_print: str):
    try:
        tokens = await buscar_tokens_no_redis(user_finger_print)

        assert tokens and "refreshToken" in tokens

        # 20 seconds
        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{configs.AUTH_JWT_MS_URL}/api/v1/token-jwt/por-refresh-token",
                json={
                    "refreshToken": tokens["refreshToken"],
                    "userFingerPrint": user_finger_print,
                },
                timeout=timeout,
            ) as result:
                # Lança uma exceção se o código de status não for 2xx
                result.raise_for_status()

                json_result = await result.json()

                await persiste_autenticacao_no_redis(
                    token_jwt=json_result["tokenJwt"],
                    user_finger_print=json_result["userFingerPrint"],
                    refresh_token=json_result["refreshToken"],
                )

                return {"userFingerPrint": json_result["userFingerPrint"]}
    except aiohttp.ClientResponseError as err:
        logger.error(f"Erro ao fazer a requisição: {err}")
        logger.error(traceback.print_exc())

        return JSONResponse(
            content={"status": None, "mensagemErro": "Usuário não autenticado!"},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    except Exception as err:
        logger.error(f"Erro ao fazer a requisição: {err}")
        logger.error(traceback.print_exc())

        return JSONResponse(
            content={"status": None, "mensagemErro": str(err)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@tracer.start_as_current_span("gerar_tonken_login_senha_usr_siga")
async def gerar_tonken_login_senha_usr_siga(
    login: str, senha: str, recurso_computacional: List[str]
):
    # 20 seconds
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{configs.AUTH_JWT_MS_URL}/api/v1/token-jwt/por-login-senha-usuario-siga",
            headers=HEADERS,
            json={
                "login": login,
                "senha": senha,
                "listaRecursosComputacionais": recurso_computacional,
                "cifrar": True,
            },
            timeout=timeout,
        ) as response:
            # logger.info(response.text)
            # logger.info(response.status)

            # Lança uma exceção se o código de status não for 2xx
            response.raise_for_status()

            json_result = await response.json()

            return {
                "tokenJwt": json_result["tokenJwt"],
                "refreshToken": json_result["refreshToken"],
                "userFingerPrint": json_result["userFingerPrint"],
            }


@tracer.start_as_current_span("gerar_tonken_login_senha_usr_siga_com_cache_redis")
async def gerar_tonken_login_senha_usr_siga_com_cache_redis(login: str, senha: str):
    try:
        tokens = await gerar_tonken_login_senha_usr_siga(
            login, senha, RECURSO_COMPUTACIONAL
        )

        await persiste_autenticacao_no_redis(
            token_jwt=tokens["tokenJwt"],
            user_finger_print=tokens["userFingerPrint"],
            refresh_token=tokens["refreshToken"],
        )

        return tokens
    except Exception as error:
        logger.error(traceback.print_exc())

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": 0, "mensagemErro": str(error)},
        )


@tracer.start_as_current_span("persiste_autenticacao_no_redis")
async def persiste_autenticacao_no_redis(
    token_jwt: str, refresh_token: str, user_finger_print: str
) -> None:
    try:
        logger.info(">> Persistindo tokens no Redis")

        tokens_auth_jwt = await gerar_tonken_login_senha_usr_siga(
            configs.USUARIO_SISTEMA,
            configs.SENHA_SISTEMA,
            [f"{RECURSO_COMPUTACIONAL_AUTHJWT}"],
        )

        # Obter a data e hora atual
        data_atual = datetime.now().replace(microsecond=0)
        expiracao = data_atual + timedelta(hours=VALIDADE_REFRESH_TOKEN)
        # expiracao_milis = int(expiracao.timestamp() * 1000)

        expiracao_segundos = int(expiracao.timestamp())

        expiracao_ = datetime.fromtimestamp(expiracao_segundos)

        logger.info(f"Data atual:{data_atual}")
        logger.info(
            f"Nova data após adicionar {VALIDADE_REFRESH_TOKEN} horas: {expiracao_}"
        )

        parametros = {
            "accessToken": token_jwt,
            "refreshToken": refresh_token,
            "userFingerPrint": user_finger_print,
            "dataHoraExpiracaoRefreshToken": expiracao_segundos,
        }

        # 20 seconds
        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{configs.AUTH_REDIS_URL}/api/cache-jwt-no-backend/adiciona-autenticacao",
                headers={
                    "Authorization": f'Bearer {tokens_auth_jwt["tokenJwt"]}',
                    "X-UFP": tokens_auth_jwt["userFingerPrint"],
                },
                json=parametros,
                timeout=timeout,
            ) as response:
                json_result = await response.json()

                assert (
                    json_result["mensagens"][0]["codigoParaUsoCliente"]
                    == "autenticacao-persistida"
                )

                logger.info(">> Tokens persistidos no Redis")
    except Exception as error:
        logger.error(error)
        traceback.print_exc()

        raise error


@tracer.start_as_current_span("buscar_tokens_no_redis")
async def buscar_tokens_no_redis(user_finger_print: str):
    if not user_finger_print or user_finger_print == "undefined":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        logger.info(">> Buscando tokens no Redis")

        tokens_auth_jwt = await gerar_tonken_login_senha_usr_siga(
            configs.USUARIO_SISTEMA,
            configs.SENHA_SISTEMA,
            [f"{RECURSO_COMPUTACIONAL_AUTHJWT}"],
        )

        # 20 seconds
        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession() as session:
            async with session.get(
                (
                    f"{configs.AUTH_REDIS_URL}"
                    + f"/api/cache-jwt-no-backend/recupera-autenticacao/{user_finger_print}"
                ),
                headers={
                    "Authorization": f'Bearer {tokens_auth_jwt["tokenJwt"]}',
                    "X-UFP": tokens_auth_jwt["userFingerPrint"],
                },
                timeout=timeout,
            ) as response:
                # Lança uma exceção se o código de status não for 2xx
                response.raise_for_status()

                json_result = await response.json()

                logger.info(">> Tokens resgatados do Redis com sucesso")
                return {
                    "tokenJwt": json_result["accessToken"],
                    "userFingerPrint": json_result["userFingerPrint"],
                    "refreshToken": json_result["refreshToken"],
                }
    except Exception as error:
        logger.error(error)
        logger.error(traceback.print_exc())

        raise error


@tracer.start_as_current_span("efetuar_logoff")
async def efetuar_logoff(user_finger_print: str):
    tokens = await buscar_tokens_no_redis(user_finger_print)

    # 20 seconds
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{configs.AUTH_JWT_MS_URL}/api/v1/token-jwt/logoff",
            json={"tokenJwt": tokens["tokenJwt"], "userFingerPrint": user_finger_print},
            timeout=timeout,
        ) as response:
            if response.status != 200:
                json_result = await response.json()

                return JSONResponse(
                    content={
                        "status": json_result["statusCode"],
                        "mensagemErro": json_result["mensagem"],
                    },
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
