import unittest
from unittest.mock import AsyncMock, patch

from src.exceptions import MongoException
from src.infrastructure.mongo.categoria_mongo import CategoriaMongo


class TestCategoriaMongo(unittest.IsolatedAsyncioTestCase):

    @patch("src.infrastructure.mongo.categoria_mongo.CategoriaMongo.get_collection")
    async def test_get_categoria(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.find_one.return_value = {
            "_id": "123",
            "nome": "Categoria Teste",
        }

        categoria = await CategoriaMongo.get_categoria("Categoria Teste")
        self.assertIsNotNone(categoria)
        self.assertEqual(categoria.id, "123")
        self.assertEqual(categoria.nome, "Categoria Teste")

    @patch("src.infrastructure.mongo.categoria_mongo.CategoriaMongo.db")
    async def test_criar_indice_colecao(self, mock_db):
        mock_collection = AsyncMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_collection.index_information.return_value = [
            {"name": "_id_1"},
            {"name": "_id_2"},
        ]
        mock_db.command = AsyncMock()

        await CategoriaMongo._criar_indice_colecao()
        mock_db.command.assert_called_once()
        mock_collection.index_information.assert_called_once()

    @patch("src.infrastructure.mongo.categoria_mongo.CategoriaMongo.db", None)
    async def test_criar_indice_colecao_fail(self):
        with self.assertRaises(MongoException):
            await CategoriaMongo._criar_indice_colecao()


if __name__ == "__main__":
    unittest.main()
