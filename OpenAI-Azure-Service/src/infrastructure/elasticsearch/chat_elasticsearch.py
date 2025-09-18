import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List

from opentelemetry import trace

from src.domain.chat import Chat, elastic_para_chat_dict
from src.domain.schemas import FiltrosChat, PaginatedChatsResponse
from src.exceptions import ElasticException

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class ChatElasticSearch(ABC):
    @abstractmethod
    @tracer.start_as_current_span("elasticsearch_query")
    async def elasticsearch_query(self, tipo_query, query, req_tipo="get"):
        pass

    @abstractmethod
    @tracer.start_as_current_span("insert_ou_update_campo")
    async def insert_ou_update_campo(self, id, objeto_dict):
        pass

    @tracer.start_as_current_span("criar_novo_chat")
    async def criar_novo_chat(self, chat: Chat):
        novo_chat = {
            "chat": {
                "usuario": chat.usuario.upper(),
                "titulo": chat.titulo,
                "data_criacao": chat.data_criacao.strftime("%Y-%m-%d %H:%M:%S"),
                "data_ultima_iteracao": chat.data_ultima_iteracao.strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                "fixado": False,
                "apagado": False,
                "arquivado": False,
                "credencial": {
                    "aplicacao_origem": chat.credencial.aplicacao_origem.upper(),
                    "usuario": chat.credencial.usuario.upper(),
                },
            },
            "mensagens": [],
        }

        resultado = await self.elasticsearch_query(
            "_doc", json.dumps(novo_chat), "post"
        )

        novo_chat_id = resultado["_id"]

        logger.info(f"Novo chat inserido com sucesso! ID: {novo_chat_id}")

        chat.id = novo_chat_id

        return chat

    @tracer.start_as_current_span("buscar_chat")
    async def buscar_chat(self, chat_id, login: str):
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"_id": chat_id}},
                        {"match": {"chat.usuario": login.upper()}},
                    ]
                }
            }
        }

        resultado = await self.elasticsearch_query("_search", json.dumps(query))
        chat = elastic_para_chat_dict(resultado["hits"]["hits"][0], com_mensagem=True)

        return chat

    @tracer.start_as_current_span("renomear")
    async def renomear(self, chat_id: str, novo_titulo: str):
        await self.insert_ou_update_campo(chat_id, {"chat": {"titulo": novo_titulo}})

    @tracer.start_as_current_span("apagar_todos")
    async def apagar_todos(self, usuario: str, app_origem: str, chatids: List[str]):
        query = {
            "script": {
                "source": (
                    "ctx._source.chat.apagado = params.apagado; "
                    + "ctx._source.chat.data_ultima_iteracao = params.data_ultima_iteracao"
                ),
                "lang": "painless",
                "params": {
                    "apagado": True,
                    "data_ultima_iteracao": (datetime.now()).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                },
            },
            "query": {
                "bool": {
                    "must": [
                        {"match": {"chat.usuario": usuario.upper()}},
                        {"term": {"chat.apagado": False}},
                        {
                            "term": {
                                "chat.credencial.aplicacao_origem": app_origem.upper()
                            }
                        },
                        {"terms": {"_id": chatids}},
                    ]
                }
            },
        }

        resultado = await self.elasticsearch_query(
            "_doc/_update_by_query", json.dumps(query), req_tipo="post"
        )

        # Verificar resultado e tratar a resposta conforme necessário
        if "updated" in resultado:
            total_atualizacoes = resultado["updated"]

            logger.info(
                f"""{total_atualizacoes} chats do {usuario}, 
                foram atualizados como apagados com sucesso."""
            )
        else:
            logger.error(
                f"""A atualização do campo 'apagado' 
                para todos os chats do usuário {usuario} falhou."""
            )

            raise ElasticException("Erro ao apagar histórico.")

        return resultado

    @tracer.start_as_current_span("alterna_fixar_chats_por_ids")
    async def alterna_fixar_chats_por_ids(
        self, usuario: str, app_origem: str, fixar: bool, chatids: List[str]
    ):
        query = {
            "script": {
                "source": (
                    "ctx._source.chat.fixado = params.fixado; "
                    + "ctx._source.chat.data_ultima_iteracao = params.data_ultima_iteracao"
                ),
                "lang": "painless",
                "params": {
                    "data_ultima_iteracao": (datetime.now()).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                    "fixado": fixar,
                },
            },
            "query": {
                "bool": {
                    "must": [
                        {"match": {"chat.usuario": usuario.upper()}},
                        {"term": {"chat.fixado": (not fixar)}},
                        {"term": {"chat.arquivado": False}},
                        {
                            "term": {
                                "chat.credencial.aplicacao_origem": app_origem.upper()
                            }
                        },
                        {"terms": {"_id": chatids}},
                    ]
                }
            },
        }

        resultado = await self.elasticsearch_query(
            "_doc/_update_by_query", json.dumps(query), req_tipo="post"
        )

        # Verificar resultado e tratar a resposta conforme necessário
        if "updated" in resultado:
            total_atualizacoes = resultado["updated"]

            logger.info(
                f"""{total_atualizacoes} chats do {usuario}, 
                foram atualizados como desafixados com sucesso."""
            )
        else:
            logger.error(
                f"""A atualização do campo 'fixado' 
                para todos os chats do usuário {usuario} falhou."""
            )

            raise ElasticException("Erro ao desafixar chats.")

        return resultado

    @tracer.start_as_current_span("alterna_arquivar_chats_por_ids")
    async def alterna_arquivar_chats_por_ids(
        self, usuario: str, app_origem: str, arquivar: bool, chatids: List[str]
    ):
        query = {
            "script": {
                "source": (
                    "ctx._source.chat.arquivado = params.arquivado; "
                    + "ctx._source.chat.data_ultima_iteracao = params.data_ultima_iteracao"
                ),
                "lang": "painless",
                "params": {
                    "data_ultima_iteracao": (datetime.now()).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                    "arquivado": arquivar,
                },
            },
            "query": {
                "bool": {
                    "must": [
                        {"match": {"chat.usuario": usuario.upper()}},
                        {"term": {"chat.arquivado": (not arquivar)}},
                        {
                            "term": {
                                "chat.credencial.aplicacao_origem": app_origem.upper()
                            }
                        },
                        {"terms": {"_id": chatids}},
                    ]
                }
            },
        }

        resultado = await self.elasticsearch_query(
            "_doc/_update_by_query", json.dumps(query), req_tipo="post"
        )

        # Verificar resultado e tratar a resposta conforme necessário
        if "updated" in resultado:
            total_atualizacoes = resultado["updated"]

            logger.info(
                f"""{total_atualizacoes} chats do {usuario}, 
                foram atualizados como desarquivado com sucesso."""
            )
        else:
            logger.error(
                f"""A atualização do campo 'arquivado' 
                para todos os chats do usuário {usuario} falhou."""
            )

            raise ElasticException("Erro ao desarquivar chats.")

        return resultado

    @tracer.start_as_current_span("listar_chats_paginado")
    async def listar_chats_paginado(
        self,
        login: str,
        app_origem: str,
        com_msgs: bool,
        filtros: FiltrosChat,
    ) -> PaginatedChatsResponse:
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"match": {"chat.usuario": login.upper()}},
                        {"term": {"chat.apagado": False}},
                        {
                            "term": {
                                "chat.credencial.aplicacao_origem": app_origem.upper()
                            }
                        },
                    ]
                }
            },
            "sort": [{"chat.data_ultima_iteracao": {"order": "desc"}}],
        }

        if filtros.page and filtros.per_page:
            start = (filtros.page - 1) * filtros.per_page
            query["from"] = start
            query["size"] = filtros.per_page
        else:
            query["size"] = 10000

        if filtros.fixados is not None:
            query["query"]["bool"]["must"].append(
                {"term": {"chat.fixado": filtros.fixados}}
            )

        if filtros.arquivados is not None:
            query["query"]["bool"]["must"].append(
                {"term": {"chat.arquivado": filtros.arquivados}}
            )

        if filtros.searchText:
            query["query"]["bool"]["must"].append(
                {"match_phrase_prefix": {"chat.titulo": filtros.searchText}}
            )
        chats = []

        resultado = await self.elasticsearch_query("_search", json.dumps(query))

        chats = [
            elastic_para_chat_dict(chat, com_mensagem=com_msgs)
            for chat in resultado["hits"]["hits"]
        ]
        total_hits = resultado["hits"]["total"]["value"]

        return PaginatedChatsResponse(chats=chats, total=total_hits)

    @tracer.start_as_current_span("buscar_imagem")
    async def buscar_imagem(
        self, chat_id: str, msg_id: str, id_imagem: str, login: str
    ):
        query = {
            "_source": ["mensagens.codigo", "mensagens.imagens.id_imagem"],
            "query": {
                "bool": {
                    "must": [
                        {"ids": {"values": [chat_id]}},
                        {
                            "nested": {
                                "path": "mensagens",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {"term": {"mensagens.codigo": msg_id}},
                                            {
                                                "nested": {
                                                    "path": "mensagens.imagens",
                                                    "query": {
                                                        "bool": {
                                                            "must": [
                                                                {
                                                                    "term": {
                                                                        "mensagens.imagens.id_imagem": id_imagem
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                }
                                            },
                                        ]
                                    }
                                },
                            }
                        },
                    ]
                }
            },
        }

        resultado = await self.elasticsearch_query("_search", json.dumps(query))

        try:
            if resultado["hits"]["hits"]:
                imagens_encontradas = []
                for hit in resultado["hits"]["hits"]:
                    for mensagem in hit["_source"].get("mensagens", []):
                        if mensagem.get("codigo") == msg_id:
                            for imagem in mensagem.get("imagens", []):
                                logger.info(
                                    f"Checking imagem: {imagem['id_imagem']} against {id_imagem}"
                                )
                                if imagem.get("id_imagem") == id_imagem:
                                    imagens_encontradas.append(
                                        {
                                            "chat_id": hit["_id"],
                                            "mensagem_id": mensagem.get("codigo"),
                                            "id_imagem": imagem["id_imagem"],
                                        }
                                    )

                logger.info(f"Imagens encontradas: {imagens_encontradas}")
                return imagens_encontradas if imagens_encontradas else None
            else:
                logger.warning(
                    f"Nenhuma imagem encontrada para o id_imagem: {id_imagem}"
                )
                return None
        except Exception as e:
            logger.error(f"Erro ao processar a resposta do Elasticsearch: {e}")
        return None
