from enum import Enum
from typing import Any, Optional

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)
from typing_extensions import Self

from src.conf.env import configs
from src.infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW


class AuthMethod(str, Enum):
    """
    Representa o método de autenticação utilizado.

    Ref.: https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference#payload-claims
    """

    NotEntraID = "-1"
    """
    Não autenticado via `MS EntraID`.
    """
    BrowserOrTeams = "0"
    """
    `Public Client`. P. ex., usuário autenticado via Browser ou Teams.
    """
    SystemWithSecret = "1"
    """
    `Confidencial Client` usando um Secret. P. ex., sistema autenticado.
    """
    SystemWithCert = "2"
    """
    `Confidencial Client` usando um Certificado.
    """


class DecodedToken(BaseModel):
    raw_token: Optional[str] = None
    model_config = ConfigDict(frozen=True)

    codigo_usuario: str = Field(validation_alias=AliasChoices("siga_culs", "culs"))
    nome: str = Field(validation_alias=AliasChoices("siga_nuls", "nuls"))
    codigo_lotacao: str = Field(validation_alias=AliasChoices("siga_clot", "clot"))
    lotacao: str = Field(validation_alias=AliasChoices("siga_slot", "slot"))
    nome_lotacao_completo: str = Field(validation_alias=AliasChoices("siga_lot", "lot"))
    login: str = Field(validation_alias=AliasChoices("siga_luls", "luls"))
    roles: list[str] = Field(
        default=[COMUM], validation_alias=AliasChoices("siga_roles", "roles")
    )
    ufp: Optional[str] = None

    @field_validator("roles")
    @classmethod
    def local_roles(cls, v: list[str]) -> list[str]:
        roles = v
        if configs.PROFILE == "local":
            match configs.SIGA_PROFILE:
                case "PERFIL_COMUM":
                    roles = [COMUM]
                case "PERFIL_PREVIEW":
                    roles = [PREVIEW]
                case "PERFIL_DEV":
                    roles = [DESENVOLVEDOR]
        return roles


class DecodedEntraIDToken(DecodedToken):
    raw_token: str
    aud: str
    azp: str
    azpacr: AuthMethod = Field(
        default="-1", description="Identifica o método de autenticação utilizado"
    )

    @model_validator(mode="before")
    @classmethod
    def confidencial_client_fields(cls, data: Any) -> Any:
        if isinstance(data, dict) and (
            data["azpacr"] in [AuthMethod.SystemWithSecret, AuthMethod.SystemWithCert]
        ):
            data["siga_culs"] = ""
            data["siga_nuls"] = ""
            data["siga_clot"] = ""
            data["siga_slot"] = ""
            data["siga_lot"] = ""
        return data
