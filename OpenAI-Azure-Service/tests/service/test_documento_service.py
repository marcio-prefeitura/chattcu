from base64 import b64decode
from io import BytesIO

import pdfplumber
import pytest
from aioresponses import aioresponses

from src.conf.env import configs
from src.service import documento_service
from src.service.documento_service import NoHeaderFooterPDFPlumberParser
from tests.util import mock_objects
from tests.util.mock_objects import MockObjects


class TestDocumentoService:
    @pytest.mark.asyncio
    async def test_obter_pecas_processo(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        mockProcesso = {"cod": "1234567891011"}
        mockPeca = [MockObjects.mock_peca]
        with aioresponses() as mocked:

            urlProcesso = (
                f"{configs.BASE_PROCESSO_URL}/processos?numero=123456&ano=7891&dv=1"
            )
            urlPeca = f"{configs.BASE_PROCESSO_NOVO_URL}/processos/1234567891011/pecas"
            mocked.get(urlProcesso, payload=mockProcesso, status=200)
            mocked.get(urlPeca, payload=mockPeca, status=200)
            retorno = await documento_service.obter_pecas_processo(
                "1234567891011", "teste"
            )
        assert retorno[0].codigo == 1234567891011
        assert retorno[0].assunto == "assunto_teste"
        assert retorno[0].numero_ordem_peca == 1234567891011

    @pytest.mark.asyncio
    async def test_recuperar_peca_processo(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        mockProcesso = {"cod": "1234567891011"}
        mockPeca = [MockObjects.mock_peca]
        with aioresponses() as mocked:

            urlProcesso = (
                f"{configs.BASE_PROCESSO_URL}/processos?numero=123456&ano=7891&dv=1"
            )
            urlPeca = f"{configs.BASE_PROCESSO_NOVO_URL}/processos/1234567891011/pecas"
            mocked.get(urlProcesso, payload=mockProcesso, status=200)
            mocked.get(urlPeca, payload=mockPeca, status=200)
            retorno = await documento_service.recuperar_peca_processo(
                "1234567891011", "1234567891011", "teste"
            )
        assert retorno.codigo == 1234567891011
        assert retorno.assunto == "assunto_teste"

    @pytest.mark.asyncio
    async def test_recuperar_peca_processo_assercion_erro(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "obter_pecas_processo", mock)
        with pytest.raises(Exception) as exc_info:
            await documento_service.recuperar_peca_processo(
                "1234567891011", "1234567891011", "teste"
            )
        assert exc_info.value.args[0] == "Peça não encontrada!"

    @pytest.mark.asyncio
    async def test_recuperar_peca_processo_execption_erro(self, mocker):
        mocker.patch.object(documento_service, "obter_pecas_processo", [])
        with pytest.raises(Exception) as exc_info:
            await documento_service.recuperar_peca_processo(
                "1234567891011", "1234567891011", "teste"
            )
        assert exc_info.value.args[0] == "Impossibilidade de obter peças do processo"

    @pytest.mark.asyncio
    async def test_obter_stream_documento(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        with aioresponses() as mocked:
            urlConteudo = f"{configs.BASE_DOCUMENTO_URL}/documentos/1/conteudo"
            retorno_esperado = {"extensaoArquivo": "pdf", "conteudoBase64": "VGVzdGU="}
            mocked.get(urlConteudo, payload=retorno_esperado, status=200)
            retorno = await documento_service.obter_stream_documento(1, "teste")
        assert retorno.getvalue() == b"Teste"

    @pytest.mark.asyncio
    async def test_obter_stream_documento_extensao_diferente_de_pdf(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        with aioresponses() as mocked:
            urlConteudo = f"{configs.BASE_DOCUMENTO_URL}/documentos/1/conteudo"
            retorno_esperado = {"extensaoArquivo": "jpg", "conteudoBase64": "VGVzdGU="}
            mocked.get(urlConteudo, payload=retorno_esperado, status=200)
            with pytest.raises(Exception) as exc_info:
                await documento_service.obter_stream_documento(1, "teste")
            assert (
                exc_info.value.args[0]
                == "Impossibilidade de obter o stream do documento"
            )

    @pytest.mark.asyncio
    async def test_obter_documento_pdf(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        with aioresponses() as mocked:
            urlConteudo = f"{configs.BASE_DOCUMENTO_URL}/documentos/1/conteudo-pdf"
            mocked.get(urlConteudo, payload="Teste", status=200)
            retorno = await documento_service.obter_documento_pdf(1, "teste")
        assert retorno.getvalue() == b'"Teste"'

    @pytest.mark.asyncio
    async def test_obter_documento_pdf_status_nao_esperado(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        with aioresponses() as mocked:
            urlConteudo = f"{configs.BASE_DOCUMENTO_URL}/documentos/1/conteudo-pdf"
            mocked.get(urlConteudo, payload={}, status=400)
            with pytest.raises(Exception) as exc_info:
                await documento_service.obter_documento_pdf(1, "teste")
            assert (
                exc_info.value.args[0]
                == "Impossibilidade de obter o stream do documento"
            )

    @pytest.mark.asyncio
    async def test_num_tokens_from_string(self):
        retorno = documento_service.num_tokens_from_string("Teste")
        assert retorno == 2

    @pytest.mark.asyncio
    async def test_process_page_content(self, mocker):
        mock = mocker.AsyncMock()
        mocker.patch.object(documento_service, "autenticar_servico", mock)
        byteIso = BytesIO(b64decode(MockObjects.base64_pdf))
        retorno = (
            documento_service.NoHeaderFooterPDFPlumberParser._process_page_content(
                NoHeaderFooterPDFPlumberParser(), pdfplumber.open(byteIso).pages[0]
            )
        )
        assert retorno == ""
