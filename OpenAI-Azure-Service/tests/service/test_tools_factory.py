from unittest.mock import MagicMock

import pytest
from langchain_core.messages import SystemMessage
from langchain_core.tools import StructuredTool, Tool

from src.domain.enum.type_tools_enum import TypeToolsEnum
from src.domain.llm.rag.tools_factory import ToolsFactory
from src.domain.schemas import ChatGptInput
from tests.util.mock_objects import MockObjects


class TestToolsFactory:

    def test_create_tools_jurisprudencia(self):
        instance = MagicMock()
        instance._get_llm.return_value = MagicMock()
        instance.token.roles = ["role1", "role2"]
        instance.token.login = "user_login"
        instance.msg = MockObjects.mock_mensagem
        instance.stream = "some_stream"

        system_message = SystemMessage("Teste")
        chatinput = MagicMock(
            spec=ChatGptInput, prompt_usuario="some_prompt", top_documentos=5
        )

        tools = ToolsFactory.create_tools(
            TypeToolsEnum.JURISPRUDENCIA.value, system_message, instance, chatinput
        )

        assert isinstance(tools, Tool)

    def test_create_tools_administrativo(self):
        instance = MagicMock()
        instance._get_llm.return_value = MagicMock()
        instance.token.roles = ["role1", "role2"]
        instance.token.login = "user_login"
        instance.msg = MockObjects.mock_mensagem
        instance.stream = "some_stream"

        system_message = SystemMessage("Teste")
        chatinput = MagicMock(
            spec=ChatGptInput, prompt_usuario="some_prompt", top_documentos=5
        )

        tools = ToolsFactory.create_tools(
            TypeToolsEnum.ADMINISTRATIVA.value, system_message, instance, chatinput
        )

        assert isinstance(tools, Tool)

    def test_create_tools_sumarizacao(self):
        instance = MagicMock()
        instance._get_llm.side_effect = [
            MagicMock(),
            MagicMock(),
        ]  # Mocks para dois LLMs
        instance.token.roles = ["role1", "role2"]
        instance.token.login = "user_login"
        instance.msg = MockObjects.mock_mensagem
        instance.stream = "some_stream"

        system_message = SystemMessage("Teste")
        chatinput = MagicMock(
            spec=ChatGptInput, prompt_usuario="some_prompt", top_documentos=5
        )

        tools = ToolsFactory.create_tools(
            TypeToolsEnum.SUMARIZACAO.value, system_message, instance, chatinput
        )

        assert isinstance(tools, StructuredTool)

    def test_create_tools_norma(self):
        instance = MagicMock()
        instance._get_llm.return_value = MagicMock()
        instance.token.roles = ["role1", "role2"]
        instance.token.login = "user_login"
        instance.msg = MockObjects.mock_mensagem
        instance.stream = "some_stream"

        system_message = SystemMessage("Teste")
        chatinput = MagicMock(
            spec=ChatGptInput, prompt_usuario="some_prompt", top_documentos=5
        )

        tools = ToolsFactory.create_tools(
            TypeToolsEnum.NORMA.value, system_message, instance, chatinput
        )

        assert isinstance(tools, Tool)

    def test_create_tools_unknown_type(self):
        instance = MagicMock()
        system_message = SystemMessage("Teste")
        chatinput = MagicMock(spec=ChatGptInput, prompt_usuario="some_prompt")

        with pytest.raises(ValueError):
            ToolsFactory.create_tools(
                "unknown_type", system_message, instance, chatinput
            )
