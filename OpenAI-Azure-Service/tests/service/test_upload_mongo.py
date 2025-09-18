import logging
from datetime import datetime
from unittest import mock
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from src.domain.schemas import ItemSistema
from src.domain.status_arquivo_enum import StatusArquivoEnum
from src.exceptions import MongoException
from src.infrastructure.mongo.upload_mongo import UploadMongo, logger


class TestUploadMongo:

    @pytest.fixture
    def mock_collection(self):
        return mock.AsyncMock(spec=Collection)

    @pytest.fixture
    def arquivo_exemplo(self):
        return ItemSistema(
            usuario="usuario_teste",
            nome_blob="nome_blob_teste",
            nome="nome_teste",
            id_pasta_pai=str(ObjectId()),
            st_arquivo=True,
        )

    @pytest.fixture
    def mock_collection_pastas(self):
        mock = MagicMock()
        mock.find = AsyncMock()
        return mock

    @pytest.fixture
    def upload_mongo_instance(self, mock_collection_pastas):
        return UploadMongo()

    @pytest.fixture
    def setup_mocks(self, mocker):
        mocker.patch.object(UploadMongo, "busca_por_id", new_callable=AsyncMock)
        mocker.patch.object(UploadMongo, "get_collection", new_callable=AsyncMock)
        mocker.patch.object(
            UploadMongo, "verifica_existencia_by_hash", new_callable=AsyncMock
        )
        mocker.patch.object(
            UploadMongo, "verifica_existencia_by_nome", new_callable=AsyncMock
        )
        mocker.patch.object(logger, "info")
        mocker.patch.object(logger, "error")

    @pytest.fixture
    def mock_mongo(self):
        return MagicMock(spec=UploadMongo)

    @pytest.mark.asyncio
    async def test_criar_indice_colecao(self):
        cls = UploadMongo
        cls.db = AsyncMock()
        cls.collection_name = "test_collection"

        collection_pastas = AsyncMock()
        cls.db.__getitem__.return_value = collection_pastas
        collection_pastas.index_information.return_value = ["_id_1", "_id_2", "_id_3"]

        with patch("logging.getLogger", return_value=logging.getLogger("test_logger")):
            await cls._criar_indice_colecao()

        cls.db.command.assert_awaited_once_with(
            {
                "customAction": "UpdateCollection",
                "collection": cls.collection_name,
                "indexes": [
                    {"key": {"_id": 1}, "name": "_id_1"},
                    {"key": {"usuario": 2}, "name": "_id_2"},
                    {"key": {"nome": 3}, "name": "_id_3"},
                ],
            }
        )

        collection_pastas.index_information.assert_awaited_once()
        cls.db.__getitem__.assert_called_with(cls.collection_name)

    @pytest.mark.asyncio
    async def test_criar_indice_colecao_db_none(self):
        cls = UploadMongo
        cls.db = None
        cls.collection_name = "test_collection"

        with pytest.raises(Exception) as context:
            await cls._criar_indice_colecao()

        assert (
            context.value.args[0]
            == f"Falha ao criar indice da collection {cls.collection_name}!"
        )

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_hash_existe(
        self, mock_collection, arquivo_exemplo
    ):
        mock_collection.find.return_value.to_list.return_value = [arquivo_exemplo]
        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_hash(arquivo_exemplo)
            assert existe is True

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_hash_nao_existe(
        self, mock_collection, arquivo_exemplo
    ):
        arquivo_exemplo.st_arquivo = False
        mock_cursor = mock.AsyncMock()
        mock_cursor.to_list.return_value = []
        mock_collection.find.return_value = mock_cursor

        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_hash(arquivo_exemplo)
            assert existe is False

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_hash_exception(
        self, mock_collection, arquivo_exemplo
    ):
        mock_collection.find.side_effect = PyMongoError("Erro no MongoDB")
        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_hash(arquivo_exemplo)
            assert existe is True

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_hash_nao_existe_log(
        self, mock_collection, arquivo_exemplo
    ):
        arquivo_exemplo.st_arquivo = False
        mock_cursor = mock.AsyncMock()
        mock_cursor.to_list.return_value = [{}]
        mock_collection.find.return_value = mock_cursor

        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_hash(arquivo_exemplo)
            assert existe is True

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_nome_existe(
        self, mock_collection, arquivo_exemplo
    ):
        documento_existente = {
            "_id": ObjectId(),
            "usuario": arquivo_exemplo.usuario,
            "nome_blob": "outro_nome_blob",
            "id_pasta_pai": ObjectId(arquivo_exemplo.id_pasta_pai),
            "st_removido": False,
        }
        mock_cursor = mock.AsyncMock()
        mock_cursor.to_list.return_value = [documento_existente]
        mock_collection.find.return_value = mock_cursor

        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_nome(arquivo_exemplo)
            assert existe is True

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_nome_nao_existe(
        self, mock_collection, arquivo_exemplo
    ):
        arquivo_exemplo.st_arquivo = False
        mock_cursor = mock.AsyncMock()
        mock_cursor.to_list.return_value = []
        mock_collection.find.return_value = mock_cursor
        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_nome(arquivo_exemplo)
            assert existe is False

    @pytest.mark.asyncio
    async def test_verifica_existencia_by_nome_exception(
        self, mock_collection, arquivo_exemplo
    ):
        mock_collection.find.side_effect = Exception("Erro simulado")
        with mock.patch.object(
            UploadMongo, "get_collection", return_value=mock_collection
        ):
            existe = await UploadMongo.verifica_existencia_by_nome(arquivo_exemplo)
            assert existe is True

    @pytest.mark.asyncio
    async def test_inserir_pasta_sucesso(self):
        cls = UploadMongo
        cls.verifica_existencia_by_nome = AsyncMock(return_value=False)
        cls.get_collection = AsyncMock()

        collection_pastas = AsyncMock()
        cls.get_collection.return_value = collection_pastas
        collection_pastas.insert_one.return_value = AsyncMock(inserted_id=ObjectId())

        pasta = ItemSistema(
            nome="Test Pasta", usuario="Test Usuario", id_pasta_pai="-1"
        )

        result = await cls.inserir_pasta(pasta)

        assert result.nome == pasta.nome
        assert result.usuario == pasta.usuario
        assert result.id is not " "

    @pytest.mark.asyncio
    async def test_inserir_pasta_sucesso_exception(self):
        UploadMongo.verifica_existencia_by_nome = AsyncMock(return_value=True)
        pasta = ItemSistema(
            nome="Pasta Existente",
            usuario="user1",
            id_pasta_pai="-1",
        )
        with pytest.raises(Exception) as context:
            await UploadMongo.inserir_pasta(pasta)
        assert (
            context.value.args[0] == "A pasta 'Pasta Existente' já existe no destino!"
        )

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.verifica_existencia_by_hash",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.verifica_existencia_by_nome",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_inserir_arquivo(
        self,
        get_collection_mock,
        verifica_existencia_by_nome_mock,
        verifica_existencia_by_hash_mock,
    ):
        verifica_existencia_by_hash_mock.return_value = False
        verifica_existencia_by_nome_mock.return_value = False
        mock_collection = MagicMock()
        get_collection_mock.return_value = mock_collection
        mock_insert_one_result = MagicMock()
        mock_insert_one_result.inserted_id = ObjectId()
        mock_collection.insert_one = AsyncMock(return_value=mock_insert_one_result)
        file = ItemSistema(
            nome="teste.txt",
            usuario="usuario_teste",
            tamanho="1024",
            tipo_midia="txt",
            id_pasta_pai="-1",
            nome_blob="teste_blob",
        )
        result = await UploadMongo.inserir_arquivo(file)
        assert result.id is not None
        assert result.nome == "teste.txt"
        assert result.usuario == "usuario_teste"
        assert result.tamanho == "1024"
        assert result.tipo_midia == "txt"
        assert result.id_pasta_pai == "-1"
        assert result.nome_blob == "teste_blob"

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.verifica_existencia_by_hash",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_inserir_arquivo_existe_por_hash(
        self, verifica_existencia_by_hash_mock
    ):
        verifica_existencia_by_hash_mock.return_value = True
        file = ItemSistema(
            nome="teste.txt",
            usuario="usuario_teste",
            tamanho="1024",
            tipo_midia="txt",
            id_pasta_pai="-1",
            nome_blob="teste_blob",
        )
        with pytest.raises(Exception) as context:
            await UploadMongo.inserir_arquivo(file)
        assert context.value.args[0] == "O arquivo 'teste.txt' já existe no destino!"

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.verifica_existencia_by_hash",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.verifica_existencia_by_nome",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_inserir_arquivo_existe_por_nome(
        self, verifica_existencia_by_nome_mock, verifica_existencia_by_hash_mock
    ):
        verifica_existencia_by_hash_mock.return_value = False
        verifica_existencia_by_nome_mock.return_value = True
        file = ItemSistema(
            nome="teste.txt",
            usuario="usuario_teste",
            tamanho="1024",
            tipo_midia="txt",
            id_pasta_pai="-1",
            nome_blob="teste_blob",
        )

        with pytest.raises(Exception) as context:
            await UploadMongo.inserir_arquivo(file)

        assert (
            context.value.args[0]
            == "Um arquivo diferente já existe no destino com o nome 'teste.txt'!"
        )

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.verifica_existencia_by_hash",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.buscar_arquivo_existente_by_hash",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_inserir_arquivo_existe_por_hash_com_nome_diferente(
        self, buscar_arquivo_existente_by_hash_mock, verifica_existencia_by_hash_mock
    ):
        verifica_existencia_by_hash_mock.return_value = True
        buscar_arquivo_existente_by_hash_mock.return_value = ItemSistema(
            nome="arquivo_existente.txt",
            usuario="usuario_teste",
            tamanho="1024",
            tipo_midia="txt",
            id_pasta_pai="-1",
            nome_blob="teste_blob",
        )
        file = ItemSistema(
            nome="novo_arquivo.txt",
            usuario="usuario_teste",
            tamanho="1024",
            tipo_midia="txt",
            id_pasta_pai="-1",
            nome_blob="teste_blob",
        )
        with pytest.raises(Exception) as context:
            await UploadMongo.inserir_arquivo(file)
        assert (
            context.value.args[0]
            == "O arquivo 'novo_arquivo.txt' já existe no destino com o nome 'arquivo_existente.txt'!"
        )

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_inserir_varios_arquivos(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection

        files = [
            ItemSistema(
                nome="file1",
                usuario="user1",
                tamanho="100",
                tipo_midia="image/png",
                id_pasta_pai="-1",
                nome_blob="blob1",
            ),
            ItemSistema(
                nome="file2",
                usuario="user1",
                tamanho="200",
                tipo_midia="image/jpeg",
                id_pasta_pai="60c72b2f9b1d8e00012b4b67",
                nome_blob="blob2",
            ),
        ]

        await UploadMongo.inserir_varios_arquivos(files)

        expected_documents = [
            {
                "nome": "file1",
                "usuario": "user1",
                "st_removido": False,
                "tamanho": "100",
                "tipo_midia": "image/png",
                "id_pasta_pai": "-1",
                "data_criacao": (datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                "st_arquivo": True,
                "nome_blob": "blob1",
                "status": StatusArquivoEnum.ARMAZENADO.value,
            },
            {
                "nome": "file2",
                "usuario": "user1",
                "st_removido": False,
                "tamanho": "200",
                "tipo_midia": "image/jpeg",
                "id_pasta_pai": ObjectId("60c72b2f9b1d8e00012b4b67"),
                "data_criacao": (datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                "st_arquivo": True,
                "nome_blob": "blob2",
                "status": StatusArquivoEnum.ARMAZENADO.value,
            },
        ]
        mock_collection.insert_many.assert_called_once_with(expected_documents)

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_inserir_varios_arquivos_exception(
        self, mock_logger, mock_get_collection
    ):
        mock_collection = AsyncMock()
        mock_collection.insert_many.side_effect = Exception("Exception")
        mock_get_collection.return_value = mock_collection

        files = [
            ItemSistema(
                nome="file1",
                usuario="user1",
                tamanho="100",
                tipo_midia="image/png",
                id_pasta_pai="-1",
                nome_blob="blob1",
            )
        ]
        await UploadMongo.inserir_varios_arquivos(files)
        mock_logger.error.assert_called()
        assert mock_logger.error.call_args_list[0].args[0].args[0] == "Exception"

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_listar_tudo(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_cursor = AsyncMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(
            return_value=[{"nome": "file1"}, {"nome": "file2"}]
        )
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_get_collection.return_value = mock_collection
        result = await UploadMongo.listar_tudo("user1", True)
        expected_query = {"usuario": "user1", "st_removido": False, "st_arquivo": True}
        mock_collection.find.assert_called_once_with(expected_query)
        assert result == [{"nome": "file1"}, {"nome": "file2"}]

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_listar_tudo_no_arquivos_flag(self, mock_get_collection):
        mock_collection = AsyncMock()
        mock_cursor = AsyncMock()
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.to_list = AsyncMock(
            return_value=[{"nome": "file1"}, {"nome": "file2"}]
        )
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_get_collection.return_value = mock_collection
        result = await UploadMongo.listar_tudo("user1", None)
        expected_query = {"usuario": "user1", "st_removido": False}
        mock_collection.find.assert_called_once_with(expected_query)
        assert result == [{"nome": "file1"}, {"nome": "file2"}]

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_listar_tudo_exception(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_collection.find.side_effect = Exception("Execption")
        mock_get_collection.return_value = mock_collection
        result = await UploadMongo.listar_tudo("user1", True)
        mock_logger.error.assert_called()
        assert (
            mock_logger.error.call_args_list[0].args[0].args[0]
            == "'coroutine' object has no attribute 'sort'"
        )
        assert result == []

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_remover_success(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.update_one = AsyncMock()
        await UploadMongo.remover("object_id_123", "user1")
        mock_logger.info.assert_called_with(
            f"Definindo pasta|arquivo (object_id_123) como removido"
        )

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_remover_exception(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.update_one.side_effect = Exception("Exception")
        object_id = ObjectId()
        await UploadMongo.remover(str(object_id), "user1")
        mock_logger.error.assert_called()
        assert mock_logger.error.call_args_list[0].args[0].args[0] == "Exception"

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_remover_varios_success(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.update_many = AsyncMock()
        ids = [str(ObjectId()), str(ObjectId())]
        await UploadMongo.remover_varios(ids, "user1")
        expected_filter = {
            "_id": {"$in": [ObjectId(id) for id in ids]},
            "usuario": "user1",
        }
        expected_update = {"$set": {"st_removido": True}}
        mock_collection.update_many.assert_awaited_once_with(
            expected_filter, expected_update
        )
        mock_logger.info.assert_called_with(
            f"Definindo vários itens ({','.join(ids)}) como removido"
        )

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_remover_varios_exception(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.update_many.side_effect = Exception("Exception")
        ids = [str(ObjectId()), str(ObjectId())]
        try:
            await UploadMongo.remover_varios(ids, "user1")
        except Exception as e:
            mock_logger.error.assert_called()
            assert mock_logger.error.call_args_list[0] == "Exception"
            assert mock_logger.error.call_args_list[1].startswith("Traceback")

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_remover_filhos_success(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.update_many = AsyncMock()
        valid_object_id = ObjectId()
        id_pasta_pai = str(valid_object_id)
        await UploadMongo.remover_filhos(id_pasta_pai, "user1")
        expected_filter = {
            "id_pasta_pai": valid_object_id,
            "usuario": "user1",
        }
        expected_update = {"$set": {"st_removido": True}}
        mock_collection.update_many.assert_awaited_once_with(
            expected_filter, expected_update
        )
        mock_logger.info.assert_called_with(
            f"Definindo pasta|arquivo filhos de ({id_pasta_pai}) como removido"
        )

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @patch("src.infrastructure.mongo.upload_mongo.logger")
    @pytest.mark.asyncio
    async def test_remover_filhos_exception(self, mock_logger, mock_get_collection):
        mock_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.update_many.side_effect = Exception("Exception")
        try:
            await UploadMongo.remover_filhos("invalid_id", "user2")
        except Exception as e:
            mock_logger.error.assert_called()
            assert mock_logger.error.call_args_list[0] == "Exception"
            assert mock_logger.error.call_args_list[1].startswith("Traceback")

    @pytest.mark.asyncio
    async def test_renomear_item_sucesso(self, setup_mocks):
        usr = "usuario_teste"
        item_id = str(ObjectId())
        novo_nome = "novo_nome_teste"
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = None
        mock_collection.update_one.return_value.modified_count = 1
        UploadMongo.get_collection.return_value = mock_collection
        await UploadMongo.renomear_item(usr, item_id, novo_nome)
        logger.info.assert_called_with(
            f"Alterando nome do item id ({item_id}) para {novo_nome}"
        )
        mock_collection.update_one.assert_called_once_with(
            {"_id": ObjectId(item_id), "usuario": usr},
            {"$set": {"nome": novo_nome}},
        )

    @pytest.mark.asyncio
    async def test_renomear_item_excecao(self, setup_mocks):
        usr = "usuario_teste"
        item_id = str(ObjectId())
        novo_nome = "novo_nome_teste"
        UploadMongo.get_collection.side_effect = Exception("Exception")
        with patch("traceback.print_exc", return_value="traceback_mock"):
            await UploadMongo.renomear_item(usr, item_id, novo_nome)
            assert logger.error.call_args_list[0].args[0].args[0] == "Exception"

    @pytest.mark.asyncio
    async def test_copiar_item_sucesso(self, setup_mocks):
        id_item = str(ObjectId())
        id_pasta_destino = str(ObjectId())
        usr = "usuario_teste"

        file_mock = AsyncMock()
        file_mock.id_pasta_pai = str(ObjectId())
        file_mock.nome = "arquivo_teste"
        file_mock.usuario = usr
        file_mock.st_removido = False
        file_mock.tamanho = 1024
        file_mock.tipo_midia = "texto"
        file_mock.st_arquivo = "ativo"
        file_mock.nome_blob = "blob_teste"
        file_mock.status = "ok"

        UploadMongo.busca_por_id.return_value = file_mock
        UploadMongo.verifica_existencia_by_hash.return_value = False
        UploadMongo.verifica_existencia_by_nome.return_value = False

        mock_collection = AsyncMock()
        UploadMongo.get_collection.return_value = mock_collection
        mock_collection.insert_one.return_value.inserted_id = ObjectId()

        result = await UploadMongo.copiar_item(id_item, id_pasta_destino, usr)

        logger.info.assert_any_call(f"Copiando o arquivo ({file_mock.nome}) no Mongo")
        logger.info.assert_any_call(
            f"O arquivo ({file_mock.nome}) foi copiado no Mongo com _id {result.id}\n"
        )

        mock_collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_copiar_item_excecao_item_nao_encontrado(self, setup_mocks):
        id_item = str(ObjectId())
        id_pasta_destino = str(ObjectId())
        usr = "usuario_teste"
        UploadMongo.busca_por_id.return_value = None
        with pytest.raises(Exception) as excinfo:
            await UploadMongo.copiar_item(id_item, id_pasta_destino, usr)
        assert str(excinfo.value) == "Item não encontrado!"

    @pytest.mark.asyncio
    async def test_copiar_item_excecao_item_mesmo_nome(self, setup_mocks):
        id_item = str(ObjectId())
        id_pasta_destino = str(ObjectId())
        usr = "usuario_teste"
        file_mock = AsyncMock()
        file_mock.id_pasta_pai = str(ObjectId())
        file_mock.nome = "arquivo_teste"
        file_mock.usuario = usr
        file_mock.st_removido = False
        file_mock.tamanho = 1024
        file_mock.tipo_midia = "texto"
        file_mock.st_arquivo = "ativo"
        file_mock.nome_blob = "blob_teste"
        file_mock.status = "ok"
        UploadMongo.busca_por_id.return_value = file_mock
        UploadMongo.verifica_existencia_by_hash.return_value = False
        UploadMongo.verifica_existencia_by_nome.return_value = True
        with pytest.raises(Exception) as excinfo:
            await UploadMongo.copiar_item(id_item, id_pasta_destino, usr)
        assert (
            str(excinfo.value)
            == "Existe um item diferente, porém com o mesmo nome no destino!"
        )

    @pytest.mark.asyncio
    async def test_copiar_item_excecao_item_ja_existe(self, setup_mocks):
        id_item = str(ObjectId())
        id_pasta_destino = str(ObjectId())
        usr = "usuario_teste"

        file_mock = AsyncMock()
        file_mock.id_pasta_pai = str(ObjectId())
        file_mock.nome = "arquivo_teste"
        file_mock.usuario = usr
        file_mock.st_removido = False
        file_mock.tamanho = 1024
        file_mock.tipo_midia = "texto"
        file_mock.st_arquivo = "ativo"
        file_mock.nome_blob = "blob_teste"
        file_mock.status = "ok"
        UploadMongo.busca_por_id.return_value = file_mock
        UploadMongo.verifica_existencia_by_hash.return_value = True
        with pytest.raises(Exception) as excinfo:
            await UploadMongo.copiar_item(id_item, id_pasta_destino, usr)
        assert str(excinfo.value) == f"O item '{file_mock.nome}' já existe no destino!"

    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.get_collection",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_busca_por_id(self, mock_get_collection, mock_mongo):
        object_id = "61430b529ea2c8839d70af29"
        usr = "fulano"
        removido = False
        mock_result = {
            "_id": ObjectId(object_id),
            "nome": "Pasta Teste",
            "usuario": usr,
            "st_removido": removido,
            "id_pasta_pai": "-1",
            "data_criacao": "2024-06-28",
            "st_arquivo": True,
            "tamanho": "1024",
            "tipo_midia": "imagem",
            "nome_blob": "blob1",
            "status": "ativo",
        }
        mock_collection_pastas = AsyncMock()
        mock_collection_pastas.find_one.return_value = mock_result
        mock_get_collection.return_value = mock_collection_pastas
        resultado = await UploadMongo.busca_por_id(object_id, usr, removido)
        assert isinstance(resultado, ItemSistema)
        assert resultado.id == object_id
        assert resultado.nome == "Pasta Teste"
        assert resultado.usuario == usr
        assert resultado.st_removido == removido
        assert resultado.id_pasta_pai == "-1"
        assert resultado.data_criacao == "2024-06-28"
        assert resultado.st_arquivo is True
        assert resultado.tamanho == "1024"
        assert resultado.tipo_midia == "imagem"
        assert resultado.nome_blob == "blob1"
        assert resultado.status == "ativo"

    @pytest.mark.asyncio
    async def test_busca_por_id_excecao(self):
        object_id = "61430b529ea2c8839d70af29"
        usr = "fulano"
        removido = False
        mock_collection_pastas = AsyncMock()
        mock_collection_pastas.find_one.side_effect = Exception("Erro simulado")
        mock_get_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection_pastas
        UploadMongo.get_collection = mock_get_collection
        resultado = await UploadMongo.busca_por_id(object_id, usr, removido)
        assert resultado is None
        mock_get_collection.assert_called_once_with("documentos", "arquivos")
        mock_collection_pastas.find_one.assert_called_once_with(
            {"_id": ObjectId(object_id), "usuario": usr, "st_removido": removido}
        )

    @pytest.mark.asyncio
    async def test_alterar_status_sucesso(self):
        usr = "fulano"
        arquivo = ItemSistema(
            id="61430b529ea2c8839d70af29",
            nome="Arquivo Teste",
            usuario=usr,
            st_removido=False,
            id_pasta_pai="-1",
            data_criacao="2024-06-28",
            st_arquivo=True,
            tamanho="1024",
            tipo_midia="imagem",
            nome_blob="blob1",
            status="ativo",
        )
        novo_status = StatusArquivoEnum.ARMAZENADO
        mock_collection_pastas = AsyncMock()
        mock_update_result = MagicMock()
        mock_update_result.modified_count = 1
        mock_collection_pastas.update_one.return_value = mock_update_result
        mock_get_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection_pastas
        UploadMongo.get_collection = mock_get_collection
        resultado = await UploadMongo.alterar_status(usr, arquivo, novo_status)
        assert resultado == arquivo
        mock_get_collection.assert_called_once_with("documentos", "arquivos")
        mock_collection_pastas.update_one.assert_called_once_with(
            {"_id": ObjectId(arquivo.id), "usuario": usr},
            {"$set": {"status": novo_status.value}},
        )

    @pytest.mark.asyncio
    async def test_alterar_status_excecao(self):
        usr = "fulano"
        arquivo = ItemSistema(
            id="61430b529ea2c8839d70af29",
            nome="Arquivo Teste",
            usuario=usr,
            st_removido=False,
            id_pasta_pai="-1",
            data_criacao="2024-06-28",
            st_arquivo=True,
            tamanho="1024",
            tipo_midia="imagem",
            nome_blob="blob1",
            status="ativo",
        )
        novo_status = StatusArquivoEnum.PRONTO
        mock_collection_pastas = AsyncMock()
        mock_collection_pastas.update_one.side_effect = Exception("Erro simulado")
        mock_get_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection_pastas
        UploadMongo.get_collection = mock_get_collection
        resultado = await UploadMongo.alterar_status(usr, arquivo, novo_status)
        assert resultado == arquivo
        mock_get_collection.assert_called_once_with("documentos", "arquivos")
        mock_collection_pastas.update_one.assert_called_once_with(
            {"_id": ObjectId(arquivo.id), "usuario": usr},
            {"$set": {"status": novo_status.value}},
        )

    @pytest.mark.asyncio
    async def test_mover_item_sucesso(self):
        id_item = "61430b529ea2c8839d70af29"
        id_pasta_destino = "61430b529ea2c8839d70af2a"
        usr = "fulano"
        mock_item = ItemSistema(
            id=id_item,
            nome="Arquivo Teste",
            usuario=usr,
            st_removido=False,
            id_pasta_pai="-1",
            data_criacao="2024-06-28",
            st_arquivo=True,
            tamanho="1024",
            tipo_midia="imagem",
            nome_blob="blob1",
            status="ativo",
        )
        mock_collection_pastas = AsyncMock()
        mock_update_result = MagicMock()
        mock_update_result.modified_count = 1
        mock_collection_pastas.update_one.return_value = mock_update_result
        UploadMongo.verifica_existencia_by_hash = AsyncMock(return_value=False)
        UploadMongo.verifica_existencia_by_nome = AsyncMock(return_value=False)
        UploadMongo.busca_por_id = AsyncMock(return_value=mock_item)
        mock_get_collection = AsyncMock()
        mock_get_collection.return_value = mock_collection_pastas
        UploadMongo.get_collection = mock_get_collection
        resultado = await UploadMongo.mover_item(id_item, id_pasta_destino, usr)
        assert resultado == mock_item
        UploadMongo.busca_por_id.assert_called_once_with(id_item, usr)
        UploadMongo.verifica_existencia_by_hash.assert_called_once_with(mock_item)
        UploadMongo.verifica_existencia_by_nome.assert_called_once_with(mock_item)
        mock_get_collection.assert_called_once_with("documentos", "arquivos")
        mock_collection_pastas.update_one.assert_called_once_with(
            {
                "_id": ObjectId(id_item),
                "usuario": usr,
                "st_removido": False,
            },
            {
                "$set": {
                    "id_pasta_pai": (
                        str(id_pasta_destino)
                        if str(id_pasta_destino) == "-1"
                        else ObjectId(str(id_pasta_destino))
                    )
                }
            },
        )

    @pytest.mark.asyncio
    async def test_mover_item_item_nao_encontrado(self):
        id_item = "61430b529ea2c8839d70af29"
        id_pasta_destino = "61430b529ea2c8839d70af2a"
        usr = "fulano"
        UploadMongo.busca_por_id = AsyncMock(return_value=None)
        with pytest.raises(Exception, match="Item não encontrado!"):
            await UploadMongo.mover_item(id_item, id_pasta_destino, usr)
        UploadMongo.busca_por_id.assert_called_once_with(id_item, usr)

    @pytest.mark.asyncio
    async def test_mover_item_item_com_mesmo_nome_no_destino(self):
        id_item = "61430b529ea2c8839d70af29"
        id_pasta_destino = "61430b529ea2c8839d70af2a"
        usr = "fulano"
        mock_item = ItemSistema(
            id=id_item,
            nome="Arquivo Teste",
            usuario=usr,
            st_removido=False,
            id_pasta_pai="-1",
            data_criacao="2024-06-28",
            st_arquivo=True,
            tamanho="1024",
            tipo_midia="imagem",
            nome_blob="blob1",
            status="ativo",
        )
        UploadMongo.busca_por_id = AsyncMock(return_value=mock_item)
        UploadMongo.verifica_existencia_by_hash = AsyncMock(return_value=False)
        UploadMongo.verifica_existencia_by_nome = AsyncMock(return_value=True)
        with pytest.raises(
            Exception,
            match="Existe um item diferente, porém com o mesmo nome no destino!",
        ):
            await UploadMongo.mover_item(id_item, id_pasta_destino, usr)
        UploadMongo.busca_por_id.assert_called_once_with(id_item, usr)
        UploadMongo.verifica_existencia_by_nome.verifica_existencia_by_hash(mock_item)
        UploadMongo.verifica_existencia_by_nome.assert_called_once_with(mock_item)

    @pytest.mark.asyncio
    async def test_mover_item_item_ja_existe_no_destino(self):
        id_item = "61430b529ea2c8839d70af29"
        id_pasta_destino = "61430b529ea2c8839d70af2a"
        usr = "fulano"
        mock_item = ItemSistema(
            id=id_item,
            nome="Arquivo Teste",
            usuario=usr,
            st_removido=False,
            id_pasta_pai="-1",
            data_criacao="2024-06-28",
            st_arquivo=True,
            tamanho="1024",
            tipo_midia="imagem",
            nome_blob="blob1",
            status="ativo",
        )
        UploadMongo.busca_por_id = AsyncMock(return_value=mock_item)
        UploadMongo.verifica_existencia_by_hash = AsyncMock(return_value=True)
        UploadMongo.verifica_existencia_by_nome = AsyncMock(return_value=True)
        with pytest.raises(
            Exception, match=f"O item '{mock_item.nome}' já existe no destino!"
        ):
            await UploadMongo.mover_item(id_item, id_pasta_destino, usr)
        UploadMongo.busca_por_id.assert_called_once_with(id_item, usr)
        UploadMongo.verifica_existencia_by_hash.assert_called_once_with(mock_item)
        UploadMongo.verifica_existencia_by_nome.assert_not_called()

    @pytest.mark.asyncio
    async def test_listar_filhos_success(self):
        mock_collection = MagicMock()
        mock_collection.find.return_value.sort.return_value = AsyncMock()
        mock_collection.find.return_value.sort.return_value.__aiter__.return_value = [
            {
                "_id": ObjectId("60df8e507e7d48e3e4dd4e1f"),
                "nome": "Pasta 1",
                "usuario": "user1",
                "st_removido": False,
                "id_pasta_pai": ObjectId("60df8e507e7d48e3e4dd4e1f"),
                "data_criacao": "2023-01-01",
                "st_arquivo": True,
                "tamanho": "1024",
                "tipo_midia": "pdf",
                "nome_blob": "blob1.pdf",
                "status": "ativo",
            },
            {
                "_id": ObjectId("60df8e507e7d48e3e4dd4e1e"),
                "nome": "Pasta 2",
                "usuario": "user2",
                "st_removido": False,
                "id_pasta_pai": ObjectId("60df8e507e7d48e3e4dd4e1f"),
                "data_criacao": "2023-01-02",
                "st_arquivo": False,
            },
        ]
        UploadMongo.get_collection = AsyncMock(return_value=mock_collection)
        result = await UploadMongo.listar_filhos(
            "60df8e507e7d48e3e4dd4e1f", "user1", arquivos=True
        )
        assert len(result) == 2
        isinstance(result[0], ItemSistema)
        assert result[0].nome == "Pasta 1"
        assert result[0].usuario == "user1"
        assert result[0].st_removido is False
        assert result[0].id_pasta_pai == "60df8e507e7d48e3e4dd4e1f"
        assert result[0].data_criacao == "2023-01-01"
        assert result[0].st_arquivo is True
        assert result[0].tamanho == "1024"
        assert result[0].tipo_midia == "pdf"
        assert result[0].nome_blob == "blob1.pdf"
        assert result[0].status == "ativo"
        assert result[1].nome == "Pasta 2"
        assert result[1].usuario == "user2"
        assert result[1].st_removido is False
        assert result[1].id_pasta_pai == "60df8e507e7d48e3e4dd4e1f"
        assert result[1].data_criacao == "2023-01-02"
        assert result[1].st_arquivo is False

    @pytest.mark.asyncio
    async def test_listar_filhos_exception(self):
        UploadMongo.get_collection = AsyncMock(side_effect=Exception)
        result = await UploadMongo.listar_filhos(
            "60df8e507e7d48e3e4dd4e1f", "user1", arquivos=True
        )
        assert len(result) == 0

    @pytest.mark.asyncio
    async def test_busca_por_varios_ids_success(self):
        mock_collection = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(
            return_value=[
                {
                    "_id": ObjectId("60df8e507e7d48e3e4dd4e1f"),
                    "nome": "Pasta 1",
                    "usuario": "user1",
                    "st_removido": False,
                },
                {
                    "_id": ObjectId("60df8e507e7d48e3e4dd4e1e"),
                    "nome": "Pasta 2",
                    "usuario": "user1",
                    "st_removido": False,
                },
            ]
        )
        mock_collection.find.return_value.sort.return_value = mock_cursor
        UploadMongo.get_collection = AsyncMock(return_value=mock_collection)
        result = await UploadMongo.busca_por_varios_ids(
            ["60df8e507e7d48e3e4dd4e1f", "60df8e507e7d48e3e4dd4e1e"], "user1"
        )
        assert len(result) == 2
        isinstance(result[0], dict)
        assert result[0]["nome"] == "Pasta 1"
        assert result[0]["usuario"] == "user1"
        assert result[0]["st_removido"] is False

        assert result[1]["nome"] == "Pasta 2"
        assert result[1]["usuario"] == "user1"
        assert result[1]["st_removido"] is False

    @pytest.mark.asyncio
    async def test_busca_por_varios_ids_exception(self):
        UploadMongo.get_collection = AsyncMock(side_effect=Exception("Simulated error"))
        result = await UploadMongo.busca_por_varios_ids(
            ["60df8e507e7d48e3e4dd4e1f", "60df8e507e7d48e3e4dd4e1e"], "user1"
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_renomear_item_falha_item_existente(self, setup_mocks):
        usr = "usuario_teste"
        item_id = str(ObjectId())
        novo_nome = "novo_nome_teste"
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = {"nome": novo_nome}
        UploadMongo.get_collection = AsyncMock(return_value=mock_collection)

        with pytest.raises(MongoException) as exc_info:
            await UploadMongo.renomear_item(usr, item_id, novo_nome)

        assert str(exc_info.value) == f"Já existe um item com o nome '{novo_nome}'!"
        mock_collection.find_one.assert_called_once_with(
            {"usuario": usr, "nome": novo_nome, "st_removido": False}
        )
