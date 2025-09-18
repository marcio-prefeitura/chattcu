import unittest
from datetime import datetime
from unittest.mock import AsyncMock, patch

from src.domain.schemas import FiltrosEspecialistas
from src.domain.store import Especialista
from src.exceptions import MongoException
from src.infrastructure.mongo.especialista_mongo import EspecialistaMongo


class TestEspecialistaMongo(unittest.IsolatedAsyncioTestCase):

    @patch("src.infrastructure.mongo.especialista_mongo.EspecialistaMongo.db")
    async def test_criar_indice_colecao(self, mock_db):
        mock_collection = AsyncMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_collection.index_information.return_value = [
            {"name": "_id_1"},
            {"name": "_id_2"},
        ]
        mock_db.command = AsyncMock()

        await EspecialistaMongo._criar_indice_colecao()
        mock_db.command.assert_called_once()
        mock_collection.index_information.assert_called_once()

    @patch("src.infrastructure.mongo.especialista_mongo.EspecialistaMongo.db", None)
    async def test_criar_indice_colecao_fail(self):
        with self.assertRaises(MongoException):
            await EspecialistaMongo._criar_indice_colecao()

    @patch(
        "src.infrastructure.mongo.especialista_mongo.EspecialistaMongo.get_collection"
    )
    async def test_inserir_especialista(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.insert_one.return_value.inserted_id = "123"

        especialista = Especialista(
            label="Test",
            value="Test Value",
            quebra_gelo=["Test Quebra Gelo"],
            autor="Test Autor",
            descricao="Test Descricao",
            icon="Test Icon",
            categoria=None,
        )

        result = await EspecialistaMongo.inserir_especialista(especialista)
        self.assertIsNotNone(result.id)
        self.assertEqual(result.id, "123")

    @patch(
        "src.infrastructure.mongo.especialista_mongo.EspecialistaMongo.get_collection"
    )
    async def test_total_especialistas_por(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.count_documents.return_value = 5

        filtros = FiltrosEspecialistas(
            categoria=None, usuario_logado=None, page=1, per_page=10
        )
        total = await EspecialistaMongo.total_especialistas_por(filtros)
        self.assertEqual(total, 5)


if __name__ == "__main__":
    unittest.main()
