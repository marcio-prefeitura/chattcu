from fastapi import APIRouter

from src.controller.update_index_casa_controller import (
    router as update_index_casa_controller,
)

from ..controller.agent_controller import router as agent_controller
from ..controller.auth_controller import router as auth_controller
from ..controller.chatgpt_controller import router as chatgpt_controller_router
from ..controller.compartilhamento_controller import (
    router as compartilhamento_controller,
)
from ..controller.health_check import router as health_check_controller
from ..controller.model_controller import router as model_controller
from ..controller.store_controller import router as store_controller
from ..controller.upload_controller import router as upload_controller

router = APIRouter()

router.include_router(
    health_check_controller, prefix="/api/health", tags=["health-check"]
)
router.include_router(
    auth_controller,
    prefix="/api/v1/auth",
    tags=["auth"],
    include_in_schema=False,
)
router.include_router(chatgpt_controller_router, prefix="/api/v1/chats", tags=["chats"])
router.include_router(upload_controller, prefix="/api/v1/storage", tags=["storage"])
router.include_router(
    compartilhamento_controller, prefix="/api/v1/share", tags=["share"]
)
router.include_router(model_controller, prefix="/api/v1/models", tags=["models"])
router.include_router(
    update_index_casa_controller,
    prefix="/api/v1/segedam",
    tags=["segedam"],
    include_in_schema=False,
)

router.include_router(agent_controller, prefix="/api/v1/agent", tags=["agent"])
router.include_router(store_controller, prefix="/api/v1/store", tags=["store"])
