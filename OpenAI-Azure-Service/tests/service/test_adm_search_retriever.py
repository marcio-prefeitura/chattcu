import random
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from azure.search.documents.aio import SearchClient
from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain_openai import OpenAI
from langchain_openai.embeddings.azure import AzureOpenAIEmbeddings

from src.domain.llm.retriever.adm_search_retriever import AdmSearchRetriever
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum
from tests.util.messages import mock_msg_doc_adm_search_retriever
from tests.util.mock_objects import MockObjects


class AsyncIterator:
    def __init__(self, items):
        self._items = items
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._items):
            raise StopAsyncIteration
        item = self._items[self._index]
        self._index += 1
        return item


class TestAdmSearchRetriever:

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
    def _ainvoke(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(OpenAI, "ainvoke", mock)

        yield mock
        mocker.stopall()

    @pytest.mark.asyncio
    @patch(
        "src.infrastructure.cognitive_search.cognitive_search.CognitiveSearch.buscar_trechos_relevantes",
        new_callable=AsyncMock,
    )
    async def test_aget_relevant_documents(
        self, mock_buscar_trechos_relevantes, _search, _aembed_query, _ainvoke
    ):
        roles = ["adm", "teste"]
        rd = random.Random()
        mock_response = [
            {
                "nome_servico": "Teste-123",
                "descricao_servico": "Descrição Teste",
                "como_solicitar": "ajuda.com",
                "link_sistema": "sistema.com",
                "publico_alvo": "publico_alvo.com",
                "codigo_servico": 1,
                "@search.score": 1,
            }
        ]

        mock_buscar_trechos_relevantes.return_value = AsyncIterator(mock_response)

        _aembed_query.return_value = [1, 2, 3]
        _ainvoke.return_value = '{ "ano_inicial":"2024", "ano_final":"2024", "autor":"autor Teste", "pergunta":"pergunta Teste"}'
        run = AsyncCallbackManagerForRetrieverRun(
            run_id=uuid.UUID(int=rd.getrandbits(128), version=4),
            handlers=[],
            inheritable_handlers=[],
        )
        adm = AdmSearchRetriever(
            system_message=MockObjects.mock_mensagem,
            login="teste",
            llm=OpenAI(),
            usr_roles=roles,
            prompt_usuario="teste_prompt",
        )
        resposta = await adm._aget_relevant_documents("teste", run_manager=run)
        assert resposta[0].page_content == mock_msg_doc_adm_search_retriever
        assert (
            adm.system_message.trechos[0].conteudo == mock_msg_doc_adm_search_retriever
        )
        assert adm.system_message.parametro_tipo_busca == TipoBuscaEnum.ADA
        assert adm.system_message.parametro_nome_indice_busca == NomeIndiceEnum.CASA
        assert adm.system_message.parametro_quantidade_trechos_relevantes_busca is None
