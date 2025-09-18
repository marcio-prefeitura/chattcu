import logging
from abc import ABC

from langchain_community.callbacks.openai_info import OpenAICallbackHandler
from langchain_core.messages import SystemMessage

from src.domain.enum.type_tools_enum import TypeToolsEnum
from src.domain.llm.base.llm_base import LLMBase
from src.domain.llm.retriever.adm_search_retriever import AdmSearchRetriever
from src.domain.llm.retriever.base_chattcu_retriever import BaseChatTCURetriever
from src.domain.llm.retriever.jurisprudencia_selecionada_search_retriever import (
    JurisprudenciaSearchRetriever,
)
from src.domain.llm.retriever.normas_retriever import NormasRetriever
from src.domain.llm.tools.sumarizacao_peca_processo import SumarizacaoPecaProcesso
from src.domain.llm.tools.sumarizador import Sumarizador
from src.domain.llm.tools.sumarizador_documento_etcu import SumarizadorDocumentoETCU
from src.domain.llm.tools.upload_documento_full_context import (
    UploadDocumentoFullContext,
)
from src.domain.schemas import ChatGptInput
from src.infrastructure.env import MODELO_PADRAO_FILTROS, MODELOS, VERBOSE

logger = logging.getLogger(__name__)


class RetrieverRelevantDocumentsFactory(ABC):

    @staticmethod
    def create_retriever(
        type_tools: TypeToolsEnum, chat: ChatGptInput, instance: LLMBase
    ) -> BaseChatTCURetriever:
        llm_instance = instance._get_llm(
            arg_model=MODELOS[MODELO_PADRAO_FILTROS],
            arg_streaming=False,
            arg_verbose=VERBOSE,
            arg_callback=[OpenAICallbackHandler()],
        )

        retriever = None

        if type_tools == TypeToolsEnum.JURISPRUDENCIA.value:
            retriever = JurisprudenciaSearchRetriever(
                system_message=instance.msg,
                top_k=chat.top_documentos,
                prompt_usuario=chat.prompt_usuario,
                usr_roles=instance.token.roles,
                llm=llm_instance,
            )
        elif type_tools == TypeToolsEnum.ADMINISTRATIVA.value:
            retriever = AdmSearchRetriever(
                system_message=instance.msg,
                usr_roles=instance.token.roles,
                login=instance.token.login,
                top_k=chat.top_documentos,
                llm=llm_instance,
                prompt_usuario=chat.prompt_usuario,
            )
        elif type_tools == TypeToolsEnum.SUMARIZACAO.value:
            sumarizar_peca_processo_tool = SumarizacaoPecaProcesso(
                stream=instance.stream,
                msg=instance.msg,
                llm=llm_instance,
                token=instance.token,
            )

            sumarizador_documento_etcu_tool = SumarizadorDocumentoETCU(
                stream=instance.stream,
                msg=instance.msg,
                llm=llm_instance,
                token=instance.token,
            )
            retriever = Sumarizador(
                sumarizar_peca_processo_tool=(
                    sumarizar_peca_processo_tool.get_tool_focado()
                ),
                sumarizador_documento_etcu_tool=(
                    sumarizador_documento_etcu_tool.get_tool_focado()
                ),
                modelo=llm_instance,
                system_message=SystemMessage(content=instance.msg.conteudo),
                prompt_usuario=chat.prompt_usuario,
                usr_roles=instance.token.roles,
            )
        elif type_tools == TypeToolsEnum.NORMA.value:
            retriever = NormasRetriever(
                system_message=instance.msg,
                top_k=chat.top_documentos,
                usr_roles=instance.token.roles,
                prompt_usuario=chat.prompt_usuario,
                llm=llm_instance,
            )
        elif type_tools == TypeToolsEnum.RESUMOFOCADODOCUMENTOS.value:
            retriever = UploadDocumentoFullContext(
                chat=chat,
                system_message=instance.msg,
                prompt_usuario=chat.prompt_usuario,
                llm=llm_instance,
                token=instance.token,
            )
        else:
            raise ValueError(f"Unknown tool retriever: {type_tools}")

        return retriever
