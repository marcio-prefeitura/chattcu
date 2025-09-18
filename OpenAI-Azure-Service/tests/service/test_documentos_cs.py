from tempfile import SpooledTemporaryFile
from unittest.mock import AsyncMock

import pytest
from langchain.schema import Document

from src.infrastructure.cognitive_search.documentos_cs import DocumentoCS
from src.infrastructure.security_tokens import DecodedToken


class TestDocumentosCs:
    @pytest.fixture
    def mock_documento_cs(self):
        return DocumentoCS(index_name="test_index", chunk_size=1000, chunk_overlap=200)

    @pytest.mark.asyncio
    async def test_verifica_existencia_documento(self, mock_documento_cs):
        class AsyncIterator:
            def __init__(self, items):
                self.items = items
                self.index = 0

            def __aiter__(self):
                return self

            async def __anext__(self):
                if self.index >= len(self.items):
                    raise StopAsyncIteration
                item = self.items[self.index]
                self.index += 1
                return item

        mock_documento_cs.buscar_trechos_relevantes = AsyncMock(
            return_value=AsyncIterator([])
        )
        result = await mock_documento_cs.verifica_existencia_documento("test_filename")
        assert result is False

    @pytest.mark.asyncio
    async def test_persiste_documentos(self, mock_documento_cs):
        mock_documento_cs.verifica_existencia_documento = AsyncMock(return_value=False)
        mock_documento_cs.__trigger_azure_func = AsyncMock()
        mock_documento_cs.__get_azure_func_status = AsyncMock()
        mock_documento_cs.__criar_secoes = AsyncMock()
        mock_documento_cs.__text_spliter = AsyncMock(return_value=["page1", "page2"])
        mock_documento_cs._popular_indice = AsyncMock()
        mock_documento_cs._get_embeddings = AsyncMock()

        content_bytes = SpooledTemporaryFile()
        token = DecodedToken(
            login="test_user",
            roles=["DESENVOLVEDOR"],
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )

        await mock_documento_cs.persiste_documentos(
            real_filename="test_real_filename",
            user_filename="test_user_filename",
            content_bytes=content_bytes,
            extensao=".txt",
            token=token,
        )
        mock_documento_cs._popular_indice.assert_called_once()

    @pytest.mark.asyncio
    async def test_text_spliter_none_pages(self, mock_documento_cs):
        result = await mock_documento_cs._DocumentoCS__text_spliter(None)
        assert result == []

    @pytest.mark.asyncio
    async def test_text_spliter_valid_pages(self, mock_documento_cs):
        pages = [
            Document(
                page_content="This is page 1", metadata={"source": "test", "page": 1}
            ),
            Document(
                page_content="This is page 2", metadata={"source": "test", "page": 2}
            ),
        ]
        result = await mock_documento_cs._DocumentoCS__text_spliter(pages)
        assert len(result) > 0
        assert all(isinstance(trecho, Document) for trecho in result)
