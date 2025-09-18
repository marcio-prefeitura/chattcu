import logging

from opentelemetry import trace

from src.domain.agent_config import AgentConfig
from src.infrastructure.mongo.agent_mongo import AgentMongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("listar_agents_disponiveis")
async def listar_agents_disponiveis(login: str):
    logger.info(f"Carrega a lista de agentes: {login}")

    if not login:
        raise Exception("Usuário não identificado")

    agents_list = await AgentMongo.listar_agents_disponiveis()
    retorno = []
    for agent in agents_list:
        retorno.append(
            AgentConfig(
                labelAgente=agent["label_agente"],
                valueAgente=agent.get("value_agente"),
                selected=agent["selected"],
                quebraGelo=agent["quebra_gelo"],
                autor=agent["autor"],
                descricao=agent["descricao"],
                icon=agent["icon"],
                instrucoes=agent.get("instrucoes"),
            )
        )
    return retorno


@tracer.start_as_current_span("inserir_agent")
async def inserir_agent(agent: AgentConfig, login: str):
    logger.info(f"Inserindo novo Agent ")

    logger.info(f"Carrega a lista de agentes: {login}")

    if not login:
        raise Exception("Usuário não identificado")

    agent = await AgentMongo.inserir_agent(agent=agent)

    logger.info(f"finalizou a inserção de um novo Agent")

    return agent
