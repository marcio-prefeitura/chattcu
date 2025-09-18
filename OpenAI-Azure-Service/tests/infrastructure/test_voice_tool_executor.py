import asyncio
import json
from unittest.mock import AsyncMock, Mock

import pytest
from langchain_core.tools import BaseTool

from src.infrastructure.realtimeaudio.voice_tool_executor import VoiceToolExecutor


class TestVoiceToolExecutor:

    @pytest.fixture
    def mock_tool(self):
        tool = Mock(spec=BaseTool)
        tool.ainvoke = AsyncMock(return_value={"result": "success"})
        return tool

    @pytest.fixture
    def executor(self, mock_tool):
        tools_by_name = {"test_tool": mock_tool}
        return VoiceToolExecutor(tools_by_name=tools_by_name)

    @pytest.mark.asyncio
    async def test_add_tool_call(self, executor):
        tool_call = {"name": "test_tool", "arguments": json.dumps({"arg1": "value1"})}
        await executor.add_tool_call(tool_call)
        assert executor._trigger_future.done()
        assert executor._trigger_future.result() == tool_call

    @pytest.mark.asyncio
    async def test_add_tool_call_in_progress(self, executor):
        tool_call = {"name": "test_tool", "arguments": json.dumps({"arg1": "value1"})}
        await executor.add_tool_call(tool_call)
        with pytest.raises(ValueError, match="Chamada a tool em progresso!"):
            await executor.add_tool_call(tool_call)

    @pytest.mark.asyncio
    async def test_create_tool_call_task(self, executor, mock_tool):
        tool_call = {
            "name": "test_tool",
            "arguments": json.dumps({"arg1": "value1"}),
            "call_id": "123",
        }
        task = await executor._create_tool_call_task(tool_call)
        result = await task
        assert result == {
            "type": "conversation.item.create",
            "item": {
                "id": "123",
                "call_id": "123",
                "type": "function_call_output",
                "output": json.dumps({"result": "success"}),
            },
        }

    @pytest.mark.asyncio
    async def test_create_tool_call_task_invalid_tool(self, executor):
        tool_call = {
            "name": "invalid_tool",
            "arguments": json.dumps({"arg1": "value1"}),
            "call_id": "123",
        }
        with pytest.raises(
            ValueError, match="tool invalid_tool . Tools disponíveis \['test_tool'\]"
        ):
            await executor._create_tool_call_task(tool_call)

    @pytest.mark.asyncio
    async def test_create_tool_call_task_invalid_json(self, executor):
        tool_call = {"name": "test_tool", "arguments": "invalid_json", "call_id": "123"}
        with pytest.raises(
            ValueError,
            match="Falha na conversão `invalid_json`. Precisa ser um JSON válido.",
        ):
            await executor._create_tool_call_task(tool_call)

    @pytest.mark.asyncio
    async def test_output_iterator(self, executor):
        tool_call = {
            "name": "test_tool",
            "arguments": json.dumps({"arg1": "value1"}),
            "call_id": "123",
        }
        await executor.add_tool_call(tool_call)
        output = []
        async for item in executor.output_iterator():
            output.append(item)
            if len(output) == 1:
                break
        assert output == [
            {
                "type": "conversation.item.create",
                "item": {
                    "id": "123",
                    "call_id": "123",
                    "type": "function_call_output",
                    "output": json.dumps({"result": "success"}),
                },
            }
        ]
