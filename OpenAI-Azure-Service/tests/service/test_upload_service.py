import io
from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aioresponses import aioresponses
from fastapi import UploadFile
from starlette import status

from src.domain.schemas import GabiResponse, ItemSistema
from src.exceptions import ServiceException
from src.infrastructure.azure_blob.azure_blob import AzureBlob
from src.infrastructure.cognitive_search import cognitive_search
from src.infrastructure.security_tokens import DecodedToken
from src.service import upload_service
from tests.util.mock_objects import MockObjects


@pytest.fixture
def decoded_token_sem_login(token_data):
    token_data["siga_luls"] = ""
    return DecodedToken.model_validate(token_data)


class TestUploadService:
    @pytest.fixture
    def _blob_service_client(self, mocker):
        mock = mocker.Mock()

        mocker.patch.object(
            upload_service.AzureBlob, "_AzureBlob__get_blob_service_client", mock
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _mock_mongo_db(self, mocker):
        mock = {"documentos": mocker.AsyncMock(), "arquivos": mocker.AsyncMock()}

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _arquivo_upload(self, mocker):
        mock = mocker.Mock(spec=UploadFile)
        mock.filename = "teste.pdf"
        mock.content_type = "application/pdf"
        mock.size = 45 * 1024 * 1024
        mock.file = mocker.Mock()

        # Criando um mock para o método read que retorna um objeto bytes
        mock.read = mocker.AsyncMock(return_value=b"dados do arquivo")

        return mock

    @pytest.fixture
    def _search_client(self, mocker):
        trechos = []

        async def async_generator(*args, **kwargs):
            for trecho in trechos:
                yield trecho

        mock = mocker.AsyncMock(side_effect=async_generator)
        mocker.patch.object(cognitive_search.SearchClient, "search", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _lista_itens(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service, "lista_itens", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _busca_por_varios_ids(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "busca_por_varios_ids", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _adiciona_pasta(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "inserir_pasta", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _remover_varios(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "remover_varios", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _renomear_item(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "renomear_item", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _listar_filhos(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "listar_filhos", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _download_pasta_zipada(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service, "download_pasta_zipada", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _busca_por_id(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "busca_por_id", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _download_arquivo(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service, "download_arquivo", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _download_blob(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(AzureBlob, "download_blob", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _copiar_item(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "copiar_item", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _mover_item(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(upload_service.UploadMongo, "mover_item", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def mock_arquivo(self):
        arquivo = MagicMock(spec=UploadFile)
        arquivo.filename = "test.pdf"
        arquivo.content_type = "application/pdf"
        arquivo.size = 1000
        arquivo.file = io.BytesIO(b"conteudo do arquivo")
        arquivo.read = AsyncMock(return_value=b"conteudo do arquivo")
        return arquivo

    @pytest.mark.asyncio
    async def test_excluir_arquivo_processado(self, mocker):
        mock_collection = mocker.AsyncMock()
        mock_collection.return_value.update_one = mocker.AsyncMock()

        mocker.patch.object(
            upload_service.UploadMongo, "get_collection", return_value=mock_collection
        )

        await upload_service.exclui_item("0123456789abcdef01234567", "teste")

        assert mock_collection.update_one.called is True

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_excluir_arquivo_processado_sem_nome_arquivo(
        self, mocker
    ):
        mock_collection = mocker.AsyncMock()
        mock_collection.return_value.update_one = mocker.AsyncMock()

        mocker.patch.object(
            upload_service.UploadMongo, "get_collection", return_value=mock_collection
        )

        with pytest.raises(Exception):
            await upload_service.exclui_item("", "teste")

        assert mock_collection.update_one.called is False

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_excluir_arquivo_processado_sem_usuario(
        self, mocker
    ):
        mock_collection = mocker.AsyncMock()
        mock_collection.return_value.update_one = mocker.AsyncMock()

        mocker.patch.object(
            upload_service.UploadMongo, "get_collection", return_value=mock_collection
        )

        with pytest.raises(Exception):
            await upload_service.exclui_item("teste", "")

        assert mock_collection.update_one.called is False

    @pytest.mark.asyncio
    async def test_listagem_arquivos_processados(self, mocker):
        esperado = [
            {
                "_id": "0123456789abcdef01234567",
                "nome": "teste",
                "usuario": "teste",
                "st_removido": False,
                "id_pasta_pai": -1,
                "data_criacao": "",
                "st_arquivo": True,
                "tamanho": "1024",
                "tipo_midia": "teste",
                "nome_blob": "teste",
                "status": "pronto",
            },
            {
                "_id": "0123456789abcdef01234568",
                "nome": "teste1",
                "usuario": "teste1",
                "st_removido": False,
                "id_pasta_pai": -1,
                "data_criacao": "",
                "st_arquivo": True,
                "tamanho": "1024",
                "tipo_midia": "teste1",
                "nome_blob": "teste1",
                "status": "pronto",
            },
        ]

        mocker.patch.object(
            upload_service.UploadMongo, "listar_tudo", return_value=esperado
        )

        retorno = await upload_service.lista_itens("teste")

        assert retorno[0].nome == esperado[0]["nome"]

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_listagem_arquivos_processados_sem_usuario(
        self, mocker
    ):
        spy_search = mocker.spy(upload_service.UploadMongo, "listar_tudo")

        with pytest.raises(Exception):
            await upload_service.lista_itens("")

        assert spy_search.called is False

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_processa_upload_sem_extenssao(
        self, _arquivo_upload, decoded_token, mocker
    ):
        _arquivo_upload.filename = "teste"
        with pytest.raises(Exception) as exc_info:
            await upload_service.processa_upload(
                "0123456789abcdef01234567", _arquivo_upload, decoded_token
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Tipo de arquivo não permitido!"

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_processa_upload_com_extenssao_nao_permitida(
        self, _arquivo_upload, decoded_token, mocker
    ):
        _arquivo_upload.filename = "teste.txt"
        with pytest.raises(Exception) as exc_info:
            await upload_service.processa_upload(
                "0123456789abcdef01234567", _arquivo_upload, decoded_token
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Tipo de arquivo não permitido!"

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_processa_upload_com_mimetype_nao_permitido(
        self, _arquivo_upload, decoded_token, mocker
    ):
        _arquivo_upload.content_type = "text/plain"
        with pytest.raises(Exception) as exc_info:
            await upload_service.processa_upload(
                "0123456789abcdef01234567", _arquivo_upload, decoded_token
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Tipo de arquivo não permitido!"

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_processa_upload_sem_usuario(
        self, _arquivo_upload, decoded_token_sem_login, mocker
    ):
        with pytest.raises(Exception) as exc_info:
            await upload_service.processa_upload(
                "0123456789abcdef01234567", _arquivo_upload, decoded_token_sem_login
            )

        assert exc_info.type == ServiceException
        assert str(exc_info.value) == "Usuário não identificado"

    @patch("src.service.upload_service.calcula_hash", new_callable=AsyncMock)
    @patch("src.service.upload_service.AzureBlob")
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.inserir_arquivo",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.alterar_status",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.cognitive_search.documentos_cs.DocumentoCS.persiste_documentos",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_processa_upload_sucesso(
        self,
        mock_persiste_documentos,
        mock_alterar_status,
        mock_inserir_arquivo,
        mock_AzureBlob,
        mock_calcula_hash,
        mock_arquivo,
        decoded_token,
    ):
        mock_calcula_hash.return_value = "hash_teste"
        mock_AzureBlob.return_value.upload_blob = AsyncMock()
        mock_inserir_arquivo.return_value = "id_pasta"
        mock_alterar_status.return_value = "status_alterado"

        resultado = await upload_service.processa_upload(
            "1234", mock_arquivo, decoded_token
        )

        assert resultado == "status_alterado"
        mock_calcula_hash.assert_called_once()
        mock_AzureBlob.return_value.upload_blob.assert_called_once()
        mock_inserir_arquivo.assert_called_once()
        mock_persiste_documentos.assert_called_once()
        mock_alterar_status.assert_called_once()

    @patch("src.service.upload_service.calcula_hash", new_callable=AsyncMock)
    @patch("src.service.upload_service.AzureBlob")
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.inserir_arquivo",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.mongo.upload_mongo.UploadMongo.alterar_status",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.cognitive_search.documentos_cs.DocumentoCS.persiste_documentos",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.cognitive_search.documentos_cs.DocumentoCS.verifica_existencia_documento",
        new_callable=AsyncMock,
    )
    # @patch(
    #     "src.service.upload_service.process_audio",
    #     new_callable=AsyncMock,
    # )
    @pytest.mark.asyncio
    async def test_processa_upload_sucesso_com_gabi(
        self,
        # mock_precess_audio,  # Primeiro mock decorado, último parâmetro injetado
        mock_verifica_existencia_documento,
        mock_persiste_documentos,
        mock_alterar_status,
        mock_inserir_arquivo,
        mock_AzureBlob,
        mock_calcula_hash,  # Último mock decorado, primeiro parâmetro injetado
        mock_arquivo,
        decoded_token_com_role,
    ):
        mock_calcula_hash.return_value = "hash_teste"
        mock_AzureBlob.return_value.upload_blob = AsyncMock()

        mock_arquivo.filename = "teste.mp3"
        mock_arquivo.content_type = "audio/mpeg"

        mock_inserir_arquivo.return_value = ItemSistema(
            id="id_pasta",
            data_criacao="",
            arquivos=None,
            id_pasta_pai=-1,
            st_arquivo=True,
            nome=mock_arquivo.filename,
            nome_blob="nome_blob",
            usuario="usuario",
        )
        mock_alterar_status.return_value = "status_alterado"

        mock_verifica_existencia_documento.return_value = False

        retorno_esperado = GabiResponse(
            summary="teste123", transcript="teste123", itens_filenames=["teste123"]
        )
        with aioresponses() as mocked:
            url = f"{upload_service.URL_GABI}/api"
            mocked.post(url, payload=retorno_esperado.model_dump(), status=200)

            resultado = await upload_service.processa_upload(
                "1234", mock_arquivo, decoded_token_com_role
            )

        assert resultado == "status_alterado"
        mock_calcula_hash.assert_called_once()
        mock_AzureBlob.return_value.upload_blob.assert_called_once()

        assert mock_verifica_existencia_documento.called is True
        # mock_verifica_existencia_documento.assert_called_once()

        mock_inserir_arquivo.assert_called_once()
        mock_persiste_documentos.assert_called_once()
        mock_alterar_status.assert_called_once()
        # mock_precess_audio.assert_called_once()
        # assert mock_precess_audio.called is False

    @pytest.mark.asyncio
    async def test_atribuir_arquivos_a_pastas(self):
        pasta = MockObjects.mock_item_sistema
        arquivo = MockObjects.mock_item_sistema
        pasta.id = 1
        arquivo.id_pasta_pai = 1
        mock_list_pasta = [pasta]
        mock_list_arquivo = [arquivo]
        await upload_service.atribuir_arquivos_a_pastas(
            mock_list_pasta, mock_list_arquivo
        )
        assert mock_list_pasta[0].arquivos.__len__() == 1

    @pytest.mark.asyncio
    async def test_lista_pastas_com_arquivos(self, _lista_itens):
        item_mock = MockObjects.mock_item_sistema
        item_mock.id_pasta_pai = 1
        mock_list_item = [item_mock]
        _lista_itens.return_value = mock_list_item
        resposta = await upload_service.lista_pastas_com_arquivos("Teste")
        assert resposta.__len__() == 2
        assert resposta[0].arquivos.__len__() == 1
        assert resposta[1].arquivos.__len__() == 1

    @pytest.mark.asyncio
    async def test_busca_itens_por_ids(self, _busca_por_varios_ids):
        item_mock = MockObjects.mock_item
        _busca_por_varios_ids.return_value = item_mock
        resposta = await upload_service.busca_itens_por_ids(["Teste"], "Teste")
        assert resposta.__len__() == 1
        assert resposta[0].id == item_mock[0]["_id"]

    @pytest.mark.asyncio
    async def test_busca_itens_por_ids_usuario_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.busca_itens_por_ids(["Teste"], "")
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_adiciona_pasta_usuario_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.adiciona_pasta("", "Teste")
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_adiciona_pasta_nome_da_pasta_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.adiciona_pasta("Teste", "")
        assert exc_info.value.args[0] == "Nome da pasta não identificado"

    @pytest.mark.asyncio
    async def test_adiciona_pasta(self, _adiciona_pasta):
        mock_item = MockObjects.mock_item_sistema
        _adiciona_pasta.return_value = mock_item
        resposta = await upload_service.adiciona_pasta("Teste", "Teste")
        assert resposta == mock_item

    @pytest.mark.asyncio
    async def test_exclui_varios_itens_sem_itens_para_excluir(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.exclui_varios_itens([], "Teste")
        assert exc_info.value.args[0] == "Não foi localizado itens para excluir"

    @pytest.mark.asyncio
    async def test_exclui_varios_itens_usuario_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.exclui_varios_itens(
                [MockObjects.mock_item_sistema], ""
            )
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_exclui_varios_itens(self, _busca_por_id, _remover_varios):
        await upload_service.exclui_varios_itens(
            [MockObjects.mock_item_sistema], "Teste"
        )
        assert _remover_varios.called is True

    @pytest.mark.asyncio
    async def test_renomear_item_id_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.renomear_item("", "Teste", "Teste")
        assert exc_info.value.args[0] == "Id do item não identificado"

    @pytest.mark.asyncio
    async def test_renomear_item_novo_nome_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.renomear_item("Teste", "", "Teste")
        assert exc_info.value.args[0] == "Novo nome para o item não identificado"

    @pytest.mark.asyncio
    async def test_renomear_item_usuario_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.renomear_item("Teste", "Teste", "")
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_renomear_item(self, _renomear_item):
        await upload_service.renomear_item("Teste", "Teste", "Teste")
        assert _renomear_item.called is True

    @pytest.mark.asyncio
    async def test_download_item_id_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.download_item("", "Teste")
        assert exc_info.value.args[0] == "Id do item não identificado"

    @pytest.mark.asyncio
    async def test_download_item_usuario_nao_identificado(self):
        with pytest.raises(Exception) as exc_info:
            await upload_service.download_item("Teste", "")
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_download_item_item_id_negativo(
        self, _listar_filhos, _download_pasta_zipada
    ):
        _listar_filhos.return_value = [MockObjects.mock_item_sistema]
        _listar_filhos.return_value[0].st_arquivo = False
        _listar_filhos.return_value[0].arquivos = []
        _download_pasta_zipada.return_value = MockObjects.mock_stream
        resposta = await upload_service.download_item("-1", "Teste")
        assert resposta.headers.values()[0] == "attachment;filename=Teste.zip"

    @pytest.mark.asyncio
    async def test_download_item_item_id_positivo(
        self, _listar_filhos, _busca_por_id, _download_arquivo
    ):
        _listar_filhos.return_value = [MockObjects.mock_item_sistema]
        _listar_filhos.return_value[0].st_arquivo = True
        _listar_filhos.return_value[0].arquivos = []
        _busca_por_id.return_value = MockObjects.mock_item_sistema
        _download_arquivo.return_value = MockObjects.mock_stream
        resposta = await upload_service.download_item("1", "Teste")
        assert resposta.headers.values()[0] == "attachment;filename=Teste.zip"

    @pytest.mark.asyncio
    async def test_download_arquivo(self, _download_blob):
        _download_blob.return_value = BytesIO()
        resposta = await upload_service.download_arquivo(MockObjects.mock_item_sistema)
        assert resposta.headers.values()[0] == "attachment;filename=Nome_Teste"

    @pytest.mark.asyncio
    async def test_download_arquivo_exception(self, _download_blob):
        _download_blob.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await upload_service.download_arquivo(MockObjects.mock_item_sistema)
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_download_pasta_zipada(self, _download_blob):
        _download_blob.return_value = b"Teste: \x00\x01"
        mock_pasta = MockObjects.mock_item_sistema
        mock_pasta.arquivos = [MockObjects.mock_item_sistema]
        resposta = await upload_service.download_pasta_zipada(mock_pasta)
        assert resposta.headers.values()[0] == "attachment;filename=Nome_Teste.zip"

    @pytest.mark.asyncio
    async def test_download_pasta_zipada_falha_ao_selecionar_arquivos(
        self, _download_blob
    ):
        _download_blob.side_effect = Exception
        mock_pasta = MockObjects.mock_item_sistema
        mock_pasta.arquivos = []
        with pytest.raises(Exception) as exc_info:
            await upload_service.download_pasta_zipada(mock_pasta)
        assert (
            exc_info.value.args[0]
            == "Falha ao selecionar os arquivos da pasta para download"
        )

    @pytest.mark.asyncio
    async def test_download_pasta_zipada_exception(self, _download_blob):
        _download_blob.side_effect = Exception("Teste Exception")
        mock_pasta = MockObjects.mock_item_sistema
        mock_pasta.arquivos = [MockObjects.mock_item_sistema]
        with pytest.raises(Exception) as exc_info:
            await upload_service.download_pasta_zipada(mock_pasta)
        assert exc_info.value.args[0] == "Teste Exception"

    @pytest.mark.asyncio
    async def test_copiar_itens(self, _copiar_item):
        _copiar_item.return_value = MockObjects.mock_item_sistema
        _copiar_item.return_value.arquivos = []
        resposta = await upload_service.copiar_itens("Teste", ["1"], "Teste")
        assert resposta.status_code == status.HTTP_201_CREATED
        assert "Itens copiados com sucesso" in resposta.body.decode("utf-8")

    @pytest.mark.asyncio
    async def test_copiar_itens_destino_nao_identificado(self, _download_blob):
        with pytest.raises(Exception) as exc_info:
            await upload_service.copiar_itens("", ["Teste"], "Teste")
        assert exc_info.value.args[0] == "Pasta de destino não identificada"

    @pytest.mark.asyncio
    async def test_copiar_itens_nao_identificado_para_movimentacao(
        self, _download_blob
    ):
        with pytest.raises(Exception) as exc_info:
            await upload_service.copiar_itens("Teste", [], "Teste")
        assert exc_info.value.args[0] == "Itens não identificados para movimentação"

    @pytest.mark.asyncio
    async def test_copiar_itens_usuario_nao_identificado(self, _download_blob):
        with pytest.raises(Exception) as exc_info:
            await upload_service.copiar_itens("Teste", ["Teste"], "")
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_copiar_itens_erro_ao_copiar_arquivos(
        self, _copiar_item, _busca_por_id
    ):
        _copiar_item.side_effect = Exception("Teste Exception")
        _busca_por_id.return_value = MockObjects.mock_item_sistema
        resposta = await upload_service.copiar_itens("Teste", ["1"], "Teste")
        assert resposta.status_code == status.HTTP_201_CREATED
        assert "Erro ao copiar os arquivos 'Nome Teste!" in resposta.body.decode(
            "utf-8"
        )

    @pytest.mark.asyncio
    async def test_mover_itens_destino_nao_identificado(self, _download_blob):
        with pytest.raises(Exception) as exc_info:
            await upload_service.mover_itens("", ["Teste"], "Teste")
        assert exc_info.value.args[0] == "Pasta de destino não identificada"

    @pytest.mark.asyncio
    async def test_mover_itens_nao_identificado_para_movimentacao(self, _download_blob):
        with pytest.raises(Exception) as exc_info:
            await upload_service.mover_itens("Teste", [], "Teste")
        assert exc_info.value.args[0] == "Itens não identificados para movimentação"

    @pytest.mark.asyncio
    async def test_mover_itens_usuario_nao_identificado(self, _download_blob):
        with pytest.raises(Exception) as exc_info:
            await upload_service.mover_itens("Teste", ["Teste"], "")
        assert exc_info.value.args[0] == "Usuário não identificado"

    @pytest.mark.asyncio
    async def test_mover_itens(self, _mover_item):
        mock_item = MockObjects.mock_item_sistema
        _mover_item.return_value = mock_item
        resposta = await upload_service.mover_itens("Teste", ["1"], "Teste")
        assert resposta.status_code == status.HTTP_200_OK
        assert "Itens movidos com sucesso!" in resposta.body.decode("utf-8")

    @pytest.mark.asyncio
    async def test_mover_itens_erro_ao_copiar_arquivos(
        self, _mover_item, _busca_por_id
    ):
        _mover_item.side_effect = Exception("Teste Exception")
        _busca_por_id.return_value = MockObjects.mock_item_sistema
        resposta = await upload_service.mover_itens("Teste", ["1"], "Teste")
        assert resposta.status_code == status.HTTP_200_OK
        assert "Erro ao mover os arquivos 'Nome Teste!" in resposta.body.decode("utf-8")
