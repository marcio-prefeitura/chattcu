import logging
from datetime import datetime
from typing import Dict, List, Optional

from src.domain.agent import Agent
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.schemas import ChatGptInput

logger = logging.getLogger(__name__)


class MessageProcessUtils:
    def _create_mensagem(
        self,
        chatinput: ChatGptInput,
        agent: Agent,
        modelo: Dict,
        historico: List,
        chat_id: Optional[str] = None,
    ):
        data_hora_atual = datetime.now()
        msg = Mensagem(
            chat_id=chat_id,
            codigo=(
                f"c_{chat_id}_"
                + f'{data_hora_atual.strftime("%Y%m%d%H%M")}_'
                + f"{len(historico) + 1}"
            ),
            conteudo=agent.msg_sistema,
            papel=PapelEnum.SYSTEM,
            arquivos_busca=agent.arquivos_busca,
            parametro_tipo_busca=agent.parametro_tipo_busca,
            parametro_nome_indice_busca=agent.parametro_nome_indice_busca,
            parametro_quantidade_trechos_relevantes_busca=chatinput.top_documentos,
            parametro_modelo_llm=modelo["deployment_name"],
            parametro_versao_modelo_llm=modelo["version"],
            data_envio=data_hora_atual,
            especialista_utilizado=chatinput.tool_selecionada,
        )
        if (
            chatinput.arquivos_selecionados_prontos
            and len(chatinput.arquivos_selecionados_prontos) > 0
        ) or (
            chatinput.arquivos_selecionados and len(chatinput.arquivos_selecionados) > 0
        ):
            msg.conteudo = f"{agent.msg_sistema}"
            msg.arquivos_busca = "Arquivos"
            msg.arquivos_selecionados = ", ".join(chatinput.arquivos_selecionados)
            msg.arquivos_selecionados_prontos = ", ".join(
                chatinput.arquivos_selecionados_prontos
            )
            logger.info(f"Mensagem from message_process_utils: {msg}")
        return msg
