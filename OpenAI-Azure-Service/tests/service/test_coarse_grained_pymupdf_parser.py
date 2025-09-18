from io import BytesIO
from unittest.mock import MagicMock, patch

import fitz
import pytest
from langchain.docstore.document import Document

from src.service.coarse_grained_pymupdf_parser import CoarseGrainedPyMUPDFParser

sample_pdf_content = "This is a test document. It contains multiple pages.\n" * 50


@pytest.fixture
def mock_pdf_blob():
    return BytesIO(sample_pdf_content.encode("utf-8"))


@pytest.fixture
def mock_parser():
    return CoarseGrainedPyMUPDFParser()


@patch("fitz.open")
@patch("src.util.upload_util.write_data_in_temporary_file")
def test_lazy_parse(mock_write_data, mock_fitz_open, mock_pdf_blob, mock_parser):
    mock_write_data.return_value = None

    mock_doc = MagicMock()
    mock_fitz_open.return_value.__enter__.return_value = mock_doc
    mock_doc.page_count = 2

    mock_page_1 = MagicMock()
    mock_page_1.get_text.return_value = "This is content of page 1\n"

    mock_page_2 = MagicMock()
    mock_page_2.get_text.return_value = "This is content of page 2\n"

    mock_doc.load_page.side_effect = [mock_page_1, mock_page_2]

    with patch("src.domain.llm.util.util.num_tokens_from_string") as mock_num_tokens:
        mock_num_tokens.return_value = 10

        result = list(mock_parser.lazy_parse(mock_pdf_blob))

    assert len(result) == 1
    assert isinstance(result[0], Document)

    assert (
        result[0].page_content
        == "This is content of page 1\nThis is content of page 2\n"
    )

    assert result[0].metadata["page"] == 1
    assert result[0].metadata["total_pages"] == 2


@patch("fitz.open")
@patch("src.util.upload_util.write_data_in_temporary_file")
def test_lazy_parse_with_error_handling(
    mock_write_data, mock_fitz_open, mock_pdf_blob, mock_parser
):
    mock_doc = MagicMock()
    mock_fitz_open.return_value.__enter__.return_value = mock_doc
    mock_doc.page_count = 1

    mock_page = MagicMock()
    mock_doc.load_page.return_value = mock_page
    mock_page.get_text.side_effect = Exception("Error loading page")

    with pytest.raises(Exception):
        with patch("src.service.coarse_grained_pymupdf_parser.logger") as mock_logger:
            mock_logger.error = MagicMock()

            result = list(mock_parser.lazy_parse(mock_pdf_blob))

            mock_logger.error.assert_called_with(
                "Erro ao processar o documento: Error loading page"
            )


@patch("fitz.open")
@patch("src.util.upload_util.write_data_in_temporary_file")
def test_lazy_parse_empty_document(
    mock_write_data, mock_fitz_open, mock_pdf_blob, mock_parser
):
    mock_doc = MagicMock()
    mock_fitz_open.return_value.__enter__.return_value = mock_doc
    mock_doc.page_count = 0

    result = list(mock_parser.lazy_parse(mock_pdf_blob))
    assert len(result) == 0


@patch("fitz.Page")
def test_process_page_content(mock_page, mock_parser):
    mock_page.rect = fitz.Rect(0, 0, 100, 200)

    mock_page.get_textbox = MagicMock(
        return_value="This is the content of the cropped page"
    )

    cropped_content = mock_parser._process_page_content(mock_page)

    top = mock_page.rect.y0 + 90
    bottom = mock_page.rect.y1 - 4
    expected_cropped_rect = fitz.Rect(mock_page.rect.x0, top, mock_page.rect.x1, bottom)

    mock_page.get_textbox.assert_called_once_with(expected_cropped_rect)

    assert cropped_content == "This is the content of the cropped page"
