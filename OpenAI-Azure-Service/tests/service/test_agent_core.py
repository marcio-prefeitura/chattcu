import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.documents import Document
from langchain_core.language_models import BaseLLM
from starlette.responses import StreamingResponse

from src.domain.agent import Agent
from src.domain.agent_core import AgentCore
from src.domain.schemas import ChatGptInput, ChatLLMResponse
from src.infrastructure.env import VERBOSE
from src.infrastructure.security_tokens import DecodedToken
from tests.util.mock_objects import MockObjects


class MockCallbackHandler(BaseCallbackHandler):
    def __init__(self):
        super().__init__()
        self.prompt_set = None

    async def aiter(self):
        # Simula o comportamento de um fluxo assíncrono
        for chunk in ["test_response"]:
            yield chunk

    def on_event(self, *args, **kwargs):
        pass

    def set_prompt(self, prompt: str):
        self.prompt_set = prompt

    def set_done(self, done_callable):
        self.done = done_callable


class MockTask:
    def __init__(self, coro):
        self._coro = coro

    def __await__(self):
        return self._coro.__await__()

    def cancel(self):
        pass


class TestAgentCore:

    @pytest.fixture
    def mock_dependencies(self, decoded_token):
        chatinput = ChatGptInput(
            arquivos_selecionados_prontos=[],
            arquivos_selecionados=[],
            stream=True,
            tool_selecionada=None,
            prompt_usuario="test prompt",
            top_documentos=5,
            correlacao_chamada_id="correlacao_id",
        )
        agent = MagicMock(Agent)
        agent.msg_sistema = ""
        agent.use_llm_chain = True
        app_origem = "test_app"

        return chatinput, agent, app_origem, decoded_token

    @patch("src.domain.llm.base.llm_base.tiktoken")
    def test_agentcore_initialization(self, mock_tiktoken, mock_dependencies):
        chatinput, agent, app_origem, token = mock_dependencies
        agent_core = AgentCore(
            chat_id="chat_id",
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        assert agent_core.chatinput == chatinput
        assert agent_core.agent == agent
        assert agent_core.app_origem == app_origem
        assert agent_core.token == token
        assert agent_core.stream == chatinput.stream
        assert agent_core.verbose == VERBOSE

    @pytest.mark.asyncio
    async def test_prepara_prompt_sem_documentos(self, mock_dependencies):
        chatinput, agent, app_origem, token = mock_dependencies
        agent_core = AgentCore(
            chat_id="chat_id",
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        agent_core._create_mensagem = MagicMock(return_value="mensagem_mock")

        result = await agent_core._prepara_prompt()

        assert agent_core.msg == "mensagem_mock"
        assert result == "mensagem_mock"

    @pytest.mark.asyncio
    async def test_prepara_prompt_documentos(self, mock_dependencies):
        chatinput, agent, app_origem, token = mock_dependencies
        chatinput.arquivos_selecionados_prontos = ["doc1"]
        agent_core = AgentCore(
            chat_id="chat_id",
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        mock_llm = MagicMock(spec=BaseLLM)
        agent_core._get_llm = MagicMock(return_value=mock_llm)
        agent_core._buscar_docs_relevantes = AsyncMock(
            return_value={"content": "docs", "trechos": []}
        )
        agent_core._create_mensagem = MagicMock()

        # Mock da função 'ainvoke' na cadeia de execução
        with patch(
            "langchain.schema.runnable.RunnableSequence.ainvoke",
            new_callable=AsyncMock,
            return_value=json.dumps({"pergunta": "result"}),
        ):
            await agent_core._prepara_prompt_documentos()

        agent_core._buscar_docs_relevantes.assert_called_once_with(
            chatinput, {"pergunta": "result"}
        )
        agent_core._create_mensagem.assert_called_once()

    @pytest.mark.asyncio
    async def test_buscar_docs_relevantes(self):
        chatinput = ChatGptInput(
            prompt_usuario="Test prompt",
            arquivos_selecionados_prontos=["doc1", "doc2"],
            top_documentos=5,
        )
        token = DecodedToken(
            login="test_user",
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )

        agent_core = AgentCore(
            chat_id="test_chat_id",
            chatinput=chatinput,
            agent=AsyncMock(),
            app_origem="test_app",
            token=token,
        )

        agent_core._find_documentos_utilizados = AsyncMock(
            return_value=["doc1", "doc2"]
        )
        agent_core._find_trechos_relevantes = AsyncMock(
            return_value={"content": "test_content", "trechos": []}
        )

        result = await agent_core._buscar_docs_relevantes(chatinput)

        agent_core._find_documentos_utilizados.assert_called_once_with(chatinput, token)
        agent_core._find_trechos_relevantes.assert_called_once_with(
            token=token,
            docs_sel=["doc1", "doc2"],
            top_documents=chatinput.top_documentos,
            resp=None,
        )
        assert result == {"content": "test_content", "trechos": []}

    @pytest.mark.asyncio
    async def test_get_response(self, mock_dependencies):
        mock_llm = AsyncMock()
        mock_prompt = MagicMock()
        mock_callback = MockCallbackHandler()
        chatinput, agent, app_origem, token = mock_dependencies

        with patch.object(AgentCore, "_get_llm", return_value=mock_llm):
            agent_core = AgentCore(
                chat_id="test_chat_id",
                chatinput=chatinput,
                agent=agent,
                app_origem=app_origem,
                token=token,
            )
            agent_core.historico = True
            agent_core.prompt = mock_prompt
            agent_core.callback = mock_callback

            mock_chain = MagicMock()
            mock_chain.with_config.return_value = mock_chain
            mock_chain.ainvoke = AsyncMock(return_value="test_response")

            with patch(
                "langchain.schema.runnable.RunnableSequence.ainvoke",
                return_value=mock_chain,
            ):
                mock_task = MockTask(mock_chain.ainvoke({"input": "test_prompt"}))
                with patch("asyncio.create_task", return_value=mock_task):
                    response = await agent_core._get_response(agent_core.chatinput)
                    assert response == "test_response"
                    assert mock_callback.prompt_set == mock_prompt.format(
                        **{"input": "test_prompt"}
                    )

    @pytest.mark.asyncio
    async def test_get_response_by_streaming(self, mock_dependencies):
        mock_llm = AsyncMock()
        mock_prompt = MagicMock()
        mock_callback = MockCallbackHandler()
        chatinput, agent, app_origem, token = mock_dependencies

        with patch.object(AgentCore, "_get_llm", return_value=mock_llm):
            agent_core = AgentCore(
                chat_id="test_chat_id",
                chatinput=chatinput,
                agent=agent,
                app_origem=app_origem,
                token=token,
            )
            agent_core.historico = True
            agent_core.prompt = mock_prompt
            agent_core.callback = mock_callback
            agent_core.msg1 = MockObjects.mock_mensagem
            agent_core.msg2 = MockObjects.mock_mensagem
            agent_core.msg = MockObjects.mock_mensagem
            mock_chain = MagicMock()
            mock_chain.with_config.return_value = mock_chain
            mock_chain.ainvoke = AsyncMock(return_value="test_response")

            with patch(
                "langchain.schema.runnable.RunnableSequence.ainvoke",
                return_value=mock_chain,
            ):
                mock_task = MockTask(mock_chain.ainvoke({"input": "test_prompt"}))
                with patch("asyncio.create_task", return_value=mock_task):
                    mock_callback.set_done(AsyncMock())
                    response = []
                    async for chunk in agent_core._get_response_by_streaming(
                        agent_core.chatinput, "test_title"
                    ):
                        response.append(chunk)
                    assert response == [
                        '{"chat_id": "test_chat_id", "chat_titulo": "test_title", "codigo_prompt": '
                        '"teste_codigo", "response": "test_response", "codigo_response": '
                        '"teste_codigo", "trechos": [{"id_arquivo_mongo": null, "conteudo": '
                        '"Teste-123: Descri\\u00e7\\u00e3o Teste; como solicitar o servi\\u00e7o: '
                        "ajuda.com; link do sistema para solicitar o servi\\u00e7o: sistema.com; "
                        "p\\u00fablico alvo do servi\\u00e7o: publico_alvo.com; link com mais "
                        'informa\\u00e7\\u00f5es: https://casa.apps.tcu.gov.br/servico/1", '
                        '"id_registro": "Teste-123", "pagina_arquivo": null, "search_score": 1.0, '
                        '"parametro_tamanho_trecho": null, "link_sistema": "sistema.com"}], '
                        '"arquivos_busca": "Sistema CASA"}\n'
                        "\n"
                    ]

    @pytest.mark.asyncio
    async def test_executar_prompt(self, mock_dependencies):
        chatinput, agent, app_origem, token = mock_dependencies
        chatinput.parametro_modelo_llm = "o1"
        agent_core = AgentCore(
            chat_id=None,
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        agent_core._define_model = AsyncMock()
        agent_core._criar_novo_chat_com_input = AsyncMock(
            return_value=("new_chat_id", "new_title")
        )
        agent_core._carregar_historico_para_prompt = AsyncMock(return_value=[])
        agent_core._prepara_prompt = AsyncMock()
        agent_core._registrar_mensagens = AsyncMock()
        agent_core._processar_resposta_adapter_stream = AsyncMock(
            return_value=StreamingResponse
        )
        agent_core._processar_resposta = AsyncMock(return_value=ChatLLMResponse)
        agent_core._enviar_resposta_por_stream = AsyncMock(
            return_value=StreamingResponse
        )
        agent_core.client_app_header = "chat-tcu-playground"
        response = await agent_core.executar_prompt()

        agent_core._define_model.assert_called_once_with(
            arg_model=chatinput.parametro_modelo_llm
        )

        agent_core._prepara_prompt.assert_called_once()
        agent_core._registrar_mensagens.assert_called_once_with(
            chat_id="new_chat_id", chatinput=chatinput
        )
        agent_core._processar_resposta_adapter_stream.assert_called_once_with(
            chat_id="new_chat_id", chatinput=chatinput, titulo="new_title"
        )
        assert response == StreamingResponse

    @pytest.mark.asyncio
    async def test_executar_prompt_not_new_chat(self, mock_dependencies):
        chatinput, agent, app_origem, token = mock_dependencies
        chatinput.stream = False
        agent_core = AgentCore(
            chat_id="new_chat_id",
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        agent_core._define_model = AsyncMock()
        agent_core._criar_novo_chat_com_input = AsyncMock(
            return_value=("new_chat_id", "new_title")
        )
        agent_core._carregar_historico_para_prompt = AsyncMock(return_value=[])
        agent_core._prepara_prompt = AsyncMock()
        agent_core._registrar_mensagens = AsyncMock()
        agent_core._processar_resposta_adapter_stream = AsyncMock(
            return_value=StreamingResponse
        )
        agent_core._processar_resposta = AsyncMock(return_value=ChatLLMResponse)
        agent_core._enviar_resposta_por_stream = AsyncMock(
            return_value=StreamingResponse
        )
        agent_core.client_app_header = "chat-tcu-playground"
        await agent_core.executar_prompt()

        agent_core._define_model.assert_called_once_with(
            arg_model=chatinput.parametro_modelo_llm
        )

        agent_core._carregar_historico_para_prompt.assert_called_once_with(
            chat_id="new_chat_id", login=token.login
        )

        agent_core._prepara_prompt.assert_called_once()
        agent_core._registrar_mensagens.assert_called_once_with(
            chat_id="new_chat_id", chatinput=chatinput
        )
        agent_core._processar_resposta.assert_called_once_with(
            chat_id="new_chat_id", chatinput=chatinput, titulo=""
        )

    @pytest.mark.asyncio
    async def test_executar_prompt_not_o1(self, mock_dependencies):
        chatinput, agent, app_origem, token = mock_dependencies
        agent_core = AgentCore(
            chat_id=None,
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        agent_core._define_model = AsyncMock()
        agent_core._criar_novo_chat_com_input = AsyncMock(
            return_value=("new_chat_id", "new_title")
        )
        agent_core._carregar_historico_para_prompt = AsyncMock(return_value=[])
        agent_core._prepara_prompt = AsyncMock()
        agent_core._registrar_mensagens = AsyncMock()
        agent_core._processar_resposta_adapter_stream = AsyncMock(
            return_value=StreamingResponse
        )
        agent_core._processar_resposta = AsyncMock(return_value=ChatLLMResponse)
        agent_core._enviar_resposta_por_stream = AsyncMock(
            return_value=StreamingResponse
        )
        agent_core.client_app_header = "chat-tcu-playground"
        await agent_core.executar_prompt()

        agent_core._define_model.assert_called_once_with(
            arg_model=chatinput.parametro_modelo_llm
        )

        agent_core._prepara_prompt.assert_called_once()
        agent_core._registrar_mensagens.assert_called_once_with(
            chat_id="new_chat_id", chatinput=chatinput
        )
        agent_core._enviar_resposta_por_stream.assert_called_once_with(
            chatinput=chatinput, titulo="new_title"
        )

    @patch("src.domain.agent_core.RetrieverRelevantDocumentsFactory.create_retriever")
    @patch("src.domain.agent_core.get_agent_config")
    @pytest.mark.asyncio
    async def test_prepara_prompt_tool_especifica(
        self, mock_get_agent_config, mock_create_retriever, mock_dependencies
    ):
        chatinput, agent, app_origem, token = mock_dependencies
        chatinput.tool_selecionada = "JURISPRUDENCIA"
        agent_core = AgentCore(
            chat_id=None,
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        mock_retriever = AsyncMock()
        doc = Document(
            page_content="Test output",
        )
        mock_retriever.execute.return_value = [doc]
        mock_create_retriever.return_value = mock_retriever
        mock_get_agent_config.return_value = {
            "SOURCE": "Source: {sources}",
            "COMPLEMENTO_MSG_CASA": "Complemento Casa",
            "COMPLEMENTO_MSG_TOOL": "Complemento Tool",
        }

        await agent_core._prepara_prompt_tool_especifica()

        assert agent_core.agent.msg_sistema == "Complemento ToolSource: Test output"

    @patch("src.domain.agent_core.RetrieverRelevantDocumentsFactory.create_retriever")
    @patch("src.domain.agent_core.get_agent_config")
    @pytest.mark.asyncio
    async def test_prepara_prompt_tool_especifica_sumarizacao(
        self, mock_get_agent_config, mock_create_retriever, mock_dependencies
    ):
        chatinput, agent, app_origem, token = mock_dependencies
        chatinput.tool_selecionada = "SUMARIZACAO"

        agent_core = AgentCore(
            chat_id=None,
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )
        agent_core.msg = MockObjects.mock_mensagem

        mock_retriever = AsyncMock()
        mock_retriever.execute.return_value = {"output": "Test output"}
        mock_create_retriever.return_value = mock_retriever
        mock_get_agent_config.return_value = {
            "SOURCE": "Source: {sources}",
            "COMPLEMENTO_MSG_CASA": "Complemento Casa",
            "COMPLEMENTO_MSG_TOOL": "Complemento Tool",
        }

        await agent_core._prepara_prompt_tool_especifica()

        assert agent_core.agent.msg_sistema == (
            " Resposta para a solicitação " '"test prompt": \n\nTest output'
        )

    @patch("src.domain.agent_core.RetrieverRelevantDocumentsFactory.create_retriever")
    @patch("src.domain.agent_core.get_agent_config")
    @pytest.mark.asyncio
    async def test_prepara_prompt_tool_especifica_administrativa(
        self, mock_get_agent_config, mock_create_retriever, mock_dependencies
    ):
        chatinput, agent, app_origem, token = mock_dependencies
        chatinput.tool_selecionada = "ADMINISTRATIVA"
        agent_core = AgentCore(
            chat_id=None,
            chatinput=chatinput,
            agent=agent,
            app_origem=app_origem,
            token=token,
        )

        mock_retriever = AsyncMock()
        doc = Document(
            page_content="Test output",
        )
        mock_retriever.execute.return_value = [doc]
        mock_create_retriever.return_value = mock_retriever
        mock_get_agent_config.return_value = {
            "SOURCE": "Source: {sources}",
            "COMPLEMENTO_MSG_CASA": "Complemento Casa",
            "COMPLEMENTO_MSG_TOOL": "Complemento Tool",
        }

        await agent_core._prepara_prompt_tool_especifica()

        assert agent_core.agent.msg_sistema == "Source: Test outputComplemento Casa"
