import base64
import logging
from datetime import datetime

import pytest
from aioresponses import aioresponses

from src.domain.chat import Chat, Credencial
from src.domain.feedback import Feedback
from src.domain.llm.base import llm_base
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.reacao_enum import ReacaoEnum
from src.domain.schemas import (
    ChatGptInput,
    ChatOut,
    FeedbackOut,
    FiltrosChat,
    MessageOut,
    ReagirInput,
)
from src.infrastructure.cognitive_search import cognitive_search
from src.service import chatgpt_service

logger = logging.getLogger(__name__)


class TestChatgptService:
    requests = []

    def _callback(self, url, **kwargs):
        self.requests.append(
            {"url": url, "json": kwargs.get("json"), "headers": kwargs.get("headers")}
        )

    @pytest.fixture
    def _chat_input(self):
        input_string = "teste"
        encoded_bytes = input_string.encode("utf-8")
        encoded_string = base64.b64encode(encoded_bytes).decode("utf-8")

        chat_input = ChatGptInput(prompt_usuario=encoded_string, login="teste")
        yield chat_input
        del chat_input

    @pytest.fixture
    def _chat(self, _msg):
        chat = Chat(
            id="0123",
            usuario="teste",
            titulo="titulo-teste",
            data_criacao=datetime.now(),
            data_ultima_iteracao=datetime.now(),
            mensagens=[_msg],
            credencial=Credencial(aplicacao_origem="teste", usuario="teste"),
        )

        yield chat
        del chat

    @pytest.fixture
    def _chat_out(self, _chat, _msg_out):
        out = ChatOut(
            apagado=False,
            data_criacao=str(_chat.data_criacao),
            data_ultima_iteracao=str(_chat.data_ultima_iteracao),
            fixado=False,
            arquivado=False,
            id=_chat.id,
            titulo=_chat.titulo,
            usuario=_chat.usuario,
            mensagens=[_msg_out],
        )

        yield out
        del out

    @pytest.fixture
    def _chat_dict(self):
        chat = {
            "hits": {
                "hits": [
                    {
                        "_id": "0123456789abcdef",
                        "_source": {
                            "chat": {
                                "usuario": "teste",
                                "titulo": "teste",
                                "data_ultima_iteracao": "2023-08-25 18:47:54",
                                "fixado": False,
                                "arquivado": False,
                            },
                            "mensagens": [
                                {
                                    "feedback": {
                                        "conteudo": "",
                                        "nao_ajudou": False,
                                        "inveridico": False,
                                        "ofensivo": False,
                                        "reacao": "",
                                    },
                                    "codigo": "c_0123456789abcdef_20230825184754_2",
                                    "papel": "USER",
                                    "conteudo": "teste",
                                    "favoritado": False,
                                    "arquivos_busca": "",
                                },
                                {
                                    "feedback": {
                                        "conteudo": "",
                                        "nao_ajudou": False,
                                        "inveridico": False,
                                        "ofensivo": False,
                                        "reacao": "",
                                    },
                                    "codigo": "c_0123456789abcdef_20230825184754_3",
                                    "papel": "ASSISTANT",
                                    "conteudo": "teste",
                                    "favoritado": False,
                                },
                            ],
                        },
                    }
                ]
            }
        }

        yield chat
        del chat

    @pytest.fixture
    def _reacao(self):
        reacao = Feedback(
            cod_mensagem="c_0123_0123_1",
            conteudo="feedback-teste",
            reacao=ReacaoEnum.LIKED,
        )

        yield reacao
        del reacao

    @pytest.fixture
    def _reacao_out(self, _reacao):
        _reacao = FeedbackOut(
            cod_mensagem="c_0123_0123_1",
            conteudo="feedback-teste",
            reacao=str(ReacaoEnum.LIKED.name),
            inveridico=False,
            nao_ajudou=False,
            ofensivo=False,
        )

        yield _reacao
        del _reacao

    @pytest.fixture
    def _msg(self, _reacao):
        msg = Mensagem(
            chat_id="0123",
            codigo="c_0123_0123_1",
            conteudo="mensagem de teste",
            papel=PapelEnum.ASSISTANT,
            data_envio=datetime.now(),
            feedback=_reacao,
            especialista_utilizado=None,
        )

        yield msg
        del msg

    @pytest.fixture
    def _msg_out(self, _reacao_out, _msg):
        _msg = MessageOut(
            chat_id="0123",
            codigo="c_0123_0123_1",
            conteudo="mensagem de teste",
            papel=str(PapelEnum.ASSISTANT.name),
            data_envio=str(datetime.now()),
            feedback=_reacao_out,
            arquivos_busca="",
            favoritado=False,
            parametro_tipo_busca="NA",
            parametro_nome_indice_busca="NA",
            parametro_quantidade_trechos_relevantes_busca=0,
            parametro_modelo_llm="GPT-35-Turbo-4k",
            parametro_versao_modelo_llm="2023-03-15-preview",
            arquivos_selecionados=[],
            arquivos_selecionados_prontos=[],
            trechos=[],
            especialista_utilizado=None,
        )

        yield _msg
        del _msg

    @pytest.fixture
    def _resposta(self):
        resp = {"usage": 1, "choices": [{"message": {"content": "Resposta simulada"}}]}

        yield resp
        del resp

    @pytest.fixture
    def _elastic_chat_service_mock(self, mocker):
        mock = mocker.Mock()
        mocker.patch.object(chatgpt_service, "ElasticSearch", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _buscar_chat(self, _chat, mocker):
        mock = mocker.AsyncMock(return_value=_chat)
        mocker.patch.object(chatgpt_service, "buscar_chat", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _search_client_rag_documentos(self, mocker):
        trechos = [
            {
                "hash": "teste1.pdf",
                "pagina_arquivo": "teste-2",
                "trecho": "teste",
                "parametro_tamanho_trecho": "5",
                "link_sistema": None,
                "@search.score": "95.0",
                "id": "teste1",
            },
            {
                "hash": "teste2.pdf",
                "pagina_arquivo": "teste-3",
                "trecho": "teste",
                "parametro_tamanho_trecho": "5",
                "link_sistema": None,
                "@search.score": "95.0",
                "id": "teste2",
            },
        ]

        async def async_generator(*args, **kwargs):
            for trecho in trechos:
                yield trecho

        mock = mocker.AsyncMock(side_effect=async_generator)
        mocker.patch.object(cognitive_search.SearchClient, "search", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _search_client_rag_sistema_casa(self, mocker):
        trechos = [
            {
                "nome_servico": "teste 1",
                "como_solicitar": "testando 1",
                "publico_alvo": "teste",
                "requisitos": "teste",
                "categoria": "teste",
                "link_sistema": "http://teste1",
                "palavras_chave": "teste1",
                "descricao_servico": "teste1",
                "codigo_servico": "123",
                "@search.score": "95.0",
            },
            {
                "nome_servico": "teste 2",
                "como_solicitar": "testando 2",
                "publico_alvo": "teste",
                "requisitos": "teste",
                "categoria": "teste",
                "link_sistema": "http://teste2",
                "palavras_chave": "teste2",
                "descricao_servico": "teste2",
                "codigo_servico": "123",
                "@search.score": "95.0",
            },
        ]

        async def async_generator(*args, **kwargs):
            for trecho in trechos:
                yield trecho

        mock = mocker.AsyncMock(side_effect=async_generator)
        mocker.patch.object(cognitive_search.SearchClient, "search", mock)

        yield mock
        mocker.stopall()

    @pytest.fixture
    def _mocked_mensagem_juris(self):
        OriginalMensagem = llm_base.Mensagem

        def create_mocked_mensagem_juris(*args, **kwargs):
            instance = OriginalMensagem(*args, **kwargs)
            instance.arquivos_busca = "Jurisprudência Selecionada"
            return instance

        return create_mocked_mensagem_juris

    @pytest.fixture
    def _aioresponses(self):
        """Fixture para mockar requisições HTTP assíncronas."""
        with aioresponses() as m:
            yield m

    @pytest.mark.asyncio
    async def test_renomear_chat(self, _elastic_chat_service_mock, _chat, mocker):
        _elastic_chat_service_mock.return_value.renomear = mocker.AsyncMock()

        await chatgpt_service.renomear(_chat.id, _chat.titulo)

        assert _elastic_chat_service_mock.call_count == 1
        assert _elastic_chat_service_mock.call_args_list == [
            (
                (
                    "propriedade-teste",
                    "propriedade-teste",
                    "http://propriedade-teste",
                    "openai-azure-log",
                ),
            )
        ]
        assert _elastic_chat_service_mock.return_value.renomear.call_count == 1

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_receber_novo_titulo_para_renomear(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.renomear = mocker.AsyncMock()

        with pytest.raises(Exception):
            await chatgpt_service.renomear(_chat.id, None)

        assert _elastic_chat_service_mock.return_value.renomear.called is False

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_receber_chat_invalido_para_renomear(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.renomear = mocker.AsyncMock()

        with pytest.raises(Exception):
            await chatgpt_service.renomear(None, _chat.titulo)

        assert _elastic_chat_service_mock.return_value.renomear.called is False

    @pytest.mark.asyncio
    async def test_apagar_todos_chats(self, _elastic_chat_service_mock, _chat, mocker):
        _elastic_chat_service_mock.return_value.apagar_todos = mocker.AsyncMock(
            return_value={"updated": "1"}
        )
        _elastic_chat_service_mock.return_value.listar_chats = mocker.AsyncMock(
            return_value=[_chat]
        )

        await chatgpt_service.apagar_todos(_chat.usuario, "teste", True)

        assert _elastic_chat_service_mock.call_count == 1
        assert _elastic_chat_service_mock.call_args_list == [
            (
                (
                    "propriedade-teste",
                    "propriedade-teste",
                    "http://propriedade-teste",
                    "openai-azure-log",
                ),
            )
        ]
        assert _elastic_chat_service_mock.return_value.apagar_todos.call_count == 1

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_falhar_em_apagar_todos_chats(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.apagar_todos = mocker.AsyncMock(
            return_value=None
        )

        with pytest.raises(Exception):
            await chatgpt_service.apagar_todos(None, "teste", False)

        assert _elastic_chat_service_mock.return_value.apagar_todos.called is False

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_receber_usuario_invalido_para_apagar_todos_chats(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.elasticsearch_query = mocker.Mock(
            return_value={"updated": "1"}
        )

        with pytest.raises(Exception):
            await chatgpt_service.apagar_todos(None, "teste", False)

        assert (
            _elastic_chat_service_mock.return_value.elasticsearch_query.called is False
        )

    @pytest.mark.asyncio
    async def test_desafixar_todos_chats(
        self, _elastic_chat_service_mock, _chat, mocker
    ):
        _elastic_chat_service_mock.return_value.alterna_fixar_chats_por_ids = (
            mocker.AsyncMock(return_value={"updated": "1"})
        )

        await chatgpt_service.alterna_fixar_por_ids(
            chatids=[_chat.id], app_origem="teste", usuario=_chat.usuario, fixar=True
        )

        assert _elastic_chat_service_mock.call_count == 1
        assert _elastic_chat_service_mock.call_args_list == [
            (
                (
                    "propriedade-teste",
                    "propriedade-teste",
                    "http://propriedade-teste",
                    "openai-azure-log",
                ),
            )
        ]
        assert (
            _elastic_chat_service_mock.return_value.alterna_fixar_chats_por_ids.call_count
            == 1
        )

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_falhar_em_desafixar_todos_chats(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.alterna_fixar_chats_por_ids = (
            mocker.AsyncMock(return_value=None)
        )

        with pytest.raises(Exception):
            await chatgpt_service.alterna_fixar_por_ids(
                chatids=[], app_origem="teste", usuario=None, fixar=True
            )

        assert (
            _elastic_chat_service_mock.return_value.alterna_fixar_chats_por_ids.called
            is False
        )

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_receber_usuario_invalido_para_desafixar_todos_chats(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.elasticsearch_query = mocker.Mock(
            return_value={"updated": "1"}
        )

        with pytest.raises(Exception):
            await chatgpt_service.apagar_todos(None, "teste", False)

        assert (
            _elastic_chat_service_mock.return_value.elasticsearch_query.called is False
        )

    @pytest.mark.asyncio
    async def test_alterna_arquivar_chats_por_ids(
        self,
        _aioresponses,
        # _elastic_chat_service_mock,
        _chat,
        mocker,
    ):

        _aioresponses.post(
            f"http://propriedade-teste/{chatgpt_service.INDICE_ELASTIC}/_doc/_update_by_query",
            payload={"updated": "1"},
        )

        await chatgpt_service.alterna_arquivar_por_ids(
            chatids=[_chat.id], app_origem="teste", usuario=_chat.usuario, arquivar=True
        )

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_falhar_em_alterna_arquivar_chats_por_ids(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.alterna_arquivar_chats_por_ids = (
            mocker.AsyncMock(return_value=None)
        )

        with pytest.raises(Exception):
            await chatgpt_service.alterna_arquivar_por_ids(
                chatids=[], app_origem="teste", usuario=None, arquivar=True
            )

        assert (
            _elastic_chat_service_mock.return_value.alterna_arquivar_chats_por_ids.called
            is False
        )

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_receber_usuario_invalido_para_alterna_arquivar_chats_por_ids(
        self, _elastic_chat_service_mock, _chat, mocker, _msg
    ):
        _elastic_chat_service_mock.return_value.elasticsearch_query = mocker.Mock(
            return_value={"updated": "1"}
        )

        with pytest.raises(Exception):
            await chatgpt_service.alterna_arquivar_por_ids(
                chatids=[], app_origem="teste", usuario=None, arquivar=True
            )

        assert (
            _elastic_chat_service_mock.return_value.elasticsearch_query.called is False
        )

    @pytest.mark.asyncio
    async def test_buscar_chat(
        self, _elastic_chat_service_mock, _chat, _chat_out, mocker
    ):
        _elastic_chat_service_mock.return_value.buscar_chat = mocker.AsyncMock(
            return_value=_chat_out
        )

        await chatgpt_service.buscar_chat(_chat.id, _chat.usuario)

        assert _elastic_chat_service_mock.call_count == 1
        assert _elastic_chat_service_mock.call_args_list == [
            (
                (
                    "propriedade-teste",
                    "propriedade-teste",
                    "http://propriedade-teste",
                    "openai-azure-log",
                ),
            )
        ]
        assert _elastic_chat_service_mock.return_value.buscar_chat.call_count == 1

    @pytest.mark.asyncio
    async def test_deve_lancar_excecao_ao_receber_chat_id_invalido_para_buscar_chat(
        self, _elastic_chat_service_mock, _chat, mocker
    ):
        _elastic_chat_service_mock.return_value.elasticsearch_query = mocker.Mock(
            return_value={"hits": {"hits": ["teste"]}}
        )

        with pytest.raises(Exception):
            await chatgpt_service.buscar_chat(None, None)

        assert (
            _elastic_chat_service_mock.return_value.elasticsearch_query.called is False
        )

    @pytest.mark.asyncio
    async def test_adicionar_feedback(
        self, _reacao, _elastic_chat_service_mock, mocker
    ):
        _elastic_chat_service_mock.return_value.adicionar_feedback = mocker.AsyncMock(
            return_value={"result": "updated"}
        )

        entrada = ReagirInput(
            reacao=str(_reacao.reacao),
            conteudo=_reacao.conteudo,
            ofensivo=_reacao.ofensivo,
            inveridico=_reacao.inveridico,
            nao_ajudou=_reacao.nao_ajudou,
        )

        await chatgpt_service.adicionar_feedback(
            entrada,
            chat_id="0123",
            app_origem="teste",
            cod_mensagem=_reacao.cod_mensagem,
            usuario="teste",
        )

        assert _elastic_chat_service_mock.called is True
        assert (
            _elastic_chat_service_mock.return_value.adicionar_feedback.call_count == 1
        )

    @pytest.mark.asyncio
    async def test_lancar_excecao_ao_nao_identificar_chat_em_adicionar_feedback(
        self, _reacao, _elastic_chat_service_mock, mocker
    ):
        _elastic_chat_service_mock.return_value.adicionar_feedback = mocker.AsyncMock(
            return_value={"result": ""}
        )

        entrada = ReagirInput(
            reacao=str(_reacao.reacao),
            conteudo=_reacao.conteudo,
            ofensivo=_reacao.ofensivo,
            inveridico=_reacao.inveridico,
            nao_ajudou=_reacao.nao_ajudou,
        )

        with pytest.raises(Exception) as exc_info:
            await chatgpt_service.adicionar_feedback(
                entrada,
                chat_id="",
                app_origem="teste",
                cod_mensagem=_reacao.cod_mensagem,
                usuario="teste",
            )

        assert exc_info.type == ValueError
        assert _elastic_chat_service_mock.called is False
        assert (
            _elastic_chat_service_mock.return_value.adicionar_feedback.called is False
        )

    @pytest.mark.asyncio
    async def test_lancar_excecao_ao_nao_identificar_mensagem_em_adicionar_feedback(
        self, _reacao, _elastic_chat_service_mock, mocker
    ):
        _elastic_chat_service_mock.return_value.adicionar_feedback = mocker.AsyncMock(
            return_value={"result": ""}
        )

        entrada = ReagirInput(
            reacao=str(_reacao.reacao),
            conteudo=_reacao.conteudo,
            ofensivo=_reacao.ofensivo,
            inveridico=_reacao.inveridico,
            nao_ajudou=_reacao.nao_ajudou,
        )

        with pytest.raises(Exception) as exc_info:
            await chatgpt_service.adicionar_feedback(
                entrada,
                chat_id="0123",
                app_origem="teste",
                cod_mensagem="",
                usuario="teste",
            )

        assert exc_info.type == ValueError
        assert _elastic_chat_service_mock.called is False
        assert (
            _elastic_chat_service_mock.return_value.adicionar_feedback.called is False
        )

    @pytest.mark.asyncio
    async def test_listar_chats_paginados_excecao(self):
        app_origem = "test_app"
        filtros = FiltrosChat(
            fixados=False, page=1, per_page=10, searchText="", arquivados=False
        )

        with pytest.raises(Exception) as exc_info:
            await chatgpt_service.listar_chats_paginados("", app_origem, filtros)

        assert exc_info.type == ValueError
        assert exc_info.value.args[0] == "Não foi possível identificar o usuário!"
