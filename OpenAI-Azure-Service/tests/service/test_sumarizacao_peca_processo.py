from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from src.domain.llm.tools.sumarizacao_peca_processo import SumarizacaoPecaProcesso
from src.infrastructure.security_tokens import DecodedToken
from tests.util.mock_objects import MockObjects


class TestSumarizacaoPecaProcesso:

    @pytest.fixture
    def sumarizacao_peca_processo(self):
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
        return SumarizacaoPecaProcesso(
            stream=False, msg=msg, llm=AsyncMock(), token=token
        )

    @pytest.mark.asyncio
    async def test_gerar_resumo_final_focado(self, sumarizacao_peca_processo):
        docs = [{"page_content": "Conteúdo do documento"}]
        result = {"output_text": "Resumo gerado"}
        sumarizacao_peca_processo.llm = AsyncMock(return_value=result)

        with patch(
            "src.domain.llm.tools.sumarizacao_peca_processo.load_summarize_chain"
        ) as mock_chain:
            mock_chain.return_value.ainvoke = AsyncMock(return_value=result)
            resumo = await sumarizacao_peca_processo._gerar_resumo_final_focado(docs)
            assert resumo == result

    @pytest.mark.asyncio
    async def test_sumarizar_documento_processo_focado_texto_longo(
        self, sumarizacao_peca_processo
    ):
        numero_peca = "123"
        numero_processo = "456"
        input_text = "Resumo do processo"
        peca = MagicMock(codigo="codigo_peca")
        stream = MagicMock()
        result = MagicMock(content="Resumo gerado")
        with patch(
            "src.service.documento_service.recuperar_peca_processo",
            new_callable=AsyncMock,
        ) as mock_recuperar_peca:
            mock_recuperar_peca.return_value = peca
            with patch(
                "src.service.documento_service.obter_stream_documento",
                new_callable=AsyncMock,
            ) as mock_obter_stream:
                mock_obter_stream.return_value = stream
                with patch(
                    "src.service.documento_service.StreamPyMUPDFLoader"
                ) as mock_loader:
                    sumarizacao_peca_processo.llm = [HumanMessage(content=result)]
                    mock_loader.return_value.load = MagicMock(return_value=[])
                    with patch.object(
                        sumarizacao_peca_processo, "_gerar_resumo_final_focado"
                    ) as mock_gerar_resumo:
                        mock_gerar_resumo.return_value = {
                            "output_text": "Resumo gerado"
                        }
                        resumo = await sumarizacao_peca_processo._sumarizar_documento_processo_focado(
                            numero_peca, numero_processo, input_text
                        )
                        assert resumo == result.content
                        mock_gerar_resumo.assert_called_once()

    def test_get_tool_focado(self, sumarizacao_peca_processo):
        tool = sumarizacao_peca_processo.get_tool_focado()
        assert tool.func is None
        assert tool.coroutine is not None
