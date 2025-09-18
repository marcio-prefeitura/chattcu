from enum import Enum


class Tools:
    def __init__(self, modelo, especialista, msg_sistema_tool):
        self.modelo = modelo
        self.especialista = especialista
        self.msg_sistema_tool = msg_sistema_tool

    def __repr__(self):
        return f"{self.modelo} modelo {self.especialista} especialista."


class TypeToolsEnum(Enum):

    JURISPRUDENCIA = Tools("JURISPRUDENCIA", "GPT-4-Turbo", "")
    ADMINISTRATIVA = Tools("ADMINISTRATIVA", "GPT-4-Turbo", "")
    SUMARIZACAO = Tools("SUMARIZACAO", "GPT-4-Turbo", "")
    NORMA = Tools("NORMA", "GPT-4-Turbo", "")
    RESUMOFOCADODOCUMENTOS = Tools("RESUMOFOCADODOCUMENTOS", "GPT-4-Turbo", "")

    @staticmethod
    def get_tool(name_tools):
        try:
            return TypeToolsEnum[name_tools].value
        except AttributeError:
            raise ValueError(f"Invalid Tools: {name_tools}")
