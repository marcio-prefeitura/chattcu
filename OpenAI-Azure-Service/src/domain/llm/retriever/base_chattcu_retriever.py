from abc import ABC, abstractmethod
from typing import List, Optional

from langchain_core.messages.base import BaseMessage


class BaseChatTCURetriever(ABC):

    @abstractmethod
    async def execute(self, historico: Optional[List[BaseMessage]] = None): ...
