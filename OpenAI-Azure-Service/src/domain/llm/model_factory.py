import logging
import uuid
from abc import ABC, abstractmethod
from typing import Any, Optional, Union

from langchain_aws import ChatBedrockConverse
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import AzureChatOpenAI
from openai import AsyncAzureOpenAI
from opentelemetry import trace

from src.conf.env import configs
from src.exceptions import ServiceException
from src.infrastructure.env import GEMINI_API_KEY
from src.infrastructure.roles import DESENVOLVEDOR
from src.infrastructure.security_tokens import DecodedToken

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class IModelCreator(ABC):
    def _get_max_tokens(self, max_tokens_out: Optional[int], model: dict) -> int:
        max_tokens = 4096

        if max_tokens_out is not None and max_tokens_out > 0:
            max_tokens = max_tokens_out
        elif max_tokens_out is None and model["max_tokens_out"] > 0:
            max_tokens = model["max_tokens_out"]

        return max_tokens

    @abstractmethod
    def create_model(
        self,
        model: dict,
        **kwargs,
    ) -> Any:
        pass


class ModelFactory(ABC):
    class _AzureModelCreator(IModelCreator):
        def create_model(
            self,
            model: dict,
            **kwargs,
        ) -> Union[BaseChatModel, AsyncAzureOpenAI]:
            api_key = kwargs["api_key"]
            api_base = kwargs["api_base"]
            api_type = kwargs["api_type"]
            temperature = kwargs["temperature"]
            stream = kwargs["stream"]
            verbose = kwargs["verbose"]
            top_p = kwargs["top_p"]
            max_tokens_out = kwargs["max_tokens_out"]
            callbacks = kwargs["callbacks"]
            token = kwargs["token"]
            execution_id = kwargs["execution_id"]

            if model["model_type"] == "LLM":
                if not model["deployment_name"].startswith("o1"):
                    return AzureChatOpenAI(
                        azure_endpoint=api_base,
                        azure_deployment=model["deployment_name"],
                        api_version=model["version"],
                        api_key=api_key,
                        openai_api_type=api_type if api_type is not None else "",
                        temperature=temperature,
                        streaming=stream,
                        verbose=verbose,
                        top_p=top_p,
                        max_tokens=self._get_max_tokens(max_tokens_out, model),
                        callbacks=(callbacks),
                        default_headers={
                            "usuario": token.login,
                            "desenvol": str(DESENVOLVEDOR in token.roles).lower(),
                            "execution_id": str(execution_id),
                        },
                    )

                return AzureChatOpenAI(
                    azure_endpoint=api_base,
                    azure_deployment=model["deployment_name"],
                    api_version=model["version"],
                    api_key=api_key,
                    openai_api_type=api_type if api_type is not None else "",
                    verbose=verbose,
                    temperature=1,
                    top_p=1,
                    streaming=False,
                    disable_streaming=True,
                    callbacks=(callbacks),
                    default_headers={
                        "usuario": token.login,
                        "desenvol": str(DESENVOLVEDOR in token.roles).lower(),
                        "execution_id": str(execution_id),
                    },
                )

            if model["model_type"] == "ASR":
                return AsyncAzureOpenAI(
                    api_key=api_key,
                    api_version=model["version"],
                    azure_endpoint=api_base,
                    default_headers={
                        "usuario": token.login,
                        "desenvol": str(DESENVOLVEDOR in token.roles).lower(),
                        "execution_id": str(execution_id),
                    },
                )

            raise ServiceException("Tipo de modelo não identificado!")

    class _GoogleModelCreator(IModelCreator):
        def create_model(
            self,
            model: dict,
            **kwargs,
        ) -> ChatGoogleGenerativeAI:
            temperature = kwargs["temperature"]
            top_p = kwargs["top_p"]
            stream = kwargs["stream"]
            verbose = kwargs["verbose"]
            callbacks = kwargs["callbacks"]
            max_tokens_out = kwargs["max_tokens_out"]

            return ChatGoogleGenerativeAI(
                google_api_key=GEMINI_API_KEY,
                model=model["deployment_name"],
                temperature=temperature,
                verbose=verbose,
                disable_streaming=(not stream),
                top_p=top_p,
                max_output_tokens=self._get_max_tokens(max_tokens_out, model),
                callbacks=(callbacks),
            )

    class _AWSModelCreator(IModelCreator):
        def create_model(
            self,
            model: dict,
            **kwargs,
        ) -> ChatBedrockConverse:
            temperature = kwargs["temperature"]
            top_p = kwargs["top_p"]
            stream = kwargs["stream"]
            verbose = kwargs["verbose"]
            callbacks = kwargs["callbacks"]
            max_tokens_out = kwargs["max_tokens_out"]
            is_with_tools = kwargs["is_with_tools"]

            try:
                for callback in callbacks:
                    callback.set_is_with_tools(is_with_tools)
            except Exception as err:
                logger.error(err)

            aws_model = ChatBedrockConverse(
                aws_access_key_id=configs.AWS_BEDROCK_ACCESS_KEY.get_secret_value(),
                aws_secret_access_key=configs.AWS_BEDROCK_SECRET_ACCESS_KEY.get_secret_value(),
                model=model["deployment_name"],
                region_name=model["regiao"],
                max_tokens=self._get_max_tokens(max_tokens_out, model),
                temperature=temperature,
                top_p=top_p,
                verbose=verbose,
                disable_streaming=(not stream),
                callbacks=(callbacks),
            )

            return aws_model

    @tracer.start_as_current_span("__validade_kwargs")
    @staticmethod
    def _validade_kwargs(kwargs: dict) -> dict:
        newkwargs = {
            "temperature": kwargs.get("temperature", 0),
            "top_p": kwargs.get("top_p", 0.95),
            "api_base": kwargs.get("api_base", configs.APIM_OPENAI_API_BASE),
            "api_key": kwargs.get("api_key", configs.APIM_OPENAI_API_KEY),
            "api_type": kwargs.get("api_type", None),
            "stream": kwargs.get("stream", False),
            "verbose": kwargs.get("verbose", False),
            "callbacks": kwargs.get("callbacks", None),
            "max_tokens_out": kwargs.get("max_tokens_out", 0),
            "is_with_tools": kwargs.get("is_with_tools", False),
        }

        if newkwargs["temperature"] is None:
            newkwargs["temperature"] = 0

        if newkwargs["top_p"] is None:
            newkwargs["top_p"] = 0.95

        if newkwargs["stream"] is None:
            newkwargs["stream"] = False

        if newkwargs["verbose"] is None:
            newkwargs["verbose"] = False

        if newkwargs["api_base"] is None:
            newkwargs["api_base"] = configs.APIM_OPENAI_API_BASE

        if newkwargs["api_key"] is None:
            newkwargs["api_key"] = configs.APIM_OPENAI_API_KEY

        if newkwargs["is_with_tools"] is None:
            newkwargs["is_with_tools"] = False

        return newkwargs

    @tracer.start_as_current_span("get_model")
    @staticmethod
    def get_model(
        token: DecodedToken,
        model: dict,
        **kwargs,
    ) -> Union[BaseChatModel, AsyncAzureOpenAI]:

        creators = {
            "AZURE": ModelFactory._AzureModelCreator(),
            "GOOGLE": ModelFactory._GoogleModelCreator(),
            "AWS": ModelFactory._AWSModelCreator(),
        }

        if "fornecedora" not in model:
            raise ServiceException("Fornecedora do modelo não informada!")

        provider = model.get("fornecedora")
        if provider not in creators:
            raise ServiceException("Fornecedora do modelo desconhecida!")

        logger.info(
            f"Fabricando o modelo {model['deployment_name']} da fornecedora {model['fornecedora']}"
        )

        execution_id = uuid.uuid4()

        return creators[provider].create_model(
            model=model,
            token=token,
            execution_id=execution_id,
            **ModelFactory._validade_kwargs(kwargs),
        )

    @tracer.start_as_current_span("get_model")
    @staticmethod
    def get_generic_azure_openai_model(
        token: DecodedToken,
        model: dict,
        api_key: str,
        api_base: str,
        verbose: Optional[bool] = False,
    ) -> AsyncAzureOpenAI:
        logger.info(
            f"Fabricando de forma genérica o modelo {model['deployment_name']} "
            + f"da fornecedora {model['fornecedora']}"
        )
        execution_id = uuid.uuid4()
        modelo = AsyncAzureOpenAI(
            api_key=api_key,
            api_version=model["version"],
            azure_endpoint=api_base,
            default_headers={
                "usuario": token.login,
                "desenvol": str(DESENVOLVEDOR in token.roles).lower(),
                "execution_id": str(execution_id),
            },
        )

        return modelo
