import asyncio
import logging
import os
import time
from abc import ABC
from tempfile import NamedTemporaryFile, _TemporaryFileWrapper

import fitz  # PyMuPDF
import pandas as pd
from langchain.docstore.document import Document
from langchain_community.callbacks.openai_info import OpenAICallbackHandler
from langchain_community.document_loaders import CSVLoader
from opentelemetry import trace

from src.conf.env import configs
from src.domain.llm.model_factory import ModelFactory
from src.domain.llm.tools.sumarizador_documento_upload import SumarizadorDocumentoUpload
from src.domain.schemas import GabiResponse
from src.infrastructure.env import MODELO_PADRAO, MODELOS, VERBOSE
from src.util.docx_to_pdf_converter import DocxToPdfConverter
from src.util.upload_util import write_data_in_temporary_file

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class LocalFileProcessor(ABC):
    @tracer.start_as_current_span("__load_document_from_pdf_bytes")
    @staticmethod
    async def __load_document_from_pdf_bytes(
        temp_file: _TemporaryFileWrapper, filename: str
    ):
        inicio = time.time()
        logger.info("Realiza o load do arquivo PDF através dos bytes")

        temp_file.seek(0)

        pages = []
        with fitz.open(filename=temp_file.name, filetype="pdf") as pdf:
            for i in range(len(pdf)):
                page = pdf.load_page(i)
                text = page.get_text()

                pages.append(
                    Document(
                        page_content=text,
                        metadata={"source": filename, "page": i + 1},
                    )
                )

        fim = time.time()

        logger.info(
            f"Tempo total gasto carregando as páginas do documento para indexação: {(fim - inicio)}"
        )
        logger.info(f"{len(pages)} páginas")

        return pages

    @tracer.start_as_current_span("__load_document_from_csv")
    @staticmethod
    async def __load_document_from_csv(
        temp_file: _TemporaryFileWrapper, filename: str, page_number: int = 1
    ):
        inicio = time.time()
        logger.info(
            f"Realiza o load do arquivo CSV ({temp_file.name}) através dos bytes"
        )
        temp_file.seek(0)

        loader = CSVLoader(temp_file.name, encoding="utf-8")

        data = loader.load()

        page = Document(
            page_content=" ".join([doc.page_content for doc in data]),
            metadata={"page": page_number, "source": filename},
        )

        fim = time.time()
        logger.info(
            f"Tempo total gasto carregando documento para indexação: {(fim - inicio)}"
        )

        return [page]

    @tracer.start_as_current_span("__load_document_from_xlsx_as_csv")
    @staticmethod
    async def __load_document_from_xlsx_as_csv(
        temp_file: _TemporaryFileWrapper, filename: str
    ):
        temp_file.seek(0)
        xls = pd.ExcelFile(temp_file.name, engine="openpyxl")

        pages = []

        for i, plan_name in enumerate(xls.sheet_names):
            logger.info(f"Processando planilha {i+1}:{plan_name}")

            df = pd.read_excel(xls, sheet_name=i)
            df.fillna("", inplace=False)

            plan_doc = Document(
                page_content=df.to_html(),
                metadata={"page": i + 1, "source": filename},
            )

            pages.append(plan_doc)

        xls.close()

        return pages

    @tracer.start_as_current_span("__load_document")
    @staticmethod
    async def __load_document(
        temp_file: _TemporaryFileWrapper, filename: str, extensao: str
    ):
        if extensao == "pdf":
            return await LocalFileProcessor.__load_document_from_pdf_bytes(
                temp_file, filename
            )

        if extensao == "xlsx":
            return await LocalFileProcessor.__load_document_from_xlsx_as_csv(
                temp_file, filename
            )

        if extensao == "csv":
            return await LocalFileProcessor.__load_document_from_csv(
                temp_file, filename
            )

    @tracer.start_as_current_span("__process_docx")
    @staticmethod
    async def __process_docx(
        temp_file: _TemporaryFileWrapper,
        real_filename: str,
        sumarizador: SumarizadorDocumentoUpload,
    ):
        conversor = DocxToPdfConverter()

        loop = asyncio.get_event_loop()
        path_file_converted = await loop.run_in_executor(
            None, conversor.converter, temp_file
        )

        resumo = None
        pages = []

        with open(path_file_converted, "rb") as f:
            with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                write_data_in_temporary_file(f, temp_pdf)

                resumo = await sumarizador.sumarizar(temp_pdf)

                pages = await LocalFileProcessor.__load_document(
                    filename=real_filename,
                    temp_file=temp_pdf,
                    extensao="pdf",
                )

        os.unlink(path_file_converted)

        return pages, resumo

    @tracer.start_as_current_span("__process_file")
    @staticmethod
    async def __process_file(token, real_filename, extensao, content_bytes):
        sumarizador = SumarizadorDocumentoUpload(
            stream=True,
            msg=None,
            llm=ModelFactory.get_model(
                token=token,
                api_base=configs.APIM_OPENAI_API_BASE,
                api_key=configs.APIM_OPENAI_API_KEY,
                api_type=configs.OPENAI_API_TYPE,
                model=MODELOS[MODELO_PADRAO],
                stream=False,
                temperature=0,
                verbose=VERBOSE,
                callbacks=[
                    OpenAICallbackHandler(),
                ],
            ),
            token=token,
        )
        resumo = None

        pages = []
        with NamedTemporaryFile(
            suffix=f".{extensao.lower()}", delete=False
        ) as temp_file:
            write_data_in_temporary_file(content_bytes, temp_file)

            if "docx" == extensao.lower():
                pages, resumo = await LocalFileProcessor.__process_docx(
                    temp_file, real_filename, sumarizador
                )
            elif "pdf" == extensao.lower():
                resumo = await sumarizador.sumarizar(temp_file)

                pages = await LocalFileProcessor.__load_document(
                    filename=real_filename, temp_file=temp_file, extensao=extensao
                )
            else:
                pages = await LocalFileProcessor.__load_document(
                    filename=real_filename, temp_file=temp_file, extensao=extensao
                )

            if resumo:
                logger.info("Resumo do arquivo gerado com sucesso!")

        if temp_file:
            os.unlink(temp_file.name)

        return pages, resumo

    @tracer.start_as_current_span("process")
    @staticmethod
    async def process(**kwargs):
        content_bytes = kwargs.get("content_bytes")
        token = kwargs.get("token")
        real_filename = kwargs.get("real_filename")
        user_filename = kwargs.get("user_filename")
        extensao = kwargs.get("extensao")
        fn_text_spliter = kwargs.get("fn_text_spliter")
        fn_create_section = kwargs.get("fn_create_section")
        fn_populate_intex = kwargs.get("fn_populate_intex")

        if not isinstance(content_bytes, GabiResponse):
            pages, resumo = await LocalFileProcessor.__process_file(
                token=token,
                real_filename=real_filename,
                extensao=extensao,
                content_bytes=content_bytes,
            )
        else:
            resumo = content_bytes.summary
            pages = [
                Document(
                    page_content=content_bytes.transcript,
                    metadata={"source": real_filename, "page": 1},
                )
            ]

        trechos = await fn_text_spliter(pages)

        if resumo:
            logger.info("Adicionando resumo as pages do documento!")
            trechos.append(
                Document(
                    page_content=f"RESUMO RESUMO RESUMO {resumo}",
                    metadata={"source": real_filename, "page": "RESUMO"},
                )
            )

        logger.info(f"Persiste no CognitiveSearch o arquivo ({real_filename})")

        secoes = await fn_create_section(
            user_filename=user_filename,
            real_filename=real_filename,
            trechos=trechos,
        )

        logger.info(f"Quantidade de seçoes: {len(secoes)}")

        await fn_populate_intex(sections=secoes)
