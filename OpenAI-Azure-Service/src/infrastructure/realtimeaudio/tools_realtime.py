import json
import logging

from langchain_core.tools import tool

from src.infrastructure.cognitive_search.cognitive_search import CognitiveSearch
from src.infrastructure.env import INDEX_NAME_NORMAS
from src.infrastructure.roles import DESENVOLVEDOR

logger = logging.getLogger(__name__)


@tool(name_or_callable="search_normas")
async def search_normas(question: str) -> str:
    """Ferramenta para procurar sobre norma ou normas, no âmbito do TCU, ou Tribunal, ou Tribunal de Contas da União
    Deixe claro para o usuário que você está procurando sobre normas ANTES de chamar a ferramenta.
    """
    cogs = CognitiveSearch(index_name=INDEX_NAME_NORMAS, chunk_size=1, usr_roles=[])

    similarity_docs = await cogs.buscar_trechos_relevantes(
        search_text=question,
        query_type="semantic",
        query_language="pt-br",
        semantic_configuration_name="semantic-normas",
        query_caption="extractive",
        filtro=None,
        selecao=["trecho"],
        search_fields=["titulo", "trecho"],
        top=3,
    )

    conteudo = ""
    async for doc in similarity_docs:
        conteudo += doc["trecho"] + "\n"

    return json.dumps(conteudo)


TOOLS = [search_normas]
