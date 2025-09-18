import json
from unittest.mock import AsyncMock, Mock, patch

import pytest
from langchain_core.tools import BaseTool

from src.infrastructure.realtimeaudio.openai_realtime_client import (
    OpenAIRealTimeClient,
    UtilStreams,
)
from src.infrastructure.realtimeaudio.voice_tool_executor import VoiceToolExecutor


@pytest.fixture
def mock_tool():
    tool = Mock(spec=BaseTool)
    tool.name = "search_normas"
    tool.description = "A test tool"
    tool.args = {"arg1": {"type": "string"}}
    return tool


@pytest.fixture
def client(mock_tool):
    config_instruction = {"tools": ["search_normas"], "is_headset": True}
    return OpenAIRealTimeClient(
        api_key="test_api_key",
        config_instruction=config_instruction,
        url="wss://test.url",
        tools=[mock_tool],
        login_user="test_user",
    )


def test_do_initial_session_config_sucesso(client, mock_tool):
    tools_by_name = {mock_tool.name: mock_tool}
    config_session = client.do_initial_session_config(tools_by_name)
    assert "session" in config_session
    assert config_session["session"]["tools"][0]["name"] == "search_normas"


@pytest.mark.asyncio
async def test_handle_input_ws_user_quando_ha_evento_stop_aciona_close(client):
    data = {"type": "stop_audio_conversation"}
    close_openai_ws = AsyncMock()
    close_client_user_ws = AsyncMock()
    model_send_openai = AsyncMock()

    await client.handle_input_ws_user(
        data, close_openai_ws, close_client_user_ws, model_send_openai
    )
    assert close_openai_ws.called
    assert close_client_user_ws.called


@pytest.mark.asyncio
async def test_handle_tool_outputs_deve_chamar_dois_eventos(client):
    data = {"type": "tool_output"}
    model_send_openai = AsyncMock()

    await client.handle_tool_outputs(data, model_send_openai)
    assert model_send_openai.call_count == 2


@pytest.mark.asyncio
async def test_handle_output_speaker_deve_chamar_evento_para_user(client):
    data = {"type": "response.audio.delta"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    assert send_output_to_user.called


def test_filter_tools(client, mock_tool):
    tools_by_name = {mock_tool.name: mock_tool}
    tools_from_client = ["search_normas"]
    filtered_tools = client.filter_tools(tools_by_name, tools_from_client)
    assert len(filtered_tools) == 1
    assert filtered_tools[0]["name"] == "search_normas"


@pytest.mark.asyncio
async def test_handle_output_speaker_response_audio_delta(client):
    data = {"type": "response.audio.delta"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_called_once_with(json.dumps(data))


@pytest.mark.asyncio
async def test_handle_output_speaker_response_audio_done(client):
    data = {"type": "response.audio.done"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_called_once_with(json.dumps(data))


@pytest.mark.asyncio
async def test_handle_output_speaker_response_audio_buffer_speech_started(client):
    data = {"type": "response.audio_buffer.speech_started"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_called_once_with(json.dumps(data))


@pytest.mark.asyncio
async def test_handle_output_speaker_response_audio_transcript_done(client):
    data = {"type": "response.audio_transcript.done", "transcript": "test transcript"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_called_once_with(json.dumps(data))


@pytest.mark.asyncio
async def test_handle_output_speaker_conversation_item_input_audio_transcription_completed(
    client,
):
    data = {
        "type": "conversation.item.input_audio_transcription.completed",
        "transcript": "test transcript",
    }
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_not_called()


@pytest.mark.asyncio
async def test_handle_output_speaker_error(client):
    data = {"type": "error", "message": "test error"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_not_called()


@pytest.mark.asyncio
async def test_handle_output_speaker_response_done(client):
    data = {"type": "response.done", "response": {"usage": "test usage"}}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_not_called()


@pytest.mark.asyncio
async def test_handle_output_speaker_response_function_call_arguments_done(client):
    data = {
        "type": "response.function_call_arguments.done",
        "arguments": "test arguments",
    }
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    tool_executor.add_tool_call.assert_called_once_with(data)


@pytest.mark.asyncio
async def test_handle_output_speaker_input_audio_buffer_speech_started_with_headset(
    client,
):
    data = {"type": "input_audio_buffer.speech_started"}
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)
    client.config_instruction["is_headset"] = True

    await client.handle_output_speaker(data, send_output_to_user, tool_executor)
    send_output_to_user.assert_called_once_with(json.dumps(data))


@pytest.mark.asyncio
async def test_handle_stream_event_input_ws_user(client):
    data = {"type": "stop_audio_conversation"}
    close_openai_ws = AsyncMock()
    close_client_user_ws = AsyncMock()
    model_send_openai = AsyncMock()
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_stream_event(
        "input_ws_user",
        data,
        close_openai_ws,
        close_client_user_ws,
        model_send_openai,
        send_output_to_user,
        tool_executor,
    )
    assert close_openai_ws.called
    assert close_client_user_ws.called


@pytest.mark.asyncio
async def test_handle_stream_event_tool_outputs(client):
    data = {"type": "tool_output"}
    close_openai_ws = AsyncMock()
    close_client_user_ws = AsyncMock()
    model_send_openai = AsyncMock()
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_stream_event(
        "tool_outputs",
        data,
        close_openai_ws,
        close_client_user_ws,
        model_send_openai,
        send_output_to_user,
        tool_executor,
    )
    assert model_send_openai.call_count == 2


@pytest.mark.asyncio
async def test_handle_stream_event_output_speaker(client):
    data = {"type": "response.audio.delta"}
    close_openai_ws = AsyncMock()
    close_client_user_ws = AsyncMock()
    model_send_openai = AsyncMock()
    send_output_to_user = AsyncMock()
    tool_executor = Mock(spec=VoiceToolExecutor)

    await client.handle_stream_event(
        "output_speaker",
        data,
        close_openai_ws,
        close_client_user_ws,
        model_send_openai,
        send_output_to_user,
        tool_executor,
    )
    send_output_to_user.assert_called_once_with(json.dumps(data))
