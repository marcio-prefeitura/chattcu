# app.py

import logging
import os
import threading

import fastapi
from fastapi.middleware.cors import CORSMiddleware
from langchain.globals import set_debug, set_verbose

from src.domain.enum.type_channel_redis_enum import TypeChannelRedisEnum
from src.infrastructure.env import VERBOSE
from src.infrastructure.mongo.mongo import Mongo
from src.infrastructure.redis.redis_chattcu import RedisClient
from src.infrastructure.routes import router

REDIS_THREAD = None
if os.environ["PROFILE"] in ["prod", "aceite", "desenvol"]:
    REDIS_THREAD = threading.Thread(
        target=RedisClient().subscribe_channel,
        args=(TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value,),
        daemon=True,
    )

# define a verbosidade do langchain
set_verbose(VERBOSE)

# define o debug do langchain
set_debug(VERBOSE)

logging.config.fileConfig(
    os.path.join(os.path.dirname(__file__), "conf/logging.conf"),
    disable_existing_loggers=False,
)

logging.getLogger("azure").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)

logging.info("iniciando aplicação")

app = fastapi.FastAPI(
    openapi_version="3.0.0",
    title="OpenAI Azure Service",
    description="API do ChatTCU",
    version="0.0.3",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url=None,
)


@app.on_event("startup")
async def startup_event():
    await Mongo.conectar()
    if REDIS_THREAD:
        REDIS_THREAD.start()


@app.on_event("shutdown")
async def shutdown_event():
    await Mongo.fechar_conexao()


origins = [
    "https://stchattcuteamsapp.z15.web.core.windows.net",
    "https://portal.tcu.gov.br",
    "https://chat-tcu.apps.tcu.gov.br/",
    "http://chat-tcu.producao.rancher.tcu.gov.br/",
    "https://chat-tcu.producao.rancher.tcu.gov.br/",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
