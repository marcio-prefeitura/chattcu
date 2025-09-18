import logging
import traceback
from abc import ABC
from datetime import datetime

from opentelemetry import trace

from src.domain.agent_config import AgentConfig
from src.exceptions import MongoException
from src.infrastructure.env import COLLECTION_NAME_AGENTS, DB_NAME_AGENTS
from src.infrastructure.mongo import mongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class AgentMongo(mongo.Mongo, ABC):

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

            logger.info(
                f"Indexes are: {sorted(await collection.index_information())}\n"
            )
        else:
            raise MongoException(
                f"Falha ao criar indice da collection {cls.collection_name}!"
            )

    @classmethod
    @tracer.start_as_current_span("listar_tudo")
    async def listar_agents_disponiveis(cls):
        logger.info(f"Carrega a lista de agentes disponíveis")
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_AGENTS, COLLECTION_NAME_AGENTS
            )

            query = collection_pastas.find()
            return await query.to_list(length=None)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return []

    @classmethod
    @tracer.start_as_current_span("inserir_agent")
    async def inserir_agent(cls, agent: AgentConfig) -> AgentConfig:
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_AGENTS, COLLECTION_NAME_AGENTS
            )

            item = {
                "label_agente": agent.labelAgente,
                "value_agente": agent.valueAgente,
                "selected": False,
                "quebra_gelo": agent.quebraGelo,
                "autor": agent.autor,
                "descricao": agent.descricao,
                "icon": agent.icon,
                "data_criacao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "st_removido": False,
                "is_agent_default": False,
            }

            result = await collection_pastas.insert_one(item)

            logger.info(f"Agent inserido no Mongo com _id {result.inserted_id}!\n")

            agent.id = str(result.inserted_id)

            return agent
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
