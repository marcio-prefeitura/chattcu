import logging
from abc import ABC, abstractmethod
from typing import List

from google.generativeai import GenerativeModel, configure
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.messages.base import BaseMessage

from src.domain.papel_enum import PapelEnum
from src.infrastructure.env import GEMINI_API_KEY

logger = logging.getLogger(__name__)


class ITokenizer(ABC):
    """Interface para truncadores de tokens."""

    @abstractmethod
    def truncate_prompt(
        self,
        prompt: str,
        msg_sistema: str,
        encoding,
        max_tokens: int,
        min_espaco_tokens_resposta: int,
    ) -> str:
        """Trunca o prompt para caber dentro do limite de tokens."""
        pass


class GeminiTokenizer(ITokenizer):
    """Truncador de tokens usando Google Gemini."""

    def __init__(self, api_key, deployment_name):
        configure(api_key=api_key)
        self.gemini_model = GenerativeModel(deployment_name)

    def truncate_prompt(
        self, prompt, msg_sistema, encoding, max_tokens, min_espaco_tokens_resposta
    ) -> str:
        num_wrap_tokens = 4
        num_reply_tokens = 2

        num_tokens_sistema = (
            len(encoding.encode(PapelEnum.SYSTEM.name.lower()))
            + len(encoding.encode(msg_sistema))
            + num_wrap_tokens
        )

        limit_prompt = (
            max_tokens
            - num_tokens_sistema
            - num_wrap_tokens
            - num_reply_tokens
            - min_espaco_tokens_resposta
        )

        prompt_truncated = prompt[:limit_prompt]
        token_count = self.gemini_model.count_tokens(prompt_truncated).total_tokens

        while token_count > limit_prompt:
            prompt_truncated = prompt_truncated[:-1]
            token_count = self.gemini_model.count_tokens(prompt_truncated).total_tokens

        logger.info(f"Truncado (Gemini): {prompt_truncated}")
        return prompt_truncated


class TiktokenTokenizer(ITokenizer):
    """Truncador de tokens usando Tiktoken."""

    def truncate_prompt(
        self, prompt, msg_sistema, encoding, max_tokens, min_espaco_tokens_resposta
    ) -> str:
        num_wrap_tokens = 4
        num_reply_tokens = 2

        num_tokens_sistema = (
            len(encoding.encode(PapelEnum.SYSTEM.name.lower()))
            + len(encoding.encode(msg_sistema))
            + num_wrap_tokens
        )

        limit_prompt = (
            max_tokens
            - num_tokens_sistema
            - num_wrap_tokens
            - num_reply_tokens
            - min_espaco_tokens_resposta
        )

        prompt_truncated = encoding.decode(encoding.encode(prompt)[:limit_prompt])

        logger.info(f"Truncado (Tiktoken): {prompt_truncated}")
        return prompt_truncated


class LLMBaseUtils:
    def _num_tokens_from_messages(mensagens, encoding):
        """Returns the number of tokens used by a list of messages, including image URLs."""
        num_tokens = 0
        for message in mensagens:
            num_tokens += 4

            for key, value in message.items():
                if isinstance(value, str):
                    num_tokens += len(encoding.encode(value))
                elif isinstance(value, dict) and "image_url" in value:
                    num_tokens += 1
                    logger.info(f"Image URL found: {value['image_url']}")

                if key == "name":
                    num_tokens += -1

        num_tokens += 2
        return num_tokens

    @staticmethod
    def _get_tokenizer(llm_model, encoding):
        if llm_model.get("fornecedora") == "GOOGLE":
            return GeminiTokenizer(
                api_key=GEMINI_API_KEY, deployment_name=llm_model["deployment_name"]
            )
        return TiktokenTokenizer()

    @staticmethod
    def _truncar_prompt(
        prompt, msg_sistema, encoding, max_tokens, min_espaco_tokens_resposta, llm_model
    ):
        tokenizer = LLMBaseUtils._get_tokenizer(llm_model, encoding)
        return tokenizer.truncate_prompt(
            prompt, msg_sistema, encoding, max_tokens, min_espaco_tokens_resposta
        )

    @staticmethod
    def _truncar_historico(
        mensagem_usuario,
        msg_sistema,
        historico,
        encoding,
        max_tokens,
        min_espaco_tokens_resposta,
    ):
        logger.info("Truncando histórico...")
        base_index = 1

        def num_tokens_in_historico():
            return LLMBaseUtils._num_tokens_from_messages(
                [{"role": PapelEnum.SYSTEM.name.lower(), "content": msg_sistema}]
                + historico
                + [{"role": PapelEnum.USER.name.lower(), "content": mensagem_usuario}],
                encoding,
            )

        while num_tokens_in_historico() + min_espaco_tokens_resposta > max_tokens:
            if base_index >= len(historico):
                break

            historico = historico[base_index:]

    @staticmethod
    def _tratar_historico(user_prefix, assistant_prefix, msg_sufix, historico):
        # para cod antigo
        result_str = ""

        for registro in historico:
            prefix = user_prefix if registro["role"] == "user" else assistant_prefix
            content = registro["content"]
            if isinstance(content, list):
                content = "".join(
                    [item.get("text", "") for item in content if isinstance(item, dict)]
                )
            result_str += prefix + content + msg_sufix

        # para cod novo
        result = []

        for registro in historico:
            msg = None
            if registro["role"] == "user":
                msg = HumanMessage(content=registro["content"])
            else:
                msg = AIMessage(content=registro["content"])

            result.append(msg)
        return result, result_str
