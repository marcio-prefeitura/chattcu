from unittest.mock import AsyncMock, patch

import pytest
from motor.motor_asyncio import AsyncIOMotorClient

from src.conf.env import configs
from src.infrastructure.mongo.mongo import Mongo


@pytest.mark.asyncio
class TestMongo:
    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        self.mock_client = AsyncMock(spec=AsyncIOMotorClient)
        self.mock_db = AsyncMock()
        self.mock_collection = AsyncMock()
        self.mock_client.__getitem__.return_value = self.mock_db
        self.mock_db.__getitem__.return_value = self.mock_collection

    @pytest.mark.asyncio
    @patch("src.infrastructure.mongo.mongo.AsyncIOMotorClient", new_callable=AsyncMock)
    async def test_conectar(self, mock_motor_client):
        mock_instance = AsyncMock()
        mock_motor_client.return_value = mock_instance

        await Mongo.conectar()

        mock_motor_client.assert_called_once_with(
            configs.AZURE_COSMOS_CONNECT_STR,
            maxConnecting=15,
            minPoolSize=10,
            maxPoolSize=200,
            waitQueueTimeoutMS=100,
            maxIdleTimeMS=1000 * 60 * 1,
        )

        assert await Mongo.client == mock_instance

    async def test_fechar_conexao(self):
        Mongo.client = self.mock_client

        await Mongo.fechar_conexao()

        self.mock_client.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_database_existing_db(self):
        mock_client = AsyncMock()
        mock_client.list_database_names.return_value = ["existing_db"]
        mock_db = AsyncMock()
        mock_db.command = AsyncMock(return_value={"ok": 1})

        mock_client.__getitem__.return_value = mock_db
        Mongo.client = mock_client

        db = await Mongo._get_database("existing_db")

        mock_client.list_database_names.assert_awaited_once()
        mock_client.__getitem__.assert_called_once_with("existing_db")
        assert db == mock_db

    @pytest.mark.asyncio
    @patch(
        "src.infrastructure.mongo.mongo.Mongo._criar_colecao", new_callable=AsyncMock
    )
    async def test_get_database_new_db(self, mock_criar_colecao):
        mock_client = AsyncMock()
        mock_client.list_database_names.return_value = []
        mock_db = AsyncMock()
        mock_db.command = AsyncMock(return_value={"ok": 1})

        mock_client.__getitem__.return_value = mock_db
        Mongo.client = mock_client

        db = await Mongo._get_database("new_db")

        mock_client.list_database_names.assert_awaited_once()
        mock_client.__getitem__.assert_called_once_with("new_db")
        mock_db.command.assert_awaited_once_with(
            {"customAction": "CreateDatabase", "offerThroughput": 400}
        )

        mock_criar_colecao.assert_awaited_once()

        assert db == mock_db

    async def test_get_collection_existing(self):
        Mongo.client = self.mock_client
        Mongo.db = self.mock_db

        collection = await Mongo.get_collection("test_db", "test_collection")

        assert collection == self.mock_collection
        assert Mongo.db_name == "test_db"
        assert Mongo.collection_name == "test_collection"

    @patch(
        "src.infrastructure.mongo.mongo.Mongo._criar_indice_colecao",
        new_callable=AsyncMock,
    )
    async def test_criar_colecao_new_collection(self, mock_criar_indice):
        Mongo.client = self.mock_client
        Mongo.db = self.mock_db
        self.mock_db.list_collection_names.return_value = []

        await Mongo._criar_colecao()

        self.mock_db.command.assert_called_once_with(
            {"customAction": "CreateCollection", "collection": Mongo.collection_name}
        )
        mock_criar_indice.assert_called_once()

    async def test_criar_colecao_existing_collection(self):
        Mongo.client = self.mock_client
        Mongo.db = self.mock_db
        self.mock_db.list_collection_names.return_value = ["existing_collection"]
        Mongo.collection_name = "existing_collection"

        await Mongo._criar_colecao()

        self.mock_db.command.assert_not_called()
