from unittest.mock import MagicMock, patch

import pytest

from src.domain.enum.type_tools_enum import TypeToolsEnum
from src.domain.llm.rag.retriever_relevant_documents_factory import (
    RetrieverRelevantDocumentsFactory,
)
from src.domain.llm.retriever.adm_search_retriever import AdmSearchRetriever
from src.domain.llm.retriever.jurisprudencia_selecionada_search_retriever import (
    JurisprudenciaSearchRetriever,
)
from src.domain.llm.retriever.normas_retriever import NormasRetriever
from src.domain.llm.tools.sumarizador import Sumarizador
from tests.util.mock_objects import MockObjects


class TestRetrieverRelevantDocumentsFactory:

    @pytest.fixture
    def instance(self):
        mock_instance = MagicMock()
        mock_instance._get_llm.return_value = MagicMock()
        mock_instance.token.roles = ["role1", "role2"]
        mock_instance.token.login = "test_user"
        mock_instance.msg = MockObjects.mock_mensagem
        mock_instance.prompt_usuario = "Test prompt"
        return mock_instance

    @pytest.fixture
    def prompt_usuario(self):
        return MockObjects.mock_chat_new_gpt_input

    def test_create_retriever_jurisprudencia(self, instance, prompt_usuario):
        retriver = RetrieverRelevantDocumentsFactory.create_retriever(
            TypeToolsEnum.JURISPRUDENCIA.value, prompt_usuario, instance
        )
        assert isinstance(retriver, JurisprudenciaSearchRetriever)

    def test_create_retriever_administrativa(self, instance, prompt_usuario):
        retriver = RetrieverRelevantDocumentsFactory.create_retriever(
            TypeToolsEnum.ADMINISTRATIVA.value, prompt_usuario, instance
        )
        assert isinstance(retriver, AdmSearchRetriever)

    def test_create_retriever_sumarizacao(
        self,
        instance,
        prompt_usuario,
    ):
        retriver = RetrieverRelevantDocumentsFactory.create_retriever(
            TypeToolsEnum.SUMARIZACAO.value, prompt_usuario, instance
        )
        assert isinstance(retriver, Sumarizador)

    def test_create_retriever_norma(self, instance, prompt_usuario):
        retriver = RetrieverRelevantDocumentsFactory.create_retriever(
            TypeToolsEnum.NORMA.value, prompt_usuario, instance
        )
        assert isinstance(retriver, NormasRetriever)

    def test_create_retriever_unknown_tool(self, instance, prompt_usuario):
        with pytest.raises(ValueError, match="Unknown tool retriever: UNKNOWN_TOOL"):
            RetrieverRelevantDocumentsFactory.create_retriever(
                "UNKNOWN_TOOL", prompt_usuario, instance
            )
