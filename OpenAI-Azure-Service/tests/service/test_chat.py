import pytest

from src.domain.chat import Credencial, elastic_para_chat_dict
from tests.util.mock_objects import MockObjects


class TestChat:

    @pytest.mark.asyncio
    async def test_chat_creation(self):
        credencial = Credencial(aplicacao_origem="teste", usuario="teste")
        mensagens = [MockObjects.mock_mensagem]
        chat = MockObjects.mock_chat
        assert chat.id == "1"
        assert chat.usuario == "Usuario Teste"
        assert chat.titulo == "Titulo Teste"
        assert chat.fixado is False
        assert chat.apagado is False
        assert chat.mensagens == mensagens
        assert chat.credencial == credencial

    @pytest.mark.asyncio
    async def test_elastic_para_chat_dict(self):
        dado = {
            "_id": "123",
            "_source": {
                "chat": {
                    "usuario": "user",
                    "titulo": "Chat Title",
                    "data_ultima_iteracao": "2023-01-01 10:00:00",
                    "fixado": True,
                    "arquivado": False,
                },
                "mensagens": [
                    {
                        "papel": "ASSISTANT",
                        "texto": "Mensagem de sistema",
                        "codigo": "1",
                        "conteudo": "Conteudo da mensagem",
                        "favoritado": False,
                        "imagens": [],
                    }
                ],
            },
        }
        chat_out = elastic_para_chat_dict(dado, com_mensagem=True)
        assert chat_out.id == "123"
        assert chat_out.usuario == "user"
        assert chat_out.titulo == "Chat Title"
        assert chat_out.data_ultima_iteracao == "2023-01-01 10:00:00"
        assert chat_out.fixado is True
        assert chat_out.arquivado is False
        assert chat_out.mensagens[0].papel == "ASSISTANT"
        assert chat_out.mensagens[0].conteudo == "Conteudo da mensagem"
        assert chat_out.mensagens[0].codigo == "1"

    @pytest.mark.asyncio
    async def test_elastic_para_chat_dict_none(self):
        chat_out = elastic_para_chat_dict(None, com_mensagem=False)
        assert chat_out is None
