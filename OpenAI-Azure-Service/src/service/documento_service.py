import logging
import os
import re
import traceback
from base64 import b64decode
from io import BytesIO
from typing import Any, Iterator, List, Mapping, Optional

import aiohttp
import pdfplumber
from langchain.docstore.document import Document
from langchain.document_loaders.blob_loaders import Blob
from langchain_community.document_loaders.parsers.pdf import PDFPlumberParser
from langchain_community.document_loaders.pdf import BasePDFLoader
from opentelemetry import trace

from src.conf.env import configs
from src.domain import documento
from src.domain.llm.util.util import num_tokens_from_string
from src.exceptions import ServiceException
from src.infrastructure.realtimeaudio.util_realtime import Bcolors
from src.service.auth_service import autenticar_servico
from src.service.coarse_grained_pymupdf_parser import CoarseGrainedPyMUPDFParser

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

RECURSO_COMPUTACIONAL_PECAS_PROCESSOS = 394
HEADERS = {"Content-Type": "application/json"}


@tracer.start_as_current_span("obter_pecas_processo")
async def obter_pecas_processo(numero_processo: str, token: str):
    try:
        url_base_processo = re.sub(r"\/$", "", configs.BASE_PROCESSO_URL)
        url_base_processo_novo = re.sub(r"\/$", "", configs.BASE_PROCESSO_NOVO_URL)

        numero_processo = re.sub(r"\D", "", numero_processo).zfill(11)
        numero = numero_processo[0:6]
        ano = numero_processo[6:10]
        dv = numero_processo[-1]

        HEADERS["Authorization"] = (
            f"Bearer {await autenticar_servico(token, RECURSO_COMPUTACIONAL_PECAS_PROCESSOS)}"
        )

        async with aiohttp.ClientSession() as session:
            async with session.get(
                (f"{url_base_processo}/processos?numero={numero}&ano={ano}&dv={dv}"),
                headers=HEADERS,
            ) as response:
                # Lança uma exceção se o código de status não for 2xx
                response.raise_for_status()

                codigo_processo = await response.json()
                codigo_processo = codigo_processo["cod"]

                async with session.get(
                    f"{url_base_processo_novo}/processos/{codigo_processo}/pecas",
                    headers=HEADERS,
                ) as response:
                    # Lança uma exceção se o código de status não for 2xx
                    response.raise_for_status()

                    json_response = await response.json()

                    a = sorted(
                        list(map(documento.documento_assembly, json_response)),
                        key=lambda documento: documento.numero_ordem_peca,
                        reverse=True,
                    )
                    return a
    except AssertionError as erro:
        logger.error(erro)
        traceback.print_exc()
        raise Exception("Impossibilidade de obter peças do processo") from erro


@tracer.start_as_current_span("recuperar_peca_processo")
async def recuperar_peca_processo(
    numero_peca: str, numero_processo: str, token: str
) -> str:
    """Ferramenta que recupera uma peça de processo.
    Parâmetros válidos incluem:
    "numero_peca": "numero_peca", "numero_processo": "numero_processo" """
    try:
        pecas = await obter_pecas_processo(numero_processo, token)

        logger.info(f"Total de peças => {len(pecas)}")

        peca = list(
            filter(lambda peca: peca.numero_ordem_peca == int(numero_peca), pecas)
        )

        assert len(peca) != 0

        return peca[0]
    except AssertionError as erro:
        raise Exception("Peça não encontrada!") from erro
    except Exception as erro:
        logger.error(erro)
        traceback.print_exc()
        raise Exception("Impossibilidade de obter peças do processo") from erro


@tracer.start_as_current_span("obter_stream_documento")
async def obter_stream_documento(id_documento: int, token: str) -> BytesIO:
    """
    MÉTODO OBSOLETO VISTO QUE O ENDPOINT DE OBTENÇÃO DO CONTEÚDO ESTÁ OBSOLETO
    """
    try:
        url_base_documento = re.sub(r"\/$", "", configs.BASE_DOCUMENTO_URL)

        HEADERS["Authorization"] = (
            f"Bearer {await autenticar_servico(token, RECURSO_COMPUTACIONAL_PECAS_PROCESSOS)}"
        )

        # ENDPOINT OBSOLETO
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{url_base_documento}/documentos/{id_documento}/conteudo",
                headers=HEADERS,
            ) as response:
                # Lança uma exceção se o código de status não for 2xx
                response.raise_for_status()

                body = await response.json()

                assert body["extensaoArquivo"] == "pdf"

                return BytesIO(b64decode(body["conteudoBase64"]))
    except AssertionError as erro:
        logger.error(erro)
        traceback.print_exc()
        raise ServiceException(
            "Impossibilidade de obter o stream do documento"
        ) from erro


@tracer.start_as_current_span("obter_documento_pdf")
async def obter_documento_pdf(id_documento: int, token: str):
    logger.info(f"\n\n>>{id_documento} - OBTENDO O DOCUMENTO PDF\n\n")
    try:
        HEADERS["Authorization"] = (
            f"Bearer {await autenticar_servico(token, RECURSO_COMPUTACIONAL_PECAS_PROCESSOS)}"
        )

        if not HEADERS["Authorization"]:
            raise ServiceException("Authorization token é nullo ou inválido!")

        logger.info(
            Bcolors.FAIL
            + f">> {token} - Obtendo o stream do documento {id_documento}"
            + Bcolors.ENDC
        )

        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{configs.BASE_DOCUMENTO_URL}/documentos/{id_documento}/conteudo-pdf",
                headers=HEADERS,
                timeout=timeout,
            ) as response:
                # Lança uma exceção se o código de status não for 2xx
                response.raise_for_status()

                return BytesIO(await response.read())
    except aiohttp.ClientResponseError as erro:
        logger.error(
            Bcolors.BOLD
            + Bcolors.FAIL
            + f">> {token} - Impossibilidade de obter [ob214] o stream do documento {id_documento}"
            + Bcolors.ENDC
        )

        logger.error(erro)
        traceback.print_exc()
        raise Exception("Impossibilidade de obter o stream do documento") from erro


@tracer.start_as_current_span("remove_header_and_footer")
def remove_header_and_footer(page):
    x_0, top, x_1, bottom = page.bbox
    top += 90
    bottom -= 4
    cropped_page = page.within_bbox((x_0, top, x_1, bottom))

    return cropped_page


class NoHeaderFooterPDFPlumberParser(PDFPlumberParser):
    @tracer.start_as_current_span("_process_page_content")
    def _process_page_content(self, page: pdfplumber.page.Page) -> str:
        """Process the page content based on dedupe."""

        page = remove_header_and_footer(page)

        if self.dedupe:
            return page.dedupe_chars().extract_text(**self.text_kwargs)

        return page.extract_text(**self.text_kwargs)


class CoarseGrainedPDFPlumberParser(NoHeaderFooterPDFPlumberParser):
    @tracer.start_as_current_span("lazy_parse")
    def lazy_parse(self, blob: Blob) -> Iterator[Document]:
        """Lazily parse the blob."""

        logger.info(">> Executando o lazzy parse do documento")

        with blob.as_bytes_io() as file_path:
            # open document
            logger.info(f"Chegou com o file_path {file_path}")
            doc = pdfplumber.open(file_path)
            segments = []
            max_length = 30000
            current_segment_length = 0
            current_segment = ""
            page_numbers = [doc.pages[0].page_number]

            for page in doc.pages:
                page_content = self._process_page_content(page)
                num_tokens = num_tokens_from_string(page_content)

                if current_segment_length + num_tokens < max_length:
                    current_segment += page_content
                    current_segment_length += num_tokens
                else:
                    segments.append(current_segment)

                    current_segment = page_content
                    current_segment_length = num_tokens

                    page_numbers.append(page.page_number)

            segments.append(current_segment)

            yield from [
                Document(
                    page_content=segment,
                    metadata=dict(
                        {
                            "source": blob.source,
                            "file_path": blob.source,
                            "page": page_numbers[i],
                            "total_pages": len(doc.pages),
                        },
                        **{
                            k: doc.metadata[k]
                            for k in doc.metadata
                            if type(doc.metadata[k]) in [str, int]
                        },
                    ),
                )
                for i, segment in enumerate(segments)
            ]


class StreamPDFPlumberLoader(BasePDFLoader):
    """Load `PDF` files using `pdfplumber`."""

    @tracer.start_as_current_span("__init___BasePDFLoader")
    def __init__(
        self,
        data: BytesIO,
        text_kwargs: Optional[Mapping[str, Any]] = None,
        dedupe: bool = False,
    ) -> None:
        self.data = data
        self.text_kwargs = text_kwargs or {}
        self.dedupe = dedupe

    @tracer.start_as_current_span("load")
    def load(self) -> List[Document]:
        logger.info(">> Executando o load do documento")

        """Load file."""
        parser = CoarseGrainedPDFPlumberParser(
            text_kwargs=self.text_kwargs, dedupe=self.dedupe
        )

        blob = Blob.from_data(self.data.read())

        return parser.parse(blob)


class StreamPyMUPDFLoader(BasePDFLoader):
    """Load `PDF` files using `pymupdf`."""

    @tracer.start_as_current_span("__init___BasePDFLoader")
    def __init__(
        self,
        data: BytesIO,
        text_kwargs: Optional[Mapping[str, Any]] = None,
        # dedupe: bool = False,
    ) -> None:
        self.data = data
        self.text_kwargs = text_kwargs or {}
        # self.dedupe = dedupe

    @tracer.start_as_current_span("load")
    def load(self) -> List[Document]:
        logger.info(">> Executando o load do documento com o PyMUPDF")

        self.data.seek(0)

        """Load file."""
        parser = CoarseGrainedPyMUPDFParser(text_kwargs=self.text_kwargs)

        return parser.parse(self.data)
