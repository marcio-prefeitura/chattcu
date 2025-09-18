from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.responses import StreamingResponse

from src.domain.llm.base.llm_base_operations import LLMBaseOperations
from src.domain.llm.callback.chat_async_iterator_callback_handler import (
    ChatAsyncIteratorCallbackHandler,
)
from src.domain.schemas import ChatGptInput


@pytest.mark.asyncio
class TestLLMBaseOperations:
    @pytest.fixture
    def setup(self):
        self.instance = LLMBaseOperations()
        self.instance._prepara_prompt = AsyncMock()
        self.instance._buscar_docs_relevantes = AsyncMock()
        self.instance._get_response_by_streaming = AsyncMock()
        self.instance.modelo = {
            "deployment_name": "model_deployment",
            "version": "v1.0",
        }
        self.chatinput = ChatGptInput(
            prompt_usuario="Prompt",
            arquivos_selecionados=[],
            arquivos_selecionados_prontos=[],
            tool_selecionada="Tool",
            imagens=["base64image1"],
            # historico_mensagens=[],
        )
        self.data_hora_atual = datetime.now()
        return self.instance

    @pytest.mark.asyncio
    # TODO CORRIGIR TESTE
    # async def test_registrar_mensagens(self, setup):
    #     self.instance._gerar_codigo_mensagem = MagicMock(return_value="code123")
    #     self.instance._adicionar_mensagens = MagicMock()

    #     self.instance._registrar_mensagens(chat_id="chat_123", chatinput=self.chatinput)

    #     print(f"msg1: {self.instance.msg1}")
    #     print(f"msg2: {self.instance.msg2}")

    #     assert self.instance.msg1 is not None
    #     assert self.instance.msg2 is not None
    #     assert isinstance(self.instance.callback, ChatAsyncIteratorCallbackHandler)
    #     self.instance._gerar_codigo_mensagem.assert_called()

    def test_gerar_codigo_mensagem(self, setup):
        result = self.instance._gerar_codigo_mensagem(
            chat_id="chat_123",
            historico=[],
            data_hora_atual=self.data_hora_atual,
            index=2,
        )
        assert "c_chat_123_" in result
        assert "_2" in result

    def test_processar_arquivos_busca_e_trechos(self, setup):
        self.instance.msg = MagicMock(
            arquivos_busca="Jurisprudência Selecionada", trechos=["t1", "t2"]
        )
        with patch(
            "src.domain.llm.base.llm_base_operations.filtrar_trechos_utilizados",
            return_value=["t1"],
        ):
            arquivos_busca, trechos_utilizados = (
                self.instance._processar_arquivos_busca_e_trechos("resposta")
            )
            assert arquivos_busca == "Jurisprudência Selecionada"
            assert trechos_utilizados == ["t1"]

    @pytest.mark.asyncio
    async def test_enviar_resposta_por_stream(self, setup):
        self.instance._get_response_by_streaming.return_value = AsyncMock()
        response = self.instance._enviar_resposta_por_stream(self.chatinput, "titulo")
        assert isinstance(response, StreamingResponse)
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["Cache-Control"] == "no-cache"
        assert response.headers["Connection"] == "keep-alive"
        self.instance._get_response_by_streaming.assert_called_with(
            chatinput=self.chatinput, titulo="titulo"
        )
