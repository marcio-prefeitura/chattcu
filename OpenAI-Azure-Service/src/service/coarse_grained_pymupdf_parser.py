import logging
import os
import traceback
from io import BytesIO
from tempfile import NamedTemporaryFile
from typing import Iterator, Optional

import fitz  # PyMuPDF
from langchain.docstore.document import Document
from langchain_community.document_loaders.parsers.pdf import PyMuPDFParser
from opentelemetry import trace

from src.domain.llm.util.util import num_tokens_from_string
from src.util.upload_util import write_data_in_temporary_file

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class NoHeaderFooterPyMUPDFParser(PyMuPDFParser):
    @tracer.start_as_current_span("_process_page_content")
    def _process_page_content(self, page: fitz.Page) -> str:
        """Process the page content based on dedupe."""

        # Simulate removing header and footer by cropping the page
        rect = page.rect
        top = rect.y0 + 90
        bottom = rect.y1 - 4
        cropped_page = page.get_textbox(fitz.Rect(rect.x0, top, rect.x1, bottom))

        return cropped_page


class CoarseGrainedPyMUPDFParser(NoHeaderFooterPyMUPDFParser):
    file_path: Optional[str] = None

    def __del__(self):
        """Método destrutor responsável por remover o arquivo temporário
        utilizado pela instância da classe"""
        if self.file_path:
            self.__remove_temporary_file(self.file_path)

    def __remove_temporary_file(self, file_path: str):
        try:
            os.unlink(file_path)
            logger.info(f'Arquivo temporário "{file_path}" removido com sucesso')
        except Exception as e:
            logger.error(f"Erro ao remover o arquivo temporário: {e}")
            traceback.print_exc()

    @tracer.start_as_current_span("lazy_parse")
    def lazy_parse(self, blob: BytesIO) -> Iterator[Document]:
        """Lazily parse the blob."""

        try:

            logger.info(">> Executando o lazzy parse do documento")

            with NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
                write_data_in_temporary_file(blob, temp_file)

                # define o nome do arquivo temporário para a remoção posterior
                self.file_path = temp_file.name

                # open document
                logger.info(f"Chegou com o file_path {temp_file.name}")

                return self._process_document(temp_file.name)
        except Exception as e:
            logger.error(f"Erro ao processar o documento: {e}")
            traceback.print_exc()
            raise e

    @tracer.start_as_current_span("_process_document")
    def _process_document(self, filename: str) -> Iterator[Document]:
        with fitz.open(filename=filename) as doc:
            logger.info(f"Documento aberto com {doc.page_count} páginas")
            logger.info(f"Documento aberto com {doc.metadata} metadados")

            # 100k tokens de entrada deixando 28k tokens para a geracao
            max_length = 100000
            current_segment_length = 0
            current_segment = ""
            current_page_number = 1
            total_pages = doc.page_count

            for page_number in range(total_pages):
                try:
                    page = doc.load_page(page_number)
                    page_content = page.get_text("text")

                    if page_content:
                        num_tokens = num_tokens_from_string(page_content, "o200k_base")

                        if current_segment_length + num_tokens < max_length:
                            current_segment += page_content
                            current_segment_length += num_tokens
                        else:
                            yield Document(
                                page_content=current_segment,
                                metadata=self._get_metadata(
                                    current_page_number=current_page_number,
                                    total_pages=total_pages,
                                    doc=doc,
                                    file_path=filename,
                                ),
                            )

                            current_segment = page_content
                            current_segment_length = num_tokens
                            current_page_number = page_number + 1

                except Exception as page_error:
                    logger.error(
                        f"Erro ao processar a página {page_number}: {page_error}"
                    )
                    traceback.print_exc()

            # Yield the last segment
            if current_segment:
                yield Document(
                    page_content=current_segment,
                    metadata=self._get_metadata(
                        current_page_number=current_page_number,
                        total_pages=total_pages,
                        doc=doc,
                        file_path=filename,
                    ),
                )

    @tracer.start_as_current_span("_get_metadata")
    def _get_metadata(self, doc, file_path, current_page_number, total_pages):
        return dict(
            {
                "source": file_path,
                "file_path": file_path,
                "page": current_page_number,
                "total_pages": total_pages,
            },
            **{
                k: doc.metadata[k]
                for k in doc.metadata
                if type(doc.metadata[k]) in [str, int]
            },
        )
