import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain.agents import AgentExecutor
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate

from src.domain.llm.base.stream_process_utils import StreamProcessUtils
from src.domain.schemas import ChatGptInput


class MockBaseCallbackHandler(BaseCallbackHandler):
    def set_prompt(self, promptstr):
        pass


@pytest.mark.asyncio
class TestStreamProcessUtils:

    @pytest.fixture
    def utils(self):
        return StreamProcessUtils()

    @pytest.fixture
    def event(self):
        return asyncio.Event()

    @pytest.fixture
    def mock_function(self):
        return AsyncMock()

    @pytest.fixture
    def mock_error_function(self):
        async def error_function():
            raise Exception("Test exception")

        return AsyncMock(side_effect=error_function)

    @pytest.mark.asyncio
    async def test_wrap_done_success(self, utils, mock_function, event):
        await utils._wrap_done(mock_function(), event)
        assert event.is_set() is True

    @pytest.mark.asyncio
    async def test_wrap_done_exception(self, utils, mock_error_function, event):
        with pytest.raises(Exception, match="Test exception"):
            await utils._wrap_done(mock_error_function(), event)
        assert event.is_set() is True

    @patch("src.domain.llm.base.stream_process_utils.asyncio.create_task")
    @patch("src.domain.llm.base.stream_process_utils.ChatStop.registra_task")
    @pytest.mark.asyncio
    def test_get_task_llm(self, mock_registra_task, mock_create_task):
        utils = StreamProcessUtils()
        llm = MagicMock(spec=BaseChatModel)
        prompt = MagicMock(spec=ChatPromptTemplate)
        chatinput = MagicMock(spec=ChatGptInput)
        chatinput.prompt_usuario = "Test prompt"
        chatinput.correlacao_chamada_id = "test_id"
        historico = [MagicMock(spec=BaseMessage)]
        callback = MagicMock(spec=MockBaseCallbackHandler)
        callback.done = AsyncMock()

        task = utils._get_task_llm(llm, prompt, chatinput, historico, callback)

        mock_create_task.assert_called_once()
        mock_registra_task.assert_called_once_with(mock_create_task.return_value)
        assert task == mock_create_task.return_value
        callback.set_prompt.assert_called_once_with(prompt.format.return_value)

    @patch("src.domain.llm.base.stream_process_utils.asyncio.create_task")
    @patch("src.domain.llm.base.stream_process_utils.ChatStop.registra_task")
    @pytest.mark.asyncio
    def test_get_task_executor(self, mock_registra_task, mock_create_task):
        utils = StreamProcessUtils()
        executor = MagicMock(spec=AgentExecutor)
        prompt = MagicMock(spec=ChatPromptTemplate)
        chatinput = MagicMock(spec=ChatGptInput)
        chatinput.prompt_usuario = "Test prompt"
        chatinput.correlacao_chamada_id = "test_id"
        chatinput.imagens = []
        historico = [MagicMock(spec=BaseMessage)]
        callback = MagicMock(spec=MockBaseCallbackHandler)
        callback.done = AsyncMock()
        task = utils._get_task_executor(
            executor, prompt, chatinput, historico, callback
        )

        mock_create_task.assert_called_once()
        mock_registra_task.assert_called_once_with(mock_create_task.return_value)
        assert task == mock_create_task.return_value
        callback.set_prompt.assert_called_once_with(prompt.format.return_value)
