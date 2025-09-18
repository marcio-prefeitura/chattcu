import io
import logging
import re
import zipfile
from datetime import datetime
from typing import List, Literal

import aiohttp
from fastapi import UploadFile, status
from fastapi.responses import JSONResponse, StreamingResponse
from opentelemetry import trace

from src.conf.env import configs
from src.domain.schemas import GabiResponse, ItemSistema, ItemSistemaComErro
from src.domain.status_arquivo_enum import StatusArquivoEnum
from src.exceptions import ServiceException
from src.infrastructure.azure_blob.azure_blob import AzureBlob
from src.infrastructure.cognitive_search.documentos_cs import DocumentoCS
from src.infrastructure.env import CHUNK_OVERLAP  # TAM_MAXIMO_ARQUIVO,
from src.infrastructure.env import (
    CHUNK_SIZE,
    CONTAINER_NAME,
    EXT_ALVOS_GABI,
    INDEX_NAME_DOCUMENTOS,
    MIME_TYPES_PERMITIDOS,
    NOME_PASTA_PADRAO,
    PERMITIDOS,
)
from src.infrastructure.mongo.upload_mongo import UploadMongo
from src.infrastructure.roles import DESENVOLVEDOR
from src.infrastructure.security_tokens import DecodedToken

# from src.service.gabi_service import process_audio
from src.util.upload_util import calcula_hash, parse_item

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

# @TODO mover para env ajustando de acordo com o ambiente
URL_GABI = "http://chat-tcu-gabi.producao.rancher.tcu.gov.br"


@tracer.start_as_current_span("processa_com_gabi")
async def processa_com_gabi(
    token: DecodedToken,
    mongo_registry: ItemSistema,
    language: str = "pt",
    tipo_conteudo: Literal["geral", "reuniao"] = "reuniao",
) -> GabiResponse:
    logger.info("Invocando o GABI para o processamento do arquivo...")

    headers = {"Authorization": f"Bearer {token.raw_token}"}
    body = {
        "mongo_id": mongo_registry.id,
        "tipo_conteudo": tipo_conteudo,
        "language": language,
    }

    # sem timeout
    timeout = aiohttp.ClientTimeout(total=None)
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.post(
            f"{URL_GABI}/api", headers=headers, timeout=timeout, json=body
        ) as response:
            response.raise_for_status()

            return GabiResponse.model_validate(await response.json())


@tracer.start_as_current_span("processa_upload")
async def processa_upload(id_pasta_pai: str, arquivo: UploadFile, token: DecodedToken):
    extensao = None

    if arquivo.filename:
        extensao = arquivo.filename.split(".")[-1]

    if not extensao or extensao.lower() not in PERMITIDOS:
        raise ServiceException("Tipo de arquivo não permitido!")

    if arquivo.content_type not in MIME_TYPES_PERMITIDOS:
        raise ServiceException("Tipo de arquivo não permitido!")

    if not token.login:
        raise ServiceException("Usuário não identificado")

    if not id_pasta_pai:
        id_pasta_pai = -1

    logger.info(f"Processando arquivo {arquivo.filename}")
    logger.info(
        f"O arquivo foi armazenado {'na memória' if arquivo._in_memory else 'no disco'}"
    )

    azb = AzureBlob()

    cogs = DocumentoCS(
        INDEX_NAME_DOCUMENTOS,
        CHUNK_SIZE,
        azure_search_key=configs.AZURE_SEARCH_DOCS_KEY,
        azure_search_url=configs.AZURE_SEARCH_DOCS_URL,
        chunk_overlap=CHUNK_OVERLAP,
        usr_roles=token.roles,
        login=token.login,
    )

    # # content = await arquivo.read()
    # Usa o gerenciador de contexto para garantir que o arquivo seja fechado
    with arquivo.file as file:
        hash_arquivo = await calcula_hash(file)
        file.seek(0)

        hash_arquivo = f"{hash_arquivo}-{arquivo.size}"

        nome_blob = f"{hash_arquivo}.{extensao}"

        logger.info(f"Arquivo: {arquivo.filename}")
        logger.info(f"Extensão: {extensao}")
        logger.info(f"Hash: {hash_arquivo}")
        logger.info(f"Size: {arquivo.size}")
        # logger.info(f"Tamanho Content: {len(content)}")
        logger.info(f"Nome do Blob: {nome_blob}")
        logger.info(f"Id pasta pai: {id_pasta_pai}")

        await azb.upload_blob(CONTAINER_NAME, data=file, filename=nome_blob)

        pasta = await UploadMongo.inserir_arquivo(
            ItemSistema(
                nome=arquivo.filename,
                id_pasta_pai=id_pasta_pai,
                tipo_midia=arquivo.content_type,
                tamanho=str(arquivo.size),
                usuario=token.login.lower(),
                nome_blob=nome_blob,
                status=StatusArquivoEnum.ARMAZENADO.value,
                st_arquivo=True,
                st_removido=False,
                data_criacao=(datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
            )
        )

        try:
            content = arquivo.file

            # passar o arquivo pelos métodos do gabi se estes forem dos tipos alvos
            if DESENVOLVEDOR in token.roles and extensao.lower() in EXT_ALVOS_GABI:
                # verifica se a midia já foi indexada, alguma vez, por qualquer usr
                existe = await cogs.verifica_existencia_documento(nome_blob)

                if not existe:
                    logger.info("Processa o arquivo com o GABI")

                    gabi = await processa_com_gabi(
                        mongo_registry=pasta,
                        token=token,
                        language="pt",
                        tipo_conteudo="reuniao",
                    )

                    logger.info(gabi)

                    content = gabi

            await cogs.persiste_documentos(
                user_filename=arquivo.filename,
                real_filename=nome_blob,
                content_bytes=content,
                extensao=extensao.lower(),
                token=token,
            )

            pasta = await UploadMongo.alterar_status(
                usr=token.login.lower(),
                arquivo=pasta,
                status=StatusArquivoEnum.PRONTO,
            )

            return pasta
        except Exception as error:
            await UploadMongo.remover(object_id=pasta.id, usr=token.login.lower())
            raise error


# @TODO mover para upload_util
@tracer.start_as_current_span("atribuir_arquivos_a_pastas")
async def atribuir_arquivos_a_pastas(
    pastas: List[ItemSistema], arquivos: List[ItemSistema]
):
    for pasta in pastas:
        pasta.arquivos = []

        for arquivo in arquivos:
            if str(pasta.id) == str(arquivo.id_pasta_pai):
                pasta.arquivos.append(arquivo)


@tracer.start_as_current_span("lista_pastas_com_arquivos")
async def lista_pastas_com_arquivos(login: str):
    raiz = ItemSistema(id=-1, nome=NOME_PASTA_PADRAO, usuario=login.lower())

    pastas: List[ItemSistema] = await lista_itens(login, arquivos=False)
    pastas.insert(0, raiz)

    arquivos = await lista_itens(login, arquivos=True)

    await atribuir_arquivos_a_pastas(pastas, arquivos)

    return pastas


@tracer.start_as_current_span("lista_itens")
async def lista_itens(login: str, arquivos: bool | None = None):
    logger.info(f"Carrega a lista de arquivos do usuário: {login}")

    lista = []

    if not login:
        raise Exception("Usuário não identificado")

    itens = await UploadMongo.listar_tudo(login.lower(), arquivos)

    for item in itens:
        lista.append(
            ItemSistema(
                id=str(item["_id"]),
                nome=item["nome"],
                usuario=item["usuario"],
                st_removido=item["st_removido"],
                id_pasta_pai=(
                    str(item["id_pasta_pai"])
                    if item["id_pasta_pai"] != -1
                    else item["id_pasta_pai"]
                ),
                data_criacao=item["data_criacao"],
                st_arquivo=item["st_arquivo"],
                tamanho=item["tamanho"] if "tamanho" in item else None,
                tipo_midia=item["tipo_midia"] if "tipo_midia" in item else None,
                nome_blob=item["nome_blob"] if "nome_blob" in item else None,
                status=item["status"] if "status" in item else None,
            )
        )

    return lista


@tracer.start_as_current_span("busca_itens_por_ids")
async def busca_itens_por_ids(ids: List[str], login: str) -> List[ItemSistema]:
    logger.info(
        "Carrega a lista de arquivos do usuário "
        + "através dos ids informados: {login}-{','.join(ids)}"
    )

    lista = []

    if not login:
        raise ServiceException("Usuário não identificado")

    if ids:
        itens = await UploadMongo.busca_por_varios_ids(
            ids=ids, usr=login.lower(), removido=None
        )

        if itens:
            for item in itens:
                lista.append(parse_item(item))

    return lista


@tracer.start_as_current_span("adiciona_pasta")
async def adiciona_pasta(login: str, nome_pasta: str):
    if not login:
        raise ServiceException("Usuário não identificado")

    if not nome_pasta:
        raise ServiceException("Nome da pasta não identificado")

    pasta = ItemSistema(nome=nome_pasta, usuario=login.lower())

    pasta = await UploadMongo.inserir_pasta(pasta)

    return pasta


@tracer.start_as_current_span("exclui_item")
async def exclui_item(item: str, login: str):
    if not item:
        raise ServiceException("Nome do item não identificado")

    if not login:
        raise ServiceException("Usuário não identificado")

    logger.info(f"Excluir o item ({item})")

    item_db = await UploadMongo.busca_por_id(item, login.lower())

    if item_db and item_db.st_arquivo is not True:
        await UploadMongo.remover_filhos(item, login.lower())

    await UploadMongo.remover(item, login.lower())


@tracer.start_as_current_span("exclui_varios_itens")
async def exclui_varios_itens(itens: List[str], login: str):
    if not itens:
        raise ServiceException("Não foi localizado itens para excluir")

    if not login:
        raise ServiceException("Usuário não identificado")

    logger.info(f"Excluir os itens ({','.join(str(id) for id in itens)})")

    # cogs = DocumentoCS(
    #     INDEX_NAME_DOCUMENTOS,
    #     CHUNK_SIZE,
    #     azure_search_key=configs.AZURE_SEARCH_DOCS_KEY,
    #     azure_search_url=configs.AZURE_SEARCH_DOCS_URL,
    #     chunk_overlap=CHUNK_OVERLAP,
    #     login=login,
    # )

    # for item in itens:
    #     item_db = await UploadMongo.busca_por_id(item, login.lower())
    #     await cogs.delete_document(item_db.nome_blob, login.lower())

    await UploadMongo.remover_varios(itens, login.lower())


@tracer.start_as_current_span("renomear_item")
async def renomear_item(item_id: str, novo_nome: str, login: str):
    if not item_id:
        raise ServiceException("Id do item não identificado")

    if not novo_nome:
        raise ServiceException("Novo nome para o item não identificado")

    if not login:
        raise ServiceException("Usuário não identificado")

    logger.info(f"Renomear o item ({item_id})")

    await UploadMongo.renomear_item(login.lower(), item_id, novo_nome)


@tracer.start_as_current_span("download_item")
async def download_item(item_id: str, login: str):
    # colocado a verificação com o null pois o frontend está
    # enviando null no lugar do id e ao receber está recebendo como string
    if not item_id or item_id == "null":
        raise ServiceException("Id do item não identificado")

    if not login:
        raise ServiceException("Usuário não identificado")

    logger.info(f"Download do item ({item_id}) por {login}")

    item = None

    if item_id == "-1":
        logger.info("Download da pasta raiz")

        item = ItemSistema(id=-1, nome=NOME_PASTA_PADRAO, usuario=login.lower())

        item.arquivos = await UploadMongo.listar_filhos(item.id, login.lower(), True)

        logger.info(f"{len(item.arquivos)} serão zipados")
    else:
        item = await UploadMongo.busca_por_id(item_id, login.lower())

        item.arquivos = await UploadMongo.listar_filhos(item.id, login.lower(), True)

    if item:
        if item.st_arquivo:
            return await download_arquivo(item)

        return await download_pasta_zipada(item)

    raise ServiceException("Item para download não localizado")


@tracer.start_as_current_span("download_arquivo")
async def download_arquivo(arquivo: ItemSistema):
    try:
        azb = AzureBlob()

        data = await azb.download_blob(
            container_name=CONTAINER_NAME, filename=arquivo.nome_blob
        )

        return StreamingResponse(
            iter([data]),
            media_type=arquivo.tipo_midia,
            headers={
                "Content-Disposition": f"attachment;filename={re.sub('[^0-9a-zA-Z_-]', '_', arquivo.nome)}"
            },
        )
    except Exception as error:
        raise error


@tracer.start_as_current_span("download_pasta_zipada")
async def download_pasta_zipada(pasta: ItemSistema):
    logger.info("Tentando download de pasta zipada")

    try:
        azb = AzureBlob()

        logger.info(
            "Baixar os arquivos do Azure Blob Storage de uma pasta como arquivo zip"
        )

        if pasta.arquivos:
            zip_stream = await generate_zip_stream(pasta.arquivos, azb)

            return StreamingResponse(
                zip_stream,
                media_type="application/zip",
                headers={
                    "Content-Disposition": f"attachment;filename={re.sub('[^0-9a-zA-Z_-]', '_', pasta.nome)}.zip"
                },
            )

        raise ServiceException("Falha ao selecionar os arquivos da pasta para download")
    except Exception as error:
        raise error


@tracer.start_as_current_span("generate_zip_stream")
async def generate_zip_stream(files: List[ItemSistema], azb: AzureBlob):
    zip_stream = io.BytesIO()

    with zipfile.ZipFile(zip_stream, mode="w") as zip_file:
        for file in files:
            data = await azb.download_blob(
                container_name=CONTAINER_NAME, filename=file.nome_blob
            )

            zip_file.writestr(file.nome, data)

    zip_stream.seek(0)

    return zip_stream


@tracer.start_as_current_span("copiar_itens")
async def copiar_itens(
    id_pasta_destino: str, ids_itens: List[str], login: str
) -> List[ItemSistema]:
    if not id_pasta_destino:
        raise ServiceException("Pasta de destino não identificada")

    if not ids_itens:
        raise ServiceException("Itens não identificados para movimentação")

    if not login:
        raise ServiceException("Usuário não identificado")

    itens_copiados: List[ItemSistema] = []
    itens_com_erros: List[ItemSistemaComErro] = []

    for id_item in ids_itens:
        try:
            item = await UploadMongo.copiar_item(
                id_item, id_pasta_destino, login.lower()
            )

            itens_copiados.append(item)
        except Exception as e:
            file = await UploadMongo.busca_por_id(id_item, login.lower())

            item_com_erro = ItemSistemaComErro(item=file, erro=str(e))

            itens_com_erros.append(item_com_erro)

    st = 0
    msg = ""

    if itens_copiados and not itens_com_erros:
        st = 1
        msg = "Itens copiados com sucesso!"
    elif itens_copiados and itens_com_erros:
        st = 1
        msg = (
            f"Alguns itens copiados com sucesso, todavia os arquivos "
            f"'{', '.join([item.item.nome for item in itens_com_erros])}' já constam no destino"
        )
    else:
        st = 0
        msg = f"Erro ao copiar os arquivos '{', '.join([item.item.nome for item in itens_com_erros])}!"

    return JSONResponse(
        content={
            "status": st,
            "mensagem": msg,
            "itens": [item.model_dump() for item in itens_copiados],
            "itens_com_erros": [item.model_dump() for item in itens_com_erros],
        },
        status_code=status.HTTP_201_CREATED,
    )


@tracer.start_as_current_span("mover_itens")
async def mover_itens(
    id_pasta_destino: str, ids_itens: List[str], login: str
) -> List[ItemSistema]:
    if not id_pasta_destino:
        raise ServiceException("Pasta de destino não identificada")

    if not ids_itens:
        raise ServiceException("Itens não identificados para movimentação")

    if not login:
        raise ServiceException("Usuário não identificado")

    itens_movidos: List[ItemSistema] = []
    itens_com_erros: List[ItemSistemaComErro] = []

    for id_item in ids_itens:
        try:
            item = await UploadMongo.mover_item(
                id_item, id_pasta_destino, login.lower()
            )

            itens_movidos.append(item)
        except Exception as e:
            file = await UploadMongo.busca_por_id(id_item, login.lower())

            item_com_erro = ItemSistemaComErro(item=file, erro=str(e))

            itens_com_erros.append(item_com_erro)

    st = 0
    msg = ""

    if itens_movidos and not itens_com_erros:
        st = 1
        msg = "Itens movidos com sucesso!"
    elif itens_movidos and itens_com_erros:
        st = 1
        msg = (
            f"Alguns itens movidos com sucesso, todavia os arquivos "
            f"'{', '.join([item.item.nome for item in itens_com_erros])}' já constam no destino"
        )
    else:
        st = 0
        msg = f"Erro ao mover os arquivos '{', '.join([item.item.nome for item in itens_com_erros])}!"

    return JSONResponse(
        content={
            "status": st,
            "mensagem": msg,
            "itens": [item.model_dump() for item in itens_movidos],
            "itens_com_erros": [item.model_dump() for item in itens_com_erros],
        },
        status_code=status.HTTP_200_OK,
    )
