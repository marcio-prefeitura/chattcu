import asyncio
import logging
import re
from datetime import datetime

from opentelemetry import trace

from src.conf.env import configs
from src.domain.chat import Chat, Credencial
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.schemas import CompartilhamentoIn, CompartilhamentoOut
from src.domain.status_arquivo_enum import StatusArquivoEnum
from src.exceptions import BusinessException, MongoException
from src.infrastructure.elasticsearch.elasticsearch import ElasticSearch
from src.infrastructure.env import INDICE_ELASTIC
from src.infrastructure.mongo.compatilhamento_mongo import CompartilhamentoMongo
from src.infrastructure.mongo.upload_mongo import UploadMongo
from src.service.chatgpt_service import buscar_chat

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("compartilha_chat")
async def compartilha_chat(compartilhamento: CompartilhamentoIn, login: str):
    # 1 - resgata o chat desejado para criar o snapshot e salvá-lo na base
    chat = await buscar_chat(compartilhamento.id_chat, login.lower())

    arquivos = []
    for msg in chat.mensagens:
        if msg.papel == PapelEnum.ASSISTANT.value:
            for trecho in msg.trechos:
                if trecho.id_arquivo_mongo:
                    arquivos.append(trecho.id_arquivo_mongo)

    if len(arquivos) == 0:
        arquivos = None
    else:
        arquivos = list(set(arquivos))

    logger.info(f"Arquivos Compartilhados com Chat: {arquivos}")

    # 2 - trata os destinatarios, se pessoa carrega-se o
    # login da pessoa e define o valor como destinatario,
    # se unidade mantem somente os numero como codigo
    compartilhamento_out = CompartilhamentoOut(
        id="",
        chat=chat,
        usuario=login.lower(),
        st_removido=False,
        data_compartilhamento=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        arquivos=arquivos,
    )

    # 4 - registrar um determinado compartilhamento do usuario
    compartilhamento_out = await CompartilhamentoMongo.inserir_compartilhamento(
        compartilhamento_out
    )

    return compartilhamento_out


@tracer.start_as_current_span("retorna_compartilhamento")
async def retorna_compartilhamento(id_compartilhamento: str, login: str):
    compartilhamento = await CompartilhamentoMongo.busca_por_id(
        id_compartilhamento, login.lower()
    )

    return compartilhamento


@tracer.start_as_current_span("retorna_compartilhamento_by_chatid")
async def retorna_compartilhamento_by_chatid(id_chat: str, login: str):
    if not id_chat or id_chat.strip() == "" or len(id_chat) > 60:
        raise BusinessException(
            "Parâmetro id_chat não pode ser nulo ou maior do que 60",
            code=400,
        )

    try:
        compartilhamento = await CompartilhamentoMongo.busca_por_chat_id(
            id_chat, login.lower()
        )
        if not compartilhamento:
            raise BusinessException(
                f"Não foi encontrado um compartilhamento para o chat: {id_chat}",
                code=404,
            )

        return compartilhamento
    except BusinessException as be:
        logger.warning(f"Não foi encontrado um compartilhamento para o chat: {id_chat}")
        raise be
    except Exception as e:
        logger.error(
            f"Erro ao resgatar o compartilhamento pelo chat de id: {id_chat}, erro: {e}"
        )
        raise BusinessException(
            f"Erro ao resgatar o compartilhamento pelo chat de id: {id_chat}", code=500
        )


@tracer.start_as_current_span("atualiza_chat_compartilhamento")
async def atualiza_chat_compartilhamento(
    id_compartilhamento: str, usuario: str
) -> bool:
    """serviço: que atualiza o conteúdo do chat pelo id_compartilhamento passado, mantendo assim o mesmo link."""

    if (
        not id_compartilhamento
        or id_compartilhamento.strip() == ""
        or len(id_compartilhamento) > 60
    ):
        raise BusinessException(
            "O id de compartilhamento deve ter entre 1 e 60 caracteres.",
            code=400,
        )

    try:
        compartilhamento: CompartilhamentoOut = await retorna_compartilhamento(
            id_compartilhamento, usuario
        )
        chat = await buscar_chat(compartilhamento.chat.id, usuario)

        return await CompartilhamentoMongo.atualizar_compartilhamento(
            compartilhamento.id, chat
        )
    except Exception as e:
        logger.error(
            f"Não foi possível atualizar o chat com id de compartilhamento: {id_compartilhamento}, erro: {e}"
        )
        raise BusinessException(
            f"Não foi possível atualizar o chat com id de compartilhamento: {id_compartilhamento}",
            code=500,
        )


@tracer.start_as_current_span("lista_compartilhados_pelo_usuario")
async def lista_compartilhados_pelo_usuario(login: str):
    compartilhamentos = await CompartilhamentoMongo.listar_compartilhados_por_usuario(
        login.lower()
    )

    return compartilhamentos


@tracer.start_as_current_span("exclui_compartilhamento")
async def exclui_compartilhamento(id_compartilhamento: str, login: str):
    await CompartilhamentoMongo.remover(id_compartilhamento, login.lower())


# @tracer.start_as_current_span("exclui_compartilhamento_por_chat_id")
# async def exclui_compartilhamento_por_chat_id(chat_id: str, login: str):
#     await CompartilhamentoMongo.remover_por_chat_id(chat_id, login.lower())


@tracer.start_as_current_span("exclui_todos_compartilhamentos_enviados")
async def exclui_todos_compartilhamentos_enviados(login: str):
    await CompartilhamentoMongo.remover_todos_enviados(login.lower())


@tracer.start_as_current_span("assumir_chat")
async def assumir_chat(id_compartilhamento: str, login: str):
    compartilhamento = await CompartilhamentoMongo.busca_por_id(
        id_compartilhamento, None
    )
    db_elastic = ElasticSearch(
        configs.ELASTIC_LOGIN,
        configs.ELASTIC_PASSWORD,
        configs.ELASTIC_URL,
        INDICE_ELASTIC,
    )
    data_atual = datetime.now()

    chat = Chat(
        apagado=False,
        data_criacao=data_atual,
        data_ultima_iteracao=data_atual,
        fixado=compartilhamento.chat.fixado,
        usuario=login,
        titulo=compartilhamento.chat.titulo,
        mensagens=[],
        credencial=Credencial(aplicacao_origem="CHATTCU", usuario=login.lower()),
    )

    chat = await db_elastic.criar_novo_chat(chat)
    logger.info(f"Chat importado: {chat.id}")

    if compartilhamento.arquivos:
        await _process_files(compartilhamento, login)

    logger.info(f"Importanto {len(compartilhamento.chat.mensagens)} mensagens")
    await _process_messages(compartilhamento, chat, db_elastic, data_atual)

    await asyncio.sleep(1)
    return await db_elastic.buscar_chat(chat_id=chat.id, login=chat.usuario)


async def _process_files(compartilhamento, login):
    logger.info(f"Importando {len(compartilhamento.arquivos)} arquivos")
    for id_arquivo in compartilhamento.arquivos:
        logger.info(f"id_arquivo => {id_arquivo}")
        if id_arquivo:
            arquivo = await _buscar_e_inserir_arquivo(
                id_arquivo, compartilhamento, login
            )
            await _corrigir_referencias_arquivo(
                compartilhamento, id_arquivo, arquivo.id
            )


async def _buscar_e_inserir_arquivo(id_arquivo, compartilhamento, login):
    arquivo = await UploadMongo.busca_por_id(
        id_arquivo, compartilhamento.chat.usuario.lower(), None
    )
    arquivo.id_pasta_pai = -1
    arquivo.usuario = login.lower()
    try:
        arquivo = await UploadMongo.inserir_arquivo(arquivo)
        arquivo = await UploadMongo.alterar_status(
            arquivo=arquivo, status=StatusArquivoEnum.PRONTO, usr=login.lower()
        )
    except MongoException as warn:
        logger.warning(f"Ao importar arquivo compartilhado: {warn}")
        arquivo = await UploadMongo.buscar_arquivo_by_hash(
            nome_blob=arquivo.nome_blob, user=login.lower()
        )
        logger.info(f"Arquivo retornado com o id {arquivo.id}")
    return arquivo


async def _corrigir_referencias_arquivo(compartilhamento, id_arquivo, novo_id_arquivo):
    logger.info("Corrigindo referencia do arquivo nos trechos das mensagens")
    for msg in compartilhamento.chat.mensagens:
        _corrigir_referencias_em_mensagem(msg, id_arquivo, novo_id_arquivo)


def _corrigir_referencias_em_mensagem(msg, id_arquivo, novo_id_arquivo):
    for i, valor in enumerate(msg.arquivos_selecionados):
        if valor == id_arquivo:
            msg.arquivos_selecionados[i] = novo_id_arquivo
    for i, valor in enumerate(msg.arquivos_selecionados_prontos):
        if valor == id_arquivo:
            msg.arquivos_selecionados_prontos[i] = novo_id_arquivo
    for trecho in msg.trechos:
        if trecho.id_arquivo_mongo == id_arquivo:
            logger.info(
                f"Correção da referencia ao arquivo {novo_id_arquivo} no trecho realizada"
            )
            trecho.id_arquivo_mongo = novo_id_arquivo


async def _process_messages(compartilhamento, chat, db_elastic, data_atual):
    regex = r"_(\d+)$"
    for i, msg in enumerate(compartilhamento.chat.mensagens, start=1):
        match = re.search(regex, msg.codigo)
        mensagem = Mensagem(
            chat_id=chat.id,
            arquivos_busca=msg.arquivos_busca,
            arquivos_selecionados=msg.arquivos_selecionados,
            arquivos_selecionados_prontos=msg.arquivos_selecionados_prontos,
            conteudo=msg.conteudo,
            data_envio=data_atual,
            favoritado=msg.favoritado,
            parametro_modelo_llm=msg.parametro_modelo_llm,
            parametro_nome_indice_busca=None,
            parametro_quantidade_trechos_relevantes_busca=None,
            parametro_tipo_busca=None,
            parametro_versao_modelo_llm=None,
            papel=PapelEnum[msg.papel],
            trechos=msg.trechos,
            codigo=(
                f"c_{chat.id}_"
                + f'{data_atual.strftime("%Y%m%d%H%M")}_'
                + f"{match.group(1) if match else i}"
            ),
            especialista_utilizado=msg.especialista_utilizado,
        )
        mensagem = await db_elastic.adicionar_mensagem(chat.id, mensagem)
