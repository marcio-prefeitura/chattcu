from unittest.mock import AsyncMock, patch

import pytest
from bson import ObjectId

from src.domain.schemas import ChatOut, CompartilhamentoOut
from src.infrastructure.mongo.compatilhamento_mongo import CompartilhamentoMongo


@pytest.mark.asyncio
class TestCompartilhamentoMongo:

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_criar_indice_colecao(self, mock_get_collection):
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.__getitem__.return_value = mock_collection
        mock_get_collection.return_value = mock_db
        CompartilhamentoMongo.db = mock_db
        CompartilhamentoMongo.collection_name = "test_collection"

        await CompartilhamentoMongo._criar_indice_colecao()
        mock_db.command.assert_called_once()
        mock_collection.index_information.assert_called_once()

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_inserir_compartilhamento(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        compartilhamento = CompartilhamentoOut(
            id="",
            arquivos=[],
            data_compartilhamento=None,
            st_removido=False,
            usuario="test_user",
            chat=ChatOut(
                id="chat_id",
                titulo="chat_title",
                usuario="chat_user",
                fixado=False,
                arquivado=False,
                mensagens=[],
            ),
        )

        result = await CompartilhamentoMongo.inserir_compartilhamento(compartilhamento)
        mock_collection.insert_one.assert_called_once()
        assert result.id is not None

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_atualizar_compartilhamento(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        novo_chat = ChatOut(
            id="new_chat_id",
            titulo="new_chat_title",
            usuario="new_chat_user",
            fixado=False,
            arquivado=False,
            mensagens=[],
        )

        valid_object_id = str(ObjectId())
        mock_collection.update_one.return_value.modified_count = 1
        result = await CompartilhamentoMongo.atualizar_compartilhamento(
            valid_object_id, novo_chat
        )
        mock_collection.update_one.assert_called_once()
        assert result is True

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_atualizar_compartilhamento_zero_modified_count(
        self, mock_get_collection
    ):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        novo_chat = ChatOut(
            id="new_chat_id",
            titulo="new_chat_title",
            usuario="new_chat_user",
            fixado=False,
            arquivado=False,
            mensagens=[],
        )

        valid_object_id = str(ObjectId())
        mock_collection.update_one.return_value.modified_count = 0
        result = await CompartilhamentoMongo.atualizar_compartilhamento(
            valid_object_id, novo_chat
        )
        mock_collection.update_one.assert_called_once()
        assert result is True

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_busca_por_id(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.find_one.return_value = {
            "_id": ObjectId(),
            "arquivos": [],
            "data_compartilhamento": None,
            "st_removido": False,
            "usuario": "test_user",
            "chat": {
                "id_chat": "chat_id",
                "titulo": "chat_title",
                "usuario": "chat_user",
                "mensagens": [],
            },
        }
        valid_object_id = str(ObjectId())
        result = await CompartilhamentoMongo.busca_por_id(valid_object_id, "test_user")
        assert result is not None

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_busca_por_chat_id(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.find_one.return_value = {
            "_id": ObjectId(),
            "arquivos": [],
            "data_compartilhamento": None,
            "st_removido": False,
            "usuario": "test_user",
            "chat": {
                "id_chat": "chat_id",
                "titulo": "chat_title",
                "usuario": "chat_user",
                "mensagens": [],
            },
        }

        result = await CompartilhamentoMongo.busca_por_chat_id("chat_id", "test_user")
        assert result is not None

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_listar_compartilhados_por_usuario(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.find.return_value.to_list.return_value = []

        result = await CompartilhamentoMongo.listar_compartilhados_por_usuario(
            "test_user"
        )
        assert result is not None

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_listar_compartilhados_por_destinatarios(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.find.return_value.to_list.return_value = []

        result = await CompartilhamentoMongo.listar_compartilhados_por_destinatarios(
            ["dest1", "dest2"]
        )
        assert result is not None

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_listar_tudo(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.find.return_value.to_list.return_value = []

        result = await CompartilhamentoMongo.listar_tudo()
        assert result is not None

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_remover(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        valid_object_id = str(ObjectId())
        await CompartilhamentoMongo.remover(valid_object_id, "test_user")
        mock_collection.update_one.assert_called_once()

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_remover_por_chat_id(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection

        await CompartilhamentoMongo.remover_por_chat_id("chat_id", "test_user")
        mock_collection.update_many.assert_called_once()

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_remover_todos_enviados(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection

        await CompartilhamentoMongo.remover_todos_enviados("test_user")
        mock_collection.update_many.assert_called_once()

    @patch(
        "src.infrastructure.mongo.compatilhamento_mongo.mongo.Mongo.get_collection",
        new_callable=AsyncMock,
    )
    async def test_remover_todos_enviados_por_chats_ids(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection

        await CompartilhamentoMongo.remover_todos_enviados_por_chats_ids(
            "test_user", ["chat_id1", "chat_id2"]
        )
        mock_collection.update_many.assert_called_once()
