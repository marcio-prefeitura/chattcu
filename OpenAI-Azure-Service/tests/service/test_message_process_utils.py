from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from src.domain.agent import Agent
from src.domain.llm.base.message_process_utils import MessageProcessUtils
from src.domain.nome_indice_enum import NomeIndiceEnum
from src.domain.papel_enum import PapelEnum
from src.domain.schemas import ChatGptInput
from src.domain.tipo_busca_enum import TipoBuscaEnum


class TestMessageProcessUtils:

    @pytest.fixture
    def setup(self):
        self.utils = MessageProcessUtils()

        self.mock_chatinput = MagicMock(ChatGptInput)
        # self.mock_chatinput.chat_id = "123"  # Convertido para string
        self.mock_chatinput.top_documentos = 5
        self.mock_chatinput.tool_selecionada = "Tool1"
        self.mock_chatinput.arquivos_selecionados = []
        self.mock_chatinput.arquivos_selecionados_prontos = []

        self.mock_agent = MagicMock(Agent)
        self.mock_agent.msg_sistema = "System message"
        self.mock_agent.parametro_tipo_busca = (
            TipoBuscaEnum.NA
        )  # Valor válido para o enum
        self.mock_agent.parametro_nome_indice_busca = (
            NomeIndiceEnum.JURIS
        )  # Valor válido para o enum
        self.mock_agent.arquivos_busca = "Conhecimento Geral"
        self.mock_modelo = {"deployment_name": "deployment_name", "version": "1.0"}

        self.historico = []

        self.current_datetime = datetime(2024, 8, 15, 12, 30)

    def test_create_mensagem_default(self, setup):
        with patch(
            "src.domain.llm.base.message_process_utils.datetime"
        ) as mock_datetime:
            mock_datetime.now.return_value = self.current_datetime

            mensagem = self.utils._create_mensagem(
                chatinput=self.mock_chatinput,
                agent=self.mock_agent,
                modelo=self.mock_modelo,
                historico=self.historico,
                chat_id="123",
            )

            expected_codigo = (
                f"c_123_" f"{self.current_datetime.strftime('%Y%m%d%H%M')}_1"
            )

            assert mensagem.chat_id == "123"
            assert mensagem.codigo == expected_codigo
            assert mensagem.conteudo == self.mock_agent.msg_sistema
            assert mensagem.papel == PapelEnum.SYSTEM
            assert mensagem.arquivos_busca == "Conhecimento Geral"
            assert mensagem.parametro_tipo_busca == self.mock_agent.parametro_tipo_busca
            assert (
                mensagem.parametro_nome_indice_busca
                == self.mock_agent.parametro_nome_indice_busca
            )
            assert (
                mensagem.parametro_quantidade_trechos_relevantes_busca
                == self.mock_chatinput.top_documentos
            )
            assert mensagem.parametro_modelo_llm == self.mock_modelo["deployment_name"]
            assert mensagem.parametro_versao_modelo_llm == self.mock_modelo["version"]
            assert mensagem.data_envio == self.current_datetime
            assert (
                mensagem.especialista_utilizado == self.mock_chatinput.tool_selecionada
            )
            assert mensagem.arquivos_selecionados is None
            assert mensagem.arquivos_selecionados_prontos is None

    def test_create_mensagem_with_files(self, setup):
        self.mock_chatinput.arquivos_selecionados = ["file1.txt", "file2.txt"]
        self.mock_chatinput.arquivos_selecionados_prontos = ["file3.txt"]

        with patch(
            "src.domain.llm.base.message_process_utils.datetime"
        ) as mock_datetime:
            mock_datetime.now.return_value = self.current_datetime

            mensagem = self.utils._create_mensagem(
                chatinput=self.mock_chatinput,
                agent=self.mock_agent,
                modelo=self.mock_modelo,
                historico=self.historico,
                chat_id="123",
            )

            expected_codigo = (
                f"c_123_" f"{self.current_datetime.strftime('%Y%m%d%H%M')}_1"
            )

            assert mensagem.chat_id == "123"
            assert mensagem.codigo == expected_codigo
            assert mensagem.conteudo == self.mock_agent.msg_sistema
            assert mensagem.papel == PapelEnum.SYSTEM
            assert mensagem.arquivos_busca == "Arquivos"
            assert mensagem.arquivos_selecionados == "file1.txt, file2.txt"
            assert mensagem.arquivos_selecionados_prontos == "file3.txt"
            assert mensagem.parametro_tipo_busca == self.mock_agent.parametro_tipo_busca
            assert (
                mensagem.parametro_nome_indice_busca
                == self.mock_agent.parametro_nome_indice_busca
            )
            assert (
                mensagem.parametro_quantidade_trechos_relevantes_busca
                == self.mock_chatinput.top_documentos
            )
            assert mensagem.parametro_modelo_llm == self.mock_modelo["deployment_name"]
            assert mensagem.parametro_versao_modelo_llm == self.mock_modelo["version"]
            assert mensagem.data_envio == self.current_datetime
            assert (
                mensagem.especialista_utilizado == self.mock_chatinput.tool_selecionada
            )
