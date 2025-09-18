import random
import uuid

import pytest
from azure.search.documents.aio import SearchClient
from langchain.chains.llm import LLMChain
from langchain_community.llms.openai import OpenAI
from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain_openai.embeddings.azure import AzureOpenAIEmbeddings

from src.domain.llm.retriever.jurisprudencia_selecionada_search_retriever import (
    JurisprudenciaSearchRetriever,
)
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum
from tests.util import mock_objects
from tests.util.messages import mock_msg_juris_select_search_retriever
from tests.util.mock_objects import MockObjects


class TestJurisprudenciaSelecionadaSearchRetriever:

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
    async def test_aget_relevant_documents(self, _search, _aembed_query, _ainvoke):
        roles = ["adm", "teste"]
        rd = random.Random()
        mock_doc = {
            "numacordao": "Teste-123",
            "anoacordao": "2024",
            "colegiado": "Teste",
            "funcaoautortese": "sistema.com",
            "autortese": "publico_alvo.com",
            "trecho": "Trecho teste",
            "@search.score": 1,
            "linkPesquisaIntegrada": "link.teste.com",
        }
        _search.return_value = mock_objects.AsyncIterator([mock_doc])
        _aembed_query.return_value = [1, 2, 3]
        _ainvoke.return_value = '{ "ano_inicial":"2024", "ano_final":"2024", "autor":"autor Teste", "pergunta":"pergunta Teste"}'
        run = AsyncCallbackManagerForRetrieverRun(
            run_id=uuid.UUID(int=rd.getrandbits(128), version=4),
            handlers=[],
            inheritable_handlers=[],
        )
        juris = JurisprudenciaSearchRetriever(
            system_message=MockObjects.mock_mensagem,
            prompt_usuario="teste_prompt",
            llm=OpenAI(),
            usr_roles=roles,
        )
        resposta = await juris._aget_relevant_documents("teste", run_manager=run)
        assert resposta[0].page_content == mock_msg_juris_select_search_retriever
        assert juris.system_message.trechos[0].conteudo == "Trecho teste"
        assert juris.system_message.parametro_tipo_busca == TipoBuscaEnum.BM25
        assert juris.system_message.parametro_nome_indice_busca == NomeIndiceEnum.JURIS
        assert (
            juris.system_message.parametro_quantidade_trechos_relevantes_busca is None
        )

    @pytest.mark.asyncio
    async def test_aget_relevant_documents_JSONDecodeError(
        self, _search, _aembed_query, _ainvoke
    ):
        roles = ["adm", "teste"]
        rd = random.Random()
        mock_doc = {
            "numacordao": "Teste-123",
            "anoacordao": "2024",
            "colegiado": "Teste",
            "funcaoautortese": "sistema.com",
            "autortese": "publico_alvo.com",
            "trecho": "Trecho teste",
            "@search.score": 1,
            "linkPesquisaIntegrada": "link.teste.com",
        }
        _search.return_value = mock_objects.AsyncIterator([mock_doc])
        _aembed_query.return_value = [1, 2, 3]
        _ainvoke.return_value = '{ "ano_inicial":"2024", "ano_final":"2024", "autor":"autor Teste", "pergunta":"pergunta Teste"}'
        run = AsyncCallbackManagerForRetrieverRun(
            run_id=uuid.UUID(int=rd.getrandbits(128), version=4),
            handlers=[],
            inheritable_handlers=[],
        )
        juris = JurisprudenciaSearchRetriever(
            system_message=MockObjects.mock_mensagem,
            prompt_usuario="teste_prompt",
            llm=OpenAI(),
            usr_roles=roles,
        )
        resposta = await juris._aget_relevant_documents("teste", run_manager=run)
        assert resposta[0].page_content == mock_msg_juris_select_search_retriever
        assert juris.system_message.trechos[0].conteudo == "Trecho teste"
        assert juris.system_message.parametro_tipo_busca == TipoBuscaEnum.BM25
        assert juris.system_message.parametro_nome_indice_busca == NomeIndiceEnum.JURIS
        assert (
            juris.system_message.parametro_quantidade_trechos_relevantes_busca is None
        )
