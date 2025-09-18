import asyncio
import gc
import logging
import re
import traceback

from langchain.schema import HumanMessage
from langchain.tools import StructuredTool

from src.domain.llm.tools.sumarizacao_peca_processo import SumarizacaoPecaProcesso
from src.domain.mensagem import Mensagem
from src.domain.trecho import Trecho
from src.infrastructure.env import VERBOSE
from src.infrastructure.security_tokens import DecodedToken
from src.service import documento_service
from src.service.documento_service import StreamPyMUPDFLoader

logger = logging.getLogger(__name__)


class SumarizadorDocumentoETCU(SumarizacaoPecaProcesso):
    def __init__(self, stream, msg: Mensagem, llm, token: DecodedToken):
        super().__init__(stream, msg, token=token, llm=llm)

        logger.info(
            f">> {self.token.login} - Instanciei uma tool de sumarização de documentos"
        )

    async def sumarizar_documento_focado(
        self, numero_documento: str, input: str, otimizar=False
    ) -> str:
        """Ferramenta que sumariza em Português do Brasil um documento.
        Parâmetros válidos incluem:
        "numero_documento": "numero_documento" """

        logger.info("Executanto sumarizar documento etcu")

        # define a fonte de informação antecipadamente para registro de que entrou na tool
        self.msg.arquivos_busca = "Processos e-TCU"

        try:
            numero_documento = numero_documento[0 : numero_documento.rfind("-")]
            numero_documento = re.sub(r"\D", "", numero_documento)

            logger.info(f">> Obtendo stream do documento Nº {numero_documento}")

            stream = await documento_service.obter_documento_pdf(
                numero_documento, self.token.login
            )

            logger.info(f">> Stream obtido com sucesso ({len(stream.getbuffer())})")

            loader = StreamPyMUPDFLoader(stream)

            loop = asyncio.get_event_loop()

            # joga para executar em thread separada
            docs = await loop.run_in_executor(None, loader.load)

            # libera memória ao invocar o garbage collector
            gc.collect()

            logger.info(">> Load do documento efetuado e transformado em docs")

            # define os demais atributos
            self.msg.parametro_tipo_busca = None
            self.msg.parametro_nome_indice_busca = None
            self.msg.parametro_quantidade_trechos_relevantes_busca = 1

            resumo = None

            if len(docs) == 1:
                logger.info("Texto curto -> pode sumarizar diretamente.")

                content = f"""Considerando que o conteúdo do documento {numero_documento}
                 é: "{docs[0].page_content}", {input[0].lower()}{input[1:]}"""

                result = self.llm([HumanMessage(content=content)])
                resumo = result.content
            else:
                logger.info("Texto longo -> sumarizar usando refine.")

                preffix = (
                    f"Considerando que o conteúdo do documento {numero_documento} é"
                )

                resumo = await self._gerar_resumo_final_focado(
                    docs, preffix=preffix, input_prompt=input, verbose=VERBOSE
                )
                resumo = resumo["output_text"]

            logger.info(f"RESUMO => {resumo}")

            trecho = Trecho(conteudo=resumo)

            self.msg.trechos = [trecho]

            return resumo
        except Exception as erro:
            logger.error(erro)
            traceback.print_exc()
            return str(erro)

    def get_tool_focado(self) -> StructuredTool:
        sumarizar_documento_tool = self._troca_func_por_coroutine_tool(
            StructuredTool.from_function(
                self.sumarizar_documento_focado, verbose=VERBOSE
            )
        )

        return sumarizar_documento_tool
