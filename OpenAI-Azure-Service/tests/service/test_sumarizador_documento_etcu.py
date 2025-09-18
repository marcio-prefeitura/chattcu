from datetime import datetime
from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.domain.llm.tools.sumarizador_documento_etcu import SumarizadorDocumentoETCU
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.infrastructure.security_tokens import DecodedToken
from src.service.documento_service import StreamPyMUPDFLoader


class TestSumarizadorDocumentoETCU:

    @pytest.fixture
    def sumarizador_documento_etcu(self):
        stream = MagicMock()
        msg = Mensagem(
            chat_id="0123",
            codigo="c_0123_0123_1",
            conteudo="mensagem de teste",
            papel=PapelEnum.SYSTEM,
            data_envio=datetime.now(),
            especialista_utilizado=None,
        )
        llm = AsyncMock()
        token = DecodedToken(
            login="test_user",
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )
        return SumarizadorDocumentoETCU(stream, msg, llm, token)

    @patch("src.service.documento_service.obter_documento_pdf", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_sumarizar_documento_focado_texto_longo(
        self, mock_obter_documento_pdf, sumarizador_documento_etcu
    ):
        with patch.object(
            sumarizador_documento_etcu,
            "_gerar_resumo_final_focado",
            return_value={"output_text": "fake_summary"},
        ) as mock_gerar_resumo, patch(
            "src.domain.llm.tools.sumarizador_documento_etcu.StreamPyMUPDFLoader"
        ) as MockStreamPyMUPDFLoader:

            mock_stream = BytesIO(b"fake_data")
            mock_obter_documento_pdf.return_value = mock_stream

            mock_loader_instance = MockStreamPyMUPDFLoader.return_value
            mock_loader_instance.load_list.return_value = [
                {"page_content": "fake_content"}
            ]

            result = await sumarizador_documento_etcu.sumarizar_documento_focado(
                numero_documento="123-456", input="Resumo do documento"
            )

            assert result == "fake_summary"
            mock_gerar_resumo.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_tool_focado(self, sumarizador_documento_etcu):
        tool = sumarizador_documento_etcu.get_tool_focado()
        assert tool is not None
        assert tool.name == "sumarizar_documento_focado"
