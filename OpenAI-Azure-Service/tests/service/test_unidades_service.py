import pytest
from aioresponses import aioresponses

from src.domain.schemas import DestinatarioOut
from src.service import unidades_service


class TestUnidadesService:

    @pytest.mark.asyncio
    async def test_busca_unidade(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(unidades_service, "autenticar_servico_token_2019", mock)
        resposta_esperada = [{"cod": "123", "sigla": "teste"}]
        with aioresponses() as mocked:
            url = "http://propriedade-teste/unidades/ativas"
            mocked.get(url, payload=resposta_esperada, status=200)
            retorno = await unidades_service.busca_unidade("teste", "teste", "teste")
        assert retorno[0] == DestinatarioOut(codigo="U_123", nome="teste")

    @pytest.mark.asyncio
    async def test_busca_arvore_unidades(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(unidades_service, "autenticar_servico_token_2019", mock)
        resposta_esperada = [
            {
                "id": 123,
                "sigla": "teste",
                "denominacao": "teste",
                "situacaoUnidade": {"id": 1, "descricao": "teste"},
            }
        ]
        with aioresponses() as mocked:
            url = "http://propriedade-teste/api/v1/unidades/arvore"
            mocked.get(url, payload=resposta_esperada, status=200)
            retorno = await unidades_service.busca_arvore_unidades("teste", "teste")
        assert retorno[0] == resposta_esperada[0]

    @pytest.mark.asyncio
    async def test_get_cod_unidades_ate(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(unidades_service, "autenticar_servico_token_2019", mock)
        resposta_esperada = [
            {
                "id": 123,
                "sigla": "teste",
                "denominacao": "teste",
                "situacaoUnidade": {"id": 1, "descricao": "teste"},
                "subunidades": [],
            }
        ]
        with aioresponses() as mocked:
            url = "http://propriedade-teste/api/v1/unidades/arvore"
            mocked.get(url, payload=resposta_esperada, status=200)
            retorno = await unidades_service.get_cod_unidades_ate(
                "teste", "teste", "123"
            )
        assert retorno[0] == "123"
