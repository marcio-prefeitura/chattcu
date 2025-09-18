import logging
import time
from abc import abstractmethod
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from opentelemetry import trace

from src.conf.env import configs

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class Mongo:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    db_name = None
    collection_name = None

    @classmethod
    @tracer.start_as_current_span("conectar")
    async def conectar(cls):
        inicio = time.time()

        cls.client = AsyncIOMotorClient(
            configs.AZURE_COSMOS_CONNECT_STR,
            maxConnecting=15,
            minPoolSize=10,
            maxPoolSize=200,
            waitQueueTimeoutMS=100,
            maxIdleTimeMS=1000 * 60 * 1,
        )

        fim = time.time()

        logger.info(f"Tempo gasto com abertura da conexao Cosmos: {(fim - inicio)}")

    @classmethod
    @tracer.start_as_current_span("fechar_conexao")
    async def fechar_conexao(cls):
        inicio = time.time()

        if cls.client:
            cls.client.close()

        fim = time.time()

        logger.info(f"Tempo gasto com fechamento da conexao Cosmos: {(fim - inicio)}")

    @classmethod
    @tracer.start_as_current_span("_get_database")
    async def _get_database(cls, db_name):
        if cls.client is not None:
            cls.db = cls.client[db_name]

            await cls._bd_existis_or_create(db_name)

            return cls.db

    @classmethod
    @tracer.start_as_current_span("get_collection")
    async def get_collection(cls, db_name, collection_name):
        cls.db_name = db_name
        cls.collection_name = collection_name

        if cls.db is None:
            await cls._get_database(db_name)

        if cls.db is not None:
            return cls.db[collection_name]

    @classmethod
    @tracer.start_as_current_span("_bd_existis_or_create")
    async def _bd_existis_or_create(cls, db_name):
        if db_name not in await cls.client.list_database_names():
            # Create a database with 400 RU throughput that can be shared across
            # the DB's collections
            await cls.db.command(
                {"customAction": "CreateDatabase", "offerThroughput": 400}
            )

            logger.info(f"Created db '{db_name}' with shared throughput.\n")

            await cls._criar_colecao()
        else:
            print(f"Using database: '{db_name}'.\n")

    @classmethod
    @tracer.start_as_current_span("_criar_colecao")
    async def _criar_colecao(cls):
        if cls.db is not None:
            if cls.collection_name not in await cls.db.list_collection_names():
                # Creates a unsharded collection that uses the DBs shared throughput
                await cls.db.command(
                    {
                        "customAction": "CreateCollection",
                        "collection": cls.collection_name,
                    }
                )

                logger.info(f"Created collection '{cls.collection_name}'.\n")

                await cls._criar_indice_colecao()
            else:
                logger.info(f"Using collection: '{cls.collection_name}'.\n")
        else:
            raise Exception(f"Falha ao criar collection {cls.collection_name}!")

    @classmethod
    @abstractmethod
    @tracer.start_as_current_span("_criar_indice_colecao")
    async def _criar_indice_colecao(cls):
        pass
