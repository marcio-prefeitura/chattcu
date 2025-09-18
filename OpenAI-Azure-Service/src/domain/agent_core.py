import ast
import asyncio
import json
import logging
import time
import traceback
from typing import Optional, Union

from langchain_community.callbacks import OpenAICallbackHandler
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from openai import RateLimitError
from starlette.responses import StreamingResponse

from src.domain.agent import Agent
from src.domain.enum.type_tools_enum import TypeToolsEnum
from src.domain.llm.base.llm_base import LLMBase
from src.domain.llm.rag.retriever_relevant_documents_factory import (
    RetrieverRelevantDocumentsFactory,
)
from src.domain.llm.retriever.base_chattcu_retriever import BaseChatTCURetriever
from src.domain.schemas import ChatGptInput, ChatLLMResponse
from src.domain.trecho import trecho_para_dict
from src.infrastructure.env import MODELO_PADRAO_FILTROS, MODELOS, VERBOSE
from src.infrastructure.env_agent_config import get_agent_config
from src.infrastructure.security_tokens import DecodedToken
from src.messaging.chatstop import ChatStop

logger = logging.getLogger(__name__)
chat_stop = ChatStop()


class AgentCore(LLMBase):
    def __init__(
        self,
        chat_id: Optional[str],
        chatinput: ChatGptInput,
        agent: Agent,
        app_origem: str,
        token: DecodedToken,
        client_app_header: str = "chat-tcu-playground",
    ):
        super().__init__(
            chat_id=chat_id, chatinput=chatinput, verbose=VERBOSE, token_usr=token
        )

        self.agent = agent
        self.app_origem = app_origem
        self.token = token
        self.client_app_header = client_app_header

    async def _prepara_prompt(self):
        if (
            self.chatinput.arquivos_selecionados_prontos
            and len(self.chatinput.arquivos_selecionados_prontos) > 0
            and self.chatinput.tool_selecionada is None
        ) or (
            self.chatinput.arquivos_selecionados
            and len(self.chatinput.arquivos_selecionados) > 0
            and self.chatinput.tool_selecionada is None
        ):
            await self._prepara_prompt_documentos()
        else:
            self.msg = self._create_mensagem(
                chat_id=self.chat_id,
                chatinput=self.chatinput,
                agent=self.agent,
                modelo=self.modelo,
                historico=self.historico,
            )
            if (self.chatinput.tool_selecionada is not None) and (
                self.chatinput.tool_selecionada != "CONHECIMENTOGERAL"
            ):
                await self._prepara_prompt_tool_especifica()

        self._acoes_ao_preparar_prompt(self.chatinput, self.agent)
        return self.msg

    async def _buscar_docs_relevantes(self, chatinput: ChatGptInput, resp=None):
        logger.info("Buscando documentos do RAG DOCUMENTOS")

        separator = ","

        logger.info(
            f"Buscando os top {chatinput.top_documentos}"
            + f"trechos relevantes pertencentes à {self.token.login.lower()}, "
            + f'respondendo a questão "{chatinput.prompt_usuario}" '
            + f'dentre os documentos "{separator.join(chatinput.arquivos_selecionados_prontos)}"'
        )

        docs_sel = await self._find_documentos_utilizados(chatinput, self.token)

        return await self._find_trechos_relevantes(
            token=self.token,
            docs_sel=docs_sel,
            top_documents=chatinput.top_documentos,
            resp=resp,
        )

    async def _get_response(self, chatinput: ChatGptInput):
        try:
            llm = self._get_llm(arg_model=chatinput.parametro_modelo_llm)
            chain = self.prompt | llm | StrOutputParser()
            chain = chain.with_config(verbose=True)

            entrada = {"input": chatinput.prompt_usuario}

            if self.historico:
                entrada["chat_history"] = self.historico

            self.callback.set_prompt(self.prompt.format(**entrada))
            task = asyncio.create_task(
                chain.ainvoke(entrada), name=chatinput.correlacao_chamada_id
            )

            logger.info(
                f"Aguardando a Task {chatinput.correlacao_chamada_id} registrada."
            )
            print("chat_stop agent_core", chat_stop)
            return await task

        except asyncio.CancelledError:
            logger.info(f"Tarefa {chatinput.correlacao_chamada_id} foi cancelada.")
            return ""
        except Exception as error:
            logger.error(f"Erro ao processar a resposta: {error}")
            raise error

    async def _get_response_by_streaming(self, chatinput: ChatGptInput, titulo: str):
        logger.info(
            f">> {self.token.login} - Enviando o prompt e solicitando a resposta por streaming"
        )
        inicio = time.time()

        try:
            if self.agent.use_llm_chain:
                task = self._get_task_llm(
                    self._get_llm(arg_model=chatinput.parametro_modelo_llm),
                    self.prompt,
                    self.chatinput,
                    self.historico,
                    self.callback,
                )
            else:
                executor = self._get_agent_executor(
                    self.agent.tools,
                    self.prompt,
                    self.chatinput,
                    (not self.agent.use_llm_chain),
                )
                task = self._get_task_executor(
                    executor,
                    self.prompt,
                    self.chatinput,
                    self.historico,
                    self.callback,
                )

            async for chunk in self.callback.aiter():
                resp = {
                    "chat_id": self.chat_id,
                    "chat_titulo": titulo,
                    "codigo_prompt": self.msg1.codigo,
                    "response": chunk,
                    "codigo_response": self.msg2.codigo,
                    "trechos": (
                        [trecho_para_dict(trecho) for trecho in self.msg2.trechos]
                        if len(self.msg2.trechos) > 0
                        else []
                    ),
                    "arquivos_busca": self.msg.arquivos_busca,
                }

                yield f"{json.dumps(resp)}\n\n"

            await task
        except RateLimitError as error:
            error_message = error.message.replace("Error code: 429 - ", "")
            error_message = ast.literal_eval(error_message)

            logger.error(error_message["message"])

            error_resp = {
                "status": error.code,
                "message": f"Erro durante a transmissão: {error_message['message']}",
            }

            yield json.dumps(error_resp)
        except Exception as error:
            traceback.print_exc()
            error_resp = {
                "status": 0,
                "message": f"Erro durante a transmissão: {error}",
            }

            yield json.dumps(error_resp)
        finally:
            fim = time.time()

            logger.info(f"## Tempo total da resposta LLM: {(fim - inicio)}")

    async def executar_prompt(self) -> Union[StreamingResponse, ChatLLMResponse]:
        logger.info(
            "Definindo o modelo selecionado para a devida adição ao registro da mensagem"
        )
        self._define_model(arg_model=self.chatinput.parametro_modelo_llm)

        self.historico = []
        titulo = ""

        if not self.chat_id:
            chat_id, titulo = await self._criar_novo_chat_com_input(
                chatinput=self.chatinput,
                app_origem=self.app_origem,
                token_usr=self.token,
            )

            self.chat_id = chat_id
        else:
            self.historico = await self._carregar_historico_para_prompt(
                chat_id=self.chat_id, login=self.token.login
            )

        await self._prepara_prompt()

        await self._registrar_mensagens(chat_id=self.chat_id, chatinput=self.chatinput)

        # chat-tcu-playground nunca processa o o1-* sem streaming, pois o front é dependente de streaming.
        # para conversação, mesmo o o1-* não possui streaming da openai... se mudar FIXME.
        if (
            self.chatinput.parametro_modelo_llm
            and self.chatinput.parametro_modelo_llm.startswith("o1")
            and self.client_app_header == "chat-tcu-playground"
        ):
            return await self._processar_resposta_adapter_stream(
                chat_id=self.chat_id, chatinput=self.chatinput, titulo=titulo
            )

        if not self.chatinput.stream:
            return await self._processar_resposta(
                chat_id=self.chat_id, chatinput=self.chatinput, titulo=titulo
            )

        return self._enviar_resposta_por_stream(chatinput=self.chatinput, titulo=titulo)

    async def _prepara_prompt_documentos(self):
        try:
            self.prompt = (
                "Responda OBRIGATORIAMENTE em formato json sem markdown "
                + "(campos: pagina_inicial, pagina_final "
                + "e pergunta) quais as paginas inicial e final descritas no texto "
                + "(no formato numérico e caso não tenha informação responda com null) "
                + "e qual a pergunta principal (remover informação das páginas e gerar a "
                + "pergunta com um formato util para uma engine de busca) citada no "
                + "texto a seguir: {input}"
            )

            default_callback = self.callback

            self.callback = OpenAICallbackHandler()

            llm = self._get_llm(arg_model=MODELOS[MODELO_PADRAO_FILTROS])

            chain = PromptTemplate.from_template(self.prompt) | llm | StrOutputParser()

            a = await chain.ainvoke({"input": self.chatinput.prompt_usuario})

            logger.info(a)

            resp = json.loads(a)

            logger.info(resp)

            self.callback = default_callback
        except json.JSONDecodeError as error:
            logger.error(error)

            resp = {
                "pergunta": self.chatinput.prompt_usuario,
                "pagina_inicial": None,
                "pagina_final": None,
            }

        # para evitar erro de busca de trechos sem pergunta ou com pergunta vazia
        if resp["pergunta"] is None or resp["pergunta"] == "":
            resp["pergunta"] = self.chatinput.prompt_usuario

        log = (
            "Quantidade de arquivos selecionados: "
            + f"{len(self.chatinput.arquivos_selecionados)} ({self.chatinput.arquivos_selecionados})\n"
            "Quantidade de arquivos selecionados prontos: "
            + f"{len(self.chatinput.arquivos_selecionados_prontos)} \
                ({self.chatinput.arquivos_selecionados_prontos})"
        )

        logger.info(log)

        sources = await self._buscar_docs_relevantes(self.chatinput, resp)

        logger.info(sources)

        self.agent.msg_sistema = self.agent.msg_sistema.format(
            sources=sources["content"]
        )
        self.msg = self._create_mensagem(
            self.chatinput, self.agent, self.modelo, self.historico, self.chat_id
        )
        self.msg.trechos = sources["trechos"]

    async def _prepara_prompt_tool_especifica(self):
        tool_selecionada = TypeToolsEnum.get_tool(self.chatinput.tool_selecionada)

        retriver: BaseChatTCURetriever = (
            RetrieverRelevantDocumentsFactory.create_retriever(
                tool_selecionada, self.chatinput, self
            )
        )

        resp = await retriver.execute(
            historico=ChatPromptTemplate.from_messages(
                [(item["role"], item["content"]) for item in self.historico]
            )
            .invoke({})
            .to_messages()
        )

        results = None

        if tool_selecionada in (
            TypeToolsEnum.SUMARIZACAO.value,
            TypeToolsEnum.RESUMOFOCADODOCUMENTOS.value,
        ):
            if self.msg:
                self.msg.arquivos_busca = "Processos e-TCU"

            logger.info(f"OUTPUT =>\n{resp['output']}")

            results = resp["output"]
        else:
            results = [f"{doc.page_content}" for doc in resp]

        content = (
            "\n\n".join(results) if isinstance(results, list) else f"\n\n{results}"
        )

        sources = {"content": content}

        if tool_selecionada in (
            TypeToolsEnum.SUMARIZACAO.value,
            TypeToolsEnum.RESUMOFOCADODOCUMENTOS.value,
        ):
            self.agent.msg_sistema += (
                f' Resposta para a solicitação "{self.chatinput.prompt_usuario}": '
                + sources["content"]
            )
        elif tool_selecionada == TypeToolsEnum.ADMINISTRATIVA.value:
            self.agent.msg_sistema += (
                get_agent_config()["SOURCE"].format(sources=sources["content"])
                + get_agent_config()["COMPLEMENTO_MSG_CASA"]
            )
        else:
            self.agent.msg_sistema += get_agent_config()[
                "COMPLEMENTO_MSG_TOOL"
            ] + get_agent_config()["SOURCE"].format(sources=sources["content"])
