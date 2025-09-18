import asyncio
import json
import logging
from typing import AsyncIterator, TypeVar

from fastapi import WebSocket

from src.conf.env import configs
from src.exceptions import BusinessException
from src.infrastructure.realtimeaudio.tools_realtime import TOOLS
from src.infrastructure.security_tokens import DecodedEntraIDToken
from src.service import auth_service

logger = logging.getLogger(__name__)

T = TypeVar("T")


class ConfigRealtime:
    _instance = None
    api_key: str
    api_version: str
    deployment_name: str

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConfigRealtime, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        self.api_key = configs.OPENAI_API_REALTIME_KEY
        self.api_version = "2024-10-01-preview"
        self.deployment_name = "gpt-4o-realtime-preview"
        self.url = (
            f"wss://openai-tcu-dev-eastus-002.openai.azure.com/openai/realtime?"
            f"api-version={self.api_version}&deployment={self.deployment_name}"
        )

    @staticmethod
    def get_standard_session_creation():
        """Cria um dicionário com as configurações padrão de uma sessão de conversação com a OpenAI.
        @see https://platform.openai.com/docs/api-reference/realtime-sessions/session_object
        """

        return {
            "type": "session.update",
            "session": {
                "instructions": """Você é um assistente virtual educado e prestativo, que responde de forma sucinta.
                                Responde sempre usando a língua portuguesa do Brasil.""",
                "modalities": ["audio", "text"],
                "input_audio_transcription": {
                    # só tem o whisper-1 até a data de criação
                    "model": "whisper-1",
                },
                "turn_detection": {
                    # detecção de voz a cargo do modelo
                    "type": "server_vad",
                    # mais alto, tem que falar mais alto
                    "threshold": 0.5,
                    # quantidade de áudio submetido antes da detecção
                    "prefix_padding_ms": 300,
                    # tempo de silêncio para considerar fim de fala
                    "silence_duration_ms": 1400,
                },
                # 'amuch', 'dan', 'elan', 'marilyn', 'meadow', 'breeze', 'cove',
                # 'ember', 'jupiter', 'alloy', 'echo', and 'shimmer'
                "voice": "marilyn",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                # varia de 0.6 à 1.2, > é mais criativo
                "temperature": 0.6,
                # máximo de tokens de saída
                "max_response_output_tokens": 2000,
            },
        }

    @staticmethod
    def update_dict(original_dict, updates: dict):
        """
        Atualiza os valores de um dicionário original com base em um dicionário de atualizações.

        :param original_dict: Dicionário original que será atualizado.
        :param updates: Dicionário contendo as atualizações.
        :return: Dicionário atualizado.
        """
        if original_dict:
            for key, value in updates.items():
                if isinstance(value, dict) and key in original_dict:
                    # se o valor for um dicionário chama recursivo
                    ConfigRealtime.update_dict(original_dict[key], value)
                elif key in original_dict:
                    # se não é dict atualiza o valor diretamente
                    original_dict[key] = value
                else:
                    logger.error(f"Chave {key} não encontrada no dicionário original.")

        return original_dict


class Bcolors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


class UtilStreams:

    @staticmethod
    async def amerge(**streams: AsyncIterator[T]) -> AsyncIterator[tuple[str, T]]:
        """Trabalha varias streams de entrada e saída em um único loop."""

        nexts: dict[asyncio.Task, str] = {
            asyncio.create_task(anext(stream)): key for key, stream in streams.items()
        }
        while nexts:
            done, _ = await asyncio.wait(nexts, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                key = nexts.pop(task)
                stream = streams[key]
                try:
                    yield key, task.result()
                    nexts[asyncio.create_task(anext(stream))] = key
                except StopAsyncIteration:
                    pass
                except Exception as e:
                    for task in nexts:
                        task.cancel()
                    logger.error(e)

    @staticmethod
    async def websocket_stream(websocket: WebSocket) -> AsyncIterator[str]:
        """Recebe os dados do websocket do usuário final e mantém a conexão aberta por 60 segundos.
        Se não receber dados do usuário final em X segundos, a conexão é fechada
        """
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=180.0)
                yield data
            except TimeoutError:
                raise BusinessException(
                    message="Timeout de 3 minutos sem receber dados do cliente.",
                    code=1005,
                )

    @staticmethod
    async def validar_payload(payload: str) -> DecodedEntraIDToken:
        """Função para validar o payload inicial."""
        try:
            data = json.loads(payload)
            token_decoded = await auth_service.verify_decode_entraid_token(
                data["token"], None, None
            )
            if not token_decoded:
                raise BusinessException(message="Token inválido", code=4001)
            else:
                return token_decoded
        except json.JSONDecodeError:
            raise BusinessException(
                message="Payload inválido ao realizar o parse para JSON", code=4002
            )

    @staticmethod
    def get_config_instructions_from_payload(payload: str) -> DecodedEntraIDToken:
        """
        Recupera as instruções do usuário do payload. json para dict
        caso contrario retorna um dict vazio
        """
        try:
            data = json.loads(payload)
            return data["config_instructions"]
        except json.JSONDecodeError:
            return {}
