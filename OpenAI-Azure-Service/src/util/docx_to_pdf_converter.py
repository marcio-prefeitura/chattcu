import os
import platform
import tempfile
from abc import ABC
from io import BytesIO
from subprocess import Popen


class Converter(ABC):
    def _get_destiny_and_command(self, source):
        pasta_destino = "/tmp"
        cmd_libre_office = "soffice"

        so = platform.system()

        if so == "Windows" and os.getenv("PROFILE") == "local":
            path = source.name.split("\\")
            pasta_destino = "\\".join(path[0 : len(path) - 1])

            cmd_libre_office = (
                "C:\\Program Files\\LibreOffice\\program\\" + cmd_libre_office + ".exe"
            )

        return pasta_destino, cmd_libre_office


class DocumentUtil(ABC):
    @staticmethod
    def cria_um_arquivo_temporario(stream: BytesIO):
        stream.seek(0)
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(stream.read())

            return temp_file

    @staticmethod
    def ler_arq_e_converter_para_bytesio(nome_arquivo):
        with open(nome_arquivo, "rb") as arquivo:
            doc_bytesio = BytesIO()
            doc_bytesio.write(arquivo.read())
            doc_bytesio.seek(0)
        return doc_bytesio


class DocxToPdfConverter(Converter):
    def converter(self, arquivo_de_entrada: tempfile._TemporaryFileWrapper):
        ext = arquivo_de_entrada.name.split(".")[-1]
        arquivo_de_saida = f"{arquivo_de_entrada.name.replace(f'.{ext}', '')}.pdf"

        print(arquivo_de_saida)

        pasta_destino, cmd_libre_office = self._get_destiny_and_command(
            source=arquivo_de_entrada
        )

        with Popen(
            [
                cmd_libre_office,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                pasta_destino,
                arquivo_de_entrada.name,
            ]
        ) as p:
            p.communicate()

        return arquivo_de_saida
