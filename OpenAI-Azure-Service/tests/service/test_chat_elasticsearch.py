from datetime import datetime
from unittest.mock import ANY, AsyncMock, patch

import pytest

from src.domain.chat import Chat, Credencial
from src.domain.schemas import ChatOut, FiltrosChat, PaginatedChatsResponse
from src.infrastructure.elasticsearch.chat_elasticsearch import ChatElasticSearch
from tests.util.mock_objects import MockObjects


class TestChatElasticSearch:
    @pytest.fixture
    def chat_elasticsearch(self):
        class MockChatElasticSearch(ChatElasticSearch):
            async def elasticsearch_query(self, tipo_query, query, req_tipo="get"):
                pass

            async def insert_ou_update_campo(self, id, objeto_dict):
                pass

        return MockChatElasticSearch()

    @pytest.fixture
    def chat_instance(self):
        return Chat(
            usuario="usuario_teste",
            titulo="Chat de Teste",
            data_criacao=datetime.now(),
            data_ultima_iteracao=datetime.now(),
            credencial=Credencial(aplicacao_origem="CHATTCU", usuario="teste"),
            mensagens=[MockObjects.mock_mensagem],
        )

    @patch("src.domain.chat.elastic_para_chat_dict")
    @pytest.mark.asyncio
    async def test_criar_novo_chat(
        self, mock_elastic_para_chat_dict, chat_elasticsearch, chat_instance
    ):
        mock_response = {"_id": "12345"}
        chat_elasticsearch.elasticsearch_query = AsyncMock(return_value=mock_response)

        resultado = await chat_elasticsearch.criar_novo_chat(chat_instance)

        chat_elasticsearch.elasticsearch_query.assert_awaited_once_with(
            "_doc", ANY, "post"
        )
        assert resultado.id == "12345"

    @patch("src.domain.chat.elastic_para_chat_dict")
    @pytest.mark.asyncio
    async def test_buscar_chat(self, mock_elastic_para_chat_dict, chat_elasticsearch):
        mock_resultado = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "chat": {
                                "titulo": "Novo Título",
                                "usuario": "usuário teste",
                                "data_ultima_iteracao": "22051993",
                                "fixado": True,
                                "arquivado": False,
                            },
                            "mensagens": [],
                        },
                        "_id": "1",
                    }
                ]
            }
        }
        mock_elastic_para_chat_dict.return_value = "mocked_chat"
        chat_elasticsearch.elasticsearch_query = AsyncMock(return_value=mock_resultado)

        resultado = await chat_elasticsearch.buscar_chat("12345", "usuario_teste")

        chat_elasticsearch.elasticsearch_query.assert_awaited_once_with("_search", ANY)
        assert resultado == ChatOut(
            id="1",
            usuario="usuário teste",
            titulo="Novo Título",
            data_ultima_iteracao="22051993",
            fixado=True,
            arquivado=False,
            mensagens=[],
            editing=False,
            deleting=False,
        )

    @pytest.mark.asyncio
    async def test_renomear(self, chat_elasticsearch):
        chat_elasticsearch.insert_ou_update_campo = AsyncMock()

        await chat_elasticsearch.renomear("12345", "Novo Título")

        chat_elasticsearch.insert_ou_update_campo.assert_awaited_once_with(
            "12345", {"chat": {"titulo": "Novo Título"}}
        )

    @pytest.mark.asyncio
    async def test_apagar_todos(self, chat_elasticsearch):
        mock_response = {"updated": 5}
        chat_elasticsearch.elasticsearch_query = AsyncMock(return_value=mock_response)

        resultado = await chat_elasticsearch.apagar_todos(
            "usuario_teste", "app_origem", ["123", "456"]
        )

        assert resultado["updated"] == 5

    @pytest.mark.asyncio
    async def test_alterna_fixar_chats_por_ids(self, chat_elasticsearch):
        mock_response = {"updated": 3}
        chat_elasticsearch.elasticsearch_query = AsyncMock(return_value=mock_response)

        resultado = await chat_elasticsearch.alterna_fixar_chats_por_ids(
            "usuario_teste", "app_origem", True, ["123", "456"]
        )

        assert resultado["updated"] == 3

    @pytest.mark.asyncio
    async def test_listar_chats_paginado(self, chat_elasticsearch):
        filtros = FiltrosChat(
            page=1, per_page=10, fixados=True, arquivados=True, searchText="Teste"
        )
        mock_response = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "chat": {
                                "titulo": "Novo Título",
                                "usuario": "usuário teste",
                                "data_ultima_iteracao": "22051993",
                                "fixado": True,
                                "arquivado": False,
                            },
                            "mensagens": [],
                        },
                        "_id": "1",
                    }
                ],
                "total": {"value": 15},
            }
        }
        chat_elasticsearch.elasticsearch_query = AsyncMock(return_value=mock_response)

        resultado = await chat_elasticsearch.listar_chats_paginado(
            "usuario_teste", "app_origem", False, filtros
        )

        assert isinstance(resultado, PaginatedChatsResponse)
        assert resultado.total == 15

    @patch("src.domain.chat.elastic_para_chat_dict")
    @pytest.mark.asyncio
    async def test_alterna_arquivar_chats_por_ids(
        self, mock_elastic_para_chat_dict, chat_elasticsearch
    ):
        mock_response = {"updated": 3}
        chat_elasticsearch.elasticsearch_query = AsyncMock(return_value=mock_response)

        resultado = await chat_elasticsearch.alterna_arquivar_chats_por_ids(
            "usuario_teste", "app_origem", True, ["123", "456"]
        )

        chat_elasticsearch.elasticsearch_query.assert_awaited_once_with(
            "_doc/_update_by_query", ANY, req_tipo="post"
        )
        assert resultado["updated"] == 3
