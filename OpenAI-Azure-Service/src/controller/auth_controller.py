import logging

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from opentelemetry import trace

from ..domain.schemas import AutenticacaoOut  # InfoUsuarioOut,
from ..domain.schemas import (
    AutenticacaoSigaIn,
    AutenticacaoSigaOut,
    ResponseErroPadrao,
    ResponseException,
)
from ..infrastructure.role_checker import RoleChecker
from ..infrastructure.roles import COMUM, DESENVOLVEDOR
from ..service.auth_service import (
    atualizar_access_token_por_refresh_token,
    autenticar_por_azure_jwt,
    autenticar_por_tkn_java,
    autenticar_por_tkn_portal,
    efetuar_logoff,
    gerar_link_login,
    gerar_tonken_login_senha_usr_siga_com_cache_redis,
)

# from ..service.auth_service import get_token

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

router = APIRouter()


@router.get(
    "/link-login",
    status_code=status.HTTP_201_CREATED,
    response_model=str,
    name="Gera um link de redirecionamento para o serviço de autenticação",
)
@tracer.start_as_current_span("link_login")
async def link_login(pathname: str, origin: str, context: bool = True):
    return await gerar_link_login(pathname, origin, context)


@router.post(
    "/autenticacao-jwt-por-azure",
    status_code=status.HTTP_201_CREATED,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ResponseErroPadrao}},
    name="Autentica o usuário utilizando um token da Azure",
)
@tracer.start_as_current_span("autenticacao_por_azure_jwt")
async def autenticacao_por_azure_jwt(request: Request, response: Response):
    logger.info("Autenticação por Azure Token")

    body = await request.json()
    tkn = await autenticar_por_azure_jwt(body["id_token"], body["client_id"])

    if "mensagemErro" in tkn:
        return JSONResponse(content=tkn, status_code=status.HTTP_400_BAD_REQUEST)

    ufp = await autenticacao_jwt_por_tkn_portal(request, response, tkn)

    logger.info("Autenticação por Azure Token realizada com sucesso!")

    return ufp


@router.get(
    "/autenticacao-jwt-por-tkn-portal",
    status_code=status.HTTP_201_CREATED,
    response_model=AutenticacaoOut,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ResponseErroPadrao}},
    name="Autentica o usuário utilizando um token do portal TCU",
)
@tracer.start_as_current_span("autenticacao_jwt_por_tkn_portal")
async def autenticacao_jwt_por_tkn_portal(
    request: Request, response: Response, tkn: str
):
    # domain = 'localhost' if request.client.host == '127.0.0.1' else request.client.host
    result = await autenticar_por_tkn_portal(tkn)

    return result


@router.get(
    "/autenticacao-jwt-por-tkn",
    status_code=status.HTTP_201_CREATED,
    response_model=AutenticacaoOut,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ResponseErroPadrao}},
    name="Autentica o usuário utilizando um token do Siga",
)
@tracer.start_as_current_span("autenticacao_jwt_por_tkn_java")
async def autenticacao_jwt_por_tkn_java(request: Request, response: Response):
    params = request.query_params
    result = await autenticar_por_tkn_java(
        params.get("/ServletTcuLoginIntegrado?tkn", params["tkn"])
    )

    return result


@router.post(
    "/reautenticacao-jwt-tkn",
    status_code=status.HTTP_201_CREATED,
    response_model=AutenticacaoOut,
    responses={status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponseErroPadrao}},
    name="""Reautentica o usuário através do
        refreshToken associado userFingerPrint informado""",
)
@tracer.start_as_current_span("atualizacao_access_token_por_refresh_token")
async def atualizacao_access_token_por_refresh_token(
    request: Request, response: Response
):
    body = await request.json()
    result = await atualizar_access_token_por_refresh_token(body["userFingerPrint"])

    return result


@router.post(
    "/autenticacao-por-login-senha-usuario-siga",
    response_model=AutenticacaoSigaOut,
    status_code=status.HTTP_201_CREATED,
    responses={status.HTTP_400_BAD_REQUEST: {"model": ResponseErroPadrao}},
    name="Realiza a autenticação do usuário através do login e senha do SIGA",
    description="Realiza a autenticação do usuário através do login e senha do SIGA",
    include_in_schema=False,
)
@tracer.start_as_current_span("autenticacao_por_login_senha_usuario_siga")
async def autenticacao_por_login_senha_usuario_siga(entrada: AutenticacaoSigaIn):
    return await gerar_tonken_login_senha_usr_siga_com_cache_redis(
        entrada.login, entrada.senha
    )


@router.get(
    "/info",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM]))],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Retorna as informações do usuário autenticado",
)
@tracer.start_as_current_span("informacoes_do_usuario")
async def informacoes_do_usuario(request: Request, response: Response):
    token = request.state.decoded_token

    return {
        "login": token.login,
        "sigla_lotacao": token.lotacao,
        "nome": token.nome,
        "roles": token.roles,
        "codigo_usr": token.codigo_usuario,
    }


@router.get(
    "/logout",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM]))],
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_204_NO_CONTENT: {
            "model": None,
            "description": "Logout efetuado com sucesso",
        },
        status.HTTP_400_BAD_REQUEST: {"model": ResponseErroPadrao},
        status.HTTP_401_UNAUTHORIZED: {
            "model": ResponseException,
            "description": "Usuário não autenticado",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ResponseException,
            "description": "Usuário Sem permissão para realizar operação",
        },
    },
    name="Realiza o logout do usuário",
)
@tracer.start_as_current_span("logout")
async def logout(request: Request, response: Response):
    user_finger_print = (
        request.headers["userFingerPrint"] or request.cookies["userFingerPrint"]
    )

    await efetuar_logoff(user_finger_print)

    response.delete_cookie("userFingerPrint")
    # remover quando os tokens estiverem no redis
    response.delete_cookie("tokenJwt")

    response.delete_cookie("ssotcu_logout_azuread_DESENVOL")
    response.delete_cookie("ssotcu_login_azuread_DESENVOL")
    response.delete_cookie("DESENVOL__tcu_uid")
    response.delete_cookie("_gid")
    response.delete_cookie("__gsas")
    response.delete_cookie("_ga")
