from unittest.mock import patch

import pytest

from src.domain.llm.model_factory import ModelFactory
from src.exceptions import ServiceException
from src.infrastructure.env import GEMINI_API_KEY, MODELO_PADRAO, MODELOS
from src.infrastructure.roles import DESENVOLVEDOR

MODELOS_TESTE = {
    "TESTE": {
        "model_type": "LLM",
        "deployment_name": "GPT-35-Turbo-4k",
        "version": "2024-02-15-preview",
        "max_tokens": 4096,
        "tiktoken_modelo": "gpt-3.5-turbo-0613",
        "tiktoken_encodding": "cl100k_base",
        "disponivel": False,
    },
    "TESTE_DESCONHECIDA": {
        "model_type": "LLM",
        "deployment_name": "GPT-35-Turbo-4k",
        "version": "2024-02-15-preview",
        "max_tokens": 4096,
        "tiktoken_modelo": "gpt-3.5-turbo-0613",
        "tiktoken_encodding": "cl100k_base",
        "disponivel": False,
        "fornecedora": "TCU",
    },
    "TESTE_AZURE_MODEL_DESC": {
        "model_type": "TCU",
        "deployment_name": "GPT-35-Turbo-4k",
        "version": "",
        "max_tokens": 0,
        "tiktoken_modelo": "gpt-3.5-turbo-0613",
        "tiktoken_encodding": "",
        "disponivel": True,
        "fornecedora": "AZURE",
    },
    "TESTE_GOOGLE": {
        "model_type": "LLM",
        "deployment_name": "GPT-35-Turbo-4k",
        "version": "2024-02-15-preview",
        "max_tokens": 4096,
        "tiktoken_modelo": "gpt-3.5-turbo-0613",
        "tiktoken_encodding": "cl100k_base",
        "disponivel": False,
        "fornecedora": "GOOGLE",
    },
    "TESTE_AWS": {
        "model_type": "LLM",
        "deployment_name": "GPT-35-Turbo-4k",
        "version": "2024-02-15-preview",
        "max_tokens": 4096,
        "tiktoken_modelo": "gpt-3.5-turbo-0613",
        "tiktoken_encodding": "cl100k_base",
        "disponivel": False,
        "fornecedora": "AWS",
    },
}


class TestModelFactory:
    def test_deve_lancar_excecao_quando_sem_fornecedora(self, decoded_token):
        with pytest.raises(Exception) as exc_info:
            ModelFactory.get_model(
                model=MODELOS_TESTE["TESTE"],
                api_key="teste",
                token=decoded_token,
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Fornecedora do modelo não informada!"

    def test_deve_definir_padrao_quando_azure_sem_api_base(self, decoded_token):
        model = ModelFactory.get_model(
            model=MODELOS[MODELO_PADRAO],
            api_key="teste",
            token=decoded_token,
        )

        assert model.azure_endpoint == "APIM_OPENAI_API_BASE"

    def test_deve_lancar_excecao_quando_azure_model_type_desconhecido(
        self, decoded_token
    ):
        with pytest.raises(Exception) as exc_info:
            ModelFactory.get_model(
                model=MODELOS_TESTE["TESTE_AZURE_MODEL_DESC"],
                api_key="teste",
                api_base="teste",
                token=decoded_token,
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Tipo de modelo não identificado!"

    def test_deve_lancar_excecao_quando_fornecedora_desconhecida(self, decoded_token):
        with pytest.raises(Exception) as exc_info:
            ModelFactory.get_model(
                model=MODELOS_TESTE["TESTE_DESCONHECIDA"],
                api_key="teste",
                token=decoded_token,
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Fornecedora do modelo desconhecida!"

    @patch("src.domain.llm.model_factory.AsyncAzureOpenAI")
    @patch("src.domain.llm.model_factory.uuid")
    def test_deve_retornar_azure_model_asr(
        self, mock_uuid, mock_async_azure_open_ai, decoded_token, mocker
    ):
        mock_uuid.uuid4 = mocker.Mock(return_value="teste")

        ModelFactory.get_model(
            model=MODELOS["WHISPER"],
            token=decoded_token,
            api_key="Teste",
            api_base="Teste",
        )

        mock_async_azure_open_ai.assert_called_once_with(
            api_key="Teste",
            api_version=MODELOS["WHISPER"]["version"],
            azure_endpoint="Teste",
            default_headers={
                "usuario": decoded_token.login,
                "desenvol": str(DESENVOLVEDOR in decoded_token.roles).lower(),
                "execution_id": "teste",
            },
        )

    @patch("src.domain.llm.model_factory.ChatGoogleGenerativeAI")
    def test_deve_retornar_gemini(self, mock_chat_google_genai, decoded_token):
        ModelFactory.get_model(
            model=MODELOS["GEMINI-1.5-Pro"],
            token=decoded_token,
            api_key="Teste",
            top_p=None,
            max_tokens_out=None,
        )

        mock_chat_google_genai.assert_called_once_with(
            google_api_key=GEMINI_API_KEY,
            model=MODELOS["GEMINI-1.5-Pro"]["deployment_name"],
            temperature=0,
            verbose=False,
            disable_streaming=True,
            top_p=0.95,
            max_output_tokens=4096,
            callbacks=None,
        )

    @patch("src.domain.llm.model_factory.ChatBedrockConverse")
    def test_deve_retornar_chat_aws(self, mock_chat_bedrock_converse, decoded_token):
        ModelFactory.get_model(
            model=MODELOS["Claude 3.5 Sonnet"],
            token=decoded_token,
            api_key="Teste",
        )

        mock_chat_bedrock_converse.assert_called_once_with(
            aws_access_key_id="AWS_BEDROCK_ACCESS_KEY",
            aws_secret_access_key="AWS_BEDROCK_SECRET_ACCESS_KEY",
            model=MODELOS["Claude 3.5 Sonnet"]["deployment_name"],
            region_name=MODELOS["Claude 3.5 Sonnet"]["regiao"],
            max_tokens=4096,
            temperature=0,
            top_p=0.95,
            verbose=False,
            disable_streaming=True,
            callbacks=None,
        )
