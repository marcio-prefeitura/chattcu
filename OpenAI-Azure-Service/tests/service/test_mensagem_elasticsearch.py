from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.domain.mensagem import Mensagem
from src.domain.schemas import ReagirInput
from src.infrastructure.elasticsearch.mensagem_elasticsearch import (
    MensagemElasticSearchImpl,
)


class TestMensagemElasticSearch:

    @patch("src.infrastructure.elasticsearch.mensagem_elasticsearch.logger")
    @patch(
        "src.infrastructure.elasticsearch.mensagem_elasticsearch.MensagemElasticSearchImpl.elasticsearch_query",
        new_callable=AsyncMock,
    )
    @patch(
        "src.infrastructure.elasticsearch.mensagem_elasticsearch.MensagemElasticSearchImpl.insert_ou_update_campo",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_adicionar_mensagem(
        self, mock_insert_ou_update_campo, mock_elasticsearch_query, mock_logger
    ):
        # Arrange
        elasticsearch = MensagemElasticSearchImpl()
        cod_chat = "chat123"
        mensagem = MagicMock(spec=Mensagem)
        mensagem.codigo = "msg123"
        mensagem.papel = MagicMock()
        mensagem.papel.name = "user"
        mensagem.conteudo = "conteudo da mensagem"
        mensagem.data_envio = MagicMock()
        mensagem.data_envio.strftime.return_value = "2023-01-01 12:00:00"
        mensagem.parametro_tipo_busca = MagicMock()
        mensagem.parametro_tipo_busca.value = "tipo_busca"
        mensagem.parametro_nome_indice_busca = MagicMock()
        mensagem.parametro_nome_indice_busca.value = "nome_indice"
        mensagem.parametro_quantidade_trechos_relevantes_busca = 5
        mensagem.parametro_modelo_llm = "modelo_llm"
        mensagem.parametro_versao_modelo_llm = "versao_modelo_llm"
        mensagem.arquivos_busca = "arquivos_busca"
        mensagem.arquivos_selecionados = ["arquivo1", "arquivo2"]
        mensagem.arquivos_selecionados_prontos = ["arquivo1_pronto", "arquivo2_pronto"]
        mensagem.trechos = []
        mensagem.especialista_utilizado = "especialista"
        mensagem.chat_id = "chat123"
        mensagem.imagens = []
        mock_elasticsearch_query.return_value = {"result": "updated"}

        await elasticsearch.adicionar_mensagem(cod_chat, mensagem)

        mock_elasticsearch_query.assert_called()
        mock_insert_ou_update_campo.assert_called()
        mock_logger.info.assert_called()

    @patch("src.infrastructure.elasticsearch.mensagem_elasticsearch.logger")
    @patch(
        "src.infrastructure.elasticsearch.mensagem_elasticsearch.MensagemElasticSearchImpl.elasticsearch_query",
        new_callable=AsyncMock,
    )
    @pytest.mark.asyncio
    async def test_adicionar_feedback(self, mock_elasticsearch_query, mock_logger):
        elasticsearch = MensagemElasticSearchImpl()
        entrada = ReagirInput(
            reacao="like",
            conteudo="bom",
            ofensivo=False,
            inveridico=False,
            nao_ajudou=False,
        )
        chat_id = "chat123"
        cod_mensagem = "msg123"
        app_origem = "app"
        usuario = "usuario"

        mock_elasticsearch_query.return_value = {"result": "updated"}

        await elasticsearch.adicionar_feedback(
            entrada, chat_id, cod_mensagem, app_origem, usuario
        )

        mock_elasticsearch_query.assert_called()
        mock_logger.info.assert_called()
