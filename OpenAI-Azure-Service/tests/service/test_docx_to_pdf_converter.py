import os
from io import BytesIO
from unittest.mock import patch

import pytest

from src.util.docx_to_pdf_converter import Converter, DocumentUtil


class TestConverter:
    @pytest.fixture
    def converter(self):
        return Converter()

    def test_windows_local_profile(self, converter):
        with patch("platform.system", return_value="Windows"), patch.dict(
            os.environ, {"PROFILE": "local"}
        ):
            source = MockSource("C:\\Users\\user\\Documents\\file.txt")
            pasta_destino, cmd_libre_office = converter._get_destiny_and_command(source)

            assert pasta_destino == "C:\\Users\\user\\Documents"
            assert (
                cmd_libre_office
                == "C:\\Program Files\\LibreOffice\\program\\soffice.exe"
            )

    def test_non_windows_profile_local(self, converter):
        with patch("platform.system", return_value="Linux"), patch.dict(
            os.environ, {"PROFILE": "local"}
        ):
            source = MockSource("/home/user/documents/file.txt")
            pasta_destino, cmd_libre_office = converter._get_destiny_and_command(source)

            assert pasta_destino == "/tmp"
            assert cmd_libre_office == "soffice"

    def test_no_profile_set(self, converter):
        with patch("platform.system", return_value="Windows"), patch.dict(
            os.environ, {}
        ):
            source = MockSource("C:\\Users\\user\\Documents\\file.txt")
            pasta_destino, cmd_libre_office = converter._get_destiny_and_command(source)

            assert pasta_destino == "/tmp"
            assert cmd_libre_office == "soffice"

    def test_linux_profile_local(self, converter):
        with patch("platform.system", return_value="Linux"), patch.dict(
            os.environ, {"PROFILE": "local"}
        ):
            source = MockSource("/home/user/documents/file.txt")
            pasta_destino, cmd_libre_office = converter._get_destiny_and_command(source)

            assert pasta_destino == "/tmp"
            assert cmd_libre_office == "soffice"


class MockSource:
    def __init__(self, name):
        self.name = name


class TestDocumentUtil:

    @pytest.fixture
    def sample_stream(self):
        content = b"Sample content for testing"
        return BytesIO(content)

    @pytest.fixture
    def temp_file_path(self, sample_stream):
        temp_file = DocumentUtil.cria_um_arquivo_temporario(sample_stream)
        return temp_file.name

    def test_cria_um_arquivo_temporario(self, sample_stream):
        temp_file = DocumentUtil.cria_um_arquivo_temporario(sample_stream)

        assert os.path.exists(temp_file.name)
        with open(temp_file.name, "rb") as f:
            content = f.read()
            assert content == sample_stream.getvalue()

        os.remove(temp_file.name)

    def test_ler_arq_e_converter_para_bytesio(self, temp_file_path):
        doc_bytesio = DocumentUtil.ler_arq_e_converter_para_bytesio(temp_file_path)
        assert isinstance(doc_bytesio, BytesIO)

        with open(temp_file_path, "rb") as f:
            original_content = f.read()

        assert doc_bytesio.read() == original_content

    def test_ler_arq_e_converter_para_bytesio_invalid_file(self):
        with pytest.raises(FileNotFoundError):
            DocumentUtil.ler_arq_e_converter_para_bytesio("invalid_file_path.txt")
