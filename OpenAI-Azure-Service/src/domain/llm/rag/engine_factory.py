import logging
from typing import Optional

from src.domain.agent_core import AgentCore
from src.domain.schemas import ChatGptInput
from src.infrastructure.env_agent_config import get_agent_config
from src.infrastructure.roles import DESENVOLVEDOR
from src.infrastructure.security_tokens import DecodedToken

VERBOSE = True
logger = logging.getLogger(__name__)


class EngineFactory:

    @staticmethod
    def create_engine(
        chat_id: Optional[str],
        chat_input: ChatGptInput,
        token: DecodedToken,
        app_origem: str,
        client_app_header: str,
    ):
        agent = None
        if (
            chat_input.arquivos_selecionados_prontos
            and len(chat_input.arquivos_selecionados_prontos) > 0
            and chat_input.tool_selecionada is None
        ) or (
            chat_input.arquivos_selecionados
            and len(chat_input.arquivos_selecionados) > 0
            and chat_input.tool_selecionada is None
        ):
            chat_input.tool_selecionada = None
            agent = get_agent_config()["RAGDocumentos"]
        elif chat_input.tool_selecionada is not None:
            if chat_input.tool_selecionada == "CONHECIMENTOGERAL":
                agent = get_agent_config()["LLM"]
            else:
                agent = get_agent_config()["EspecificTollRag"]
        else:
            agent = get_agent_config()["ConversationalRAG"]

        EngineFactory.adicionar_instrucao(agent, chat_input, token)

        return AgentCore(
            chat_id=chat_id,
            chatinput=chat_input,
            agent=agent,
            app_origem=app_origem,
            token=token,
            client_app_header=client_app_header,
        )

    @staticmethod
    def adicionar_instrucao(agent, chat_input, token):
        if DESENVOLVEDOR in token.roles:
            if (
                chat_input.arquivos_selecionados_prontos
                and len(chat_input.arquivos_selecionados_prontos) > 0
                and chat_input.tool_selecionada is None
            ) or (
                chat_input.arquivos_selecionados
                and len(chat_input.arquivos_selecionados) > 0
                and chat_input.tool_selecionada is None
            ):
                agent.msg_sistema = (
                    chat_input.config.instrucoes + "\n" + get_agent_config()["SOURCE"]
                )
            else:
                agent.msg_sistema = chat_input.config.instrucoes
