import pytest

from src.domain.llm.tools.normas import Normas
from tests.util.messages import mock_descricao_normas
from tests.util.mock_objects import MockObjects


class TestNormas:

    @pytest.mark.asyncio
    async def test_get_tool(self):
        norma = Normas(MockObjects.mock_mensagem, None, "teste prompt", 10)
        resposta = norma.get_tool()
        assert resposta.description == mock_descricao_normas
