import unittest
from unittest.mock import AsyncMock, patch

from src.domain.schemas import FiltrosEspecialistas, PaginatedEspecialistResponse
from src.domain.store import Categoria, Especialista, TotalEspecialistasPorCategoria
from src.service.store_service import (
    contador_especialistas_por_categoria,
    inserir_especialista,
    listar_categorias_disponiveis,
    listar_especialistas_por,
)


class TestStoreService(unittest.IsolatedAsyncioTestCase):

    @patch("src.service.store_service.EspecialistaMongo.listar_especialistas_por")
    @patch("src.service.store_service.EspecialistaMongo.total_especialistas_por")
    async def test_listar_especialistas_por(
        self, mock_total_especialistas_por, mock_listar_especialistas_por
    ):
        mock_listar_especialistas_por.return_value = [
            {
                "label": "Test",
                "value": "Test Value",
                "selected": False,
                "quebra_gelo": ["Test Quebra Gelo"],
                "autor": "Test Autor",
                "descricao": "Test Descricao",
                "icon": "Test Icon",
                "instrucoes": "Test Instrucoes",
                "categoria": {"nome": "Test Categoria"},
            }
        ]
        mock_total_especialistas_por.return_value = 1

        filtros = FiltrosEspecialistas(
            categoria=None, usuario_logado=None, page=1, per_page=10
        )
        response = await listar_especialistas_por("Test Login", filtros)

        self.assertEqual(response.total, 1)
        self.assertEqual(len(response.especialistas), 1)
        self.assertEqual(response.especialistas[0].label, "Test")

    @patch("src.service.store_service.EspecialistaMongo.inserir_especialista")
    async def test_inserir_especialista(self, mock_inserir_especialista):
        mock_inserir_especialista.return_value = Especialista(
            id="123",
            label="Test",
            value="Test Value",
            quebra_gelo=["Test Quebra Gelo"],
            autor="Test Autor",
            descricao="Test Descricao",
            icon="Test Icon",
            categoria=Categoria(nome="Test Categoria"),
        )

        especialista = Especialista(
            label="Test",
            value="Test Value",
            quebra_gelo=["Test Quebra Gelo"],
            autor="Test Autor",
            descricao="Test Descricao",
            icon="Test Icon",
            categoria=Categoria(nome="Test Categoria"),
        )

        result = await inserir_especialista(especialista, "Test Login")
        self.assertIsNotNone(result.id)
        self.assertEqual(result.id, "123")

    @patch("src.service.store_service.CategoriaMongo.listar_categorias_disponiveis")
    async def test_listar_categorias_disponiveis(
        self, mock_listar_categorias_disponiveis
    ):
        mock_listar_categorias_disponiveis.return_value = [
            {"id_": "1", "nome": "Categoria Teste"}
        ]

        result = await listar_categorias_disponiveis("Test Login")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].nome, "Categoria Teste")

    @patch(
        "src.service.store_service.EspecialistaMongo.obter_contador_especialistas_por_categoria"
    )
    @patch(
        "src.service.store_service.EspecialistaMongo.obter_contador_especialistas_usuario_logado"
    )
    async def test_contador_especialistas_por_categoria(
        self,
        mock_obter_contador_especialistas_usuario_logado,
        mock_obter_contador_especialistas_por_categoria,
    ):
        mock_obter_contador_especialistas_por_categoria.return_value = [
            {"_id": "Categoria Teste", "total_especialistas": 10}
        ]
        mock_obter_contador_especialistas_usuario_logado.return_value = [
            {"_id": "Meus Especialistas", "total_especialistas": 5}
        ]

        result = await contador_especialistas_por_categoria("Test Login")
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].categoria, "Categoria Teste")
        self.assertEqual(result[0].total, 10)
        self.assertEqual(result[1].categoria, "Meus Especialistas")
        self.assertEqual(result[1].total, 5)


if __name__ == "__main__":
    unittest.main()
