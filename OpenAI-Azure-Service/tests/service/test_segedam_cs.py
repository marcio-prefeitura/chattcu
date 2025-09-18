from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from azure.core.exceptions import HttpResponseError

from src.domain.schemas import ServicoSegedam
from src.infrastructure.cognitive_search.segedam_cs import SegedamCS


class MockAsyncItemPaged:
    def __init__(self, items):
        self.items = items

    def __aiter__(self):
        return self

    async def __anext__(self):
        if not self.items:
            raise StopAsyncIteration
        return self.items.pop(0)


class TestSegedamCS:

    @pytest.fixture
    def mock_configs(self):
        return MagicMock(AZURE_SEARCH_SISTEMAS_URL="http://mock-search-url")

    @pytest.fixture
    def segedam_cs(self, mock_configs):
        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.CognitiveSearch.__init__",
            return_value=None,
        ):
            instance = SegedamCS(azure_credential=MagicMock(), index_name="mock-index")
        return instance

    @pytest.mark.asyncio
    async def test_verifica_existencia_indice_true(self, segedam_cs):
        mock_index_client = AsyncMock()
        mock_index_client.get_index.return_value = None

        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.SearchIndexClient",
            return_value=mock_index_client,
        ):
            segedam_cs.azure_credential = MagicMock()
            segedam_cs.index_name = MagicMock()

            result = await segedam_cs.verifica_existencia_indice()

            assert result is True

    @pytest.mark.asyncio
    async def test_verifica_existencia_indice_false(self, segedam_cs):
        segedam_cs.azure_credential = MagicMock()
        segedam_cs.index_name = "mock-index"
        mock_index_client = AsyncMock()
        mock_index_client.get_index.side_effect = HttpResponseError("Index not found")

        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.SearchIndexClient",
            return_value=mock_index_client,
        ):
            result = await segedam_cs.verifica_existencia_indice()

        assert result is False
        mock_index_client.get_index.assert_called_once_with("mock-index")
        mock_index_client.close.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_exclui_indice(self, segedam_cs):
        mock_index_client = AsyncMock()
        mock_verifica_existencia = AsyncMock(return_value=True)
        segedam_cs.azure_credential = MagicMock()
        segedam_cs.index_name = "mock-index"

        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.SearchIndexClient",
            return_value=mock_index_client,
        ), patch.object(
            segedam_cs, "verifica_existencia_indice", mock_verifica_existencia
        ):
            await segedam_cs.exclui_indice()

        mock_verifica_existencia.assert_called_once()
        mock_index_client.delete_index.assert_called_once_with("mock-index")

    @pytest.mark.asyncio
    async def test_exclui_indice_nao_existe_indice(self, segedam_cs):
        mock_index_client = AsyncMock()
        mock_verifica_existencia = AsyncMock(return_value=False)
        segedam_cs.azure_credential = MagicMock()
        segedam_cs.index_name = "mock-index"

        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.SearchIndexClient",
            return_value=mock_index_client,
        ), patch.object(
            segedam_cs, "verifica_existencia_indice", mock_verifica_existencia
        ):
            await segedam_cs.exclui_indice()

        mock_verifica_existencia.assert_called_once()
        mock_index_client.delete_index.assert_not_called()

    @pytest.mark.asyncio
    async def test_popular_indice_sobra_igual_0(self, segedam_cs):
        mock_search_client = AsyncMock()
        mock_sections = AsyncMock()
        mock_sections.__aiter__.return_value = [{"id": "1", "conteudo": "Test"}]
        segedam_cs.azure_credential = MagicMock()
        segedam_cs.index_name = "mock-index"

        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.SearchClient",
            return_value=mock_search_client,
        ):
            await segedam_cs.popular_indice(mock_sections)

        mock_search_client.upload_documents.assert_called_once()

    @pytest.mark.asyncio
    async def test_popular_indice(self, segedam_cs):

        mock_search_client = AsyncMock()
        mock_search_client.upload_documents.return_value = [
            MagicMock(succeeded=True) for _ in range(100)
        ]

        mock_sections = AsyncMock()
        mock_sections.__aiter__.return_value = [
            {"id": str(i), "conteudo": f"Content {i}"} for i in range(1, 101)
        ]

        segedam_cs.azure_credential = MagicMock()
        segedam_cs.index_name = "mock-index"

        with patch(
            "src.infrastructure.cognitive_search.segedam_cs.SearchClient",
            return_value=mock_search_client,
        ):
            await segedam_cs.popular_indice(mock_sections)

        mock_search_client.upload_documents.assert_called_once_with(
            documents=[
                {"id": str(i), "conteudo": f"Content {i}"} for i in range(1, 101)
            ]
        )
        assert mock_search_client.upload_documents.call_count == 1

    @pytest.mark.asyncio
    async def test_obtem_ultimo_id(self, segedam_cs):
        mock_search_client = AsyncMock()
        mock_search_client.search.return_value = MockAsyncItemPaged([{"id": "123"}])

        segedam_cs.azure_credential = MagicMock()
        segedam_cs.index_name = "mock-index"

        with patch.object(
            segedam_cs, "_get_search_client", return_value=mock_search_client
        ):
            result = await segedam_cs.obtem_ultimo_id()

        assert result == 123
        mock_search_client.search.assert_called_once_with(
            "", order_by="id_num desc", top=1
        )
        mock_search_client.close.assert_called_once()

    @patch("src.infrastructure.cognitive_search.segedam_cs.SegedamCS._get_embeddings")
    @patch("src.infrastructure.cognitive_search.segedam_cs.SegedamCS.obtem_ultimo_id")
    @patch(
        "src.infrastructure.cognitive_search.segedam_cs.SegedamCS.buscar_servico_pelo_codigo"
    )
    @pytest.mark.asyncio
    async def test_create_sections_servicos(
        self,
        mock_buscar_servico_pelo_codigo,
        mock_obtem_ultimo_id,
        mock_get_embeddings,
        segedam_cs,
    ):
        segedam_cs.modelo_embeddding = "modelo"
        mock_get_embeddings.return_value.create = AsyncMock(
            return_value=[0.1, 0.2, 0.3]
        )
        mock_obtem_ultimo_id.return_value = 10
        mock_buscar_servico_pelo_codigo.return_value = None

        servicos = [
            ServicoSegedam(
                cod=1,
                descr_nome="Servico 1",
                texto_o_que_e="Descricao 1",
                texto_palavras_chave="Palavras chave 1",
                descr_categoria="Categoria 1",
                descr_subcategoria="Subcategoria 1",
                nome_sistema="Sistema 1",
                link_sistema="http://link1.com",
                texto_publico_alvo="Publico 1",
                descr_unidade_responsavel="Unidade 1",
                texto_etapas="Etapas 1",
                texto_requisitos="Requisitos 1",
                texto_como_solicitar="Como solicitar 1",
            )
        ]

        documents = [type("Document", (object,), {"page_content": "Conteudo 1"})]

        sections = [
            section
            async for section in segedam_cs.create_sections_servicos(
                servicos, documents, parcial=True
            )
        ]

        assert len(sections) == 1
        assert sections[0]["id"] == "11"
        assert sections[0]["conteudo"] == "Conteudo 1"
        assert sections[0]["codigo_servico"] == 1
        assert sections[0]["nome_servico"] == "Servico 1"
        assert sections[0]["descricao_servico"] == "Descricao 1"
        assert sections[0]["palavras_chave"] == "Palavras chave 1"
        assert sections[0]["categoria"] == "Categoria 1"
        assert sections[0]["subcategoria"] == "Subcategoria 1"
        assert sections[0]["nome_sistema"] == "Sistema 1"
        assert sections[0]["link_sistema"] == "http://link1.com"
        assert sections[0]["publico_alvo"] == "Publico 1"
        assert sections[0]["unidade_responsavel"] == "Unidade 1"
        assert sections[0]["etapas"] == "Etapas 1"
        assert sections[0]["requisitos"] == "Requisitos 1"
        assert sections[0]["como_solicitar"] == "Como solicitar 1"

    @patch(
        "src.infrastructure.cognitive_search.segedam_cs.SegedamCS._get_search_client"
    )
    @pytest.mark.asyncio
    async def test_buscar_servico_pelo_codigo(self, mock_get_search_client, segedam_cs):
        mock_search_client = AsyncMock()
        mock_get_search_client.return_value = mock_search_client
        mock_search_client.search.return_value = AsyncMock()
        mock_search_client.search.return_value.__aiter__.return_value = [
            {"id": "1", "codigo_servico": 123, "nome_servico": "Servico Teste"}
        ]

        result = await segedam_cs.buscar_servico_pelo_codigo(123)

        assert result is not None
        assert result["id"] == "1"
        assert result["codigo_servico"] == 123
        assert result["nome_servico"] == "Servico Teste"
        mock_search_client.search.assert_called_once_with(
            "", filter="codigo_servico eq 123", top=1
        )
        mock_search_client.close.assert_called_once()
