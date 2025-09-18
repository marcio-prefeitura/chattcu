import pytest

from src.domain.schemas import DestinatarioOut
from src.exceptions import BusinessException
from src.infrastructure.elasticsearch.elasticsearch import ElasticSearch
from src.service import compartilhamento_service
from tests.util.mock_objects import MockObjects


class TestCompartilhamentoService:
    # @pytest.fixture
    # def _buscar_pessoa(self, mocker):
    #     mock = mocker.AsyncMock()
    #     mocker.patch.object(compartilhamento_service, "buscar_pessoas_por_nome", mock)

    #     yield mock
    #     mocker.stopall()

    # @pytest.fixture
    # def _buscar_pessoa_por_codigo(self, mocker):
    #     mock = mocker.AsyncMock()
    #     mocker.patch.object(compartilhamento_service, "buscar_pessoa_por_codigo", mock)

    #     yield mock
    #     mocker.stopall()

    # @pytest.fixture
    # def _buscar_unidade(self, mocker):
    #     mock = mocker.AsyncMock()
    #     mocker.patch.object(compartilhamento_service, "busca_unidade", mock)

    #     yield mock
    #     mocker.stopall()

    @pytest.fixture
    def _buscar_chat(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(compartilhamento_service, "buscar_chat", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _comprtilhamento_mongo(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo,
            "inserir_compartilhamento",
            mock,
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _comprtilhamento_mongo_por_id(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo, "busca_por_id", mock
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _retorna_compartilhamento_by_chatid(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo, "busca_por_chat_id", mock
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _comprtilhamento_mongo_por_usuario(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo,
            "listar_compartilhados_por_usuario",
            mock,
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _comprtilhamento_mongo_pora_usuario(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo,
            "listar_compartilhados_por_destinatarios",
            mock,
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _get_cod_unidades_ate(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(compartilhamento_service, "get_cod_unidades_ate", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _remover_compartilhamento(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo, "remover", mock
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _remover_todos_enviados(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo,
            "remover_todos_enviados",
            mock,
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _criar_novo_chat(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(ElasticSearch, "criar_novo_chat", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _adicionar_mensagem(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(ElasticSearch, "adicionar_mensagem", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _elastic_buscar_chat(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(ElasticSearch, "buscar_chat", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _busca_por_id(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(compartilhamento_service.UploadMongo, "busca_por_id", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _inserir_arquivo(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.UploadMongo, "inserir_arquivo", mock
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _atualiza_chat_compartilhamento(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo,
            "atualizar_compartilhamento",
            mock,
        )

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _retorna_compartilhamento(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(
            compartilhamento_service.CompartilhamentoMongo, "busca_por_id", mock
        )

        yield mock
        mocker.stopall()

    @pytest.mark.asyncio
    async def test_compartilha_chat(self, _buscar_chat, _comprtilhamento_mongo):
        _buscar_chat.return_value = MockObjects.mock_chat_out
        _comprtilhamento_mongo.return_value = MockObjects.mock_compartilhamento_out
        retorno = await compartilhamento_service.compartilha_chat(
            MockObjects.mock_compartilhamento_in, "Teste"
        )
        assert retorno.id == MockObjects.mock_compartilhamento_out.id

    @pytest.mark.asyncio
    async def test_compartilha_chat_exception(
        self, _buscar_chat, _comprtilhamento_mongo
    ):
        _buscar_chat.return_value = MockObjects.mock_chat_out
        _comprtilhamento_mongo.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.compartilha_chat(
                MockObjects.mock_compartilhamento_in, "Teste"
            )
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_retorna_compartilhamento(self, _comprtilhamento_mongo_por_id):
        _comprtilhamento_mongo_por_id.return_value = (
            MockObjects.mock_compartilhamento_out
        )
        retorno = await compartilhamento_service.retorna_compartilhamento(
            "122",
            "Teste",
        )
        assert retorno.id == MockObjects.mock_compartilhamento_out.id

    @pytest.mark.asyncio
    async def test_retorna_compartilhamento_exception(
        self, _comprtilhamento_mongo_por_id
    ):
        _comprtilhamento_mongo_por_id.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.retorna_compartilhamento("122", "Teste")
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_lista_compartilhados_pelo_usuario(
        self, _comprtilhamento_mongo_por_usuario
    ):
        _comprtilhamento_mongo_por_usuario.return_value = [
            MockObjects.mock_compartilhamento_out
        ]
        retorno = await compartilhamento_service.lista_compartilhados_pelo_usuario(
            "Teste"
        )
        assert retorno[0].id == MockObjects.mock_compartilhamento_out.id

    @pytest.mark.asyncio
    async def test_lista_compartilhados_pelo_usuario_exception(
        self, _comprtilhamento_mongo_por_usuario
    ):
        _comprtilhamento_mongo_por_usuario.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.lista_compartilhados_pelo_usuario("Teste")
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_exclui_compartilhamento(self, _remover_compartilhamento):
        await compartilhamento_service.exclui_compartilhamento("123", "Teste")
        assert _remover_compartilhamento.called is True

    @pytest.mark.asyncio
    async def test_exclui_compartilhamento_exception(self, _remover_compartilhamento):
        _remover_compartilhamento.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.exclui_compartilhamento("123", "Teste")
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_exclui_todos_compartilhamentos_enviados(
        self, _remover_todos_enviados
    ):
        await compartilhamento_service.exclui_todos_compartilhamentos_enviados("Teste")
        assert _remover_todos_enviados.called is True

    @pytest.mark.asyncio
    async def test_exclui_todos_compartilhamentos_enviados_exception(
        self, _remover_todos_enviados
    ):
        _remover_todos_enviados.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.exclui_todos_compartilhamentos_enviados(
                "Teste"
            )
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_assumir_chat(
        self,
        _comprtilhamento_mongo_por_id,
        _criar_novo_chat,
        _adicionar_mensagem,
        _elastic_buscar_chat,
        _busca_por_id,
        _inserir_arquivo,
    ):
        _comprtilhamento_mongo_por_id.return_value = (
            MockObjects.mock_compartilhamento_out
        )
        _comprtilhamento_mongo_por_id.return_value.chat.mensagens = [
            MockObjects.mock_message_out
        ]
        _comprtilhamento_mongo_por_id.return_value.arquivos = ["12345"]
        _criar_novo_chat.return_value = MockObjects.mock_chat_out
        _elastic_buscar_chat.return_value = MockObjects.mock_chat_out
        _adicionar_mensagem.return_value = MockObjects.mock_message_out
        _busca_por_id.return_value = MockObjects.mock_item_sistema
        _inserir_arquivo.return_value = MockObjects.mock_item_sistema

        resposta = await compartilhamento_service.assumir_chat("123", "P_1")

        assert resposta.id is MockObjects.mock_chat_out.id
        assert resposta.mensagens[0].codigo is MockObjects.mock_message_out.codigo

    @pytest.mark.asyncio
    async def test_assumir_chat_execption(self, _comprtilhamento_mongo_por_id):
        _comprtilhamento_mongo_por_id.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.assumir_chat("123", "P_1")
        assert exc_info.value.args[0] == "Teste exception"

    @pytest.mark.asyncio
    async def test_atualiza_chat_compartilhamento_sucesso(
        self,
        _retorna_compartilhamento,
        _buscar_chat,
        _atualiza_chat_compartilhamento,
    ):
        chat_stub = MockObjects.mock_chat_out
        compartilhamento_chat_stub = MockObjects.mock_compartilhamento_out

        _retorna_compartilhamento.return_value = compartilhamento_chat_stub
        _buscar_chat.return_value = chat_stub
        _atualiza_chat_compartilhamento.return_value = True

        is_atualizado = await compartilhamento_service.atualiza_chat_compartilhamento(
            "AbCsadsaASDAS", "user_teste"
        )

        assert is_atualizado == True

    @pytest.mark.asyncio
    async def test_atualiza_chat_compartilhamento_business_exception_quando_sem_chatid(
        self,
        _retorna_compartilhamento,
        _buscar_chat,
        _atualiza_chat_compartilhamento,
    ):
        try:
            await compartilhamento_service.atualiza_chat_compartilhamento(
                "", "user_teste"
            )

        except BusinessException as exc_info:
            assert (
                exc_info.args[0]
                == "O id de compartilhamento deve ter entre 1 e 60 caracteres."
            )
            return

        pytest.fail("Deveria ter lançado uma exceção BusinessException")

    @pytest.mark.asyncio
    async def test_atualiza_chat_compartilhamento_exception_diversa(
        self,
        _retorna_compartilhamento,
        _buscar_chat,
        _atualiza_chat_compartilhamento,
    ):
        _retorna_compartilhamento.side_effect = Exception("Teste exception")
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.atualiza_chat_compartilhamento(
                "ABC1234DEF456", "user_teste"
            )

        assert (
            exc_info.value.args[0]
            == "Não foi possível atualizar o chat com id de compartilhamento: ABC1234DEF456"
        )

    @pytest.mark.asyncio
    async def test_retorna_compartilhamento_by_chat_id_sucesso(
        self, _retorna_compartilhamento_by_chatid
    ):

        compartilhaement_stub = MockObjects.mock_compartilhamento_out
        _retorna_compartilhamento_by_chatid.return_value = compartilhaement_stub

        compartilhamento_retorno = (
            await compartilhamento_service.retorna_compartilhamento_by_chatid(
                "122",
                "user_teste",
            )
        )
        assert compartilhamento_retorno.id == compartilhaement_stub.id

    @pytest.mark.asyncio
    async def test_retorna_compartilhamento_by_chat_id_business_exception_chatid_invalido_vazio(
        self, _retorna_compartilhamento_by_chatid
    ):
        try:
            await compartilhamento_service.retorna_compartilhamento_by_chatid(
                "", "user_teste"
            )
        except BusinessException as exc_info:
            assert (
                exc_info.args[0]
                == "Parâmetro id_chat não pode ser nulo ou maior do que 60"
            )
            return

        pytest.fail("Deveria ter lançado uma exceção BusinessException")

    @pytest.mark.asyncio
    async def test_retorna_compartilhamento_by_chat_id_business_exception_chatid_invalido_null(
        self, _retorna_compartilhamento_by_chatid
    ):
        try:
            await compartilhamento_service.retorna_compartilhamento_by_chatid(
                None, "user_teste"
            )
        except BusinessException as exc_info:
            assert (
                exc_info.args[0]
                == "Parâmetro id_chat não pode ser nulo ou maior do que 60"
            )
            return

        pytest.fail("Deveria ter lançado uma exceção BusinessException")

    @pytest.mark.asyncio
    async def test_retorno_compartilhamento_by_chatid_quando_nao_encontra_compartilhamento(
        self, _retorna_compartilhamento_by_chatid
    ):
        compartilhamento_retornado_stub = None
        _retorna_compartilhamento_by_chatid.return_value = (
            compartilhamento_retornado_stub
        )

        try:
            await compartilhamento_service.retorna_compartilhamento_by_chatid(
                "ABC123", "user_teste"
            )

        except BusinessException as exc_info:
            assert (
                exc_info.args[0]
                == "Não foi encontrado um compartilhamento para o chat: ABC123"
            )
            return

        pytest.fail("Deveria ter lançado uma exceção BusinessException")

    @pytest.mark.asyncio
    async def test_retorna_compartilhamento_by_chatid_exception_diversa(
        self, _retorna_compartilhamento_by_chatid
    ):
        _retorna_compartilhamento_by_chatid.side_effect = Exception(
            "Exception Diversa!"
        )
        with pytest.raises(Exception) as exc_info:
            await compartilhamento_service.retorna_compartilhamento_by_chatid(
                "ABC123", "user_teste"
            )

        assert (
            exc_info.value.args[0]
            == "Erro ao resgatar o compartilhamento pelo chat de id: ABC123"
        )
