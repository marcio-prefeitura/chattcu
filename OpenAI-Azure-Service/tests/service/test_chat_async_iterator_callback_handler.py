import logging
from typing import List

import pytest
from langchain_core.outputs import Generation, LLMResult

from src.domain.llm.callback.chat_async_iterator_callback_handler import (
    ChatAsyncIteratorCallbackHandler,
)
from src.domain.mensagem import Mensagem
from tests.util.mock_objects import MockObjects

logger = logging.getLogger(__name__)


class TestChatAsyncInteratorCallbackHandler:

    @staticmethod
    async def _adicionar_mensagens(cod_chat: str, mensagens: List[Mensagem]):
        logger.info(">> MENSAGENS ADICIONADAS COM SUCESSO")

    @pytest.mark.asyncio
    async def test_on_llm_new_token(self):
        chat_async = ChatAsyncIteratorCallbackHandler(
            chat_id="chat_id_test",
            msg=[MockObjects.mock_mensagem],
            acao="Teste",
            model={"deployment_name": "teste"},
        )
        resposta = await chat_async.on_llm_new_token("[Teste]")
        assert resposta is None

    @pytest.mark.asyncio
    async def test_on_llm_new_token_sem_filtrar_trechos(self):
        mensagem = MockObjects.mock_mensagem
        mensagem.arquivos_busca = "Teste"
        chat_async = ChatAsyncIteratorCallbackHandler(
            chat_id="chat_id_test",
            msg=[mensagem],
            acao="Teste",
            model={"deployment_name": "teste"},
        )
        resposta = await chat_async.on_llm_new_token("[Teste]")
        assert resposta is None

    @pytest.mark.asyncio
    async def test_on_llm_end_sem_filtrar_trechos(self):
        chat_async = ChatAsyncIteratorCallbackHandler(
            chat_id="chat_id_test",
            msg=[MockObjects.mock_mensagem],
            acao=self._adicionar_mensagens,
            model={"deployment_name": "teste"},
        )
        generation = Generation(text="Teste")
        llm_result = LLMResult(generations=[[generation]])
        resposta = await chat_async.on_llm_end(llm_result)
        assert resposta is None

    @pytest.mark.asyncio
    async def test_on_llm_end(self):
        mensagem = MockObjects.mock_mensagem
        mensagem.arquivos_busca = "Jurisprudência Selecionada"
        chat_async = ChatAsyncIteratorCallbackHandler(
            chat_id="chat_id_test",
            msg=[mensagem],
            acao=self._adicionar_mensagens,
            model={"deployment_name": "teste"},
        )
        generation = Generation(text="Teste")
        llm_result = LLMResult(generations=[[generation]])
        resposta = await chat_async.on_llm_end(llm_result)
        assert resposta is None

    @pytest.mark.asyncio
    async def test_on_llm_end_sem_resposta(self):
        chat_async = ChatAsyncIteratorCallbackHandler(
            chat_id="chat_id_test",
            msg=[MockObjects.mock_mensagem],
            acao=self._adicionar_mensagens,
            model={"deployment_name": "teste"},
        )
        generation = Generation(text="")
        llm_result = LLMResult(generations=[[generation]])
        resposta = await chat_async.on_llm_end(llm_result)
        assert resposta is None
