import asyncio
import gc
import logging

from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage
from langchain.tools import StructuredTool

from src.conf.env import configs
from src.domain.mensagem import Mensagem
from src.domain.trecho import Trecho
from src.infrastructure.env import MODELO_PADRAO, MODELOS, VERBOSE
from src.infrastructure.security_tokens import DecodedToken
from src.service import documento_service

logger = logging.getLogger(__name__)


class SumarizacaoPecaProcesso:
    def __init__(self, stream: bool, msg: Mensagem, llm, token: DecodedToken):
        self.stream = stream
        self.msg = msg
        self.token = token

        self.modelo = MODELOS[MODELO_PADRAO]
        self.api_base = configs.APIM_OPENAI_API_BASE
        self.api_key = configs.APIM_OPENAI_API_KEY
        self.llm = llm

        logger.info(
            f">> {self.token.login} - Instanciei uma tool de sumarização de peça processo"
        )

    def _troca_func_por_coroutine_tool(self, structured_tool):
        structured_tool.coroutine = structured_tool.func
        structured_tool.func = None

        return structured_tool

    async def _gerar_resumo_final_focado(
        self,
        docs,
        preffix=None,
        input_prompt=None,
        verbose=False,
        return_intermediate_steps=False,
    ):
        logger.info(">> Gerando o resumo final - focado")

        if preffix and input_prompt:
            prompt_template = preffix + ": \n" + "{text}\n" + input_prompt + ":"
        else:
            prompt_template = """Escreva um resumo conciso do seguinte:
            {text}
            RESUMO CONCISO:"""

        prompt = PromptTemplate.from_template(prompt_template)

        refine_template = (
            "A sua tarefa é produzir um resumo final"
            + (
                f' que responda a requisição: \n"{input_prompt}"\n'
                if input_prompt
                else "\n"
            )
            + "Fornecemos um resumo existente até um certo ponto: {existing_answer}\n"
            "Temos a oportunidade de refinar o resumo existente"
            "(apenas se necessário) com mais algum contexto abaixo.\n"
            "------------\n"
            "{text}\n"
            "------------\n"
            "Dado o novo contexto, refine o resumo original em Português do Brasil. "
            "Se o contexto não for útil, retorne o resumo original."
        )
        refine_prompt = PromptTemplate.from_template(refine_template)

        chain = load_summarize_chain(
            llm=self.llm,
            chain_type="refine",
            question_prompt=prompt,
            refine_prompt=refine_prompt,
            return_intermediate_steps=return_intermediate_steps,
            input_key="input_documents",
            output_key="output_text",
            verbose=verbose,
        )

        result = await chain.ainvoke(
            input={"input_documents": docs},
            return_only_outputs=(not return_intermediate_steps),
        )

        return result

    async def _sumarizar_documento_processo_focado(
        self, numero_peca: str, numero_processo: str, input: str, otimizar=False
    ) -> str:
        """Ferramenta que sumariza em Português do Brasil uma peça de processo.
        Parâmetros válidos incluem:
        "numero_peca": "numero_peca", "numero_processo": "numero_processo" """

        logger.info("Executanto sumarizar peça processo focado")

        logger.info(f"ENTRADA ORIGINAL = {input}")

        # define a fonte de informação antecipadamente para registro de que entrou na tool
        self.msg.arquivos_busca = "Processos e-TCU"

        try:
            peca = await documento_service.recuperar_peca_processo(
                numero_peca, numero_processo, self.token.login
            )

            logger.info(peca)

            stream = await documento_service.obter_stream_documento(
                peca.codigo, self.token.login
            )

            loader = documento_service.StreamPyMUPDFLoader(stream)

            loop = asyncio.get_event_loop()

            # joga para executar em thread separada
            docs = await loop.run_in_executor(None, loader.load)

            # libera memória ao invocar o garbage collector
            gc.collect()

            # define os demais atributos
            self.msg.parametro_tipo_busca = None
            self.msg.parametro_nome_indice_busca = None
            self.msg.parametro_quantidade_trechos_relevantes_busca = 1

            resumo = None

            if len(docs) == 1:
                logger.info("Texto curto -> pode sumarizar diretamente.")

                content = (
                    f"Considerando que o conteúdo da peça {numero_peca}"
                    + f" do processo {numero_processo} é: "
                    + f'"{docs[0].page_content}", {input[0].lower()}{input[1:]}'
                )

                result = self.llm([HumanMessage(content=content)])
                resumo = result.content
            else:
                logger.info("Texto longo -> sumarizar usando refine.")

                preffix = (
                    f"Considerando que o conteúdo da peça {numero_peca}"
                    + f" do processo {numero_processo} é"
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
            return str(erro)

    def get_tool_focado(self) -> StructuredTool:
        sumarizar_peca_processo_tool = self._troca_func_por_coroutine_tool(
            StructuredTool.from_function(
                self._sumarizar_documento_processo_focado, verbose=VERBOSE
            )
        )

        return sumarizar_peca_processo_tool
