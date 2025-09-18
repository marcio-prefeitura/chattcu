import random
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from langchain_core.callbacks import AsyncCallbackManagerForRetrieverRun
from langchain_openai import OpenAI
from langchain_openai.embeddings.azure import AzureOpenAIEmbeddings

from src.domain.llm.retriever.normas_retriever import NormasRetriever
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.tipo_busca_enum import TipoBuscaEnum
from tests.util.mock_objects import AsyncIterator, MockObjects


@pytest.mark.asyncio
class TestNormasRetriever:

    @pytest.fixture
    def normas_retriever(self):
        roles = ["adm", "teste"]
        return NormasRetriever(
            system_message=MockObjects.mock_mensagem,
            login="teste",
            llm=OpenAI(),
            usr_roles=roles,
            prompt_usuario="teste_prompt",
        )

    @pytest.fixture
    def mock_cognitive_search(self):
        with patch(
            "src.infrastructure.cognitive_search.cognitive_search.CognitiveSearch",
            new_callable=AsyncMock,
        ) as mock:
            yield mock

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

    async def test_set_system_message(self, normas_retriever):
        message = MockObjects.mock_mensagem
        normas_retriever.set_system_message(message)
        assert normas_retriever.system_message == message

    async def test_set_usr_roles(self, normas_retriever):
        roles = ["role1", "role2"]
        normas_retriever.set_usr_roles(roles)
        assert normas_retriever.usr_roles == roles

    async def test_set_prompt_usuario(self, normas_retriever):
        prompt = "Test prompt"
        normas_retriever.set_prompt_usuario(prompt)
        assert normas_retriever.prompt_usuario == prompt

    async def test_set_llm(self, normas_retriever):
        llm = AsyncMock()
        normas_retriever.set_llm(llm)
        assert normas_retriever.llm == llm

    @pytest.mark.asyncio
    @patch(
        "src.infrastructure.cognitive_search.cognitive_search.CognitiveSearch.buscar_trechos_relevantes",
        new_callable=AsyncMock,
    )
    async def test_processar(
        self, mock_buscar_trechos_relevantes, normas_retriever, _ainvoke, _aembed_query
    ):
        rd = random.Random()
        mock_response = [
            {
                "titulo": "Titulo Teste",
                "linkPesquisaIntegrada": "publico_alvo.com",
                "trecho": "trecho teste",
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
        resposta = await normas_retriever._aget_relevant_documents(
            "teste", run_manager=run
        )
        assert resposta[0].page_content == (
            "Titulo Teste_1; linkPesquisaIntegrada: publico_alvo.com; trecho: trecho "
            "teste"
        )
        assert normas_retriever.system_message.trechos[0].conteudo == "trecho teste"
        assert (
            normas_retriever.system_message.parametro_tipo_busca == TipoBuscaEnum.BM25
        )
        assert (
            normas_retriever.system_message.parametro_nome_indice_busca
            == NomeIndiceEnum.NORMATIVOS
        )
        assert (
            normas_retriever.system_message.parametro_quantidade_trechos_relevantes_busca
            is None
        )
