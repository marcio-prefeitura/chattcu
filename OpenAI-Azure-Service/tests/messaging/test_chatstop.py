import asyncio
from unittest.mock import MagicMock

import pytest

from src.messaging.chatstop import ChatStop
from tests.util.mock_objects import MockObjects


class TestChatStop:

    @pytest.fixture
    def _mock_chat_stop(self, mocker):
        return ChatStop()

    async def _get_task_fake(self, nome_task, sleep_time=5):
        async def dummy_coroutine():
            await asyncio.sleep(sleep_time)

        return asyncio.create_task(dummy_coroutine(), name=nome_task)

    def test_eh_singleton(self):
        assert ChatStop() is ChatStop()

    def test_registra_task(self):
        chat_stop = ChatStop()
        task = asyncio.run(self._get_task_fake("task-1"))

        chat_stop.registra_task(task)

        assert chat_stop._get_task_by_nome("task-1") == task

    def test_cancela_task(self):
        nome_task = "task-2"
        chat_stop = ChatStop()
        task = asyncio.run(self._get_task_fake(nome_task))
        chat_stop.registra_task(task)

        msg_stub = MockObjects.mock_redis_message
        msg_stub.correlacao_chamada_id = nome_task

        chat_stop.cancela_task(msg_stub)

        assert chat_stop._get_task_by_nome(nome_task) is None

    def test_cancela_task_lanca_exception(self):
        chat_stop = ChatStop()
        task = asyncio.run(self._get_task_fake("task-3"))
        chat_stop.registra_task(task)

        msg_stub = MockObjects.mock_redis_message
        msg_stub.correlacao_chamada_id = "task-3"

        chat_stop.cancela_task(msg_stub)

        with pytest.raises(asyncio.CancelledError):
            task.result()

    def test_cancela_task_nao_existe(self):
        chat_stop = ChatStop()
        task = asyncio.run(self._get_task_fake("task-4"))
        chat_stop.registra_task(task)

        msg_stub = MockObjects.mock_redis_message
        msg_stub.correlacao_chamada_id = "task-5"

        chat_stop.cancela_task(msg_stub)

        assert chat_stop._get_task_by_nome("task-4") == task

    def test_cancela_task_por_correlacao_chamada_id_lanca_exception(
        self, mocker, _mock_chat_stop
    ):

        mock_logger = mocker.patch("src.messaging.chatstop.logger.info")

        task = asyncio.run(self._get_task_fake("task-6"))
        _mock_chat_stop.registra_task(task)

        _mock_chat_stop._get_task_by_nome = MagicMock(
            side_effect=asyncio.CancelledError
        )

        _mock_chat_stop._cancela_task_por_correlacao_chamada_id("task-6")

        mock_logger.assert_called_once_with("Tarefa task-6 tratada após cancelamento.")
