import logging
import traceback
from abc import ABC

from opentelemetry import trace

from src.domain.store import Categoria
from src.exceptions import MongoException
from src.infrastructure.env import COLLECTION_NAME_CATEGORIA, DB_NAME_STORE
from src.infrastructure.mongo import mongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class CategoriaMongo(mongo.Mongo, ABC):

    @classmethod
    @tracer.start_as_current_span("_criar_indice_colecao")
    async def _criar_indice_colecao(cls):
        if cls.db is not None:
            collection = cls.db[cls.collection_name]

            indexes = [
                {"key": {"_id": 1}, "name": "_id_1"},
                {"key": {"value": 2}, "name": "_id_2"},
            ]

            await cls.db.command(
                {
                    "customAction": "UpdateCollection",
                    "collection": cls.collection_name,
                    "indexes": indexes,
                }
            )

            index_info = await collection.index_information()
            sorted_index_info = sorted(index_info, key=lambda x: x["name"])
            logger.info(f"Indexes are: {sorted_index_info}\n")
        else:
            raise MongoException(
                f"Falha ao criar indice da collection {cls.collection_name}!"
            )

    @classmethod
    @tracer.start_as_current_span("get_categoria")
    async def get_categoria(cls, nome: str) -> Categoria:
        logger.info(f"Carrega a categoria do especialista: {nome}")
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_CATEGORIA
            )

            query = collection_pastas.find_one({"nome": nome})
            categoria = await query

            if categoria:
                return Categoria(
                    id=str(categoria["_id"]),
                    nome=categoria["nome"],
                )
            else:
                return None
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
            return None

    @classmethod
    @tracer.start_as_current_span("listar_categorias_disponiveis")
    async def listar_categorias_disponiveis(cls):
        try:
            collection = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_CATEGORIA
            )

            query = collection.find({})
            result = await query.to_list(length=None)
            return result
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
            return []
