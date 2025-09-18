from unittest.mock import AsyncMock, patch

import pytest

from src.domain.llm.base.document_process_utils import DocumentProcessUtils
from src.domain.schemas import ChatGptInput, ItemSistema
from src.infrastructure.cognitive_search.documentos_cs import DocumentoCS
from src.infrastructure.mongo.upload_mongo import UploadMongo


class TestDocumentProcessUtils:

    @pytest.fixture
    def setup(self):
        self.utils = DocumentProcessUtils()
        self.chatinput = ChatGptInput(
            arquivos_selecionados_prontos=["doc1", "doc2"],
            prompt_usuario="Teste prompt",
        )
        self.docs_sel = [
            ItemSistema(
                id="doc1_id",
                nome="Doc1",
                nome_blob="doc1_blob",
                usuario="Teste usuário 1",
            ),
            ItemSistema(
                id="doc2_id",
                nome="Doc2",
                nome_blob="doc2_blob",
                usuario="Teste usuário 2",
            ),
        ]
        self.resp = {
            "pergunta": "Sample question",
            "pagina_inicial": 1,
            "pagina_final": 2,
        }

    @pytest.mark.asyncio
    @patch.object(UploadMongo, "busca_por_id", new_callable=AsyncMock)
    async def test_find_documentos_utilizados(
        self, mock_busca_por_id, decoded_token, setup
    ):
        # Configura o mock para retornar documentos válidos
        mock_busca_por_id.side_effect = self.docs_sel

        docs_sel = await self.utils._find_documentos_utilizados(
            self.chatinput, decoded_token
        )

        assert docs_sel == self.docs_sel
        assert mock_busca_por_id.call_count == len(
            self.chatinput.arquivos_selecionados_prontos
        )
        mock_busca_por_id.assert_any_call(
            "doc1", decoded_token.login.lower(), removido=False
        )
        mock_busca_por_id.assert_any_call(
            "doc2", decoded_token.login.lower(), removido=False
        )

    @pytest.mark.asyncio
    @patch.object(DocumentoCS, "buscar_trechos_relevantes", new_callable=AsyncMock)
    async def test_find_trechos_relevantes(
        self, mock_buscar_trechos_relevantes, decoded_token, setup
    ):
        # Simula um objeto assíncrono retornado pela busca
        async def async_gen():
            yield {
                "id": "doc1_blob-1",
                "pagina_arquivo": "Page1",
                "numero_pagina": 1,
                "tamanho_trecho": 100,
                "trecho": "Sample trecho",
                "@search.score": 0.9,
            }

        mock_buscar_trechos_relevantes.return_value = async_gen()

        result = await self.utils._find_trechos_relevantes(
            decoded_token, self.docs_sel, 10, self.resp
        )

        assert "content" in result
        assert "trechos" in result
        assert len(result["trechos"]) == 1

        trecho = result["trechos"][0]
        assert trecho.id_arquivo_mongo == "doc1_id"
        assert trecho.pagina_arquivo == 1
        assert trecho.conteudo == "Sample trecho"
        assert trecho.search_score == 0.9
        assert trecho.id_registro == "Arquivo Doc1 - página 1 - número do trecho 1"

        mock_buscar_trechos_relevantes.assert_called_once()

    @pytest.mark.asyncio
    async def test_find_documentos_utilizados_doc_not_found(self, decoded_token, setup):
        # Configura o mock para lançar uma exceção quando um documento não for encontrado
        with patch.object(
            UploadMongo,
            "busca_por_id",
            side_effect=[self.docs_sel[0], None],
            new_callable=AsyncMock,
        ):
            with pytest.raises(Exception) as exc_info:
                await self.utils._find_documentos_utilizados(
                    self.chatinput, decoded_token
                )

            assert (
                str(exc_info.value)
                == "Você não possui acesso a um dos documentos selecionados!"
            )
