import re
from datetime import datetime
from json import JSONDecodeError

import pytest
from tomlkit import date

from src.domain.enum.type_channel_redis_enum import TypeChannelRedisEnum
from src.messaging.mensagem_chatstop_redis import MensagemChatStopRedis


class TestMensagemChatStopRedis:

    def test_instancia_mensagem_sucesso(self):

        assert (
            MensagemChatStopRedis(
                TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value,
                "correlacao_chamada_id",
                "usuario",
                "origem",
                datetime.now(),
            )
            is not None
        )

    def test_instancia_mensagem_sem_data_hora(self):
        assert MensagemChatStopRedis(
            TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value,
            "correlacao_chamada_id",
            "usuario",
            "origem",
            None,
        )

    def test_from_str_sucesso(self):
        mensagem = MensagemChatStopRedis.from_str(
            '{"channel_subscricao": "CHAT_STOP_CHANNEL", "correlacao_chamada_id": "abc123", "usuario": "usuario", "origem": "origem", "data_hora": "2021-07-01T00:00:00"}'
        )
        assert mensagem.channel_subscricao == "CHAT_STOP_CHANNEL"
        assert mensagem.correlacao_chamada_id == "abc123"
        assert mensagem.usuario == "usuario"
        assert mensagem.origem == "origem"
        assert mensagem.data_hora == datetime(2021, 7, 1)

    def test_from_str_sem_data_hora(self):
        mensagem = MensagemChatStopRedis.from_str(
            '{"channel_subscricao": "CHAT_STOP_CHANNEL", "correlacao_chamada_id": "abc123", "usuario": "usuario", "origem": "origem"}'
        )
        assert mensagem.channel_subscricao == "CHAT_STOP_CHANNEL"
        assert mensagem.correlacao_chamada_id == "abc123"
        assert mensagem.usuario == "usuario"
        assert mensagem.origem == "origem"
        assert mensagem.data_hora is not None

    def _get_exception(self):
        return ValueError("Erro ao validar dados da mensagem: ValidationError")

    def test_from_str_data_nao_eh_valida_insere_data_now(self):
        msg = MensagemChatStopRedis.from_str(
            '{"channel_subscricao": "CHAT_STOP_CHANNEL", "correlacao_chamada_id": "abc123", "usuario": "usuario", "origem": "origem", "data_hora": "2021-07-01-ABC"}'
        )
        assert msg.data_hora is not None

    def test_from_str_erro_diverson(self):
        with pytest.raises(ValueError):
            MensagemChatStopRedis.from_str("1234")

    def test_from_str_erro_json_decode(self):
        msg = MensagemChatStopRedis.from_str(
            '{"channel_subscricao": "CHAT_STOP_CHANNEL"'
        )
        msg is None
