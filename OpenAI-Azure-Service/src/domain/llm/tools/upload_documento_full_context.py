import asyncio
import logging

from langchain_core.messages import HumanMessage

from src.domain.llm.base.document_process_utils import DocumentProcessUtils
from src.domain.llm.retriever.base_chattcu_retriever import BaseChatTCURetriever
from src.domain.llm.util.resumo_focado_utils import ResumoFocadoUtils
from src.domain.mensagem import Mensagem
from src.domain.trecho import Trecho
from src.infrastructure.azure_blob.azure_blob import AzureBlob
from src.infrastructure.env import CONTAINER_NAME, VERBOSE
from src.service.StreamFileLoader import StreamFileLoader

logger = logging.getLogger(__name__)


class UploadDocumentoFullContext(
    DocumentProcessUtils, ResumoFocadoUtils, BaseChatTCURetriever
):
    def __init__(self, chat, system_message: Mensagem, prompt_usuario, llm, token):
        super().__init__()
        self.chat = chat
        self.msg = system_message
        self.prompt_usuario = prompt_usuario
        self.llm = llm
        self.token = token

    async def sumarizar_upload_documento_focado(self):
        logger.info("Executanto sumarizar documento focado upload")

        try:
            azb = AzureBlob()
            docs_sel = await self._find_documentos_utilizados(
                chatinput=self.chat, token=self.token
            )
            all_data = []
            file_names = []

            for document in docs_sel:
                data = await azb.download_blob_as_stream(
                    container_name=CONTAINER_NAME, filename=document.nome_blob
                )
                all_data.append(data)
                file_names.append(document.nome)

            loader = StreamFileLoader(data_list=all_data, file_names=file_names)

            logger.info(f">> Loader obtido com sucesso ({loader})")

            loop = asyncio.get_event_loop()

            docs = await loop.run_in_executor(None, loader.load_list)
            logger.info(f">> Docs obtido com sucesso ({docs})")

            logger.info(">> Load do documento efetuado e transformado em docs")

            self.msg.parametro_tipo_busca = None
            self.msg.parametro_nome_indice_busca = None
            self.msg.parametro_quantidade_trechos_relevantes_busca = 1
            resumo = None

            if len(docs) == 1:
                logger.info("Texto curto -> pode sumarizar diretamente.")

                content = f"""Considerando o conteúdo do(s) documento(s):
                "{docs[0].page_content}"responda: {self.prompt_usuario[0].lower()}{self.prompt_usuario[1:]}"""

                result = self.llm([HumanMessage(content=content)])
                resumo = result.content
            else:
                logger.info("Texto longo -> sumarizar usando refine.")

                preffix = f"Considerando o conteúdo do(s) documento(s):"

                resumo = await self._gerar_resumo_final_focado(
                    docs,
                    preffix=preffix,
                    input_prompt=self.prompt_usuario,
                    verbose=VERBOSE,
                )
                resumo = resumo["output_text"]

            logger.info(f"RESUMO => {resumo}")

            trecho = Trecho(conteudo=resumo)

            self.msg.trechos = [trecho]

            return {"output": resumo}
        except Exception as erro:
            return str(erro)

    async def execute(self):
        return await self.sumarizar_upload_documento_focado()
