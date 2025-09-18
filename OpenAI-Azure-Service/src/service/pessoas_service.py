import logging
import re

import aiohttp
from opentelemetry import trace

from src.conf.env import configs
from src.domain.schemas import DestinatarioOut
from src.infrastructure.env import HEADERS
from src.service.auth_service import autenticar_servico, autenticar_servico_token_2019

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

RECURSO_COMPUTACIONAL_GRH = 23


@tracer.start_as_current_span("buscar_pessoas_por_nome")
async def buscar_pessoas_por_nome(parametro: str, login: str):
    HEADERS["Authorization"] = (
        f"Bearer {await autenticar_servico(login, RECURSO_COMPUTACIONAL_GRH)}"
    )

    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{configs.BASE_GRH_URL}/pessoas/pesquisa-por-nome",
            json={"query": parametro},
            headers=HEADERS,
            timeout=timeout,
        ) as result:
            logger.info(await result.text())

            # Lança uma exceção se o código de status não for 2xx
            result.raise_for_status()

            json_result = await result.json()

            ## regex para separar o nome da matricula
            regex = re.compile(r"\s*\|\s*")

            resultado = []
            for res in json_result["results"]:
                ## separa o nome da matricula
                nome_matricula = regex.split(res["text"])

                resultado.append(
                    DestinatarioOut(
                        codigo=f"P_{res['id']}",
                        nome=nome_matricula[0],
                        # matricula = nome_matricula[1]
                    )
                )

            return resultado


@tracer.start_as_current_span("buscar_pessoa_por_codigo")
async def buscar_pessoa_por_codigo(codigo: int, tkn_usr: str, ufp_usr: str):
    tokens = await autenticar_servico_token_2019(
        tkn_usr, ufp_usr, [RECURSO_COMPUTACIONAL_GRH]
    )

    HEADERS["Authorization"] = f"Bearer {tokens['tokenJwt']}"
    HEADERS["X-UFP"] = tokens["userFingerPrint"]

    timeout = aiohttp.ClientTimeout(total=20)  # seconds
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{configs.BASE_GRH_URL}/pessoas/{codigo}", headers=HEADERS, timeout=timeout
        ) as result:
            # Lança uma exceção se o código de status não for 2xx
            result.raise_for_status()

            json_result = await result.json()

            return json_result


@tracer.start_as_current_span("buscar_pessoa_por_matricula")
async def buscar_pessoa_por_matricula(matricula: str, login: str):
    HEADERS["Authorization"] = (
        f"Bearer {await autenticar_servico(login, RECURSO_COMPUTACIONAL_GRH)}"
    )

    timeout = aiohttp.ClientTimeout(total=20)  # seconds
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{configs.BASE_GRH_URL}/pessoas/matricula/{matricula}",
            headers=HEADERS,
            timeout=timeout,
        ) as result:
            # Lança uma exceção se o código de status não for 2xx
            result.raise_for_status()

            json_result = await result.json()

            return json_result
