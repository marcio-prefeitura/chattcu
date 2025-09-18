from enum import auto
from typing import Any
from unittest.mock import MagicMock, Mock, patch

import pytest
from redis import RedisError

from src.domain.enum.type_channel_redis_enum import TypeChannelRedisEnum
from src.infrastructure.redis.redis_chattcu import RedisClient
from tests.util.mock_objects import MockObjects


class TestRedisClient:

    @pytest.fixture
    def _mock_redis_client(self, mocker):
        mocker.patch("redis.ConnectionPool", return_value=MagicMock())
        mocker.patch("redis.StrictRedis", return_value=MagicMock())
        return RedisClient()

    def test_eh_singleton(self):
        assert RedisClient() is RedisClient()

    def test_publish_message_sucesso(self, mocker, _mock_redis_client):
        mock_publish = mocker.patch.object(_mock_redis_client.connection, "publish")

        msg_stub = MockObjects.mock_redis_message

        # alvo do teste
        _mock_redis_client.publish_message(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL, msg_stub.model_dump()
        )

        mock_publish.assert_called_once_with(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value, msg_stub.model_dump()
        )

    def test_publish_message_reconectar_quando_ha_excecao(
        self, mocker, _mock_redis_client
    ):
        mocker.patch.object(
            _mock_redis_client.connection, "publish", side_effect=RedisError
        )
        mock_reconnect = mocker.patch.object(_mock_redis_client, "_reconnect")

        _mock_redis_client.publish_message(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL,
            MockObjects.mock_redis_message.model_dump_json,
        )

        mock_reconnect.assert_called_once()

    def test_subscribe_channel_sucesso(self, mocker, _mock_redis_client):
        mock_pubsub = MagicMock()
        mock_pubsub.listen.return_value = [
            {"type": "message", "data": MockObjects.mock_redis_message.model_dump()}
        ]

        mocker.patch.object(
            _mock_redis_client.connection, "pubsub", return_value=mock_pubsub
        )

        mock_process_message = mocker.patch(
            "src.infrastructure.redis.redis_chattcu.RedisClient._process_message",
            return_value=None,
        )

        # chamada alvo de teste
        _mock_redis_client.subscribe_channel(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value
        )

        mock_process_message.assert_called_once()

    def test_subscribe_channel_quando_ha_excecao(self, mocker, _mock_redis_client):
        mocker.patch.object(
            _mock_redis_client.connection, "pubsub", side_effect=RedisError
        )

        mock_reconnect = mocker.patch.object(_mock_redis_client, "_reconnect")

        # chamada alvo do teste
        _mock_redis_client.subscribe_channel(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value
        )

        mock_reconnect.assert_called_once()

    def test_process_message(self, mocker, _mock_redis_client):
        mock_cancela_task = mocker.patch.object(
            _mock_redis_client.chatstop, "cancela_task"
        )

        msg_stub = MockObjects.mock_redis_message

        # chamada alvo de teste
        _mock_redis_client._process_message(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value, msg_stub.model_dump_json()
        )

        mock_cancela_task.assert_called_once_with(msg_stub)

    def test_reconnect_sucesso(self, mocker, _mock_redis_client):
        mock_initialize_connection = mocker.patch.object(
            _mock_redis_client, "_initialize_connection"
        )

        mock_subscribe_channel = mocker.patch.object(
            _mock_redis_client, "subscribe_channel"
        )

        _mock_redis_client._reconnect()

        mock_initialize_connection.assert_called_once()
        mock_subscribe_channel.assert_called_once_with(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value
        )

    def test_initialize_connection_quando_ha_excecao(self, mocker, _mock_redis_client):
        mocker.patch("redis.ConnectionPool", side_effect=ConnectionError)

        with pytest.raises(ConnectionError):
            _mock_redis_client._initialize_connection()
