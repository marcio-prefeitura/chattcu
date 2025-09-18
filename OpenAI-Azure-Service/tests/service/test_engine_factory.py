from unittest.mock import MagicMock

import pytest

from src.domain.agent_config import AgentConfig
from src.domain.agent_core import AgentCore
from src.domain.llm.rag.engine_factory import EngineFactory
from src.domain.schemas import ChatGptInput
from src.infrastructure.env_agent_config import get_agent_config
from src.infrastructure.security_tokens import DecodedToken


@pytest.fixture
def mock_chat_input():
    mock_input = MagicMock(spec=ChatGptInput)
    mock_input.arquivos_selecionados = []
    mock_input.arquivos_selecionados_prontos = []
    mock_input.tool_selecionada = None
    mock_input.stream = None
    mock_input.temperature = 0
    return mock_input


@pytest.fixture
def mock_token():
    return MagicMock(spec=DecodedToken)


@pytest.fixture
def setup_agents_config():
    get_agent_config()["RAGDocumentos"] = "agent_1"
    get_agent_config()["LLM"] = "agent_2"
    get_agent_config()["EspecificTollRag"] = "agent_3"
    get_agent_config()["ConversationalRAG"] = "agent_4"


class TestEngineFactory:

    def test_create_engine_with_files(
        self, mock_chat_input, mock_token, setup_agents_config
    ):
        mock_chat_input.arquivos_selecionados_prontos = ["file1"]
        mock_chat_input.arquivos_selecionados = []
        mock_chat_input.tool_selecionada = None
        app_origem = "app_1"
        mock_token.roles = []

        engine = EngineFactory.create_engine(
            chat_id="chat_123",
            chat_input=mock_chat_input,
            token=mock_token,
            app_origem=app_origem,
            client_app_header="chat-tcu-playground",
        )

        assert isinstance(engine, AgentCore)
        assert engine.chatinput == mock_chat_input
        assert engine.agent == get_agent_config()["RAGDocumentos"]
        assert engine.app_origem == app_origem
        assert engine.token == mock_token

    def test_create_engine_with_tool_selection(
        self, mock_chat_input, mock_token, setup_agents_config
    ):
        mock_chat_input.arquivos_selecionados_prontos = []
        mock_chat_input.arquivos_selecionados = []
        mock_chat_input.tool_selecionada = "CONHECIMENTOGERAL"
        app_origem = "app_2"
        mock_token.roles = []
        engine = EngineFactory.create_engine(
            chat_id="chat_123",
            chat_input=mock_chat_input,
            token=mock_token,
            app_origem=app_origem,
            client_app_header="chat-tcu-playground",
        )

        assert isinstance(engine, AgentCore)
        assert engine.chatinput == mock_chat_input
        assert engine.agent == get_agent_config()["LLM"]
        assert engine.app_origem == app_origem
        assert engine.token == mock_token

    def test_create_engine_with_other_tool(
        self, mock_chat_input, mock_token, setup_agents_config
    ):
        mock_chat_input.arquivos_selecionados_prontos = []
        mock_chat_input.arquivos_selecionados = []
        mock_chat_input.tool_selecionada = "OTHER_TOOL"
        app_origem = "app_3"
        mock_token.roles = []
        engine = EngineFactory.create_engine(
            chat_id="chat_123",
            chat_input=mock_chat_input,
            token=mock_token,
            app_origem=app_origem,
            client_app_header="chat-tcu-playground",
        )

        assert isinstance(engine, AgentCore)
        assert engine.chatinput == mock_chat_input
        assert engine.agent == get_agent_config()["EspecificTollRag"]
        assert engine.app_origem == app_origem
        assert engine.token == mock_token

    def test_create_engine_with_no_tool_and_no_files(
        self, mock_chat_input, mock_token, setup_agents_config
    ):
        mock_chat_input.arquivos_selecionados_prontos = []
        mock_chat_input.arquivos_selecionados = []
        mock_chat_input.tool_selecionada = None
        mock_chat_input.config = AgentConfig(
            labelAgente="Agent1",
            valueAgente="Value1",
            selected=True,
            quebraGelo=["Quebra Gelo 1"],
            autor="Autor 1",
            descricao="Descricao 1",
            icon="Icon 1",
            instrucoes="Instrucoes 1",
        )
        app_origem = "app_4"
        mock_token.roles = ["P400S1"]
        engine = EngineFactory.create_engine(
            chat_id="chat_123",
            chat_input=mock_chat_input,
            token=mock_token,
            app_origem=app_origem,
            client_app_header="chat-tcu-playground",
        )

        rag_ = get_agent_config()["ConversationalRAG"]
        rag_.msg_sistema = "Instrucoes 1"

        assert isinstance(engine, AgentCore)
        assert engine.chatinput == mock_chat_input
        assert engine.agent == rag_
        assert engine.app_origem == app_origem
        assert engine.token == mock_token
