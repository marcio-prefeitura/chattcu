import asyncio
import logging
import traceback
from typing import Awaitable, List

from langchain.agents import AgentExecutor
from langchain_community.callbacks import OpenAICallbackHandler
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.language_models import BaseChatModel
from langchain_core.messages.base import BaseMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from src.domain.schemas import ChatGptInput
from src.messaging.chatstop import ChatStop

logger = logging.getLogger(__name__)
chat_stop = ChatStop()


class StreamProcessUtils:

    async def _wrap_done(self, function: Awaitable, event: asyncio.Event):
        """Wrap an awaitable with a event to signal when it's done or an exception is raised."""
        try:
            await function
        except Exception as error:
            logger.error(f"Caught exception: {error}")
            traceback.print_exc()
            raise error
        finally:
            event.set()

    async def handle_events(
        self,
        prompt: ChatPromptTemplate,
        chatinput: str,
        historico: List[BaseMessage],
        llm: BaseChatModel,
    ):
        chain = prompt | llm | StrOutputParser()

        chain = chain.with_config(verbose=True)

        entrada = {"input": chatinput}

        if historico:
            entrada["chat_history"] = historico

        async for event in chain.astream_events(
            entrada,
            version="v2",
        ):
            kind = event["event"]

            if kind == "on_llm_start":
                print("O modelo começou a responder.")

            elif kind == "on_llm_end":
                print("Resposta completa:")

    def _get_task_llm(
        self,
        llm: BaseChatModel,
        prompt: ChatPromptTemplate,
        chatinput: ChatGptInput,
        historico: List[BaseMessage],
        callback: BaseCallbackHandler,
    ):
        entrada = {"input": chatinput.prompt_usuario}

        if historico:
            entrada["chat_history"] = historico

        promptstr = prompt.format(**entrada)

        callback.set_prompt(promptstr)

        task = asyncio.create_task(
            self._wrap_done(
                self.handle_events(prompt, chatinput.prompt_usuario, historico, llm),
                callback.done,
            ),
            name=chatinput.correlacao_chamada_id,
        )

        chat_stop.registra_task(task)
        return task

    def _get_task_executor(
        self,
        executor: AgentExecutor,
        prompt: ChatPromptTemplate,
        chatinput: ChatGptInput,
        historico: List[BaseMessage],
        callback: OpenAICallbackHandler,
    ):

        entrada = {"input": chatinput.prompt_usuario}

        if chatinput.imagens:
            image_urls = []
            for img in chatinput.imagens:
                image_urls.append({"url": f"data:image/jpeg;base64,{img}"})
            entrada["image_urls"] = image_urls

        if historico:
            entrada["chat_history"] = historico
        promptstr = prompt.format(**entrada)

        callback.set_prompt(promptstr)

        task = asyncio.create_task(
            self._wrap_done(
                executor.ainvoke(entrada),
                callback.done,
            ),
            name=chatinput.correlacao_chamada_id,
        )

        chat_stop.registra_task(task)
        return task
