import logging
from abc import abstractmethod
from datetime import datetime

from fastapi.responses import StreamingResponse

from src.domain.llm.base.llm_base_elasticsearch import LLMBaseElasticSearch
from src.domain.llm.callback.chat_async_iterator_callback_handler import (
    ChatAsyncIteratorCallbackHandler,
)
from src.domain.llm.tools.image_handler import base64_to_blob_name
from src.domain.llm.util.util import filtrar_trechos_utilizados
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.schemas import ChatGptInput
from src.infrastructure.env import MODELOS

logger = logging.getLogger(__name__)


class LLMBaseOperations(LLMBaseElasticSearch):
    def __init__(self) -> None:
        self.msg = None
        self.msg1 = None
        self.msg2 = None
        self.callback = None
        self.modelo = None
        self.historico = []

    @abstractmethod
    async def _prepara_prompt(self):
        pass

    @abstractmethod
    async def _buscar_docs_relevantes(self, chatinput: ChatGptInput, resp=None):
        pass

    @abstractmethod
    async def _get_response_by_streaming(self, chatinput: ChatGptInput, titulo: str):
        pass

    @abstractmethod
    async def _get_response(self, chatinput: ChatGptInput):
        pass

    async def _registrar_mensagens(self, chat_id: str, chatinput: ChatGptInput):
        logger.info(">> Registrando as mensagens")
        data_hora_atual = datetime.now()
        images_hash = []
        for img in chatinput.imagens:
            images_hash.append(await base64_to_blob_name(img))  # Use await
        self.msg1 = Mensagem(
            chat_id=chat_id,
            conteudo=chatinput.prompt_usuario,
            data_envio=data_hora_atual,
            papel=PapelEnum.USER,
            codigo=self._gerar_codigo_mensagem(
                chat_id=chat_id,
                historico=self.historico,
                data_hora_atual=data_hora_atual,
                index=2,
            ),
            arquivos_selecionados=chatinput.arquivos_selecionados,
            arquivos_selecionados_prontos=chatinput.arquivos_selecionados_prontos,
            especialista_utilizado=chatinput.tool_selecionada,
            parametro_modelo_llm=chatinput.parametro_modelo_llm,
            imagens=images_hash,
        )

        modelo_utilizado = None
        for chave, valor in MODELOS.items():
            logger.info(valor["deployment_name"])
            logger.info(self.modelo["deployment_name"])
            logger.info(valor["deployment_name"] == self.modelo["deployment_name"])
            if valor["deployment_name"] == self.modelo["deployment_name"]:
                modelo_utilizado = chave
                break

        if modelo_utilizado is None:
            modelo_utilizado = self.modelo["deployment_name"]

        self.msg2 = Mensagem(
            chat_id=chat_id,
            conteudo="",
            data_envio=data_hora_atual,
            papel=PapelEnum.ASSISTANT,
            codigo=self._gerar_codigo_mensagem(
                chat_id=chat_id,
                historico=self.historico,
                data_hora_atual=data_hora_atual,
                index=3,
            ),
            parametro_modelo_llm=modelo_utilizado,
            parametro_versao_modelo_llm=self.modelo["version"],
            arquivos_selecionados=chatinput.arquivos_selecionados,
            arquivos_selecionados_prontos=chatinput.arquivos_selecionados_prontos,
            especialista_utilizado=chatinput.tool_selecionada,
        )

        self.callback = ChatAsyncIteratorCallbackHandler(
            chat_id,
            [self.msg, self.msg1, self.msg2],
            self._adicionar_mensagens,
            self.modelo,
        )

    def _gerar_codigo_mensagem(self, chat_id, historico, data_hora_atual, index):
        return (
            f"c_{chat_id}_"
            + f'{data_hora_atual.strftime("%Y%m%d%H%M")}_'
            + f"{len(historico) + index}"
        )

    def _processar_arquivos_busca_e_trechos(self, resposta):
        arquivos_busca = self.msg.arquivos_busca
        trechos_utilizados = []

        if arquivos_busca == "Jurisprudência Selecionada":
            trechos_utilizados = filtrar_trechos_utilizados(self.msg.trechos, resposta)

        return arquivos_busca, trechos_utilizados

    def _enviar_resposta_por_stream(self, chatinput, titulo):
        logger.info(">> Enviando resposta por stream!")

        return StreamingResponse(
            self._get_response_by_streaming(chatinput=chatinput, titulo=titulo),
            media_type="text/event-stream",
            headers={
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
