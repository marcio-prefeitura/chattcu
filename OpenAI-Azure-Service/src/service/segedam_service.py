import json
import logging
from typing import List

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from langchain.docstore.document import Document
from opentelemetry import trace

from src.domain.schemas import ServicoSegedam
from src.infrastructure.cognitive_search.segedam_cs import SegedamCS

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("prepara")
async def prepara(servicos: List[ServicoSegedam]):
    colunas_a_remover = [
        "cod_categoria_servico",
        "cod_unidade",
        "cod_subcategoria",
        "nome_usuario_preenchimento",
        "descr_unidade_responsavel",
        "texto_etapas",
        "texto_como_acompanhar",
        "texto_prazos_atendimento",
        "texto_publico_alvo",
        "texto_requisitos",
        "texto_documentacao",
        "dthora_ultima_alteracao",
        "alias_pagina_sistema_apex",
        "se_envia_pesquisa",
        "periodicidade_atualiza_meses",
        "ind_forma_atendimento",
        "cod_sistema_interno",
        "cod_usuario_preenchimeto",
        "texto_responsavel",
        "descr_categoria",
        "descr_subcategoria",
        "link_sistema",
        "nome_sistema",
        "email_servico",
        "cod",
        "texto_normativos",
        "texto_como_solicitar",
    ]
    documents = []

    for index, servico in enumerate(servicos):
        servico_dict = servico.model_dump()

        for coluna in colunas_a_remover:
            if coluna in servico_dict:
                del servico_dict[coluna]

        documents.append(
            Document(
                page_content=json.dumps(servico_dict),
                metadata={"source": "Segedam", "index": index},
            )
        )

    return documents


@tracer.start_as_current_span("autaliza_integral")
async def autaliza_integral(servicos: List[ServicoSegedam], usr_roles=[]):
    cs_segedam = SegedamCS("segedam_teste", 0, usr_roles=usr_roles)

    try:
        ## cada serviço corresponde a 1 documento e consequentemente a 1 seção
        documents = await prepara(servicos)

        await cs_segedam.exclui_indice()

        await cs_segedam.cria_indice()

        sections = cs_segedam.create_sections_servicos(servicos, documents)

        await cs_segedam.popular_indice(sections)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"msg": "Indice atualizado com sucesso!"},
        )
    except Exception as exp:
        logger.error(exp)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=exp
        ) from exp


@tracer.start_as_current_span("autaliza_parcial")
async def autaliza_parcial(servicos: List[ServicoSegedam], usr_roles=[]):
    cs_segedam = SegedamCS("segedam_teste", 0, usr_roles=usr_roles)

    try:
        documents = await prepara(servicos)

        sections = cs_segedam.create_sections_servicos(
            servicos, documents, parcial=True
        )

        await cs_segedam.popular_indice(sections)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"msg": "Indice atualizado com sucesso!"},
        )
    except Exception as exp:
        logger.error(exp)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=exp
        ) from exp
