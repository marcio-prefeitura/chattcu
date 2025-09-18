import logging
import time
import traceback
from typing import List

from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from fastapi.responses import JSONResponse
from opentelemetry import trace

from src.domain.schemas import (
    AcaoItemFolderEnum,
    ItemFolderIn,
    ItemFolderInForCopy,
    ItemSistema,
    ListaIdsIn,
    ResponseException,
    ResponsePadrao,
)
from src.exceptions import MongoException
from src.infrastructure.role_checker import RoleChecker
from src.infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW
from src.service.upload_service import (
    adiciona_pasta,
    busca_itens_por_ids,
    copiar_itens,
    download_item,
    exclui_item,
    exclui_varios_itens,
    lista_pastas_com_arquivos,
    mover_itens,
    processa_upload,
    renomear_item,
)

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

router = APIRouter()


@router.post(
    "/folders",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Realiza registro de uma pasta para o usuário",
    description="""Realiza registro de uma pasta para o usuário""",
)
@tracer.start_as_current_span("cria_pasta")
async def cria_pasta(request: Request, pasta: ItemFolderIn):
    try:
        inicio = time.time()

        usuario = request.state.decoded_token.login

        pasta: ItemSistema = await adiciona_pasta(usuario, pasta.nome)

        fim = time.time()

        logger.info(f"tempo total para criar uma pasta: {(fim - inicio)}")

        return JSONResponse(
            content={
                "status": 1,
                "mensagem": f"Pasta '{pasta.nome}' criada com sucesso!",
                "pasta": pasta.model_dump(),
            },
            status_code=status.HTTP_201_CREATED,
        )
    except Exception as erro:
        logger.error(f"Erro ao criar pasta: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao criar pasta: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.delete(
    "/folders/{id_pasta}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Excluir uma pasta",
    description="""Exclui uma pasta que era destinada
                a armazenar arquivos do usuário""",
)
@tracer.start_as_current_span("exclui_pasta")
async def exclui_pasta(id_pasta: str, request: Request) -> ResponsePadrao:
    try:
        login = request.state.decoded_token.login

        await exclui_item(id_pasta, login)

        return JSONResponse(
            content={"status": 1, "mensagem": "Item excluído com sucesso!"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as erro:
        logger.error(f"Erro ao excluir item: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao excluir item: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.put(
    "/folders/{id_pasta}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Renomear pasta",
    description="""Renomeia uma determinada pasta com o novo nome informado""",
)
@tracer.start_as_current_span("atualiza_nome_pasta")
async def atualiza_nome_pasta(id_pasta: str, payload: ItemFolderIn, request: Request):
    try:
        login = request.state.decoded_token.login

        await renomear_item(id_pasta, payload.nome, login)

        return JSONResponse(
            content={"status": 1, "mensagem": "Item renomeado com sucesso!"},
            status_code=status.HTTP_200_OK,
        )
    except MongoException as me:
        logger.error(f"Erro de Mongo ao renomear item: {me}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"{me}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as erro:
        logger.error(f"Erro ao renomear item: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao renomear item: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get(
    "/folders",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=List[ItemSistema],
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Retorna a lista de pasta do usuário com seus respectivos arquivos",
    description="""Retorna a lista de pasta do usuário com seus
                respectivos arquivos para contextualização do LLM""",
)
@tracer.start_as_current_span("resgata_lista_pastas")
async def resgata_lista_pastas(request: Request):
    try:
        inicio = time.time()

        login = request.state.decoded_token.login

        lista = await lista_pastas_com_arquivos(login)

        fim = time.time()
        logger.info(
            f"Tempo total gasto para retornar a lista de pastas com seus arquivos: {(fim -inicio)}"
        )

        return lista
    except Exception as erro:
        logger.error(f"Erro ao listar pastas: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao listar pastas: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post(
    "/folders/{id_pasta_destino}/files",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    # response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Realiza o upload de um arquivo",
    description="""Realiza o upload de um arquivo,
                seu armazenamento e indexação para contextualização do LLM""",
)
@tracer.start_as_current_span("upload_arquivo")
async def upload_arquivo(
    request: Request, id_pasta_destino: str, arquivo: UploadFile = File(...)
):
    logger.info(
        f"Recebi o arquivo {arquivo.filename} com tamanho de {arquivo.size} bytes."
    )

    try:
        inicio = time.time()

        file = await processa_upload(
            id_pasta_destino, arquivo, token=request.state.decoded_token
        )

        fim = time.time()

        logger.info(f"Tempo total de processamento: {(fim - inicio)}")

        return JSONResponse(
            content={
                "status": 1,
                "mensagem": "Arquivo recebido e indexado com sucesso!",
                "arquivo": file.model_dump(),
            },
            status_code=status.HTTP_201_CREATED,
        )
    except Exception as erro:
        logger.error(f"Erro ao realizar upload de arquivo: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao realizar upload de arquivo: {erro}",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.delete(
    "/files/bulk-delete",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Excluir os arquivos informados",
    description="""Exclui os arquivos informados do indice,
                não sendo mais possível utilizá-lo para
                contextualizar o LLM""",
)
@tracer.start_as_current_span("exclui_varios_arquivos")
async def exclui_varios_arquivos(
    ids_arquivos: ListaIdsIn, request: Request
) -> ResponsePadrao:
    try:
        login = request.state.decoded_token.login

        await exclui_varios_itens(ids_arquivos.ids, login)

        return JSONResponse(
            content={"status": 1, "mensagem": "Itens excluídos com sucesso!"},
            status_code=status.HTTP_200_OK,
        )
    except Exception as erro:
        logger.error(f"Erro ao excluir item: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao excluir item: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.put(
    "/files/{id_arquivo}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Renomear arquivo",
    description="""Renomeia um determinado arquivo com o novo nome informado""",
)
@tracer.start_as_current_span("atualiza_nome_arquivo")
async def atualiza_nome_arquivo(
    id_arquivo: str, payload: ItemFolderIn, request: Request
):
    try:
        login = request.state.decoded_token.login

        await renomear_item(id_arquivo, payload.nome, login)

        return JSONResponse(
            content={"status": 1, "mensagem": "Item renomeado com sucesso!"},
            status_code=status.HTTP_200_OK,
        )
    except MongoException as me:
        logger.error(f"Erro de Mongo ao renomear item: {me}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"{me}",
            },
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as erro:
        logger.error(f"Erro ao renomear item: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao renomear item: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post(
    "/files",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=List[ItemSistema],
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Retorna os dados dos arquivos através dos ids informados",
    description="""Retorna os dados dos arquivos através dos ids informados""",
)
@tracer.start_as_current_span("retorna_arquivos_pelos_ids")
async def retorna_arquivos_pelos_ids(payload: ListaIdsIn, request: Request):
    try:
        login = request.state.decoded_token.login

        dados = await busca_itens_por_ids(payload.ids, login)

        return dados
    except Exception as erro:
        logger.error(f"Erro ao retornar dados dos arquivos: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao retornar dados dos arquivos: {erro}",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get(
    "/download/{id_item}",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, COMUM, PREVIEW]))],
    response_model=List[ItemSistema],
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Realiza o download de uma pasta ou arquivo",
    description="""Realiza o download de uma pasta ou arquivo""",
)
@tracer.start_as_current_span("download_itens")
async def download_itens(id_item: str, request: Request):
    try:
        login = request.state.decoded_token.login

        return await download_item(id_item, login)
    except Exception as erro:
        logger.error(f"Erro ao realizar download do item: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={
                "status": 0,
                "mensagem": f"Erro ao realizar download do item: {erro}",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.put(
    "/folders/{id_pasta_destino}/files",
    dependencies=[Depends(RoleChecker([DESENVOLVEDOR, PREVIEW, COMUM]))],
    response_model=ResponsePadrao,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ResponsePadrao},
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
    name="Copiar (COPY) ou Mover (MOVE) os arquivos com os ids informados para outro diretório",
    description="""Copiar ou Mover os arquivos com os ids informados para outro diretório do usuário""",
)
@tracer.start_as_current_span("copiar_mover")
async def copiar_mover(
    body: ItemFolderInForCopy, id_pasta_destino: str, request: Request
):
    try:
        inicio = time.time()

        login = request.state.decoded_token.login
        resposta = None

        if body.acao == AcaoItemFolderEnum.COPIAR:
            resposta = await copiar_itens(
                id_pasta_destino=id_pasta_destino,
                ids_itens=body.ids_itens,
                login=login,
            )

            fim = time.time()
            logger.info(
                f"Tempo total gasto para copiar arquivos para outra pasta: {(fim -inicio)}"
            )

        if body.acao == AcaoItemFolderEnum.MOVER:
            resposta = await mover_itens(
                id_pasta_destino=id_pasta_destino,
                ids_itens=body.ids_itens,
                login=login,
            )

            fim = time.time()
            logger.info(
                f"Tempo total gasto para mover arquivos para outra pasta: {(fim -inicio)}"
            )
        if resposta is not None:
            return resposta
        else:
            return JSONResponse(
                content={
                    "status": 0,
                    "mensagem": f"Erro ao identificar ação desejada!",
                },
                status_code=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as erro:
        logger.error(f"Erro ao copiar itens: {erro}")
        traceback.print_exc()

        return JSONResponse(
            content={"status": 0, "mensagem": f"Erro ao copiar itens: {erro}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
