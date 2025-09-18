import pytest

from src.domain.llm.tools.adiministrativo import Administrativo
from tests.util.messages import mock_descricao_adm
from tests.util.mock_objects import MockObjects


class TestAdministrativo:

    @pytest.mark.asyncio
    async def test_get_tool(self):
        adm = Administrativo(
            msg=MockObjects.mock_mensagem,
            top_documents=10,
            login="teste",
            llm=None,
            prompt_usuario="teste",
        )
        resposta = adm.get_tool()
        assert resposta.description == mock_descricao_adm
