from typing import List

from pydantic import BaseModel


class TipoUnidade(BaseModel):
    id: int
    descricao: str
    seLegado: str
    codNivelLegado: int
    codNivelTipo: int
    secretaria: bool


class SituacaoUnidade(BaseModel):
    id: int
    descricao: str


class Unidade(BaseModel):
    id: int
    sigla: str
    denominacao: str
    situacaoUnidade: SituacaoUnidade
    subunidades: List["Unidade"]

    async def obter_codigos_ascendentes(self, codigo_alvo: str, caminho_atual=None):
        if caminho_atual is None:
            caminho_atual = []

        caminho_atual.append(str(self.id))

        if str(self.id) == codigo_alvo:
            # Se encontrarmos a unidade desejada, paramos a recursão
            # print(self.sigla)
            return caminho_atual

        # Itera pelas subunidades recursivamente
        for subunidade in self.subunidades:
            resultado = await subunidade.obter_codigos_ascendentes(
                codigo_alvo, caminho_atual.copy()
            )

            if resultado:
                # print(self.sigla)
                return resultado

        # Se não encontrarmos o código na subárvore atual, removemos a última entrada do caminho
        caminho_atual.pop()

        return None
