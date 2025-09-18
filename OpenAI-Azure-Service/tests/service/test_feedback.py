import pytest

from src.domain.feedback import (
    Feedback,
    elastic_para_feedback,
    elastic_para_feedback_dict,
)
from src.domain.reacao_enum import ReacaoEnum


class TestFeedback:

    @pytest.mark.asyncio
    async def test_feedback_creation(self):
        feedback = Feedback(
            cod_mensagem="msg_123",
            conteudo="This is a feedback",
            reacao=ReacaoEnum.LIKED,
            ofensivo=False,
            inveridico=False,
            nao_ajudou=False,
        )
        assert feedback.cod_mensagem == "msg_123"
        assert feedback.conteudo == "This is a feedback"
        assert feedback.reacao == ReacaoEnum.LIKED
        assert feedback.ofensivo is False
        assert feedback.inveridico is False
        assert feedback.nao_ajudou is False

    @pytest.mark.asyncio
    async def test_elastic_para_feedback(self):
        dado = {
            "conteudo": "This is a feedback",
            "nao_ajudou": False,
            "inveridico": False,
            "ofensivo": False,
            "reacao": "LIKED",
        }
        feedback = elastic_para_feedback(dado)
        assert feedback.conteudo == "This is a feedback"
        assert feedback.nao_ajudou is False
        assert feedback.inveridico is False
        assert feedback.ofensivo is False
        assert feedback.reacao == ReacaoEnum.LIKED

    @pytest.mark.asyncio
    async def test_elastic_para_feedback_dict(self):
        dado = {
            "conteudo": "This is a feedback",
            "nao_ajudou": False,
            "inveridico": False,
            "ofensivo": False,
            "reacao": "LIKE",
        }
        feedback_out = elastic_para_feedback_dict(dado)
        assert feedback_out.conteudo == "This is a feedback"
        assert feedback_out.nao_ajudou is False
        assert feedback_out.inveridico is False
        assert feedback_out.ofensivo is False
        assert feedback_out.reacao == "LIKE"

    @pytest.mark.asyncio
    async def test_feedback_none(self):
        feedback_out = elastic_para_feedback_dict(None)
        feedback = elastic_para_feedback(None)
        assert feedback_out is None
        assert feedback is None
