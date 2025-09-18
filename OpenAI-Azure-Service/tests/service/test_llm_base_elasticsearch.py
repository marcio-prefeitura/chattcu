from unittest.mock import AsyncMock

import pytest

from src.domain.llm.base.llm_base_elasticsearch import LLMBaseElasticSearch
from src.domain.schemas import ChatGptInput
from src.infrastructure.security_tokens import DecodedToken
from tests.util.mock_objects import MockObjects


class TestLLMBaseElasticSearch:

    @pytest.mark.asyncio
    async def test_criar_novo_chat_com_input(self, mocker):
        mocker.patch(
            "src.infrastructure.elasticsearch.elasticsearch.ElasticSearch.criar_novo_chat",
            new_callable=AsyncMock,
        )
        chat_input = ChatGptInput(
            prompt_usuario="There are many variations of passages of Lorem Ipsum available"
            ", but the majority have suffered alteration in some"
        )
        token_usr = DecodedToken(
            login="test_user",
            siga_culs="value1",
            siga_nuls="value2",
            siga_clot="value3",
            siga_slot="value4",
            siga_lot="value5",
            siga_luls="value6",
        )
        app_origem = "app"

        chat_id, titulo = await LLMBaseElasticSearch._criar_novo_chat_com_input(
            chat_input, token_usr, app_origem
        )

        assert chat_id is not None
        assert titulo == (
            "There are many variations of passages of Lorem Ipsum available, but the "
            "majority have suffered alter..."
        )

    @pytest.mark.asyncio
    async def test_carregar_historico_para_prompt(self, mocker):
        mocker.patch(
            "src.infrastructure.elasticsearch.elasticsearch.ElasticSearch.buscar_chat",
            new_callable=AsyncMock,
            return_value=MockObjects.mock_chat,
        )
        chat_id = "123"
        login = "user"

        historico = await LLMBaseElasticSearch._carregar_historico_para_prompt(
            chat_id, login
        )

        assert isinstance(historico, list)

    @pytest.mark.asyncio
    async def test_adicionar_mensagem(self, mocker):
        mocker.patch(
            "src.infrastructure.elasticsearch.elasticsearch.ElasticSearch.adicionar_mensagem",
            new_callable=AsyncMock,
        )
        cod_chat = "123"
        mensagem = MockObjects.mock_mensagem

        await LLMBaseElasticSearch._adicionar_mensagem(cod_chat, mensagem)

        assert True

    @pytest.mark.asyncio
    async def test_adicionar_mensagens(self, mocker):
        mocker.patch(
            "src.infrastructure.elasticsearch.elasticsearch.ElasticSearch.adicionar_mensagem",
            new_callable=AsyncMock,
        )
        cod_chat = "123"
        mensagens = [MockObjects.mock_mensagem]

        await LLMBaseElasticSearch._adicionar_mensagens(cod_chat, mensagens)

        assert True
