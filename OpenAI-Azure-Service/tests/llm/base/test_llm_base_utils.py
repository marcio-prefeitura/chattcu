from unittest.mock import MagicMock, patch

import pytest

from src.domain.llm.base.llm_base_utils import (
    AIMessage,
    GeminiTokenizer,
    HumanMessage,
    LLMBaseUtils,
    TiktokenTokenizer,
)
from src.domain.papel_enum import PapelEnum


@pytest.fixture
def mock_encoding():
    encoding = MagicMock()
    encoding.encode = MagicMock(side_effect=lambda x: [ord(c) for c in x])
    encoding.decode = MagicMock(side_effect=lambda x: "".join([chr(c) for c in x]))
    return encoding


@pytest.fixture
def mock_llm_model_google():
    return {"fornecedora": "GOOGLE", "deployment_name": "test_deployment"}


@pytest.fixture
def mock_llm_model_other():
    return {"fornecedora": "OTHER"}


def test_get_tokenizer_google(mock_llm_model_google, mock_encoding):
    tokenizer = LLMBaseUtils._get_tokenizer(mock_llm_model_google, mock_encoding)
    assert isinstance(tokenizer, GeminiTokenizer)


def test_get_tokenizer_other(mock_llm_model_other, mock_encoding):
    tokenizer = LLMBaseUtils._get_tokenizer(mock_llm_model_other, mock_encoding)
    assert isinstance(tokenizer, TiktokenTokenizer)


@patch("src.domain.llm.base.llm_base_utils.GeminiTokenizer.truncate_prompt")
def test_truncar_prompt_google(
    mock_truncate_prompt, mock_llm_model_google, mock_encoding
):
    prompt = "This is a test prompt"
    msg_sistema = "System message"
    max_tokens = 100
    min_espaco_tokens_resposta = 10

    LLMBaseUtils._truncar_prompt(
        prompt,
        msg_sistema,
        mock_encoding,
        max_tokens,
        min_espaco_tokens_resposta,
        mock_llm_model_google,
    )
    mock_truncate_prompt.assert_called_once()


@patch("src.domain.llm.base.llm_base_utils.TiktokenTokenizer.truncate_prompt")
def test_truncar_prompt_other(
    mock_truncate_prompt, mock_llm_model_other, mock_encoding
):
    prompt = "This is a test prompt"
    msg_sistema = "System message"
    max_tokens = 100
    min_espaco_tokens_resposta = 10

    LLMBaseUtils._truncar_prompt(
        prompt,
        msg_sistema,
        mock_encoding,
        max_tokens,
        min_espaco_tokens_resposta,
        mock_llm_model_other,
    )
    mock_truncate_prompt.assert_called_once()


def test_truncar_historico(mock_encoding):
    mensagem_usuario = "User message"
    msg_sistema = "System message"
    historico = [
        {"role": "user", "content": "Hello"},
        {"role": "system", "content": "System message"},
    ]
    max_tokens = 50
    min_espaco_tokens_resposta = 10

    LLMBaseUtils._truncar_historico(
        mensagem_usuario,
        msg_sistema,
        historico,
        mock_encoding,
        max_tokens,
        min_espaco_tokens_resposta,
    )
    assert len(historico) == 2


def test_tratar_historico():
    user_prefix = "User: "
    assistant_prefix = "Assistant: "
    msg_sufix = "\n"
    historico = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
    ]

    result, result_str = LLMBaseUtils._tratar_historico(
        user_prefix, assistant_prefix, msg_sufix, historico
    )
    assert result_str == "User: Hello\nAssistant: Hi there!\n"
    assert len(result) == 2
    assert isinstance(result[0], HumanMessage)
    assert isinstance(result[1], AIMessage)
