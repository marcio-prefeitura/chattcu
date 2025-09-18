from typing import Any

from langchain.agents.agent_toolkits import create_retriever_tool
from langchain.tools import Tool

from src.domain.llm.retriever.adm_search_retriever import AdmSearchRetriever
from src.domain.mensagem import Mensagem


class Administrativo:
    def __init__(
        self,
        msg: Mensagem,
        top_documents: int,
        prompt_usuario: str,
        llm: Any,
        usr_roles=[],
        login: str = None,
    ):
        self.msg = msg
        self.usr_roles = usr_roles
        self.login = login
        self.top_documents = top_documents
        self.prompt_usuario = prompt_usuario
        self.llm = llm

    def get_tool(self) -> Tool:
        descricao_adm = (
            "Serviços administrativos oferecidos internamente. "
            + "Cada serviço é listado com seu nome, uma "
            + "descrição detalhada, um link para o sistema onde ele pode "
            + "ser solicitado e informações sobre quem é o público-alvo "
            + "e um link para mais informações. "
            + "Esta descrição abrange uma variedade de serviços e procedimentos "
            + "relacionados à gestão de recursos humanos, finanças, saúde e "
            + "bem-estar, tecnologia da informação, viagens, patrimônio, segurança, "
            + "transporte, limpeza e conservação, comunicação e documentação, "
            + "biblioteca e aprendizado, e gestão de eventos. "
            + "Inclui tópicos como empréstimos, alterações de dados, aposentadoria, "
            + "férias, avaliação de desempenho, gestão de estágios, remoção de "
            + "funcionários, licenças, benefícios, aposentadoria, gestão de "
            + "dependências, programas de saúde e bem-estar, suporte de TI, viagens, "
            + "manutenção de imóveis, segurança, transporte, limpeza, serviços de "
            + "biblioteca e programas de aprendizado."
        )

        adm_retriever = AdmSearchRetriever(
            system_message=self.msg,
            top_k=self.top_documents,
            login=self.login,
            prompt_usuario=self.prompt_usuario,
            usr_roles=self.usr_roles,
            llm=self.llm,
        )

        adm_tool = create_retriever_tool(adm_retriever, "search_adm", descricao_adm)

        return adm_tool
