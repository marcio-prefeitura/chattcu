import json
import logging
from abc import ABC, abstractmethod

from opentelemetry import trace

from src.domain.mensagem import Mensagem
from src.domain.schemas import ReagirInput
from src.domain.trecho import trecho_para_dict
from src.exceptions import ElasticException

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class MensagemElasticSearch(ABC):
    @abstractmethod
    @tracer.start_as_current_span("elasticsearch_query")
    async def elasticsearch_query(self, tipo_query, query, req_tipo="get"):
        pass

    @abstractmethod
    @tracer.start_as_current_span("insert_ou_update_campo")
    async def insert_ou_update_campo(self, id, objeto_dict):
        pass

    @tracer.start_as_current_span("adicionar_mensagem")
    async def adicionar_mensagem(self, cod_chat: str, mensagem: Mensagem):
        nova_mensagem = {
            "codigo": mensagem.codigo,
            "papel": mensagem.papel.name,
            "conteudo": mensagem.conteudo,
            "data_envio": mensagem.data_envio.strftime("%Y-%m-%d %H:%M:%S"),
            "favoritado": False,
            "parametro_tipo_busca": (
                mensagem.parametro_tipo_busca.value
                if mensagem.parametro_tipo_busca
                else None
            ),
            "parametro_nome_indice_busca": (
                (mensagem.parametro_nome_indice_busca.value)
                if mensagem.parametro_nome_indice_busca
                else None
            ),
            "parametro_quantidade_trechos_relevantes_busca": (
                (mensagem.parametro_quantidade_trechos_relevantes_busca)
                if mensagem.parametro_quantidade_trechos_relevantes_busca
                else None
            ),
            "parametro_modelo_llm": mensagem.parametro_modelo_llm,
            "parametro_versao_modelo_llm": mensagem.parametro_versao_modelo_llm,
            "arquivos_busca": (
                mensagem.arquivos_busca if mensagem.arquivos_busca else ""
            ),
            "arquivos_selecionados": (
                ", ".join(mensagem.arquivos_selecionados)
                if mensagem.arquivos_selecionados
                else ""
            ),
            "arquivos_selecionados_prontos": (
                ", ".join(mensagem.arquivos_selecionados_prontos)
                if mensagem.arquivos_selecionados_prontos
                else ""
            ),
            "trechos": (
                [trecho_para_dict(trecho) for trecho in mensagem.trechos]
                if len(mensagem.trechos) > 0
                else []
            ),
            "feedback": {
                "reacao": "",
                "conteudo": "",
                "ofensivo": False,
                "inveridico": False,
                "nao_ajudou": False,
            },
            "especialista_utilizado": mensagem.especialista_utilizado,
            "imagens": [{"id_imagem": img} for img in mensagem.imagens],
        }
        query = {
            "script": {
                "source": """if (ctx._source.containsKey('mensagens')) {
                    ctx._source.mensagens.add(params.mensagem) 
                } else { 
                    ctx._source.mensagens = [params.mensagem] 
                }""",
                "lang": "painless",
                "params": {"mensagem": nova_mensagem},
            }
        }

        response = await self.elasticsearch_query(
            f"_doc/{cod_chat}/_update", json.dumps(query), req_tipo="post"
        )

        if "result" in response and response["result"] == "updated":
            logger.info(f"Mensagem inserida com sucesso no chat: {cod_chat}")

            await self.insert_ou_update_campo(
                mensagem.chat_id,
                {
                    "chat": {
                        "data_ultima_iteracao": mensagem.data_envio.strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                    }
                },
            )

            logger.info(f"Data de última iteração atualizada: {cod_chat}")
        else:
            logger.error(f"Falha ao inserir mensagem no chat: {cod_chat}")

            if "error" in response:
                error_message = response["error"]["reason"]

                logger.error(f"Mensagem de erro: {error_message}")

            raise ElasticException("Falha ao inserir mensagem no chat")

    # @TODO filtrar pelo app_origem e usuario
    @tracer.start_as_current_span("adicionar_feedback")
    async def adicionar_feedback(
        self,
        entrada: ReagirInput,
        chat_id: str,
        cod_mensagem: str,
        app_origem: str,
        usuario: str,
    ):
        novo_feedback = {
            "reacao": entrada.reacao,
            "conteudo": entrada.conteudo,
            "ofensivo": str(entrada.ofensivo).lower(),
            "inveridico": str(entrada.inveridico).lower(),
            "nao_ajudou": str(entrada.nao_ajudou).lower(),
        }

        script = {
            "source": """
                for (int i = 0; i < ctx._source.mensagens.length; i++) {
                    if (ctx._source.mensagens[i].codigo == params.codigo) {
                        ctx._source.mensagens[i].feedback = params.feedback;
                        break;
                    }
                }
            """,
            "lang": "painless",
            "params": {"codigo": cod_mensagem, "feedback": novo_feedback},
        }

        query = {"script": script}

        resultado = await self.elasticsearch_query(
            f"_update/{chat_id}", json.dumps(query), req_tipo="post"
        )

        if "result" in resultado and resultado["result"] == "updated":
            logger.info("Feedback inserido com sucesso.")
        else:
            logger.error(f"Erro ao adicionar feedback à mensagem {cod_mensagem}")

            raise ElasticException(
                f"Erro ao adicionar feedback à mensagem {cod_mensagem}"
            )


class MensagemElasticSearchImpl(MensagemElasticSearch):
    async def elasticsearch_query(self, tipo_query, query, req_tipo="get"):
        pass

    async def insert_ou_update_campo(self, id, objeto_dict):
        pass
