import json
import logging
import os
import sys
from functools import lru_cache
from typing import Callable, Optional

import hvac
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.monitor.opentelemetry import configure_azure_monitor
from config.spring import ConfigClient
from hvac.api.auth_methods import Kubernetes
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated

_logger = logging.getLogger(__name__)

_PROFILE = os.environ["PROFILE"]


def _ensure_entraid_app_registrations_env() -> None:
    raw_value = os.getenv("ENTRAID_APP_REGISTRATIONS")
    if raw_value:
        try:
            json.loads(raw_value)
            return
        except json.JSONDecodeError:
            pass

    indexed_values: list[str] = []
    index = 0
    while True:
        env_key = f"ENTRAID_APP_REGISTRATIONS__{index}"
        value = os.getenv(env_key)
        if value is None:
            break
        indexed_values.append(value)
        index += 1

    if not indexed_values and raw_value:
        indexed_values = [item.strip() for item in raw_value.split(',') if item.strip()]

    if indexed_values:
        os.environ["ENTRAID_APP_REGISTRATIONS"] = json.dumps(indexed_values)


_ensure_entraid_app_registrations_env()

os.environ["BASE_DOMAIN"] = (
    "producao.rancher.tcu.gov.br"
    if _PROFILE in ["prod", "homol"]
    else "desenvol.rancher.tcu.gov.br"
)


def _get_credential(profile: str) -> DefaultAzureCredential:
    token_file = "/var/run/secrets/kubernetes.io/serviceaccount/token"
    if profile == "prod" and os.path.isfile(token_file):
        with open(token_file, encoding="utf-8") as file:
            try:
                jwt = file.read()
                hv_client = hvac.Client(url="http://vault.vault:8200", verify=False)
                Kubernetes(hv_client.adapter).login(role="openai-azure", jwt=jwt)

                response = hv_client.secrets.kv.read_secret_version(
                    path=f"NIA/chattcu/{profile}"
                )
                os.environ["AZURE_TENANT_ID"] = response["data"]["data"][
                    "AZURE_TENANT_ID"
                ]
                os.environ["AZURE_CLIENT_ID"] = response["data"]["data"][
                    "AZURE_CLIENT_ID"
                ]
                os.environ["AZURE_CLIENT_SECRET"] = response["data"]["data"][
                    "AZURE_CLIENT_SECRET"
                ]

            # pylint: disable=broad-exception-caught
            except Exception as e:
                _logger.error(e)
                sys.exit(1)

    return DefaultAzureCredential()


_ENV_PATH = "src/conf"
_env_file = (
    f"{_ENV_PATH}/.env.shared",
    f"{_ENV_PATH}/.env.{_PROFILE}",
    ".env.local",
)


class _PreConfigs(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_file,
        env_file_encoding="utf-8",
        case_sensitive=True,
        frozen=True,
        extra="ignore",
    )

    PROFILE: str = _PROFILE
    AZURE_KEYVAULT_URL: str
    ENTRAID_APP_REGISTRATIONS: list[str]


# pyright: ignore [reportCallIssue]
_preconfigs = _PreConfigs()


def _get_secret(secret_name: str) -> Callable[[], str] | None:
    # Contorna o acesso externo para os testcases
    if _preconfigs.PROFILE == "test":
        return None

    spring_key = {
        "ELASTIC-PASSWORD": "elasticsearch.password",
        "ELASTIC-LOGIN": "elasticsearch.login",
        "USUARIO-SISTEMA": "service.tcu.usuarioSistema",
        "SENHA-SISTEMA": "service.tcu.senhaUsuarioSistema",
    }
    if _preconfigs.PROFILE in ["local", "aceite"] and secret_name in spring_key:
        return _get_spring_cloud_property(spring_key[secret_name])

    client = SecretClient(
        vault_url=_preconfigs.AZURE_KEYVAULT_URL,
        credential=_get_credential(_preconfigs.PROFILE),
    )
    assert client is not None
    return lambda: str(client.get_secret(secret_name).value)


def _get_entraid_audience() -> list[str]:
    get_client_ids = _get_secret("ENTRAID-AUDIENCE")
    if not callable(get_client_ids):
        return []

    dict_client_ids = json.loads(get_client_ids())
    dict_client_ids_filtered = {
        key: dict_client_ids[key] for key in _preconfigs.ENTRAID_APP_REGISTRATIONS
    }
    list_client_ids_filtered: list[str] = [*dict_client_ids_filtered.values()]
    return list_client_ids_filtered


@lru_cache(maxsize=1)
def get_configs():
    # pyright: ignore [reportCallIssue]
    return _Configs()


@lru_cache(maxsize=1)
def _get_spring_cloud() -> ConfigClient:
    spring_cloud_config_url = "http://spring-cloud-config.producao.rancher.tcu.gov.br"
    app_name = "openai-azure-service"
    if _PROFILE in ["prod", "homol"]:
        profile = "prod"
    elif _PROFILE in "aceite":
        profile = "aceite"
    else:
        profile = "dev"
    spring_cloud_config = ConfigClient(
        address=spring_cloud_config_url,
        app_name=app_name,
        profile=profile,
        # profile="prod" if _PROFILE in ["prod", "homol"] else "dev",
    )
    spring_cloud_config.get_config()
    return spring_cloud_config


def _get_spring_cloud_property(propriedade: str) -> Callable[[], str] | None:
    # Contorna o acesso externo para os testcases
    if _preconfigs.PROFILE == "test":
        return None

    res = _get_spring_cloud().get(propriedade)
    # Elimina o '/' no final de cada uma dessas urls.
    if propriedade in (
        "URL_BASE_AUTENTICACAO_REST"
        "URL_BASE_DOCUMENTO"
        "URL_BASE_DOCUMENTO_NOVO"
        "URL_BASE_SSO"
        "URL_BASE_SIGA_EXTERNO"
        "URL_BASE_PROCESSO"
        "URL_BASE_PROCESSO_NOVO"
        "URL_SISTEMA_GER_DOC"
    ):
        res = res.rstrip("/")
    return lambda: res


class _Configs(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_file,
        env_file_encoding="utf-8",
        case_sensitive=True,
        frozen=True,
    )

    APPLICATIONINSIGHTS_CONNECTION_STRING: Annotated[
        str,
        Field(default_factory=_get_secret("APPLICATIONINSIGHTS-CONNECTION-STRING")),
    ]

    AUDIENCE: Annotated[
        list[str],
        Field(default_factory=_get_entraid_audience),
    ]

    AUTENTICACAO_REST_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_AUTENTICACAO_REST")),
    ]

    AUTH_JWT_MS_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_AUTH_JWT_MS")),
    ]
    AUTH_REDIS_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("url.authRedis")),
    ]

    AWS_BEDROCK_ACCESS_KEY: Annotated[
        SecretStr, Field(default_factory=_get_secret("AWS-BEDROCK-ACCESS-KEY"))
    ]
    AWS_BEDROCK_SECRET_ACCESS_KEY: Annotated[
        SecretStr, Field(default_factory=_get_secret("AWS-BEDROCK-SECRET-ACCESS-KEY"))
    ]

    AZURE_OPENAI_POC_EASTUS2_ENDPOINT: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-OPENAI-POC-EASTUS2-ENDPOINT")),
    ]
    AZURE_OPENAI_POC_EASTUS2_API_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-OPENAI-POC-EASTUS2-API-KEY")),
    ]
    AZURE_BLOB_STG_NAME: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-BLOB-STG-NAME")),
    ]
    AZURE_BLOB_STG_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-BLOB-STG-KEY")),
    ]

    AZURE_COSMOS_CONNECT_STR: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-COSMOS-CONNECT-STR")),
    ]

    AZURE_FUNC_INDEX_TRECHOS: str
    AZURE_FUNC_INDEX_RESUMO: str

    AZURE_KEYVAULT_URL: str

    AZURE_SEARCH_DOCS_URL: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-SEARCH-DOCS-URL")),
    ]
    AZURE_SEARCH_DOCS_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-SEARCH-DOCS-KEY")),
    ]
    AZURE_SEARCH_SISTEMAS_URL: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-SEARCH-SISTEMAS-URL")),
    ]
    AZURE_SEARCH_SISTEMAS_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("AZURE-SEARCH-SISTEMAS-KEY")),
    ]

    #    AZURE_SUBSCRIPTION_ID: str
    #    AZURE_TENANT_ID: str

    BASE_DOMAIN: str

    BASE_DOCUMENTO_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_DOCUMENTO")),
    ]
    BASE_DOCUMENTO_NOVO_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_DOCUMENTO_NOVO")),
    ]
    BASE_PROCESSO_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_PROCESSO")),
    ]
    BASE_PROCESSO_NOVO_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_PROCESSO_NOVO")),
    ]

    BASE_GRH_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_GRH")),
    ]

    BASE_UNIDADES_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_UNIDADE")),
    ]

    ELASTIC_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("elasticsearch.url")),
    ]
    ELASTIC_LOGIN: Annotated[
        str,
        Field(default_factory=_get_secret("ELASTIC-LOGIN")),
    ]

    ELASTIC_PASSWORD: Annotated[
        str,
        Field(default_factory=_get_secret("ELASTIC-PASSWORD")),
    ]

    # https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/switching-endpoints#azure-active-directory-authentication
    APIM_OPENAI_API_BASE: str
    APIM_OPENAI_API_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("APIM-OPENAI-API-KEY")),
    ]

    ENTRAID_APP_REGISTRATIONS: list[str]

    OPENAI_API_BASE: str
    OPENAI_API_TYPE: str
    OPENAI_API_VERSION: str
    OPENAI_API_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("OPENAI-API-KEY")),
    ]

    OPENAI_API_REALTIME_KEY: Annotated[
        Optional[str],
        Field(default_factory=_get_secret("OPENAI-API-REALTIME-KEY")),
    ]

    PROFILE: str = _PROFILE

    SIGA_EXTERNO_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_SIGA_EXTERNO")),
    ]

    SIGA_PROFILE: Optional[str] = None

    SSO_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_BASE_SSO")),
    ]

    SISTEMA_GER_DOC_URL: Annotated[
        str,
        Field(default_factory=_get_spring_cloud_property("URL_SISTEMA_GER_DOC")),
    ]

    USUARIO_SISTEMA: Annotated[
        str,
        Field(default_factory=_get_secret("USUARIO-SISTEMA")),
    ]
    SENHA_SISTEMA: Annotated[
        str,
        Field(default_factory=_get_secret("SENHA-SISTEMA")),
    ]
    QUOTA_QUERY_KEY: Annotated[
        str,
        Field(default_factory=_get_secret("QUOTA-QUERY-KEY")),
    ]
    GET_QUOTA_URL: Annotated[
        str,
        Field(default_factory=_get_secret("GET-QUOTA-URL")),
    ]
    UPDATE_QUOTA_URL: Annotated[
        str,
        Field(default_factory=_get_secret("UPDATE-QUOTA-URL")),
    ]

    REDIS_MESSAGE_URL: Annotated[
        str,
        Field(default="redis-chattcu-svc"),
    ]
    REDIS_MESSAGE_PASSWORD: Annotated[
        str,
        Field(default_factory=_get_secret("REDIS-MESSAGE-PASSWORD")),
    ]


configs = get_configs()

if configs.PROFILE != "test":
    os.environ["OTEL_PYTHON_EXCLUDED_URLS"] = "api/health/.*"
    configure_azure_monitor(
        connection_string=configs.APPLICATIONINSIGHTS_CONNECTION_STRING,
    )
