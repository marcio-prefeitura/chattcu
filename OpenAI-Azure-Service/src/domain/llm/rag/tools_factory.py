import logging

from langchain_community.callbacks.openai_info import OpenAICallbackHandler
from langchain_core.messages import SystemMessage

from src.domain.enum.type_tools_enum import TypeToolsEnum
from src.domain.llm.tools.adiministrativo import Administrativo
from src.domain.llm.tools.jurisprudencia_selecionada import JurisprudenciaSelecionada
from src.domain.llm.tools.normas import Normas
from src.domain.llm.tools.sumarizacao_peca_processo import SumarizacaoPecaProcesso
from src.domain.llm.tools.sumarizador import Sumarizador
from src.domain.llm.tools.sumarizador_documento_etcu import SumarizadorDocumentoETCU
from src.domain.schemas import ChatGptInput
from src.infrastructure.env import MODELO_PADRAO_FILTROS, MODELOS, VERBOSE

logger = logging.getLogger(__name__)


class ToolsFactory:

    @staticmethod
    def create_tools(
        type_tools: TypeToolsEnum,
        system_message: SystemMessage,
        instance,
        chatinput: ChatGptInput,
    ):
        llm_instance = instance._get_llm(
            arg_model=MODELOS[MODELO_PADRAO_FILTROS],
            arg_streaming=False,
            arg_verbose=VERBOSE,
            arg_callback=[OpenAICallbackHandler()],
        )

        tool = None

        if type_tools == TypeToolsEnum.JURISPRUDENCIA.value:
            logger.info(f">> {instance.token.login} - Tool jusrisprudencia definida")
            tool = JurisprudenciaSelecionada(
                instance.msg,
                usr_roles=instance.token.roles,
                prompt_usuario=chatinput.prompt_usuario,
                top_documents=chatinput.top_documentos,
                llm=llm_instance,
            ).get_tool()

        elif type_tools == TypeToolsEnum.ADMINISTRATIVA.value:
            logger.info(f">> {instance.token.login} - Tool adiministrativa definida")
            tool = Administrativo(
                instance.msg,
                top_documents=chatinput.top_documentos,
                prompt_usuario=chatinput.prompt_usuario,
                llm=llm_instance,
                usr_roles=instance.token.roles,
                login=instance.token.login,
            ).get_tool()

        elif type_tools == TypeToolsEnum.SUMARIZACAO.value:
            sumarizar_peca_processo_tool = SumarizacaoPecaProcesso(
                stream=instance.stream,
                msg=instance.msg,
                llm=llm_instance,
                token=instance.token,
            )
            logger.info(
                f">> {instance.token.login} - Tool sumarização peça processo definida"
            )
            sumarizador_documento_etcu_tool = SumarizadorDocumentoETCU(
                stream=instance.stream,
                msg=instance.msg,
                llm=llm_instance,
                token=instance.token,
            )
            logger.info(
                f">> {instance.token.login} - Tool sumarização documento etcu definida"
            )
            logger.info(f">> {instance.token.login} - Sumarizador(Unificação) definido")
            tool = Sumarizador(
                sumarizar_peca_processo_tool=(
                    sumarizar_peca_processo_tool.get_tool_focado()
                ),
                sumarizador_documento_etcu_tool=(
                    sumarizador_documento_etcu_tool.get_tool_focado()
                ),
                modelo=llm_instance,
                system_message=system_message,
                prompt_usuario=chatinput.prompt_usuario,
                usr_roles=instance.token.roles,
            ).get_tool()

        elif type_tools == TypeToolsEnum.NORMA.value:
            logger.info(">> Tool normas definida")
            tool = Normas(
                instance.msg,
                usr_roles=instance.token.roles,
                prompt_usuario=chatinput.prompt_usuario,
                top_documents=chatinput.top_documentos,
                llm=llm_instance,
            ).get_tool()

        else:
            raise ValueError(f"Unknown tool type: {type_tools}")

        return tool
