from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.domain.llm.tools.sumarizador_documento_upload import SumarizadorDocumentoUpload
from src.infrastructure.security_tokens import DecodedToken
from tests.util.mock_objects import MockObjects


class TestSumarizadorDocumentoUpload:

    @pytest.fixture
    def sumarizador_documento_upload(self):
        msg = MockObjects.mock_mensagem
        token = DecodedToken(
            login="test_user",
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )
        return SumarizadorDocumentoUpload(
            stream=False, msg=msg, llm=AsyncMock(), token=token
        )

    @pytest.mark.asyncio
    async def test_sumarizar(self, sumarizador_documento_upload):
        stream = BytesIO(b"Conteudo do documento")
        result = {"output_text": "Resumo gerado"}
        sumarizador_documento_upload.llm = AsyncMock(return_value=result)

        with patch("src.service.documento_service.StreamPyMUPDFLoader") as mock_loader:
            mock_loader.return_value.load = MagicMock(
                return_value=[{"page_content": "Conteúdo do documento"}]
            )
            with patch.object(
                sumarizador_documento_upload, "_gerar_resumo_final_focado"
            ) as mock_gerar_resumo:
                mock_gerar_resumo.return_value = result
                resumo = await sumarizador_documento_upload.sumarizar(stream)
                assert resumo == result["output_text"]
                mock_gerar_resumo.assert_called_once()

    @pytest.mark.asyncio
    async def test_sumarizar_msg_none(self, sumarizador_documento_upload):
        stream = BytesIO(b"Conteudo do documento")
        result = {"output_text": "Resumo gerado"}
        sumarizador_documento_upload.llm = AsyncMock(return_value=result)
        sumarizador_documento_upload.msg = None

        with patch("src.service.documento_service.StreamPyMUPDFLoader") as mock_loader:
            mock_loader.return_value.load = MagicMock(
                return_value=[{"page_content": "Conteúdo do documento"}]
            )
            with patch.object(
                sumarizador_documento_upload, "_gerar_resumo_final_focado"
            ) as mock_gerar_resumo:
                mock_gerar_resumo.return_value = result
                resumo = await sumarizador_documento_upload.sumarizar(stream)
                assert resumo == result["output_text"]
                mock_gerar_resumo.assert_called_once()
