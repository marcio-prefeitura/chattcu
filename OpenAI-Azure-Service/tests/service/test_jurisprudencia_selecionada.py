import pytest

from src.domain.llm.tools.jurisprudencia_selecionada import JurisprudenciaSelecionada
from tests.util.messages import mock_descricao_juris
from tests.util.mock_objects import MockObjects


class TestJurisprudenciaSelecionada:

    @pytest.mark.asyncio
    async def test_get_tool(self):
        juris = JurisprudenciaSelecionada(
            MockObjects.mock_mensagem, None, "teste prompt", 10
        )
        resposta = juris.get_tool()
        assert resposta.description == mock_descricao_juris
