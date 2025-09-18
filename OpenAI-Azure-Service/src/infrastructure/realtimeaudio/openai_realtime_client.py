import json
import logging
from base64 import standard_b64decode
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Callable, Coroutine

import websockets
from langchain_core.tools import BaseTool
from pydantic import BaseModel

from src.infrastructure.realtimeaudio.util_realtime import (
    Bcolors,
    ConfigRealtime,
    UtilStreams,
)
from src.infrastructure.realtimeaudio.voice_tool_executor import VoiceToolExecutor

logger = logging.getLogger(__name__)

EVENTS_TO_IGNORE = {
    "response.function_call_arguments.delta",
    "rate_limits.updated",
    "response.audio_transcript.delta",
    "response.created",
    "response.content_part.added",
    "response.content_part.done",
    # "conversation.item.created",
    "session.created",
    "session.updated",
    "response.output_item.done",
}


@asynccontextmanager
async def connect(
    api_key: str, url: str
) -> AsyncIterator[tuple[Callable, AsyncIterator[dict[str, Any]]]]:
    """
    Estabelece a conexão WebSocket com cabeçalhos personalizados.
    dentro de um contexto gerenciado, possibilitando o uso do `async with`.
    """

    headers = {"api-key": api_key}
    websocket_openai_client = await websockets.connect(url, additional_headers=headers)

    try:

        async def send_event(event: dict[str, Any] | str) -> None:
            formatted_event = json.dumps(event) if isinstance(event, dict) else event
            await websocket_openai_client.send(formatted_event)

        async def receive_event() -> AsyncIterator[dict[str, Any]]:
            async for raw_event in websocket_openai_client:
                yield json.loads(raw_event)

        async def close_openai_ws() -> None:
            await websocket_openai_client.close()

        stream: AsyncIterator[dict[str, Any]] = receive_event()

        yield send_event, stream, close_openai_ws
    except Exception as e:
        logger.error(
            f"{Bcolors.BOLD + Bcolors.WARNING}Erro no asynccontextmanager de conexão: {e} {Bcolors.ENDC}"
        )
        # logger.error(traceback.format_exc())
        raise e
    finally:
        await websocket_openai_client.close()
        logger.info("Conexão WS fechada com a OpeanAI")


class OpenAIRealTimeClient(BaseModel):
    """
    Classe para gerenciar a conexão e comunicação com a API OpenAI usando WebSockets.
    WS1 : Client para Backend
    WS2 : Backend para OpenAI
    docs: https://platform.openai.com/docs/api-reference/realtime
    TODO: encapsular os EVENTOS em classes para facilitar a manipulação.
    """

    api_key: str
    config_instruction: dict
    url: str
    tools: list[BaseTool] | None = None
    login_user: str

    def __init__(
        self,
        config_instruction: dict,
        api_key: str,
        url: str,
        tools: list[BaseTool] | None = None,
        login_user: str = None,
    ):
        super().__init__(
            api_key=api_key,
            config_instruction=config_instruction,
            url=url,
            tools=tools,
            login_user=login_user,
        )

    async def aconnect(
        self,
        input_stream_user: AsyncIterator[str],
        send_output_to_user: Callable[[str], Coroutine[Any, Any, None]],
        close_client_user_ws: Callable[[], None],
    ) -> None:
        """
        Conectar-se à API OpenAI e enviar e receber mensagens.

        input_stream_user: AsyncIterator[str]
            Stream de eventos de entrada para enviar ao modelo. Transporta eventos input_audio_buffer.append vindo usuário
        send_output_to_user: Callable[[str], None]
            Callback para receber eventos de saída do modelo. Envia eventos por WS response.audio.delta para o usuário reproduzir.
        close_client_user_ws: Callable[[], None]
            Callback que fecha a conexão do websocket que fora aberta pelo usuário.
        """

        tools_by_name = {tool.name: tool for tool in self.tools}
        tool_executor = VoiceToolExecutor(tools_by_name=tools_by_name)

        # conexão com a Openai, usando gerenciador de contexto
        async with connect(api_key=self.api_key, url=self.url) as (
            model_send_openai,
            model_receive_openai_stream,
            close_openai_ws,
        ):
            logger.info(
                f"Conexão estabelecida com a OpenAI, login: [{self.login_user}]"
            )

            config_session = self.do_initial_session_config(tools_by_name)
            await model_send_openai(config_session)

            logger.info("Enviado configurações de sessão para a OpenAI")

            # trabalha todos os streams tanto de entrada quanto de saída em uma única função
            # além de atribuir o stream_key para a devida manipulação conforme a origem dos streams
            async for stream_key, data_raw in UtilStreams.amerge(
                input_ws_user=input_stream_user,
                output_speaker=model_receive_openai_stream,
                tool_outputs=tool_executor.output_iterator(),
            ):
                try:
                    data = (
                        json.loads(data_raw) if isinstance(data_raw, str) else data_raw
                    )
                except json.JSONDecodeError:
                    logger.error(f"error decoding data: {data_raw}")
                    continue

                await self.handle_stream_event(
                    stream_key,
                    data,
                    close_openai_ws,
                    close_client_user_ws,
                    model_send_openai,
                    send_output_to_user,
                    tool_executor,
                )

    def do_initial_session_config(self, tools_by_name):
        config_session = ConfigRealtime.get_standard_session_creation()

        session_updated_byuser = ConfigRealtime.update_dict(
            config_session["session"], self.config_instruction
        )

        config_session["session"] = session_updated_byuser
        config_session["session"]["tools"] = self.filter_tools(
            tools_by_name=tools_by_name,
            tools_from_client=self.config_instruction["tools"],
        )

        print(
            f"{Bcolors.BOLD + Bcolors.OKBLUE + config_session.__str__()+ Bcolors.ENDC}"
        )

        return config_session

    async def handle_stream_event(
        self,
        stream_key: str,
        data: Any,
        close_openai_ws,
        close_client_user_ws,
        model_send_openai,
        send_output_to_user,
        tool_executor,
    ) -> None:
        """
        Manipula os eventos de entrada e saída do modelo OpenAI.
        De acordo com o type descrito na documentação.
        docs: https://platform.openai.com/docs/api-reference/realtime-server-events/
        """

        if stream_key == "input_ws_user":
            await self.handle_input_ws_user(
                data, close_openai_ws, close_client_user_ws, model_send_openai
            )

        elif stream_key == "tool_outputs":
            await self.handle_tool_outputs(data, model_send_openai)

        elif stream_key == "output_speaker":
            await self.handle_output_speaker(data, send_output_to_user, tool_executor)

    async def handle_input_ws_user(
        self,
        data: Any,
        close_openai_ws: Callable[[], Coroutine[Any, Any, None]],
        close_client_user_ws: Callable[[], None],
        model_send_openai: Callable[[dict[str, Any] | str], Coroutine[Any, Any, None]],
    ) -> None:
        if data["type"] == "stop_audio_conversation":
            await close_openai_ws()
            await close_client_user_ws()

        if data["type"] == "response.cancel":
            # cancela a resposta em andamento, por parte do modelo, porém é importante frisar que
            # que o streaming de áudio é enviado de uma maneira muito rápida rápida pela openai(azure),
            # sendo assim se faz necessário tratar o buffer que já estará no cliente também.
            await model_send_openai({"type": "response.cancel"})
            logger.info(
                f"cancelou resposta em andamento [login: + {self.login_user} + ]"
            )

        await model_send_openai(data)

    async def handle_tool_outputs(
        self,
        data: Any,
        model_send_openai: Callable[[dict[str, Any] | str], Coroutine[Any, Any, None]],
    ) -> None:
        print("tool output", data)
        await model_send_openai(data)
        await model_send_openai({"type": "response.create", "response": {}})

    async def handle_output_speaker(
        self,
        data: Any,
        send_output_to_user: Callable[[str], Coroutine[Any, Any, None]],
        tool_executor: VoiceToolExecutor,
    ) -> None:
        t = data["type"]

        if t in {
            "response.audio.delta",
            "response.audio.done",
            "response.audio_buffer.speech_started",
        }:
            await send_output_to_user(json.dumps(data))

        elif t == "response.audio_transcript.done":
            logger.info("transcrição de saída completada")
            print(
                f"{Bcolors.BOLD + Bcolors.OKGREEN + 'Transcrição Saída Modelo, [login:' + self.login_user + ']' + Bcolors.ENDC}"
            )
            print(
                f"{Bcolors.BOLD + Bcolors.OKGREEN + data['transcript'] + Bcolors.ENDC}"
            )
            await send_output_to_user(json.dumps(data))

        elif t == "conversation.item.input_audio_transcription.completed":
            logger.info("transcrição de entrada completada")
            print(
                f"{Bcolors.BOLD + Bcolors.OKBLUE + 'Transcrição Entrada Modelo, [login:' + self.login_user + ']' + Bcolors.ENDC}"
            )
            print(
                f"{Bcolors.BOLD + Bcolors.OKBLUE + data['transcript'] + Bcolors.ENDC}"
            )

        elif t == "error":
            logger.error(
                f"{Bcolors.BOLD + Bcolors.WARNING}Erro API REALTIME: {data} + {Bcolors.ENDC}"
            )

        elif t == "response.done":
            logger.info("response.done")
            print(f"MÉTRICAS REALTIME USAGE [login:' {self.login_user} ]")
            print(
                f"{Bcolors.BOLD + Bcolors.WARNING + json.dumps(data['response']) + Bcolors.ENDC}"
            )

        elif t == "response.function_call_arguments.done":
            logger.info(
                f"chamando tool: {data}",
            )
            await tool_executor.add_tool_call(data)

        # esse é um tratamento especial para o evento de início de fala (com headset), sendo assim é informado
        # ao frontend para que ele possa tomar ações de esvaziamento e ignorar stream remanescente de buffer
        # priorizando novo conteúdo.
        elif (
            t == "input_audio_buffer.speech_started"
            and self.config_instruction["is_headset"] is True
        ):
            logger.info(
                f"speech_started, [login: {self.login_user} ], usuário falando, informando o frontend."
            )
            await send_output_to_user(json.dumps(data))

        elif t in EVENTS_TO_IGNORE:
            pass

        # else:
        #     logger.info(f"EVENTO DIVERSO, [login: {self.login_user} ] evento: {t}")

    def filter_tools(
        self, tools_by_name: dict[str, BaseTool], tools_from_client: list[str]
    ) -> list[dict[str, Any]]:
        """
        Filtra as ferramentas que serão enviadas para a OpenAI.
        """
        # filtra as ferramentas deixando somente as estabelecidas pelo cliente.
        tool_defs = [
            {
                "type": "function",
                "name": tool.name,
                "description": tool.description,
                "parameters": {"type": "object", "properties": tool.args},
            }
            for tool in tools_by_name.values()
            if tool.name in tools_from_client
        ]
        return tool_defs


__all__ = ["OpenAIRealTimeClient"]
