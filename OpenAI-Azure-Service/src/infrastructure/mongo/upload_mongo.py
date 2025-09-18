import logging
import time
import traceback
from datetime import datetime
from typing import List

import pymongo
from bson.objectid import ObjectId
from opentelemetry import trace

from src.domain.schemas import ItemSistema
from src.domain.status_arquivo_enum import StatusArquivoEnum
from src.exceptions import MongoException
from src.infrastructure.env import COLLECTION_NAME_DOCUMENTOS, DB_NAME_DOCUMENTOS
from src.infrastructure.mongo import mongo

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class UploadMongo(mongo.Mongo):
    @classmethod
    @tracer.start_as_current_span("_criar_indice_colecao")
    async def _criar_indice_colecao(cls):
        if cls.db is not None:
            collection_pastas = cls.db[cls.collection_name]

            indexes = [
                {"key": {"_id": 1}, "name": "_id_1"},
                {"key": {"usuario": 2}, "name": "_id_2"},
                {"key": {"nome": 3}, "name": "_id_3"},
            ]

            await cls.db.command(
                {
                    "customAction": "UpdateCollection",
                    "collection": cls.collection_name,
                    "indexes": indexes,
                }
            )

            logger.info(
                f"Indexes are: {sorted(await collection_pastas.index_information())}\n"
            )
        else:
            raise MongoException(
                f"Falha ao criar indice da collection {cls.collection_name}!"
            )

    @classmethod
    async def inserir_pasta(cls, pasta: ItemSistema):
        if not await cls.verifica_existencia_by_nome(pasta):
            inicio = time.time()

            try:
                collection_pastas = await cls.get_collection(
                    DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
                )

                item = {
                    "nome": pasta.nome,
                    "usuario": pasta.usuario,
                    "st_removido": False,
                    "id_pasta_pai": (
                        str(pasta.id_pasta_pai)
                        if str(pasta.id_pasta_pai) == "-1"
                        else ObjectId(str(pasta.id_pasta_pai))
                    ),
                    "data_criacao": (datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                    "st_arquivo": False,
                }

                result = await collection_pastas.insert_one(item)

                logger.info(f"Pasta inserida no Mongo com _id {result.inserted_id}!\n")

                pasta.id = str(result.inserted_id)

                return pasta
            except Exception as exp:
                logger.error(exp)
                traceback.print_exc()
            finally:
                fim = time.time()

                logger.info(f"Tempo gasto criando uma pasta: {(fim - inicio)}")
        else:
            raise MongoException(f"A pasta '{pasta.nome}' já existe no destino!")

    @classmethod
    @tracer.start_as_current_span("verifica_existencia_by_hash")
    async def verifica_existencia_by_hash(cls, arquivo: ItemSistema):
        if arquivo.st_arquivo:
            query_verificacao_existencia = {
                "usuario": arquivo.usuario,
                "nome_blob": arquivo.nome_blob,
                "id_pasta_pai": (
                    ObjectId(arquivo.id_pasta_pai)
                    if str(arquivo.id_pasta_pai) != "-1"
                    else "-1"
                ),
                "st_removido": False,
            }
        else:
            query_verificacao_existencia = {
                "usuario": arquivo.usuario,
                "nome": arquivo.nome,
                "id_pasta_pai": (
                    ObjectId(arquivo.id_pasta_pai)
                    if str(arquivo.id_pasta_pai) != "-1"
                    else "-1"
                ),
                "st_removido": False,
            }

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = collection_pastas.find(query_verificacao_existencia)

            retorno = await query.to_list(length=None)

            existe = len(retorno) > 0

            if existe:
                logger.info(
                    f"O item '{arquivo.nome_blob}' ('{arquivo.nome}') já existe na"
                    + f" pasta '{arquivo.id_pasta_pai}' do usuário '{arquivo.usuario}'"
                )

            return existe
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return True

    @classmethod
    async def verifica_existencia_by_nome(cls, arquivo: ItemSistema):
        inicio = time.time()

        if arquivo.st_arquivo:
            query_verificacao_existencia = {
                "usuario": arquivo.usuario,
                "nome": arquivo.nome,
                "nome_blob": {"$ne": arquivo.nome_blob},
                "id_pasta_pai": (
                    ObjectId(arquivo.id_pasta_pai)
                    if str(arquivo.id_pasta_pai) != "-1"
                    else "-1"
                ),
                "st_removido": False,
            }
        else:
            query_verificacao_existencia = {
                "usuario": arquivo.usuario,
                "nome": arquivo.nome,
                "id_pasta_pai": (
                    ObjectId(arquivo.id_pasta_pai)
                    if str(arquivo.id_pasta_pai) != "-1"
                    else "-1"
                ),
                "st_removido": False,
            }

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = collection_pastas.find(query_verificacao_existencia)

            retorno = await query.to_list(length=None)

            existe = len(retorno) > 0

            if existe:
                logger.info(
                    f"O item '{arquivo.nome_blob}' ('{arquivo.nome}') já existe na"
                    + f" pasta '{arquivo.id_pasta_pai}' do usuário '{arquivo.usuario}'"
                )

            return existe
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
        finally:
            fim = time.time()

            logger.info(f"Tempo gasto para verificar existência: {(fim - inicio)}")

        return True

    @classmethod
    @tracer.start_as_current_span("inserir_arquivo")
    async def inserir_arquivo(cls, file: ItemSistema):
        if not await cls.verifica_existencia_by_hash(file):
            if not await cls.verifica_existencia_by_nome(file):
                try:
                    logger.info(f"Registrando o arquivo ({file.nome}) no Mongo")

                    collection_pastas = await cls.get_collection(
                        DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
                    )

                    arquivo = {
                        "nome": file.nome,
                        "usuario": file.usuario,
                        "st_removido": False,
                        "tamanho": file.tamanho,
                        "tipo_midia": file.tipo_midia,
                        "id_pasta_pai": (
                            str(file.id_pasta_pai)
                            if str(file.id_pasta_pai) == "-1"
                            else ObjectId(str(file.id_pasta_pai))
                        ),
                        "data_criacao": (datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                        "st_arquivo": True,
                        "nome_blob": file.nome_blob,
                        "status": StatusArquivoEnum.ARMAZENADO.value,
                    }

                    result = await collection_pastas.insert_one(arquivo)

                    file.id = str(result.inserted_id)

                    logger.info(
                        f"O arquivo ({file.nome}) registrado no Mongo com _id {file.id}\n"
                    )
                except Exception as exp:
                    logger.error(exp)
                    traceback.print_exc()
            else:
                raise MongoException(
                    f"Um arquivo diferente já existe no destino com o nome '{file.nome}'!"
                )
        else:
            existente = await cls.buscar_arquivo_existente_by_hash(file)

            if existente and existente.nome is not file.nome:
                raise MongoException(
                    f"O arquivo '{file.nome}' já existe no destino com o nome '{existente.nome}'!"
                )

            raise MongoException(f"O arquivo '{file.nome}' já existe no destino!")

        return file

    @classmethod
    @tracer.start_as_current_span("inserir_varios_arquivos")
    async def inserir_varios_arquivos(cls, files: List[ItemSistema]):
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            lista_arquivos = []

            for file in files:
                lista_arquivos.append(
                    {
                        "nome": file.nome,
                        "usuario": file.usuario,
                        "st_removido": False,
                        "tamanho": file.tamanho,
                        "tipo_midia": file.tipo_midia,
                        "id_pasta_pai": (
                            str(file.id_pasta_pai)
                            if str(file.id_pasta_pai) == "-1"
                            else ObjectId(str(file.id_pasta_pai))
                        ),
                        "data_criacao": (datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                        "st_arquivo": True,
                        "nome_blob": file.nome_blob,
                        "status": StatusArquivoEnum.ARMAZENADO.value,
                    }
                )

            result = await collection_pastas.insert_many(lista_arquivos)

            logger.info(result.inserted_ids)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("listar_tudo")
    async def listar_tudo(cls, usr: str, arquivos: bool | None = None):
        all_itens_query = {"usuario": usr, "st_removido": False}

        if arquivos is not None:
            all_itens_query["st_arquivo"] = arquivos

        logger.info(all_itens_query)

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = collection_pastas.find(all_itens_query).sort(
                "nome", pymongo.ASCENDING
            )

            return await query.to_list(length=None)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return []

    @classmethod
    @tracer.start_as_current_span("listar_filhos")
    async def listar_filhos(
        cls, id_pasta_pai: int | str, usr: str, arquivos: bool | None = None
    ):
        lista = []

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            all_products_query = {
                "id_pasta_pai": (
                    str(id_pasta_pai)
                    if str(id_pasta_pai) == "-1"
                    else ObjectId(str(id_pasta_pai))
                ),
                "st_removido": False,
                "usuario": usr,
            }

            if arquivos is not None:
                all_products_query["st_arquivo"] = arquivos

            logger.info(all_products_query)

            async for pasta in collection_pastas.find(all_products_query).sort(
                "nome", pymongo.ASCENDING
            ):
                lista.append(
                    ItemSistema(
                        id=str(pasta["_id"]),
                        nome=pasta["nome"],
                        usuario=pasta["usuario"],
                        st_removido=pasta["st_removido"],
                        id_pasta_pai=(
                            str(pasta["id_pasta_pai"])
                            if pasta["id_pasta_pai"] != -1
                            else pasta["id_pasta_pai"]
                        ),
                        data_criacao=pasta["data_criacao"],
                        st_arquivo=pasta["st_arquivo"],
                        tamanho=pasta["tamanho"] if "tamanho" in pasta else None,
                        tipo_midia=(
                            pasta["tipo_midia"] if "tipo_midia" in pasta else None
                        ),
                        nome_blob=pasta["nome_blob"] if "nome_blob" in pasta else None,
                        status=pasta["status"] if "status" in pasta else None,
                    )
                )
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return lista

    @classmethod
    @tracer.start_as_current_span("busca_por_id")
    async def busca_por_id(
        cls, object_id: str, usr: str, removido: bool | None = False
    ) -> ItemSistema | None:
        pasta = None

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = {"_id": ObjectId(object_id), "usuario": usr}

            if removido is not None:
                query["st_removido"] = removido

            result = await collection_pastas.find_one(query)

            if result:
                pasta = ItemSistema(
                    id=str(result["_id"]),
                    nome=result["nome"],
                    usuario=result["usuario"],
                    st_removido=result["st_removido"],
                    id_pasta_pai=(
                        str(result["id_pasta_pai"])
                        if result["id_pasta_pai"] != -1
                        else result["id_pasta_pai"]
                    ),
                    data_criacao=result["data_criacao"],
                    st_arquivo=result["st_arquivo"],
                    tamanho=result["tamanho"] if "tamanho" in result else None,
                    tipo_midia=result["tipo_midia"] if "tipo_midia" in result else None,
                    nome_blob=result["nome_blob"] if "nome_blob" in result else None,
                    status=result["status"] if "status" in result else None,
                )
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return pasta

    @classmethod
    @tracer.start_as_current_span("busca_por_varios_ids")
    async def busca_por_varios_ids(
        cls, ids: List[str], usr: str, removido: bool | None = False
    ) -> ItemSistema | None:
        pasta = None

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = {
                "_id": {"$in": [ObjectId(object_id) for object_id in ids]},
                "usuario": usr,
            }

            if removido is not None:
                query["st_removido"] = removido

            result = collection_pastas.find(query).sort("nome", pymongo.ASCENDING)

            return await result.to_list(length=None)
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return pasta

    @classmethod
    @tracer.start_as_current_span("buscar_arquivo_existente_by_hash")
    async def buscar_arquivo_existente_by_hash(cls, arquivo: ItemSistema):
        file = None

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = {
                "usuario": arquivo.usuario,
                "nome_blob": arquivo.nome_blob,
                "id_pasta_pai": (
                    ObjectId(arquivo.id_pasta_pai)
                    if str(arquivo.id_pasta_pai) != "-1"
                    else "-1"
                ),
                "st_removido": False,
            }

            result = await collection_pastas.find_one(query)

            if result:
                file = ItemSistema(
                    id=str(result["_id"]),
                    nome=result["nome"],
                    usuario=result["usuario"],
                    st_removido=result["st_removido"],
                    id_pasta_pai=(
                        str(result["id_pasta_pai"])
                        if result["id_pasta_pai"] != -1
                        else result["id_pasta_pai"]
                    ),
                    data_criacao=result["data_criacao"],
                    st_arquivo=result["st_arquivo"],
                    tamanho=result["tamanho"] if "tamanho" in result else None,
                    tipo_midia=result["tipo_midia"] if "tipo_midia" in result else None,
                    nome_blob=result["nome_blob"] if "nome_blob" in result else None,
                    status=result["status"] if "status" in result else None,
                )
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return file

    @classmethod
    @tracer.start_as_current_span("buscar_arquivo_by_hash")
    async def buscar_arquivo_by_hash(cls, nome_blob: str, user: str):
        logger.info(f"Buscando arquivo pelo hash ({nome_blob})")
        file = None

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query = {
                "usuario": user,
                "nome_blob": nome_blob,
                "st_removido": False,
            }

            result = await collection_pastas.find_one(query)

            if result:
                file = ItemSistema(
                    id=str(result["_id"]),
                    nome=result["nome"],
                    usuario=result["usuario"],
                    st_removido=result["st_removido"],
                    id_pasta_pai=(
                        str(result["id_pasta_pai"])
                        if result["id_pasta_pai"] != -1
                        else result["id_pasta_pai"]
                    ),
                    data_criacao=result["data_criacao"],
                    st_arquivo=result["st_arquivo"],
                    tamanho=result["tamanho"] if "tamanho" in result else None,
                    tipo_midia=result["tipo_midia"] if "tipo_midia" in result else None,
                    nome_blob=result["nome_blob"] if "nome_blob" in result else None,
                    status=result["status"] if "status" in result else None,
                )
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return file

    @classmethod
    @tracer.start_as_current_span("remover")
    async def remover(cls, object_id: str, usr: str):
        try:
            logger.info(f"Definindo pasta|arquivo ({object_id}) como removido")

            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            await collection_pastas.update_one(
                {"_id": ObjectId(object_id), "usuario": usr},
                {"$set": {"st_removido": True}},
            )

        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("remover_varios")
    async def remover_varios(cls, lista_de_ids: List[str], usr: str):
        try:
            logger.info(
                f"Definindo vários itens ({','.join(str(id) for id in lista_de_ids)}) como removido"
            )

            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            ids = [ObjectId(id) for id in lista_de_ids]

            await collection_pastas.update_many(
                {"_id": {"$in": ids}, "usuario": usr},
                {"$set": {"st_removido": True}},
            )

        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("remover_filhos")
    async def remover_filhos(cls, id_pasta_pai: int | str, usr: str):
        try:
            logger.info(
                f"Definindo pasta|arquivo filhos de ({id_pasta_pai}) como removido"
            )

            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            await collection_pastas.update_many(
                {
                    "id_pasta_pai": (
                        str(id_pasta_pai)
                        if str(id_pasta_pai) == "-1"
                        else ObjectId(str(id_pasta_pai))
                    ),
                    "usuario": usr,
                },
                {"$set": {"st_removido": True}},
            )
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("alterar_status")
    async def alterar_status(
        cls, usr: str, arquivo: ItemSistema, status: StatusArquivoEnum
    ):
        try:
            logger.info(
                f"Alterando status da pasta|arquivo ({arquivo.nome}) para {status.value}"
            )

            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            arquivo.status = status.value

            await collection_pastas.update_one(
                {"_id": ObjectId(arquivo.id), "usuario": usr},
                {"$set": {"status": status.value}},
            )
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

        return arquivo

    @classmethod
    async def _check_item_existence(cls, item: ItemSistema):
        if await cls.verifica_existencia_by_hash(item):
            raise MongoException(f"O item '{item.nome}' já existe no destino!")
        if await cls.verifica_existencia_by_nome(item):
            raise MongoException(
                "Existe um item diferente, porém com o mesmo nome no destino!"
            )

    @classmethod
    @tracer.start_as_current_span("mover_item")
    async def mover_item(cls, id_item: str, id_pasta_destino: int | str, usr: str):
        item = await cls.busca_por_id(id_item, usr)
        if not item:
            raise MongoException("Item não encontrado!")

        item.id_pasta_pai = id_pasta_destino
        await cls._check_item_existence(item)

        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )
            await collection_pastas.update_one(
                {"_id": ObjectId(id_item), "usuario": usr, "st_removido": False},
                {
                    "$set": {
                        "id_pasta_pai": (
                            str(id_pasta_destino)
                            if str(id_pasta_destino) == "-1"
                            else ObjectId(str(id_pasta_destino))
                        )
                    }
                },
            )
            return item
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()

    @classmethod
    @tracer.start_as_current_span("copiar_item")
    async def copiar_item(cls, id_item: str, id_pasta_destino: int | str, usr: str):
        file = await cls.busca_por_id(id_item, usr)
        if not file:
            raise MongoException("Item não encontrado!")

        id_pasta_pai_original = file.id_pasta_pai
        file.id_pasta_pai = id_pasta_destino

        await cls._check_item_existence(file)

        try:
            logger.info(f"Copiando o arquivo ({file.nome}) no Mongo")

            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )
            arquivo = {
                "nome": file.nome,
                "usuario": file.usuario,
                "st_removido": file.st_removido,
                "tamanho": file.tamanho,
                "tipo_midia": file.tipo_midia,
                "id_pasta_pai": (
                    str(id_pasta_destino)
                    if str(id_pasta_destino) == "-1"
                    else ObjectId(str(id_pasta_destino))
                ),
                "data_criacao": (datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                "st_arquivo": file.st_arquivo,
                "nome_blob": file.nome_blob,
                "status": file.status,
            }

            result = await collection_pastas.insert_one(arquivo)
            file.id = str(result.inserted_id)

            logger.info(
                f"O arquivo ({file.nome}) foi copiado no Mongo com _id {file.id}\n"
            )
            return file
        except Exception as exp:
            file.id_pasta_pai = id_pasta_pai_original
            logger.error(exp)
            traceback.print_exc()
            raise MongoException("Erro ao copiar o item!")

    @classmethod
    @tracer.start_as_current_span("renomear_item")
    async def renomear_item(cls, usr: str, item_id: str, novo_nome: str):
        try:
            collection_pastas = await cls.get_collection(
                DB_NAME_DOCUMENTOS, COLLECTION_NAME_DOCUMENTOS
            )

            query_verificacao_existencia = {
                "usuario": usr,
                "nome": novo_nome,
                "st_removido": False,
            }

            item_existente = await collection_pastas.find_one(
                query_verificacao_existencia
            )

            if item_existente:
                logger.error(f"Item com o nome '{novo_nome}' já existe!")
                raise MongoException(f"Já existe um item com o nome '{novo_nome}'!")

            logger.info(f"Alterando nome do item id ({item_id}) para {novo_nome}")

            await collection_pastas.update_one(
                {"_id": ObjectId(item_id), "usuario": usr},
                {"$set": {"nome": novo_nome}},
            )
        except MongoException as me:
            logger.error(f"MongoException: {me}")
            raise
        except Exception as exp:
            logger.error(exp)
            traceback.print_exc()
