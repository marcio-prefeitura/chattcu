import logging
from typing import List

import aiohttp
from opentelemetry import trace

from src.conf.env import configs
from src.domain.schemas import DestinatarioOut
from src.domain.unidade import Unidade
from src.infrastructure.env import HEADERS
from src.service.auth_service import autenticar_servico_token_2019

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


RECURSO_COMPUTACIONAL_GRH = 23


@tracer.start_as_current_span("busca_unidade")
async def busca_unidade(parametro: str, tkn_usr: str, ufp_usr: str):
    tokens = await autenticar_servico_token_2019(
        tkn_usr, ufp_usr, [RECURSO_COMPUTACIONAL_GRH]
    )

    HEADERS["Authorization"] = f"Bearer {tokens['tokenJwt']}"
    HEADERS["X-UFP"] = tokens["userFingerPrint"]

    timeout = aiohttp.ClientTimeout(total=20)  # seconds
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{configs.BASE_GRH_URL}/unidades/ativas", headers=HEADERS, timeout=timeout
        ) as result:
            # Lança uma exceção se o código de status não for 2xx
            result.raise_for_status()

            data = await result.json()

            # > A função filter() retorna um objeto de filtro
            # que precisamos converter em uma lista

            # > A função lambda é usada para verificar se a chave
            # de busca está contida na chave 'sigla' do dicionário

            # > Ambas as strings são convertidas para minúsculas para
            # tornar a busca insensível a maiúsculas e minúsculas
            resultado = [
                DestinatarioOut(codigo=f"U_{dest['cod']}", nome=dest["sigla"])
                for dest in list(
                    filter(lambda d: parametro.lower() in d["sigla"].lower(), data)
                )
            ]

            return resultado


@tracer.start_as_current_span("busca_arvore_unidades")
async def busca_arvore_unidades(tkn_usr: str, ufp_usr: str):
    tokens = await autenticar_servico_token_2019(
        tkn_usr, ufp_usr, [RECURSO_COMPUTACIONAL_GRH]
    )

    HEADERS["Authorization"] = f"Bearer {tokens['tokenJwt']}"
    HEADERS["X-UFP"] = tokens["userFingerPrint"]

    timeout = aiohttp.ClientTimeout(total=20)  # seconds
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{configs.BASE_UNIDADES_URL}api/v1/unidades/arvore",
            headers=HEADERS,
            timeout=timeout,
        ) as result:
            # Lança uma exceção se o código de status não for 2xx
            result.raise_for_status()

            data = await result.json()

            return data

            # > A função filter() retorna um objeto de filtro
            # que precisamos converter em uma lista

            # > A função lambda é usada para verificar se a chave
            # de busca está contida na chave 'sigla' do dicionário

            # > Ambas as strings são convertidas para minúsculas para
            # tornar a busca insensível a maiúsculas e minúsculas
            # return list(filter(lambda d: parametro.lower() in d['sigla'].lower(), data))


@tracer.start_as_current_span("get_cod_unidades_ate")
async def get_cod_unidades_ate(
    tkn: str, ufp: str, unidade_alvo: str
) -> List[str] | None:
    # Resgata a árvore de unidades
    lista = await busca_arvore_unidades(tkn, ufp)

    # Converte a lista de dict em lista de instancias de Unidades
    arvore = [Unidade.model_validate(un) for un in lista]

    caminho_ascendente = None

    # Itera pelas raízes até encontrar o caminho ascendente desejado
    for raiz in arvore:
        caminho_ascendente = await raiz.obter_codigos_ascendentes(unidade_alvo)

        if caminho_ascendente:
            break

    return caminho_ascendente
