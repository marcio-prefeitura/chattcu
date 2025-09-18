import logging
import traceback
from abc import ABC
from datetime import datetime

from opentelemetry import trace

from src.domain.schemas import FiltrosEspecialistas
from src.domain.store import Especialista
from src.exceptions import MongoException
from src.infrastructure.env import COLLECTION_NAME_ESPECIALISTA, DB_NAME_STORE
from src.infrastructure.mongo import mongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class EspecialistaMongo(mongo.Mongo, ABC):

    @classmethod
    @tracer.start_as_current_span("_criar_indice_colecao")
    async def _criar_indice_colecao(cls):
        if cls.db is not None:
            collection = cls.db[cls.collection_name]

            indexes = [
                {"key": {"_id": 1}, "name": "_id_1"},
                {"key": {"valueAgente": 2}, "name": "_id_2"},
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
    @tracer.start_as_current_span("inserir_especialista")
    async def inserir_especialista(cls, especialista: Especialista) -> Especialista:
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_ESPECIALISTA
            )

            item = {
                "label": especialista.label,
                "value": especialista.value,
                "quebra_gelo": especialista.quebra_gelo,
                "autor": especialista.autor,
                "descricao": especialista.descricao,
                "icon": especialista.icon,
                "categoria": especialista.categoria,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }

            result = await collection_pastas.insert_one(item)

            logger.info(f"Especialista inserido com sucesso: {result.inserted_id}")

            especialista.id = str(result.inserted_id)

            return especialista
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("listar_especialistas_por")
    async def listar_especialistas_por(
        cls, filtros: FiltrosEspecialistas
    ) -> list[Especialista]:
        try:
            collection = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_ESPECIALISTA
            )

            query = {}

            if filtros.categoria:
                query["categoria.nome"] = filtros.categoria

            if filtros.usuario_logado:
                query["autor"] = filtros.usuario_logado

            skip = (filtros.page - 1) * filtros.per_page
            cursor = collection.find(query)
            cursor = cursor.skip(skip)
            cursor = cursor.limit(filtros.per_page)
            especialistas = await cursor.to_list(length=None)
            return especialistas
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
            return []

    @classmethod
    @tracer.start_as_current_span("total_especialistas_por")
    async def total_especialistas_por(cls, filtros: FiltrosEspecialistas) -> int:
        try:
            collection = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_ESPECIALISTA
            )

            query = {}

            if filtros.categoria:
                query["categoria.nome"] = filtros.categoria

            if filtros.usuario_logado:
                query["autor"] = filtros.usuario_logado

            total = await collection.count_documents(query)
            return total
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
            return 0

    @classmethod
    @tracer.start_as_current_span("obter_contador_especialistas_por_categoria")
    async def obter_contador_especialistas_por_categoria(cls):
        try:
            collection = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_ESPECIALISTA
            )

            pipeline = [
                {
                    "$group": {
                        "_id": "$categoria.nome",
                        "total_especialistas": {"$sum": 1},
                    }
                }
            ]

            result = await collection.aggregate(pipeline).to_list(length=None)
            return result
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
            return 0

    @classmethod
    @tracer.start_as_current_span("obter_contador_especialistas_usuario_logado")
    async def obter_contador_especialistas_usuario_logado(cls, login: str):
        try:
            collection = await cls.get_collection(
                DB_NAME_STORE, COLLECTION_NAME_ESPECIALISTA
            )

            pipeline = [
                {"$match": {"autor": login}},
                {
                    "$group": {
                        "_id": "Meus Especialistas",
                        "total_especialistas": {"$sum": 1},
                    }
                },
            ]

            result = await collection.aggregate(pipeline).to_list(length=None)
            return result
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
            return 0
