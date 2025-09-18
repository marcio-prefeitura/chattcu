from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.domain.llm.tools.upload_documento_full_context import (
    UploadDocumentoFullContext,
)
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum


class TestUploadDocumentoFullContext:

    @pytest.fixture
    def upload_documento_full_context(self):
        chat = MagicMock()
        system_message = Mensagem(
            chat_id="0123",
            codigo="c_0123_0123_1",
            conteudo="mensagem de teste",
            papel=PapelEnum.ASSISTANT,
            data_envio=datetime.now(),
            especialista_utilizado=None,
        )
        prompt_usuario = "Resumo do documento"
        llm = AsyncMock()
        token = "fake_token"
        return UploadDocumentoFullContext(
            chat, system_message, prompt_usuario, llm, token
        )

    @pytest.mark.asyncio
    async def test_sumarizar_upload_documento_focado_texto_longo(
        self, upload_documento_full_context
    ):
        with patch(
            "src.domain.llm.tools.upload_documento_full_context.AzureBlob"
        ) as MockAzureBlob, patch(
            "src.domain.llm.tools.upload_documento_full_context.StreamFileLoader"
        ) as MockStreamFileLoader, patch(
            "src.domain.llm.tools.upload_documento_full_context.asyncio.get_event_loop",
            return_value=AsyncMock(),
        ) as MockEventLoop, patch.object(
            upload_documento_full_context,
            "_gerar_resumo_final_focado",
            return_value={"output_text": "fake_summary"},
        ) as mock_gerar_resumo:

            mock_azb_instance = MockAzureBlob.return_value
            mock_azb_instance.download_blob_as_stream.return_value = b"fake_data"

            mock_loader_instance = MockStreamFileLoader.return_value
            mock_loader_instance.load_list.return_value = [
                {"page_content": "fake_content"}
            ]

            upload_documento_full_context.llm.return_value = MagicMock(
                content="fake_summary"
            )

            result = (
                await upload_documento_full_context.sumarizar_upload_documento_focado()
            )

            assert isinstance(result, dict)
            assert result["output"] == "fake_summary"
            mock_gerar_resumo.assert_called_once()

    @pytest.mark.asyncio
    async def test_execute(self, upload_documento_full_context):
        with patch.object(
            upload_documento_full_context,
            "sumarizar_upload_documento_focado",
            return_value={"output": "fake_summary"},
        ) as mock_method:
            result = await upload_documento_full_context.execute()
            assert result["output"] == "fake_summary"
            mock_method.assert_called_once()
