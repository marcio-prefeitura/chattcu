from unittest.mock import AsyncMock, patch

import pytest

from src.domain.agent_config import AgentConfig
from src.service.agent_service import inserir_agent, listar_agents_disponiveis


class TestAgentService:
    @pytest.mark.asyncio
    @patch("src.service.agent_service.AgentMongo")
    async def test_listar_agents_disponiveis(self, mock_agent_mongo):
        mock_agent_mongo.listar_agents_disponiveis = AsyncMock(
            return_value=[
                {
                    "label_agente": "Agent1",
                    "value_agente": "Value1",
                    "selected": True,
                    "quebra_gelo": ["Quebra Gelo 1"],
                    "autor": "Autor 1",
                    "descricao": "Descricao 1",
                    "icon": "Icon 1",
                }
            ]
        )

        login = "test_user"
        result = await listar_agents_disponiveis(login)

        assert len(result) == 1
        assert result[0].labelAgente == "Agent1"
        assert result[0].valueAgente == "Value1"
        assert result[0].selected is True
        assert result[0].quebraGelo == ["Quebra Gelo 1"]
        assert result[0].autor == "Autor 1"
        assert result[0].descricao == "Descricao 1"
        assert result[0].icon == "Icon 1"

    @pytest.mark.asyncio
    @patch("src.service.agent_service.AgentMongo")
    async def test_inserir_agent(self, mock_agent_mongo):
        mock_agent_mongo.inserir_agent = AsyncMock(
            return_value={
                "label_agente": "Agent1",
                "value_agente": "Value1",
                "selected": True,
                "quebra_gelo": ["Quebra Gelo 1"],
                "autor": "Autor 1",
                "descricao": "Descricao 1",
                "icon": "Icon 1",
            }
        )

        agent = AgentConfig(
            labelAgente="Agent1",
            valueAgente="Value1",
            selected=True,
            quebraGelo=["Quebra Gelo 1"],
            autor="Autor 1",
            descricao="Descricao 1",
            icon="Icon 1",
        )
        login = "test_user"
        result = await inserir_agent(agent, login)

        assert result["label_agente"] == "Agent1"
        assert result["value_agente"] == "Value1"
        assert result["selected"] is True
        assert result["quebra_gelo"] == ["Quebra Gelo 1"]
        assert result["autor"] == "Autor 1"
        assert result["descricao"] == "Descricao 1"
        assert result["icon"] == "Icon 1"
