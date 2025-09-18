import logging
import time
from typing import Any, List

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema import LLMResult

from src.domain.llm.util.util import filtrar_trechos_utilizados
from src.domain.mensagem import Mensagem
from src.service.quota_service import update_quota

logger = logging.getLogger(__name__)


class ChatAsyncIteratorCallbackHandler(AsyncIteratorCallbackHandler):
    def __init__(self, chat_id: str, msg: List[Mensagem], acao, model: Any):
        super().__init__()

        self.chat_id = chat_id
        self.msg = msg
        self.acao = acao
        self.acumulado = ""
        self.msg_sistema = self.msg[0]
        self.msg_resposta = self.msg[len(self.msg) - 1]
        self.inicio = time.time()
        self.is_tool_call = None
        self.is_with_tools = None
        self.model = model
        self.prompt = None

    def set_is_with_tools(self, is_with_tools):
        self.is_with_tools = is_with_tools

    def set_prompt(self, prompt):
        self.prompt = prompt

    async def on_llm_start(self, *args, **kwargs) -> None:
        logger.info(f"## LLM iniciado com modelo {self.model['deployment_name']} ##")
        # logger.info(f"## Prompt Utilizado: {self.prompt} ##")
        await super().on_llm_start(*args, **kwargs)

    async def on_tool_call(self, tool_name, tool_input, **kwargs):
        logger.info(f"## Tool {tool_name} invocada com o input: {tool_input}")
        self.is_tool_call = True

    async def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        # por causa do claude
        if isinstance(token, List) and len(token) > 0 and "text" in token[0]:
            token = token[0]["text"]

        self.acumulado += token

        arquivos_busca = self.msg_sistema.arquivos_busca
        trechos_utilizados = []

        if arquivos_busca in (
            "Jurisprudência Selecionada",
            "Arquivos",
            "Normativos do TCU",
        ):
            trechos_utilizados = filtrar_trechos_utilizados(
                self.msg_sistema.trechos, self.acumulado
            )
        elif self.msg_sistema.trechos:
            trechos_utilizados = self.msg_sistema.trechos

        self.msg_resposta.trechos = trechos_utilizados
        self.msg_resposta.arquivos_busca = arquivos_busca

        await super().on_llm_new_token(token, **kwargs)

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        resposta = response.generations[0][0].text

        if resposta and len(resposta.strip()) > 0:
            if (not self.is_tool_call and not self.is_with_tools) or (
                self.is_with_tools and self.is_tool_call
            ):
                await self._handle_resposta(resposta)
            elif self.is_with_tools and not self.is_tool_call:
                self.is_tool_call = True

            await self._log_and_update_quota(resposta)
        else:
            self.inicio = time.time()

    async def _handle_resposta(self, resposta: str) -> None:
        logger.info("## Executando rotinas de finalização ##")

        self.msg_resposta.conteudo = resposta

        arquivos_busca = self.msg_sistema.arquivos_busca
        trechos_utilizados = self._update_trechos_utilizados(arquivos_busca, resposta)

        self.msg_resposta.trechos = trechos_utilizados
        self.msg_resposta.arquivos_busca = arquivos_busca

        await self.acao(self.chat_id, self.msg)

        self.is_tool_call = None

    async def _log_and_update_quota(self, resposta: str) -> None:
        # logger.info(f"Model: {self.model}")
        if self.model and "claude" in self.model["deployment_name"]:
            try:
                await update_quota(
                    "claude-aws-quota",
                    self.prompt,
                    resposta,
                    self.model["deployment_name"],
                )
                logger.info("Enviada request de quota update")
            except Exception as erro:
                logger.error(
                    f"Não foi possível enviar request de update para a API de Quotas: {erro}"
                )

    def _update_trechos_utilizados(self, arquivos_busca: str, resposta: str) -> List:
        if arquivos_busca in (
            "Jurisprudência Selecionada",
            "Arquivos",
            "Normativos do TCU",
        ):
            return filtrar_trechos_utilizados(self.msg_sistema.trechos, resposta)
        elif self.msg_sistema.trechos:
            return self.msg_sistema.trechos
        return []
