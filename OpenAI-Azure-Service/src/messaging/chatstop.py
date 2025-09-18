import asyncio
import logging
import threading
from datetime import datetime
from weakref import WeakSet

from opentelemetry import trace

from src.messaging.mensagem_chatstop_redis import MensagemChatStopRedis

SEGUNDOS_LIMPEZA = 60 * 3

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class ChatStop:
    """Singleton para gerenciar a parada do processamento do chat.

    A classe é responsável por registrar as tasks em execução e cancelar estas quando solicitado.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(ChatStop, cls).__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.tasks_registry = WeakSet()

    @tracer.start_as_current_span("get_task_by_nome")
    def _get_task_by_nome(self, name):
        """Procura uma task pelo nome."""

        for task in self.tasks_registry:
            if task.get_name() == name:
                return task
        return None

    @tracer.start_as_current_span("_cancela_task_por_correlacao_chamada_id")
    def _cancela_task_por_correlacao_chamada_id(
        self, correlacao_chamada_id: str
    ) -> None:
        """Cancela a task caso esteja em execução."""

        try:
            task = self._get_task_by_nome(correlacao_chamada_id)
            if task:
                task.cancel()
                logger.info(
                    f"Tarefa {correlacao_chamada_id} CANCELADA por evento Chat-Stop!"
                )
                self.tasks_registry.discard(task)
        except asyncio.CancelledError:
            logger.info(f"Tarefa {correlacao_chamada_id} tratada após cancelamento.")

    @tracer.start_as_current_span("registra_task")
    def registra_task(self, task):
        """Registra uma task no registro global."""

        self.tasks_registry.add(task)

    @tracer.start_as_current_span("cancela_task")
    def cancela_task(self, mensagem: MensagemChatStopRedis) -> None:
        """acionar a parada do processamento do chat."""

        try:
            self._cancela_task_por_correlacao_chamada_id(mensagem.correlacao_chamada_id)
        except Exception as e:
            logger.error(e)
