from src.conf.env import configs
from src.infrastructure.roles import COMUM, DESENVOLVEDOR, PREVIEW


class Token:
    def __init__(self, raw_token: dict):
        self.raw_token = raw_token

    def get_codigo_usuario(self):
        if "tus" in self.raw_token:
            if self.raw_token["tus"] != "SISTEMA":
                return self.raw_token["cod"]

            return self.raw_token["culs"]
        else:
            return self.raw_token["siga_culs"]

    def get_nome(self):
        if "tus" in self.raw_token:
            if self.raw_token["tus"] != "SISTEMA":
                return self.raw_token["nus"]

            return self.raw_token["nuls"]
        else:
            return self.raw_token["siga_nuls"]

    def get_codigo_lotacao(self):
        if "tus" in self.raw_token:
            return self.raw_token["clot"]
        else:
            return self.raw_token["siga_clot"]

    def get_lotacao(self):
        if "tus" in self.raw_token:
            if self.raw_token["tus"] != "SISTEMA":
                return self.raw_token["slot"]

            return self.raw_token["sloo"]
        else:
            return self.raw_token["siga_slot"]

    def get_nome_lotacao_completo(self):
        if "tus" in self.raw_token:
            if self.raw_token["tus"] != "SISTEMA":
                return self.raw_token["lot"]

            return self.raw_token["loo"]
        else:
            return self.raw_token["siga_lot"]

    def get_login(self):
        if "tus" in self.raw_token:
            if self.raw_token["tus"] != "SISTEMA":
                return self.raw_token["sub"]

            return self.raw_token["luls"]
        else:
            return self.raw_token["siga_luls"]

    def get_roles(self):
        roles = None
        if configs.PROFILE == "local":
            match configs.SIGA_PROFILE:
                case "PERFIL_COMUM":
                    roles = [COMUM]
                case "PERFIL_PREVIEW":
                    roles = [PREVIEW]
                case "PERFIL_DEV":
                    roles = [DESENVOLVEDOR]
        else:
            if "tus" in self.raw_token:
                roles = self.raw_token["roles"]
            else:
                roles = self.raw_token["siga_roles"]

        return roles
