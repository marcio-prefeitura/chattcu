import pytest
from aioresponses import aioresponses

from src.domain.schemas import DestinatarioOut
from src.service import pessoas_service

MOCK_RESPOSTA_PADRAO = {
    "results": [
        {
            "text": "teste123",
            "id": 1,
        }
    ],
}


class TestPessoasService:

    @pytest.mark.asyncio
    async def test_buscar_pessoas_por_nome(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(pessoas_service, "autenticar_servico", mock)
        retorno_esperado = DestinatarioOut(codigo="P_1", nome="teste123")
        with aioresponses() as mocked:
            url = "http://propriedade-teste/pessoas/pesquisa-por-nome"
            mocked.post(url, payload=MOCK_RESPOSTA_PADRAO, status=200)
            retorno = await pessoas_service.buscar_pessoas_por_nome("teste", "teste")
        assert retorno[0] == retorno_esperado

    @pytest.mark.asyncio
    async def test_buscar_pessoa_por_codigo(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(pessoas_service, "autenticar_servico_token_2019", mock)
        tkn_mock = "tkn-portal"
        ufp_mock = "ufp-porta"
        with aioresponses() as mocked:
            url = "http://propriedade-teste/pessoas/1"
            mocked.get(url, payload=MOCK_RESPOSTA_PADRAO, status=200)
            retorno = await pessoas_service.buscar_pessoa_por_codigo(
                1, tkn_mock, ufp_mock
            )

        assert retorno == MOCK_RESPOSTA_PADRAO

    @pytest.mark.asyncio
    async def test_buscar_pessoa_por_matricula(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(pessoas_service, "autenticar_servico", mock)
        with aioresponses() as mocked:
            url = "http://propriedade-teste/pessoas/matricula/123"
            mocked.post(url, payload=MOCK_RESPOSTA_PADRAO, status=200)
            retorno = await pessoas_service.buscar_pessoa_por_matricula("123", "teste")

        assert retorno == MOCK_RESPOSTA_PADRAO
