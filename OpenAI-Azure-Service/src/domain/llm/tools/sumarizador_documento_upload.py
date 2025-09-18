import asyncio
import gc
import logging
import time
from io import BytesIO

from langchain.tools import StructuredTool

from src.domain.llm.tools.sumarizacao_peca_processo import SumarizacaoPecaProcesso
from src.domain.mensagem import Mensagem
from src.domain.trecho import Trecho
from src.exceptions import ServiceException
from src.infrastructure.security_tokens import DecodedToken
from src.service import documento_service

logger = logging.getLogger(__name__)


class SumarizadorDocumentoUpload(SumarizacaoPecaProcesso):
    def __init__(self, stream, msg: Mensagem, llm, token: DecodedToken):
        super().__init__(stream=stream, msg=msg, token=token, llm=llm)

    async def sumarizar(self, stream: BytesIO):
        inicio = time.time()
        logger.info("Sumarizando Documento Enviado Por Upload...")

        try:
            loader = documento_service.StreamPyMUPDFLoader(stream)

            loop = asyncio.get_event_loop()

            # joga para executar em thread separada
            docs = await loop.run_in_executor(None, loader.load)

            # libera memória ao invocar o garbage collector
            gc.collect()

            if not docs:
                raise ServiceException("Nenhum texto foi encontrado no documento")

            logger.info(f"Documentos carregados: {len(docs)}")

            if self.msg is not None:
                self.msg.arquivos_busca = "Arquivos"
                self.msg.parametro_tipo_busca = None
                self.msg.parametro_nome_indice_busca = None
                self.msg.parametro_quantidade_trechos_relevantes_busca = 1

                resumo = await self._gerar_resumo_final_focado(docs)
                resumo = resumo["output_text"]

                trecho = Trecho(conteudo=resumo)

                self.msg.trechos = [trecho]
            else:
                resumo = await self._gerar_resumo_final_focado(docs)
                resumo = resumo["output_text"]

            return resumo
        except Exception as erro:
            raise ServiceException(f"Erro ao sumarizar o documento: {erro}") from erro
        finally:
            fim = time.time()
            logger.info(
                f"Tempo total gasto sumarizando o documento para indexação: {(fim - inicio)}"
            )

    def get_tool(self) -> StructuredTool:
        pass
