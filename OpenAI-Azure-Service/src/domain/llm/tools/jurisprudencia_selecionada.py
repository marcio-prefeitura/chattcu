from langchain.agents.agent_toolkits import create_retriever_tool
from langchain.tools import Tool

from src.domain.llm.retriever.jurisprudencia_selecionada_search_retriever import (
    JurisprudenciaSearchRetriever,
)
from src.domain.mensagem import Mensagem


class JurisprudenciaSelecionada:
    def __init__(
        self, msg: Mensagem, llm, prompt_usuario: str, top_documents: int, usr_roles=[]
    ):
        self.msg = msg
        self.llm = llm
        self.usr_roles = usr_roles
        self.prompt_usuario = prompt_usuario
        self.top_documents = top_documents

    def get_tool(self) -> Tool:
        descricao_juris = (
            "Jurisprudência do Tribunal de Contas da União (TCU). "
            + "Ao usar informações de uma fonte, sempre inclui o id da fonte. "
            + "Referencia os ids ao final do parágrafo usando colchetes, "
            + "como [Acórdão..._1][Acórdão..._2]. "
            + "A jurisprudência do TCU abrange temas como Direito Processual, "
            + "julgamento de contas, licitação, pessoal, finanças públicas, "
            + "gestão administrativa, contratos administrativos e desestatização. "
            + "Inclui princípios como ampla defesa e independência das instâncias, "
            + "processos como cobrança executiva e tomada de contas especial, "
            + "e conceitos como prazo, citação e recurso. "
            + "Também trata de questões específicas como aposentadoria, "
            + "licitação internacional, concurso público, renúncia de receita, "
            + "operação de crédito, terceirização, nepotismo, e controle interno. "
            + "Além disso, aborda entidades como Sistema S, empresas estatais, "
            + "organizações sociais e internacionais, e conselhos de "
            + "fiscalização profissional."
        )

        juris_retriever = JurisprudenciaSearchRetriever(
            system_message=self.msg,
            top_k=self.top_documents,
            prompt_usuario=self.prompt_usuario,
            usr_roles=self.usr_roles,
            llm=self.llm,
        )

        juris_tool = create_retriever_tool(
            juris_retriever, "search_juris", descricao_juris
        )

        return juris_tool
