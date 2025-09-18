# tests/service/test_agent_mongo.py
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.domain.agent_config import AgentConfig
from src.exceptions import MongoException
from src.infrastructure.mongo.agent_mongo import AgentMongo


class TestAgentMongo:

    @pytest.mark.asyncio
    @patch("src.infrastructure.mongo.agent_mongo.AgentMongo.get_collection")
    async def test_listar_agents_disponiveis(self, mock_get_collection):
        mock_collection = MagicMock()
        mock_get_collection.return_value = mock_collection
        mock_query = MagicMock()
        mock_query.to_list = AsyncMock(
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
        mock_collection.find.return_value = mock_query

        result = await AgentMongo.listar_agents_disponiveis()

        assert len(result) == 1
        assert result[0]["label_agente"] == "Agent1"
        assert result[0]["value_agente"] == "Value1"
        assert result[0]["selected"] is True
        assert result[0]["quebra_gelo"] == ["Quebra Gelo 1"]
        assert result[0]["autor"] == "Autor 1"
        assert result[0]["descricao"] == "Descricao 1"
        assert result[0]["icon"] == "Icon 1"

    @pytest.mark.asyncio
    @patch("src.infrastructure.mongo.agent_mongo.AgentMongo.get_collection")
    async def test_inserir_agent(self, mock_get_collection):
        mock_collection = MagicMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="12345")
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

        result = await AgentMongo.inserir_agent(agent)

        assert result.id == "12345"
        assert result.labelAgente == "Agent1"
        assert result.valueAgente == "Value1"
        assert result.selected is True
        assert result.quebraGelo == ["Quebra Gelo 1"]
        assert result.autor == "Autor 1"
        assert result.descricao == "Descricao 1"
        assert result.icon == "Icon 1"

    @pytest.mark.asyncio
    @patch("src.infrastructure.mongo.agent_mongo.AgentMongo.db")
    async def test_criar_indice_colecao(self, mock_db):
        # Mock the collection and its methods
        mock_collection = AsyncMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_db.command = AsyncMock()

        # Call the method
        await AgentMongo._criar_indice_colecao()

        # Check if the command to create indexes was called with the correct parameters
        mock_db.command.assert_called_once_with(
            {
                "customAction": "UpdateCollection",
                "collection": AgentMongo.collection_name,
                "indexes": [
                    {"key": {"_id": 1}, "name": "_id_1"},
                    {"key": {"valueAgente": 2}, "name": "_id_2"},
                ],
            }
        )

        # Check if the index information was retrieved
        mock_collection.index_information.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.infrastructure.mongo.agent_mongo.AgentMongo.db", None)
    async def test_criar_indice_colecao_falha(self):
        with pytest.raises(MongoException):
            await AgentMongo._criar_indice_colecao()

    @pytest.mark.asyncio
    @patch("src.infrastructure.mongo.agent_mongo.AgentMongo.get_collection")
    async def test_listar_agents_disponiveis_falha(self, mock_get_collection):
        mock_get_collection.side_effect = Exception("Erro ao listar agentes")

        result = await AgentMongo.listar_agents_disponiveis()

        assert result == []
