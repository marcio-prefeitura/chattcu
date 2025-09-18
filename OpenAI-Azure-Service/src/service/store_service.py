import logging

from opentelemetry import trace

from src.domain.schemas import FiltrosEspecialistas, PaginatedEspecialistResponse
from src.domain.store import Categoria, Especialista, TotalEspecialistasPorCategoria
from src.infrastructure.mongo.categoria_mongo import CategoriaMongo
from src.infrastructure.mongo.especialista_mongo import EspecialistaMongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

VERBOSE = True


@tracer.start_as_current_span("listar_especialistas_por")
async def listar_especialistas_por(
    login: str, filtros: FiltrosEspecialistas
) -> PaginatedEspecialistResponse:

    if not login:
        raise Exception("Usuário não identificado")

    if filtros.categoria == "Meus Especialistas":
        filtros.usuario_logado = login
        filtros.categoria = None

    especialista_list = await EspecialistaMongo.listar_especialistas_por(
        filtros=filtros
    )
    total_especialistas = await EspecialistaMongo.total_especialistas_por(
        filtros=filtros
    )
    retorno = PaginatedEspecialistResponse(total=total_especialistas, especialistas=[])
    for especialista in especialista_list:
        retorno.especialistas.append(
            Especialista(
                label=especialista["label"],
                value=especialista.get("value"),
                selected=especialista["selected"],
                quebra_gelo=especialista["quebra_gelo"],
                autor=especialista["autor"],
                descricao=especialista["descricao"],
                icon=especialista["icon"],
                instrucoes=especialista.get("instrucoes"),
                categoria=especialista.get("categoria"),
            )
        )
    return retorno


@tracer.start_as_current_span("inserir_especialista")
async def inserir_especialista(especialista: Especialista, login: str):
    logger.info(f"Inserindo novo Especialista ")

    if not login:
        raise Exception("Usuário não identificado")

    categoria = await CategoriaMongo.get_categoria(especialista.categoria.nome)
    if categoria:
        especialista.categoria = categoria

    novo_especialista = await EspecialistaMongo.inserir_especialista(
        especialista=especialista
    )

    logger.info(f"finalizou a inserção de um novo Especialista")

    return novo_especialista


@tracer.start_as_current_span("listar_categorias_disponiveis")
async def listar_categorias_disponiveis(login: str):

    if not login:
        raise Exception("Usuário não identificado")

    categorias = await CategoriaMongo.listar_categorias_disponiveis()
    retorno = []
    for categoria in categorias:
        retorno.append(Categoria(id=categoria.get("id_"), nome=categoria.get("nome")))
    return retorno


@tracer.start_as_current_span("contador_especialistas_por_categoria")
async def contador_especialistas_por_categoria(login: str):

    if not login:
        raise Exception("Usuário não identificado")

    totais_por_tipo = (
        await EspecialistaMongo.obter_contador_especialistas_por_categoria()
    )
    totais_usr_logado = (
        await EspecialistaMongo.obter_contador_especialistas_usuario_logado(login)
    )

    totais_dict = {}

    for total in totais_por_tipo:
        categoria = total.get("_id")
        totais_dict[categoria] = total.get("total_especialistas", 0)

    for total in totais_usr_logado:
        categoria = total.get("_id")
        if categoria in totais_dict:
            totais_dict[categoria] += total.get("total_especialistas", 0)
        else:
            totais_dict[categoria] = total.get("total_especialistas", 0)

    retorno = [
        TotalEspecialistasPorCategoria(categoria=categoria, total=total)
        for categoria, total in totais_dict.items()
    ]

    return retorno
