import pytest
from azure.search.documents.aio import SearchClient
from langchain_openai.embeddings.azure import AzureOpenAIEmbeddings

from src.domain.llm.base.llm_base import LLMBase
from src.infrastructure.mongo.upload_mongo import UploadMongo


class TestRagDocumentos:

    @pytest.fixture
    def _busca_por_id(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(UploadMongo, "busca_por_id", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _search(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(SearchClient, "search", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _aembed_query(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(AzureOpenAIEmbeddings, "aembed_query", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _get_response(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(LLMBase, "_get_response", mock)

        yield mock
        mocker.stopall()

    # @TODO ajustar e descomentar
    # @pytest.mark.asyncio
    # async def test_buscar_docs_relevantes(self, _busca_por_id, _search, _aembed_query):
    #     rag_documentos = RAGDocumentos(
    #         token_usr=Token(raw_token=MockObjects.mock_raw_token),
    #         index_name="index_name_teste",
    #         chunk_size=1,
    #         temperature=10,
    #     )
    #     mock_resp = {
    #         "pagina_inicial": "1",
    #         "pagina_final": 2,
    #         "pergunta": "Qual teste ?",
    #     }
    #     _busca_por_id.return_value = MockObjects.mock_item_sistema
    #     _busca_por_id.return_value.nome_blob = "Teste"
    #     mock_gpt_input = MockObjects.mock_chat_gpt_input
    #     mock_gpt_input.arquivos_selecionados_prontos = ["Teste"]
    #     _aembed_query.return_value = [1, 2, 3]

    #     mock_doc = {
    #         "id": "Teste-123",
    #         "pagina_arquivo": 1,
    #         "numero_pagina": 1,
    #         "trecho": "Teste de trecho",
    #         "tamanho_trecho": 10,
    #         "@search.score": 1,
    #     }
    #     _search.return_value = mock_objects.AsyncIterator([mock_doc])

    #     resposta = await rag_documentos._buscar_docs_relevantes(
    #         mock_gpt_input, mock_resp
    #     )
    #     assert (
    #         resposta["content"]
    #         == "Arquivo Nome Teste - página 1 - número do trecho 123: Teste de trecho"
    #     )
    #     assert (
    #         resposta["trechos"][0].id_registro
    #         == "Arquivo Nome Teste - página 1 - número do trecho 123"
    #     )

    # @pytest.mark.asyncio
    # async def test_prepara_prompt(
    #     self, _get_response, _busca_por_id, _search, _aembed_query
    # ):
    #     _busca_por_id.return_value = MockObjects.mock_item_sistema
    #     _busca_por_id.return_value.nome_blob = "Teste"
    #     mock_gpt_input = MockObjects.mock_chat_gpt_input
    #     mock_gpt_input.arquivos_selecionados_prontos = ["Teste"]
    #     _aembed_query.return_value = [1, 2, 3]
    #     mock_doc = {
    #         "id": "Teste-123",
    #         "pagina_arquivo": 1,
    #         "numero_pagina": 1,
    #         "trecho": "Teste de trecho",
    #         "tamanho_trecho": 10,
    #         "@search.score": 1,
    #     }
    #     _search.return_value = mock_objects.AsyncIterator([mock_doc])
    #     rag_documentos = RAGDocumentos(
    #         token_usr=Token(raw_token=MockObjects.mock_raw_token),
    #         index_name="index_name_teste",
    #         chunk_size=1,
    #         temperature=10,
    #     )
    #     mock_gpt_input = MockObjects.mock_chat_gpt_input
    #     mock_gpt_input.arquivos_selecionados_prontos = ["Teste"]
    #     _get_response.return_value = "Teste"
    #     resposta = await rag_documentos._prepara_prompt(mock_gpt_input)
    #     assert resposta.conteudo == mock_msg_rag_documentos
    #     assert rag_documentos.prompt == mock_prompt_rag_documentos
