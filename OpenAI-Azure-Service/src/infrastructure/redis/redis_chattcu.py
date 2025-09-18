import logging
import threading
import time
from typing import Any

import redis
from opentelemetry import trace
from redis.exceptions import RedisError

from src.conf.env import configs
from src.domain.enum.type_channel_redis_enum import TypeChannelRedisEnum
from src.messaging.chatstop import ChatStop
from src.messaging.mensagem_chatstop_redis import MensagemChatStopRedis

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)
chat_stop = ChatStop()


class RedisClient:
    """Classe Singleton de conexão com o REDIS. Cria pool de conexões e publica e assina mensagens."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        """Impõe o padrão singleton para garantir que apenas uma instância da classe seja criada."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(RedisClient, cls).__new__(cls)

        return cls._instance

    def __init__(self) -> None:
        self.chatstop = chat_stop
        self.tentativas = 0
        self.MAX_TENTATIVAS = 4
        if not hasattr(self, "connection"):
            self._initialize_connection()

    def _reconnect(self) -> None:
        """Tenta reconectar ao Redis quando a conexão é perdida."""
        logger.info("Tentando reconectar ao Redis...")
        self._initialize_connection()

        self.subscribe_channel(TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value)

    def _process_message(self, channel: str, data: str) -> None:
        """Processa mensagens recebidas no canal."""
        try:
            if channel == TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value:
                msg = MensagemChatStopRedis.from_str(data)
                if msg:
                    self.chatstop.cancela_task(msg)
        except Exception as e:
            logger.error(f"Erro ao processar/conversão mensagem do REDIS: {e}")

    def _initialize_connection(self) -> None:
        try:
            redis_url = configs.REDIS_MESSAGE_URL
            redis_port = int(6379)
            redis_password = configs.REDIS_MESSAGE_PASSWORD

            self.pool = redis.ConnectionPool(
                host=redis_url,
                port=redis_port,
                password=redis_password,
                decode_responses=True,
                max_connections=4,
            )

            self.connection = redis.StrictRedis(connection_pool=self.pool)
            return
        except redis.ConnectionError as e:
            logger.error(f"Erro ao conectar ao REDIS: {e}")
            raise

    def publish_message(self, channel: TypeChannelRedisEnum, message: Any) -> None:
        """Publica a mensagem, diversa no canal especificado."""
        try:
            self.connection.publish(channel.value, message)
            logger.info(
                f"Mensagem publicada no canal REDIS: '{channel.value}': {message}"
            )
        except RedisError as e:
            logger.error(f"Erro ao publicar a mensagem REDIS: {e}")
            self._reconnect()

    def subscribe_channel(self, channel_value: str) -> None:
        """Assina um canal para receber mensagens."""
        try:
            pubsub = self.connection.pubsub()
            pubsub.subscribe(channel_value)
            logger.info(f"Assinatura realizada no REDIS canal: '{channel_value}'")

            for message in pubsub.listen():
                if message["type"] == "message":
                    logger.info(
                        f"(Uma mensagem foi recebida no canal do REDIS: '{channel_value}': {message['data']}"
                    )
                    self._process_message(channel_value, message["data"])

        except RedisError as e:
            self.tentativas += 1
            logger.error(
                f"Erro ao realizar assinatura no canal do REDIS: {e}, tentativa: {self.tentativas}"
            )
            time.sleep(1)
            if self.tentativas <= self.MAX_TENTATIVAS:
                self._reconnect()
