from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest
from langchain_core.messages import SystemMessage

from src.conf.env import configs
from src.domain.llm.base.llm_base import LLMBase
from src.domain.schemas import ChatGptInput
from src.infrastructure.env import VERBOSE
from src.infrastructure.roles import DESENVOLVEDOR


@pytest.fixture
def llm_base(decoded_token_com_role):
    llm_base = LLMBase(
        chat_id="teste123",
        token_usr=decoded_token_com_role,
        verbose=VERBOSE,
        chatinput=ChatGptInput(stream=False, temperature=0.5, prompt_usuario=""),
    )

    llm_base._processar_arquivos_busca_e_trechos = MagicMock(return_value=([], []))
    llm_base._adicionar_mensagens = AsyncMock()
    llm_base._truncar_prompt = MagicMock(return_value="truncated_prompt")
    llm_base._truncar_historico = MagicMock()
    llm_base._tratar_historico = MagicMock(return_value="historico_tratado")
    return llm_base


@pytest.mark.asyncio
class TestLLMBase:
    # def setup_method(self):
    #     self.token = MagicMock(Token)
    #     self.token.get_login.return_value = "user_login"
    #     self.token.get_roles.return_value = [DESENVOLVEDOR]

    #     self.llm_base = LLMBase(
    #         chat_id="chat_id",
    #         token_usr=self.token,
    #         verbose=True,
    #         chatinput=ChatGptInput(stream=False, temperature=0.5, prompt_usuario=""),
    #     )

    #     self.llm_base._get_response = AsyncMock(return_value="mocked_response")
    #     self.llm_base._processar_arquivos_busca_e_trechos = MagicMock(
    #         return_value=([], [])
    #     )
    #     self.llm_base._adicionar_mensagens = AsyncMock()
    #     self.llm_base._truncar_prompt = MagicMock(return_value="truncated_prompt")
    #     self.llm_base._truncar_historico = MagicMock()
    #     self.llm_base._tratar_historico = MagicMock(return_value="historico_tratado")

    @patch("src.domain.llm.model_factory.AzureChatOpenAI")
    @patch("src.domain.llm.model_factory.uuid")
    def test_get_llm(
        self, mock_uuid, MockAzureChatOpenAI, llm_base, decoded_token_com_role, mocker
    ):
        mock_uuid.uuid4 = mocker.Mock(return_value="teste")
        mock_llm_instance = MagicMock()
        MockAzureChatOpenAI.return_value = mock_llm_instance

        llm = llm_base._get_llm()

        assert llm is mock_llm_instance

        MockAzureChatOpenAI.assert_called_once_with(
            azure_endpoint=llm_base.api_base,
            azure_deployment=llm_base.modelo["deployment_name"],
            api_version=llm_base.modelo["version"],
            api_key=llm_base.api_key,
            openai_api_type=configs.OPENAI_API_TYPE,  # Ajuste para usar a configuração correta
            temperature=llm_base.temperature,
            streaming=llm_base.stream,
            verbose=llm_base.verbose,
            top_p=0.95,
            max_tokens=16384,
            callbacks=[llm_base.callback],
            default_headers={
                "usuario": decoded_token_com_role.login,
                "desenvol": str(DESENVOLVEDOR in decoded_token_com_role.roles).lower(),
                "execution_id": "teste",
            },
        )

    @patch("src.domain.llm.base.llm_base.ToolsFactory")
    @patch("src.domain.llm.base.llm_base.TypeToolsEnum")
    def test_get_tools(self, MockTypeToolsEnum, MockToolsFactory, llm_base):
        mock_tool = MagicMock()
        MockToolsFactory.create_tools.return_value = mock_tool

        MockTypeToolsEnum.get_tool.return_value = "mocked_tool_value"
        MockTypeToolsEnum._member_map_ = {
            "tool1": MagicMock(value="mocked_tool_value"),
            "tool2": MagicMock(value="mocked_tool_value"),
        }

        tools = ["tool1", "tool2"]
        system_message = MagicMock(SystemMessage)
        chatinput = MagicMock(ChatGptInput)

        result = llm_base._get_tools(tools, system_message, chatinput)

        assert result == [mock_tool, mock_tool]
        MockTypeToolsEnum.get_tool.assert_has_calls([call("tool1"), call("tool2")])
        MockToolsFactory.create_tools.assert_has_calls(
            [
                call("mocked_tool_value", system_message, llm_base, chatinput),
                call("mocked_tool_value", system_message, llm_base, chatinput),
            ]
        )
