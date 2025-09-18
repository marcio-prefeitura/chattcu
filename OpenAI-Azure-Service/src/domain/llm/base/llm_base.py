import datetime
import json
import logging
from abc import ABC
from typing import Optional  # abstractmethod

import tiktoken
from fastapi.responses import StreamingResponse
from langchain.agents import Agent, AgentExecutor, create_tool_calling_agent
from langchain_core.messages import SystemMessage
from langchain_core.prompts import ChatPromptTemplate

from src.conf.env import configs
from src.domain.enum.type_tools_enum import TypeToolsEnum
from src.domain.llm.base.document_process_utils import DocumentProcessUtils
from src.domain.llm.base.llm_base_elasticsearch import LLMBaseElasticSearch
from src.domain.llm.base.llm_base_operations import LLMBaseOperations
from src.domain.llm.base.llm_base_utils import LLMBaseUtils
from src.domain.llm.base.message_process_utils import MessageProcessUtils
from src.domain.llm.base.stream_process_utils import StreamProcessUtils
from src.domain.llm.model_factory import ModelFactory
from src.domain.llm.rag.tools_factory import ToolsFactory
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.schemas import ChatGptInput, ChatLLMResponse
from src.infrastructure.env import FUSO_HORARIO, MODELO_PADRAO, MODELOS
from src.infrastructure.roles import DESENVOLVEDOR
from src.infrastructure.security_tokens import DecodedToken

logger = logging.getLogger(__name__)


class LLMBase(
    ABC,
    LLMBaseOperations,
    LLMBaseUtils,
    LLMBaseElasticSearch,
    DocumentProcessUtils,
    StreamProcessUtils,
    MessageProcessUtils,
):
    def __init__(
        self,
        chat_id: Optional[str],
        chatinput: ChatGptInput,
        token_usr: DecodedToken,
        verbose: bool = False,
    ):
        super().__init__()

        self.chat_id = chat_id
        self.chatinput = chatinput
        self.stream = chatinput.stream
        self.verbose = verbose
        self.temperature = chatinput.temperature
        self.prompt = None
        self.historico = []
        self.token = token_usr

        self.mensagem_sistema: Optional[Mensagem] = None

        # self.min_espaco_tokens_resposta = 500

        self.modelo = MODELOS[MODELO_PADRAO]
        self.api_base = configs.APIM_OPENAI_API_BASE
        self.api_key = configs.APIM_OPENAI_API_KEY

        try:
            self.encoding = tiktoken.encoding_for_model(self.modelo["tiktoken_modelo"])
        except KeyError:
            self.encoding = tiktoken.get_encoding(self.modelo["tiktoken_encodding"])

        self.system_prefix = f"""<|im_start|>{PapelEnum.SYSTEM.name.lower()}
        """
        self.user_prefix = f"""<|im_start|>{PapelEnum.USER.name.lower()}
        """
        self.assistant_prefix = f"""<|im_start|>{PapelEnum.ASSISTANT.name.lower()}
        """
        self.msg_sufix = """
        <|im_end|>
        """

        self.pre_prompt = f"""
            Você é uma inteligência artificial generativa, um assitente chamado ChatTCU. 
            O dia de hoje é {datetime.datetime.now(FUSO_HORARIO).strftime("%d.%m.%Y %H:%M")}.\n
        """

    def _define_model(self, arg_model):
        # se foi passado já um modelo selecionado
        if isinstance(arg_model, dict):
            self.modelo = arg_model

        # se foi passado somente a label do modelo para selecionar
        if isinstance(arg_model, str):
            try:
                self.modelo = MODELOS[arg_model]
            except KeyError:
                logger.warning(
                    f'Modelo "{arg_model}" não encontrado na lista de modelos. '
                    + f"Definindo modelo padrão ({MODELO_PADRAO})."
                )

                self.modelo = MODELOS[MODELO_PADRAO]

        logger.info(f"Modelo definido como {self.modelo['deployment_name']}")

    def _get_llm(
        self,
        arg_model: Optional[dict | str] = None,
        arg_base: Optional[str] = None,
        arg_key: Optional[str] = None,
        arg_streaming: Optional[bool] = None,
        arg_verbose: Optional[bool] = None,
        arg_callback=None,
        is_with_tools: Optional[bool] = False,
    ):
        # define ou redefine o modelo, pois o modelo pode ter sido
        # utilizado modelo diferente em alguma tool
        logger.info("Define o modelo que será utilizado na geração")
        self._define_model(arg_model=arg_model)

        base = self.api_base if arg_base is None else arg_base
        key = self.api_key if arg_key is None else arg_key
        streaming = self.stream if arg_streaming is None else arg_streaming
        verbose = self.verbose if arg_verbose is None else arg_verbose
        callbacks = [self.callback] if arg_callback is None else arg_callback

        llm = ModelFactory.get_model(
            token=self.token,
            api_base=base,
            api_key=key,
            api_type=configs.OPENAI_API_TYPE,
            callbacks=(callbacks),
            model=self.modelo,
            stream=streaming,
            verbose=verbose,
            temperature=self.temperature,
            top_p=None,
            max_tokens_out=None,
            is_with_tools=is_with_tools,
        )

        logger.info(
            json.dumps(
                {
                    "usuario": self.token.login,
                    "desenvol": str(DESENVOLVEDOR in self.token.roles).lower(),
                }
            )
        )

        # logger.info("Restaura a definição do modelo selecionado pelo usuário")
        self._define_model(arg_model=self.chatinput.parametro_modelo_llm)

        return llm

    def _get_tools(
        self, tools: [], system_message: SystemMessage, chatinput: ChatGptInput
    ):
        logger.info(f">> {self.token.login} - Definindo as tools")
        resp = []
        if tools:
            for tool in tools:
                resp.insert(
                    0,
                    ToolsFactory.create_tools(
                        TypeToolsEnum.get_tool(tool), system_message, self, chatinput
                    ),
                )

        return resp

    def _get_agent_executor(
        self,
        tools,
        prompt,
        chatinput: ChatGptInput,
        is_with_tools: Optional[bool] = False,
    ):
        msg = SystemMessage(
            content=(
                "Sua resposta deverá ser longa e verbosa. "
                + "Deverá ser o mais completa possível, trazendo "
                + "o máximo de informações.\n"
                + "Sinta-se à vontade para usar quaisquer ferramentas "
                + "disponíveis para procurar informações relevantes, "
                + "se necessário.\n"
                + "Caso use uma ferramenta, responda apenas com os fatos "
                + "listados nas fontes e, se não houver informações "
                + "suficientes, diga que não sabe, não gere respostas "
                + "que não usem as fontes listadas."
            )
        )

        # prompt = ChatPromptTemplate.from_template(self.prompt)

        tools = self._get_tools(tools, msg, chatinput)

        agent = create_tool_calling_agent(
            llm=self._get_llm(
                arg_model=chatinput.parametro_modelo_llm, is_with_tools=is_with_tools
            ),
            tools=tools,
            prompt=prompt,
        )

        # Criar um executor para o agente
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

        return agent_executor

        # return create_conversational_retrieval_agent(
        #     self._get_llm(arg_model=chatinput.parametro_modelo_llm),
        #     self._get_tools(tools, msg, chatinput),
        #     verbose=self.verbose,
        #     system_message=msg,
        #     remember_intermediate_steps=False,
        #     max_token_limit=self.modelo["max_tokens"],
        # )

    async def _processar_resposta_adapter_stream(self, chat_id, chatinput, titulo):
        """realiza um simulado de stream, visando não quebrar o contrato
        com interface consumidora, uma vez que só os o1-*
        não possuem stream até o momento 04-11-24.
        """

        def chunk_stream_adapter(resposta):
            for respo_chunk in resposta.split(" "):
                chunk = {
                    "chat_id": chat_id,
                    "chat_titulo": titulo,
                    "codigo_prompt": self.msg1.codigo,
                    "response": (respo_chunk + " "),
                    "codigo_response": self.msg2.codigo,
                    "trechos": self.msg2.trechos,
                    "arquivos_busca": self.msg.arquivos_busca,
                }

                yield f"{json.dumps(chunk)}\n\n"

        logger.info(">> Enviando prompt ao ChatGPT - o1-*")

        resposta = await self._get_response(chatinput)

        logger.info(">> Resposta recebida do ChatGPT - o1-*")

        return StreamingResponse(
            content=chunk_stream_adapter(resposta),
            media_type="text/event-stream",
            headers={
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    async def _processar_resposta(self, chat_id, chatinput, titulo):
        logger.info(">> Enviando prompt ao ChatGPT")

        resposta = await self._get_response(chatinput)

        logger.info(">> Resposta recebida do ChatGPT")

        return ChatLLMResponse(
            chat_id=chat_id,
            chat_titulo=titulo,
            codigo_prompt=self.msg1.codigo,
            response=resposta,
            codigo_response=self.msg2.codigo,
            trechos=self.msg2.trechos,
            arquivos_busca=self.msg.arquivos_busca,
        )

    def _acoes_ao_preparar_prompt(self, chatinput: ChatGptInput, agent: Agent):
        user_input = self._truncar_prompt(
            prompt=chatinput.prompt_usuario,
            msg_sistema=agent.msg_sistema,
            min_espaco_tokens_resposta=self.modelo["max_tokens_out"],
            encoding=self.encoding,
            max_tokens=self.modelo["max_tokens"],
            llm_model=self.modelo,
        )

        self._truncar_historico(
            mensagem_usuario=user_input,
            msg_sistema=agent.msg_sistema,
            encoding=self.encoding,
            min_espaco_tokens_resposta=self.modelo["max_tokens_out"],
            max_tokens=self.modelo["max_tokens"],
            historico=self.historico,
        )

        msgs_historico = ""

        if self.historico:
            msgs_historico, _ = self._tratar_historico(
                user_prefix=self.user_prefix,
                assistant_prefix=self.assistant_prefix,
                msg_sufix=self.msg_sufix,
                historico=self.historico,
            )

        if self.modelo["deployment_name"].startswith("o1"):
            itens = [
                ("human", "{input}"),
            ]

            if msgs_historico:
                itens.insert(0, ("placeholder", "{chat_history}"))

            if not agent.use_llm_chain:
                itens.append(("placeholder", "{agent_scratchpad}"))

            self.prompt = ChatPromptTemplate.from_messages(itens)
        else:
            prompt = self.pre_prompt + agent.msg_sistema
            prompt = prompt.replace("{", "{{")
            prompt = prompt.replace("}", "}}")

            logger.info(f"\n\n{prompt}\n\n")

            itens = [
                ("system", prompt),
                ("human", "{input}"),
            ]
            if msgs_historico:
                itens.insert(1, ("placeholder", "{chat_history}"))

            if not agent.use_llm_chain:
                itens.append(("placeholder", "{agent_scratchpad}"))

            if chatinput.imagens:
                itens = create_message_with_images(chatinput, prompt)
                logger.info("ITENS->>>>>>>>>>>.", itens)
                if not agent.use_llm_chain:
                    itens.append(("placeholder", "{agent_scratchpad}"))
                self.prompt = ChatPromptTemplate.from_messages(itens)
            else:
                self.prompt = ChatPromptTemplate.from_messages(itens)
        self.historico = msgs_historico
        chatinput.prompt_usuario = user_input


def create_message_with_images(chatinput, prompt):
    items = [
        ("system", prompt),
        (
            "human",
            [
                {"type": "text", "text": chatinput.prompt_usuario},
            ],
        ),
    ]

    if chatinput.imagens:
        for image in chatinput.imagens:
            items[1][1].append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                }
            )

    return items
