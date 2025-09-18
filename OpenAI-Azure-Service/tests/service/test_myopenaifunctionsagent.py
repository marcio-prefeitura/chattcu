from unittest.mock import AsyncMock, MagicMock

import pytest

from src.domain.llm.myopenaifunctionsagent import (
    AgentFinish,
    BaseLanguageModel,
    BasePromptTemplate,
    MyOpenAIFunctionsAgent,
    OpenAIFunctionsAgentOutputParser,
)


class TestMyOpenAIFunctionsAgent:

    @pytest.fixture
    def mock_llm(self):
        return MagicMock(spec=BaseLanguageModel)

    @pytest.fixture
    def mock_prompt(self):
        mock = MagicMock(spec=BasePromptTemplate)
        mock.input_variables = []
        mock.partial_variables = []
        return mock

    @pytest.fixture
    def mock_output_parser(self):
        class MockOutputParser(OpenAIFunctionsAgentOutputParser):
            def _parse_ai_message(self):
                return "agent_decision"

        return MockOutputParser

    @pytest.fixture
    def agent(self, mock_llm, mock_prompt, mock_output_parser):
        return MyOpenAIFunctionsAgent(
            llm=mock_llm,
            prompt=mock_prompt,
            output_parser=mock_output_parser,
            functions=[],
            tools=[],
        )

    def test_plan(self, agent):
        kwargs = {"input1": "value1", "input2": "value2"}
        agent.prompt.input_variables = ["input1", "input2", "agent_scratchpad"]
        agent.prompt.format_prompt.return_value = MagicMock()
        agent.prompt.format_prompt.return_value.to_messages.return_value = (
            "formatted_messages"
        )
        agent.llm.predict_messages.return_value = "predicted_message"
        agent.output_parser._parse_ai_message.return_value = "agent_decision"

        agent_action_message_log = MagicMock()
        agent_action_message_log.log = "action"
        intermediate_steps = [(agent_action_message_log, "observation")]

        result = agent.plan(intermediate_steps, **kwargs)

        assert result == "agent_decision"

    @pytest.mark.asyncio
    async def test_aplan(self, agent):
        kwargs = {"input1": "value1", "input2": "value2"}
        agent.prompt.input_variables = ["input1", "input2", "agent_scratchpad"]
        agent.prompt.format_prompt.return_value = MagicMock()
        agent.prompt.format_prompt.return_value.to_messages.return_value = (
            "formatted_messages"
        )
        agent.llm.apredict_messages = AsyncMock(return_value="predicted_message")
        agent.output_parser._parse_ai_message.return_value = "agent_decision"

        agent_action_message_log = MagicMock()
        agent_action_message_log.log = "action"
        intermediate_steps = [(agent_action_message_log, "observation")]

        result = await agent.aplan(intermediate_steps, **kwargs)

        assert result == "agent_decision"

    def test_return_stopped_response_force(self, agent):
        intermediate_steps = [("action", "observation")]
        result = agent.return_stopped_response("force", intermediate_steps)

        assert result == AgentFinish(
            {"output": "Agent stopped due to iteration limit or time limit."}, ""
        )

    def test_return_stopped_response_invalid_method(self, agent):
        intermediate_steps = [("action", "observation")]

        with pytest.raises(
            ValueError,
            match="early_stopping_method should be one of `force` or `generate`",
        ):
            agent.return_stopped_response("invalid_method", intermediate_steps)
