import logging
from typing import Any, List, Optional, Sequence, Tuple, Union

from langchain.agents import AgentType
from langchain.agents.agent import AgentExecutor
from langchain.agents.format_scratchpad.openai_functions import (
    format_to_openai_function_messages,
)
from langchain.agents.structured_chat.base import StructuredChatAgent
from langchain.tools import BaseTool
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.callbacks import BaseCallbackManager, Callbacks
from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import BaseMessage, SystemMessage

from src.domain.llm.myopenaifunctionsagent import MyOpenAIFunctionsAgent

logger = logging.getLogger(__name__)


class ChatTCUAgentMonique(StructuredChatAgent):
    def plan(
        self,
        intermediate_steps: List[Tuple[AgentAction, str]],
        callbacks: Callbacks = None,
        **kwargs: Any,
    ) -> Union[AgentAction, AgentFinish]:
        """Given input, decided what to do.

        Args:
            intermediate_steps: Steps the LLM has taken to date,
                along with observations
            callbacks: Callbacks to run.
            **kwargs: User inputs.

        Returns:
            Action specifying what tool to use.
        """

        full_inputs = self.get_full_inputs(intermediate_steps, **kwargs)

        logger.info(f"FULL INPUTS = {full_inputs}")

        full_output = self.llm_chain.predict(callbacks=callbacks, **full_inputs)
        agent_action = self.output_parser.parse(full_output)

        if isinstance(agent_action, AgentAction):
            agent_action.tool_input.update(full_inputs)

        return agent_action

    async def aplan(
        self,
        intermediate_steps: List[Tuple[AgentAction, str]],
        callbacks: Callbacks = None,
        **kwargs: Any,
    ) -> Union[AgentAction, AgentFinish]:
        """Given input, decided what to do.

        Args:
            intermediate_steps: Steps the LLM has taken to date,
                along with observations
            callbacks: Callbacks to run.
            **kwargs: User inputs.

        Returns:
            Action specifying what tool to use.
        """
        full_inputs = self.get_full_inputs(intermediate_steps, **kwargs)

        logger.info(f"FULL INPUTS = {full_inputs}")

        full_output = await self.llm_chain.apredict(callbacks=callbacks, **full_inputs)
        agent_action = await self.output_parser.aparse(full_output)

        if isinstance(agent_action, AgentAction):
            agent_action.tool_input.update(full_inputs)

        return agent_action


class ChatTCUAgentConversational(MyOpenAIFunctionsAgent):
    historico: Optional[List[BaseMessage]] = None

    def plan(
        self,
        intermediate_steps: List[Tuple[AgentAction, str]],
        callbacks: Callbacks = None,
        with_functions: bool = True,
        **kwargs: Any,
    ) -> Union[AgentAction, AgentFinish]:
        """Given input, decided what to do.

        Args:
            intermediate_steps: Steps the LLM has taken to date, along with observations
            **kwargs: User inputs.

        Returns:
            Action specifying what tool to use.
        """
        agent_scratchpad = format_to_openai_function_messages(intermediate_steps)

        selected_inputs = {
            k: kwargs[k] for k in self.prompt.input_variables if k != "agent_scratchpad"
        }

        full_inputs = dict(**selected_inputs, agent_scratchpad=agent_scratchpad)

        # logger.info(f"FULL INPUTS => {full_inputs}")

        prompt = self.prompt.format_prompt(**full_inputs)
        messages = prompt.to_messages()

        # logger.info(f"MESSAGES => {messages}")

        if with_functions:
            predicted_message = self.llm.predict_messages(
                messages,
                functions=self.functions,
                callbacks=callbacks,
            )
        else:
            predicted_message = self.llm.predict_messages(
                messages,
                callbacks=callbacks,
            )

        agent_decision = self.output_parser._parse_ai_message(predicted_message)

        if isinstance(agent_decision, AgentAction):
            agent_decision.tool_input.update(full_inputs)

        return agent_decision

    async def aplan(
        self,
        intermediate_steps: List[Tuple[AgentAction, str]],
        callbacks: Callbacks = None,
        **kwargs: Any,
    ) -> Union[AgentAction, AgentFinish]:
        """Given input, decided what to do.

        Args:
            intermediate_steps: Steps the LLM has taken to date,
                along with observations
            **kwargs: User inputs.

        Returns:
            Action specifying what tool to use.
        """
        agent_scratchpad = format_to_openai_function_messages(intermediate_steps)

        selected_inputs = {
            k: kwargs[k] for k in self.prompt.input_variables if k != "agent_scratchpad"
        }

        full_inputs = dict(**selected_inputs, agent_scratchpad=agent_scratchpad)

        # logger.info(f"FULL INPUTS => {full_inputs}")

        prompt = self.prompt.format_prompt(**full_inputs)
        messages = prompt.to_messages()

        logger.info(f"HISTORICO => {self.historico}")
        logger.info(f"MESSAGES => {messages}")

        messages = [*self.historico, *messages] if self.historico else messages

        logger.info(f"MESSAGES JOINED => {messages}")

        predicted_message = await self.llm.apredict_messages(
            messages, functions=self.functions, callbacks=callbacks
        )

        agent_decision = self.output_parser._parse_ai_message(predicted_message)

        if isinstance(agent_decision, AgentAction):
            agent_decision.tool_input.update(full_inputs)

        return agent_decision


def initialize_agent2(
    tools: Sequence[BaseTool],
    llm: BaseLanguageModel,
    agent: Optional[AgentType] = None,
    callback_manager: Optional[BaseCallbackManager] = None,
    agent_kwargs: Optional[dict] = None,
    *,
    tags: Optional[Sequence[str]] = None,
    **kwargs: Any,
) -> AgentExecutor:
    logger.info("INICIALIZANDO AGENTE SUMARIZADOR")

    tags_ = list(tags) if tags else []
    tags_.append(agent)

    agent_kwargs = agent_kwargs or {
        "system_message": SystemMessage(content=kwargs["system_message"]),
        "verbose": kwargs["verbose"],
    }

    agent_obj = ChatTCUAgentConversational.from_llm_and_tools(
        llm, tools, callback_manager=callback_manager, **agent_kwargs
    )

    agent_obj.historico = kwargs.get("historico", None)

    return AgentExecutor.from_agent_and_tools(
        agent=agent_obj,
        tools=tools,
        callback_manager=callback_manager,
        tags=tags_,
        **kwargs,
    )
