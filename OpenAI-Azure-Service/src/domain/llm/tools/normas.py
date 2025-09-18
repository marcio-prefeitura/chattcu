from langchain.agents.agent_toolkits import create_retriever_tool
from langchain.tools import Tool

from src.domain.llm.retriever.normas_retriever import NormasRetriever
from src.domain.mensagem import Mensagem


class Normas:
    def __init__(
        self, msg: Mensagem, llm, prompt_usuario: str, top_documents: int, usr_roles=[]
    ):
        self.msg = msg
        self.usr_roles = usr_roles
        self.llm = llm
        self.prompt_usuario = prompt_usuario
        self.top_documents = top_documents

    def get_tool(self) -> Tool:
        descricao_normas = (
            "Normativos do Tribunal de Contas da União (TCU), "
            + "incluindo portarias, resoluções, instruções"
            + "normativas e decisões normativas. Esses normativos"
            + "abordam uma ampla gama de temas, desde gestão documental"
            + "até cooperação técnica. Também são mencionados tópicos"
            + "gestão fiscal, estrutura organizacional, auditoria"
            + "financeira e orçamentária, controle orçamentário, gestão de"
            + "pessoas, ética, políticas públicas, responsabilidade fiscal"
            + ", entre outros. Além disso, são citados processos e procedimentos"
            + "específicos do TCU, como tomada de contas, auditoria de obras"
            + "públicas, avaliação de programas de governo, fiscalização, "
            + "entre outros."
            + "Ao usar informações de uma fonte, sempre inclui o id da fonte. "
            + "Referencia os ids ao final do parágrafo usando colchetes, "
            + "como [Portaria..._1][Portaria..._2]. "
            + "o nome da referencia segue conforme o metadata do Document em seu "
            + "atributo source"
        )

        normas_retriever = NormasRetriever(
            system_message=self.msg,
            top_k=self.top_documents,
            prompt_usuario=self.prompt_usuario,
            llm=self.llm,
            usr_roles=self.usr_roles,
        )

        normas_tool = create_retriever_tool(
            normas_retriever, "search_normas", descricao_normas
        )

        return normas_tool
