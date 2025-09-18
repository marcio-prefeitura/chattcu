import pytest
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from langchain.docstore.document import Document

from src.service import segedam_service
from tests.util.mock_objects import MockObjects

MOCK_RESPOSTA_PADRAO = {
    "results": [
        {
            "text": "teste123",
            "id": 1,
        }
    ],
}


class TestSegedamService:

    @pytest.mark.asyncio
    async def test_prepara(self):
        resposta_esperada = Document(
            page_content='{"descr_nome": "nome_test", "texto_palavras_chave": "texto_palavras_chave_test", "texto_o_que_e": "texto_o_que_e_test"}',
            metadata={"source": "Segedam", "index": 0},
        )
        retorno = await segedam_service.prepara([MockObjects.mock_servico_segedam])
        assert retorno[0] == resposta_esperada

    @pytest.mark.asyncio
    async def test_autaliza_integral(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(segedam_service.SegedamCS, "exclui_indice", mock)
        mocker.patch.object(segedam_service.SegedamCS, "cria_indice", mock)
        mocker.patch.object(segedam_service.SegedamCS, "popular_indice", mock)

        resposta_esperada = JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"msg": "Indice atualizado com sucesso!"},
        )
        retorno = await segedam_service.autaliza_integral(
            [MockObjects.mock_servico_segedam]
        )
        assert retorno.status_code == resposta_esperada.status_code
        assert retorno.body == resposta_esperada.body

    @pytest.mark.asyncio
    async def test_autaliza_integral_bad_request(self):

        with pytest.raises(HTTPException) as exc_info:
            await segedam_service.autaliza_integral([MockObjects.mock_servico_segedam])

        assert exc_info.type == HTTPException
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.asyncio
    async def test_autaliza_parcial(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(segedam_service.SegedamCS, "create_sections_servicos", mock)
        mocker.patch.object(segedam_service.SegedamCS, "popular_indice", mock)

        resposta_esperada = JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"msg": "Indice atualizado com sucesso!"},
        )
        retorno = await segedam_service.autaliza_parcial(
            [MockObjects.mock_servico_segedam]
        )
        assert retorno.status_code == resposta_esperada.status_code
        assert retorno.body == resposta_esperada.body

    @pytest.mark.asyncio
    async def test_autaliza_parcial_bad_request(self):

        with pytest.raises(HTTPException) as exc_info:
            await segedam_service.autaliza_parcial([MockObjects.mock_servico_segedam])

        assert exc_info.type == HTTPException
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
