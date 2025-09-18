from typing import Optional

from pydantic import BaseModel


class Trecho(BaseModel):
    id_arquivo_mongo: Optional[str] = None
    nome_arquivo_mongo: Optional[str] = None
    pagina_arquivo: int | None = None
    parametro_tamanho_trecho: int | None = None
    search_score: float | None = None
    conteudo: str
    id_registro: str | None = None
    link_sistema: str | None = None


def elastic_para_trecho(dado) -> Trecho:
    # print(f'\n\n{dado}\n\n')

    if dado:
        trecho = Trecho(
            id_arquivo_mongo=(
                dado["id_arquivo_mongo"] if "id_arquivo_mongo" in dado else None
            ),
            conteudo=dado["conteudo"],
            id_registro=dado["id_registro"],
            pagina_arquivo=dado["pagina_arquivo"],
            search_score=dado["search_score"],
            parametro_tamanho_trecho=(
                dado["parametro_tamanho_trecho"]
                if "parametro_tamanho_trecho" in dado
                else None
            ),
            link_sistema=dado["link_sistema"],
        )

        return trecho
    return None


def elastic_para_trecho_dict(dado):
    if dado:
        trecho = {
            "id_arquivo_mongo": (
                dado["id_arquivo_mongo"] if "id_arquivo_mongo" in dado else None
            ),
            "conteudo": dado["conteudo"],
            "id_registro": dado["id_registro"],
            "pagina_arquivo": dado["pagina_arquivo"],
            "search_score": dado["search_score"],
            "parametro_tamanho_trecho": dado["parametro_tamanho_trecho"],
            "link_sistema": dado["link_sistema"],
        }
        return trecho
    return None


def trecho_para_dict(dado: Trecho):
    # print(f'\n\n{dado}\n\n')

    if dado:
        trecho = {
            "id_arquivo_mongo": dado.id_arquivo_mongo,
            "conteudo": dado.conteudo,
            "id_registro": dado.id_registro,
            "pagina_arquivo": dado.pagina_arquivo,
            "search_score": dado.search_score,
            "parametro_tamanho_trecho": dado.parametro_tamanho_trecho,
            "link_sistema": dado.link_sistema,
        }
        return trecho
    return None
