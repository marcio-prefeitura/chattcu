from tempfile import NamedTemporaryFile
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.infrastructure.cognitive_search.local_file_processor import LocalFileProcessor


class TestLocalFileProcessor:

    @pytest.mark.asyncio
    async def test_load_document_from_pdf_bytes(self, mocker):
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Page content"
        mock_pdf = MagicMock()
        mock_pdf.__enter__.return_value = mock_pdf
        mock_pdf.load_page.return_value = mock_page
        mock_pdf.__len__.return_value = 2
        mocker.patch("fitz.open", return_value=mock_pdf)

        with NamedTemporaryFile(suffix=".pdf") as temp_file:
            temp_file.write(b"%PDF-1.4")
            temp_file.seek(0)
            pages = await LocalFileProcessor._LocalFileProcessor__load_document_from_pdf_bytes(
                temp_file, "test.pdf"
            )

        assert len(pages) == 2
        assert pages[0].page_content == "Page content"

    @pytest.mark.asyncio
    async def test_load_document_from_csv(self, mocker):
        mock_loader = MagicMock()
        mock_loader.load.return_value = [
            MagicMock(page_content="Row 1"),
            MagicMock(page_content="Row 2"),
        ]
        mocker.patch(
            "src.infrastructure.cognitive_search.local_file_processor.CSVLoader",
            return_value=mock_loader,
        )

        with NamedTemporaryFile(suffix=".csv") as temp_file:
            temp_file.write(b"col1,col2\nval1,val2\nval3,val4")
            temp_file.seek(0)
            pages = (
                await LocalFileProcessor._LocalFileProcessor__load_document_from_csv(
                    temp_file, "test.csv"
                )
            )

        assert len(pages) == 1
        assert "Row 1" in pages[0].page_content
        assert "Row 2" in pages[0].page_content

    @pytest.mark.asyncio
    async def test_load_document_from_xlsx_as_csv(self, mocker):
        mock_excel_file = MagicMock()
        mock_excel_file.sheet_names = ["Sheet1", "Sheet2"]
        mock_df = MagicMock()
        mock_df.to_html.return_value = "<html>Data</html>"
        mocker.patch("pandas.ExcelFile", return_value=mock_excel_file)
        mocker.patch("pandas.read_excel", return_value=mock_df)

        with NamedTemporaryFile(suffix=".xlsx") as temp_file:
            temp_file.write(b"Dummy XLSX content")
            temp_file.seek(0)
            pages = await LocalFileProcessor._LocalFileProcessor__load_document_from_xlsx_as_csv(
                temp_file, "test.xlsx"
            )

        assert len(pages) == 2
        assert pages[0].page_content == "<html>Data</html>"

    @pytest.mark.asyncio
    async def test_process_docx(self, mocker):
        mock_converter = MagicMock()
        with NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
            mock_converter.converter.return_value = temp_pdf.name

        mocker.patch(
            "src.infrastructure.cognitive_search.local_file_processor.DocxToPdfConverter",
            return_value=mock_converter,
        )

        mock_summarizer = AsyncMock()
        mock_summarizer.sumarizar.return_value = "Summary content"

        mock_load_document = AsyncMock(return_value=["Page 1"])
        mocker.patch(
            "src.infrastructure.cognitive_search.local_file_processor.LocalFileProcessor._LocalFileProcessor__load_document",
            mock_load_document,
        )

        with NamedTemporaryFile(suffix=".docx") as temp_file:
            temp_file.write(b"Dummy DOCX content")
            temp_file.seek(0)

            pages, summary = await LocalFileProcessor._LocalFileProcessor__process_docx(
                temp_file, "test.docx", mock_summarizer
            )

        assert pages == ["Page 1"]
        assert summary == "Summary content"
        mock_converter.converter.assert_called_once_with(temp_file)
        mock_summarizer.sumarizar.assert_called_once()
        mock_load_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_load_document_pdf(self, mocker):
        mock_load_pdf = AsyncMock(return_value=["Page 1", "Page 2"])
        mocker.patch(
            "src.infrastructure.cognitive_search.local_file_processor.LocalFileProcessor._LocalFileProcessor__load_document_from_pdf_bytes",
            mock_load_pdf,
        )

        with NamedTemporaryFile(suffix=".pdf") as temp_file:
            temp_file.write(b"%PDF-1.4")
            temp_file.seek(0)
            pages = await LocalFileProcessor._LocalFileProcessor__load_document(
                temp_file, "test.pdf", "pdf"
            )

        assert pages == ["Page 1", "Page 2"]
        mock_load_pdf.assert_called_once_with(temp_file, "test.pdf")

    @pytest.mark.asyncio
    async def test_load_document_csv(self, mocker):
        mock_load_csv = AsyncMock(return_value=["Page 1"])
        mocker.patch(
            "src.infrastructure.cognitive_search.local_file_processor.LocalFileProcessor._LocalFileProcessor__load_document_from_csv",
            mock_load_csv,
        )

        with NamedTemporaryFile(suffix=".csv") as temp_file:
            temp_file.write(b"col1,col2\nval1,val2\nval3,val4")
            temp_file.seek(0)
            pages = await LocalFileProcessor._LocalFileProcessor__load_document(
                temp_file, "test.csv", "csv"
            )

        assert pages == ["Page 1"]
        mock_load_csv.assert_called_once_with(temp_file, "test.csv")

    @pytest.mark.asyncio
    async def test_load_document_xlsx(self, mocker):
        mock_load_xlsx = AsyncMock(return_value=["Page 1", "Page 2"])
        mocker.patch(
            "src.infrastructure.cognitive_search.local_file_processor.LocalFileProcessor._LocalFileProcessor__load_document_from_xlsx_as_csv",
            mock_load_xlsx,
        )

        with NamedTemporaryFile(suffix=".xlsx") as temp_file:
            temp_file.write(b"Dummy XLSX content")
            temp_file.seek(0)
            pages = await LocalFileProcessor._LocalFileProcessor__load_document(
                temp_file, "test.xlsx", "xlsx"
            )

        assert pages == ["Page 1", "Page 2"]
        mock_load_xlsx.assert_called_once_with(temp_file, "test.xlsx")
