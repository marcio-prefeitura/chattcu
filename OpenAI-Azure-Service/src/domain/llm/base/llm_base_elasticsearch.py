import logging
from datetime import datetime
from typing import List

from src.conf.env import configs
from src.domain.chat import Chat, Credencial
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.schemas import ChatGptInput
from src.infrastructure.elasticsearch.elasticsearch import ElasticSearch
from src.infrastructure.env import INDICE_ELASTIC, QTD_MAX_CARACTERES_TITULO
from src.infrastructure.security_tokens import DecodedToken
from src.service.image_service import binario_to_base64, get_imagem_do_blob

logger = logging.getLogger(__name__)


class LLMBaseElasticSearch:
    @staticmethod
    async def _criar_novo_chat_com_input(
        chatinput: ChatGptInput, token_usr: DecodedToken, app_origem: str
    ):
        data_hora_atual = datetime.now()

        logger.info(">> Criando um novo registro de chat")

        titulo = chatinput.prompt_usuario

        if len(titulo) > QTD_MAX_CARACTERES_TITULO:
            titulo = titulo[0:QTD_MAX_CARACTERES_TITULO] + "..."

        chat = Chat(
            data_criacao=data_hora_atual,
            data_ultima_iteracao=data_hora_atual,
            titulo=titulo,
            usuario=token_usr.login,
            credencial=Credencial(aplicacao_origem=app_origem, usuario=token_usr.login),
            mensagens=[],
        )

        elastic = ElasticSearch(
            configs.ELASTIC_LOGIN,
            configs.ELASTIC_PASSWORD,
            configs.ELASTIC_URL,
            INDICE_ELASTIC,
        )

        chat = await elastic.criar_novo_chat(chat)

        logger.info(">> Chat registrado!")

        return chat.id, titulo

    @staticmethod
    async def _carregar_historico_para_prompt(chat_id: str, login: str):
        elastic = ElasticSearch(
            configs.ELASTIC_LOGIN,
            configs.ELASTIC_PASSWORD,
            configs.ELASTIC_URL,
            INDICE_ELASTIC,
        )

        chat = await elastic.buscar_chat(chat_id=chat_id, login=login)

        historico = []

        if chat and len(chat.mensagens) > 0:
            for msg in chat.mensagens:

                if msg.papel != PapelEnum.SYSTEM.name:
                    content = (
                        [{"type": "text", "text": msg.conteudo}] if msg.conteudo else []
                    )

                    if msg.imagens:
                        for img in msg.imagens:

                            try:
                                image_binario = await get_imagem_do_blob(img)

                                image_base64 = binario_to_base64(image_binario)

                                image_message = {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}",
                                        "detail": "high",
                                    },
                                }

                                content.append(image_message)

                            except Exception as e:
                                logger.error(f"Erro ao processar imagem {img}: {e}")
                                continue

                    historico.append(
                        {"role": f"{msg.papel}".lower(), "content": content}
                    )
        return historico

    @staticmethod
    async def _adicionar_mensagem(cod_chat: str, mensagem: Mensagem):
        elastic = ElasticSearch(
            configs.ELASTIC_LOGIN,
            configs.ELASTIC_PASSWORD,
            configs.ELASTIC_URL,
            INDICE_ELASTIC,
        )

        await elastic.adicionar_mensagem(cod_chat=cod_chat, mensagem=mensagem)

    @staticmethod
    async def _adicionar_mensagens(cod_chat: str, mensagens: List[Mensagem]):
        for msg in mensagens:
            logger.info(f"Tipo: {msg.papel.value} - Modelo: {msg.parametro_modelo_llm}")

            await LLMBaseElasticSearch._adicionar_mensagem(
                cod_chat=cod_chat, mensagem=msg
            )

        logger.info(">> MENSAGENS ADICIONADAS COM SUCESSO")
