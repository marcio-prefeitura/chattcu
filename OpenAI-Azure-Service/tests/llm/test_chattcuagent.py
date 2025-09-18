from unittest.mock import MagicMock, patch

import pytest
from langchain.agents import AgentExecutor
from langchain.tools import BaseTool
from langchain_core.callbacks import BaseCallbackManager
from langchain_core.language_models import BaseLanguageModel

from src.domain.llm.chattcuagent import ChatTCUAgentMonique, initialize_agent2


@pytest.fixture
def mock_tools():
    return [MagicMock(spec=BaseTool)]


@pytest.fixture
def mock_llm():
    return MagicMock(spec=BaseLanguageModel)


@pytest.fixture
def mock_callback_manager():
    return MagicMock(spec=BaseCallbackManager)


@pytest.fixture
def mock_agent():
    return MagicMock(spec=ChatTCUAgentMonique)


def test_initialize_agent2_missing_agent_kwargs(
    mock_tools, mock_llm, mock_callback_manager
):
    with patch(
        "src.domain.llm.chattcuagent.AgentExecutor.from_agent_and_tools",
        return_value=MagicMock(spec=AgentExecutor),
    ) as mock_from_agent_and_tools:

        agent_executor = initialize_agent2(
            tools=mock_tools,
            llm=mock_llm,
            callback_manager=mock_callback_manager,
            system_message="Test system message",
            verbose=True,
        )
        mock_from_agent_and_tools.assert_called_once()
        assert isinstance(agent_executor, AgentExecutor)


def test_initialize_agent2_with_missing_tools(mock_llm, mock_callback_manager):
    with patch(
        "src.domain.llm.chattcuagent.AgentExecutor.from_agent_and_tools",
        return_value=MagicMock(spec=AgentExecutor),
    ) as mock_from_agent_and_tools:

        agent_executor = initialize_agent2(
            tools=[],
            llm=mock_llm,
            callback_manager=mock_callback_manager,
            system_message="Test system message",
            verbose=True,
        )
        mock_from_agent_and_tools.assert_called_once()
        assert isinstance(agent_executor, AgentExecutor)


def test_initialize_agent2_with_invalid_llm(mock_tools, mock_callback_manager):
    """Test the initialize_agent2 function with invalid LLM"""
    with patch(
        "src.domain.llm.chattcuagent.AgentExecutor.from_agent_and_tools",
        return_value=MagicMock(spec=AgentExecutor),
    ) as mock_from_agent_and_tools:

        invalid_llm = MagicMock(spec=BaseLanguageModel)
        invalid_llm.some_invalid_method = True

        agent_executor = initialize_agent2(
            tools=mock_tools,
            llm=invalid_llm,
            callback_manager=mock_callback_manager,
            system_message="Test system message",
            verbose=True,
        )
        mock_from_agent_and_tools.assert_called_once()
        assert isinstance(agent_executor, AgentExecutor)
