import logging
import traceback
from typing import List

from bson import ObjectId
from opentelemetry import trace

from src.domain.schemas import ChatOut, CompartilhamentoOut, MessageOut
from src.domain.trecho import elastic_para_trecho, trecho_para_dict
from src.exceptions import MongoException
from src.infrastructure.env import (
    COLLECTION_NAME_COMPARTILHAMENTOS,
    DB_NAME_COMPARTILHAMENTO,
)
from src.infrastructure.mongo import mongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class CompartilhamentoMongo(mongo.Mongo):
    @classmethod
    @tracer.start_as_current_span("_criar_indice_colecao")
    async def _criar_indice_colecao(cls):
        if cls.db is not None:
            collection = cls.db[cls.collection_name]

            indexes = [
                {"key": {"_id": 1}, "name": "_id_1"},
                {"key": {"usuario": 2}, "name": "_id_2"},
                {"key": {"chat.id_chat": 3}, "name": "_id_3"},
                {"key": {"destinatarios.codigo": 3}, "name": "_id_4"},
            ]

            await cls.db.command(
                {
                    "customAction": "UpdateCollection",
                    "collection": cls.collection_name,
                    "indexes": indexes,
                }
            )

            logger.info(
                f"Indexes are: {sorted(await collection.index_information())}\n"
            )
        else:
            raise MongoException(
                f"Falha ao criar indice da collection {cls.collection_name}!"
            )

    @classmethod
    @tracer.start_as_current_span("__parse_result_to_compartilhamento")
    def __parse_result_to_compartilhamento(cls, result):
        compartilhamento = CompartilhamentoOut(
            id=str(result["_id"]),
            arquivos=result["arquivos"],
            data_compartilhamento=(
                result["data_compartilhamento"]
                if "data_compartilhamento" in result
                else None
            ),
            st_removido=result["st_removido"],
            usuario=result["usuario"],
            chat=ChatOut(
                id=result["chat"]["id_chat"],
                titulo=result["chat"]["titulo"],
                usuario=result["chat"]["usuario"],
                fixado=False,
                arquivado=False,
                mensagens=[
                    MessageOut(
                        codigo=msg["codigo"],
                        papel=msg["papel"],
                        conteudo=msg["conteudo"],
                        arquivos_busca=msg["arquivos_busca"],
                        arquivos_selecionados=msg["arquivos_selecionados"],
                        arquivos_selecionados_prontos=msg[
                            "arquivos_selecionados_prontos"
                        ],
                        trechos=[elastic_para_trecho(dado) for dado in msg["trechos"]],
                        favoritado=False,
                        feedback="",
                        especialista_utilizado=(
                            msg["especialista_utilizado"]
                            if "especialista_utilizado" in msg
                            else None
                        ),
                        parametro_modelo_llm=(
                            msg["parametro_modelo_llm"]
                            if "parametro_modelo_llm" in msg
                            else None
                        ),
                    )
                    for msg in result["chat"]["mensagens"]
                ],
            ),
        )
        return compartilhamento

    @classmethod
    @tracer.start_as_current_span("inserir_compartilhamento")
    async def inserir_compartilhamento(
        cls, compartilhamento: CompartilhamentoOut
    ) -> CompartilhamentoOut:
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            item = {
                "usuario": compartilhamento.usuario.lower(),
                "st_removido": compartilhamento.st_removido,
                "data_compartilhamento": compartilhamento.data_compartilhamento,
                "arquivos": compartilhamento.arquivos,
                "chat": {
                    "id_chat": compartilhamento.chat.id,
                    "titulo": compartilhamento.chat.titulo,
                    "usuario": compartilhamento.chat.usuario,
                    "apagado": False,
                    "fixado": False,
                    "mensagens": [
                        {
                            "codigo": msg.codigo,
                            "papel": msg.papel,
                            "conteudo": msg.conteudo,
                            "arquivos_busca": msg.arquivos_busca,
                            "arquivos_selecionados": msg.arquivos_selecionados,
                            "arquivos_selecionados_prontos": msg.arquivos_selecionados_prontos,
                            "trechos": [
                                trecho_para_dict(trecho) for trecho in msg.trechos
                            ],
                            "especialista_utilizado": msg.especialista_utilizado,
                            "parametro_modelo_llm": msg.parametro_modelo_llm,
                        }
                        for msg in compartilhamento.chat.mensagens
                    ],
                },
            }

            result = await collection_pastas.insert_one(item)

            logger.info(
                f"Compartilhamento inserido no Mongo com _id {result.inserted_id}!\n"
            )

            compartilhamento.id = str(result.inserted_id)
            compartilhamento.data_compartilhamento = None

            return compartilhamento
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("atualizar_compartilhamento")
    async def atualizar_compartilhamento(
        cls, compartilhamento_id: str, novo_chat: ChatOut
    ) -> bool:
        """camada de dados: atualiza o conteúdo do chat pelo id_compartilhamento passado, mantendo assim o mesmo link."""
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            query = {"_id": ObjectId(compartilhamento_id)}

            update = {
                "$set": {
                    "chat": {
                        "id_chat": novo_chat.id,
                        "titulo": novo_chat.titulo,
                        "usuario": novo_chat.usuario,
                        "fixado": novo_chat.fixado,
                        "mensagens": [
                            {
                                "codigo": msg.codigo,
                                "papel": msg.papel,
                                "conteudo": msg.conteudo,
                                "arquivos_busca": msg.arquivos_busca,
                                "arquivos_selecionados": msg.arquivos_selecionados,
                                "arquivos_selecionados_prontos": msg.arquivos_selecionados_prontos,
                                "trechos": [
                                    trecho_para_dict(trecho) for trecho in msg.trechos
                                ],
                                "especialista_utilizado": msg.especialista_utilizado,
                                "parametro_modelo_llm": msg.parametro_modelo_llm,
                            }
                            for msg in novo_chat.mensagens
                        ],
                    }
                }
            }

            result = await collection_pastas.update_one(query, update)

            if result.modified_count > 0:
                logger.info(
                    f"Compartilhamento com _id {compartilhamento_id} atualizado com sucesso!"
                )
                return True
            elif result.modified_count == 0:
                logger.warning(
                    f"Recurso já está atualizado para _id {compartilhamento_id}"
                )
                return True

        except Exception as exp:
            logger.error(
                f"Erro ao atualizar compartilhamento com _id {compartilhamento_id}: {exp}"
            )
            traceback.print_exc()

        return False

    @classmethod
    @tracer.start_as_current_span("busca_por_id")
    async def busca_por_id(cls, object_id: str, usr: str) -> CompartilhamentoOut | None:
        compartilhamento = None

        try:
            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            query = {"_id": ObjectId(object_id), "st_removido": False}

            result = await collection.find_one(query)

            if result:
                compartilhamento = cls.__parse_result_to_compartilhamento(result)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return compartilhamento

    @classmethod
    @tracer.start_as_current_span("busca_por_chat_id")
    async def busca_por_chat_id(
        cls, chat_id: str, usr: str
    ) -> CompartilhamentoOut | None:
        compartilhamento = None

        try:
            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            query = {"chat.id_chat": chat_id, "usuario": usr, "st_removido": False}

            result = await collection.find_one(query)

            if result:
                compartilhamento = cls.__parse_result_to_compartilhamento(result)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return compartilhamento

    @classmethod
    @tracer.start_as_current_span("listar_compartilhados_por_usuario")
    async def listar_compartilhados_por_usuario(
        cls, usr: str
    ) -> List[CompartilhamentoOut] | None:
        retorno = []

        try:
            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            query = collection.find({"usuario": usr.lower(), "st_removido": False})

            resultados = await query.to_list(length=None)

            for result in resultados:
                compartilhamento = cls.__parse_result_to_compartilhamento(result)

                retorno.append(compartilhamento)

        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return retorno

    @classmethod
    @tracer.start_as_current_span("listar_compartilhados_por_destinatarios")
    async def listar_compartilhados_por_destinatarios(
        cls,
        destinatarios: List[str],
    ) -> List[CompartilhamentoOut] | None:
        retorno = []

        try:
            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            query = collection.find(
                {"destinatarios.codigo": {"$in": destinatarios}, "st_removido": False}
            )

            resultados = await query.to_list(length=None)

            for result in resultados:
                compartilhamento = cls.__parse_result_to_compartilhamento(result)

                retorno.append(compartilhamento)

        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return retorno

    @classmethod
    @tracer.start_as_current_span("listar_tudo")
    async def listar_tudo(
        cls,
    ) -> List[CompartilhamentoOut] | None:
        retorno = []

        try:
            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            query = {"st_removido": False}

            # print(query)

            response = collection.find(query)

            resultados = await response.to_list(length=None)

            for result in resultados:
                compartilhamento = cls.__parse_result_to_compartilhamento(result)

                retorno.append(compartilhamento)

        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return retorno

    @classmethod
    @tracer.start_as_current_span("remover")
    async def remover(cls, object_id: str, usr: str):
        try:
            logger.info(f"Definindo compartilhamento ({object_id}) como removido")

            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            result = await collection.update_one(
                {"_id": ObjectId(object_id), "usuario": usr.lower()},
                {"$set": {"st_removido": True}},
            )

            logger.info(result)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("remover_by_chat_id")
    async def remover_por_chat_id(cls, chat_id: str, usr: str):
        try:
            logger.info(f"Definindo compartilhamento ({chat_id}) como removido")

            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            result = await collection.update_many(
                {"chat.id_chat": chat_id, "usuario": usr.lower()},
                {"$set": {"st_removido": True}},
            )

            logger.info(result)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("remover_todos_enviados")
    async def remover_todos_enviados(cls, usr: str):
        try:
            logger.info("Definindo compartilhamentos enviados como removido")

            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            result = await collection.update_many(
                {"usuario": usr.lower(), "st_removido": False},
                {"$set": {"st_removido": True}},
            )

            logger.info(result)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("remover_todos_enviados")
    async def remover_todos_enviados_por_chats_ids(cls, usr: str, ids_chats: List[str]):
        try:
            logger.info("Definindo compartilhamentos enviados como removido")

            collection = await cls.get_collection(
                DB_NAME_COMPARTILHAMENTO, COLLECTION_NAME_COMPARTILHAMENTOS
            )

            filtro = {
                "usuario": usr.lower(),
                "st_removido": False,
                "chat.id_chat": {"$in": ids_chats},
            }

            logger.info(filtro)

            result = await collection.update_many(
                filtro,
                {"$set": {"st_removido": True}},
            )

            logger.info(result)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
