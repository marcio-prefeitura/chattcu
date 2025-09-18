import logging
import re
from typing import List

from src.conf.env import configs
from src.domain.schemas import ChatGptInput, ItemSistema
from src.domain.trecho import Trecho
from src.infrastructure.cognitive_search.documentos_cs import DocumentoCS
from src.infrastructure.env import CHUNK_SIZE, INDEX_NAME_DOCUMENTOS
from src.infrastructure.mongo.upload_mongo import UploadMongo
from src.infrastructure.security_tokens import DecodedToken

logger = logging.getLogger(__name__)


class DocumentProcessUtils:

    async def _find_documentos_utilizados(
        self, chatinput: ChatGptInput, token: DecodedToken
    ):
        docs_sel: List[ItemSistema] = []

        # @TODO subistituir o for pela chamada que busca por ids
        for id_doc in chatinput.arquivos_selecionados_prontos:
            doc_db = await UploadMongo.busca_por_id(
                id_doc, token.login.lower(), removido=False
            )
            if doc_db:
                docs_sel.append(doc_db)
            else:
                raise Exception(
                    "Você não possui acesso a um dos documentos selecionados!"
                )
        return docs_sel

    async def _find_trechos_relevantes(
        self, token: DecodedToken, docs_sel: List[ItemSistema], top_documents: int, resp
    ):
        filtro = self._construir_filtro(docs_sel, resp)
        select = ["pagina_arquivo", "numero_pagina", "tamanho_trecho", "trecho", "id"]

        cogs = DocumentoCS(
            INDEX_NAME_DOCUMENTOS,
            CHUNK_SIZE,
            azure_search_key=configs.AZURE_SEARCH_DOCS_KEY,
            azure_search_url=configs.AZURE_SEARCH_DOCS_URL,
            usr_roles=token.roles,
            login=token.login,
        )
        res = await cogs.buscar_trechos_relevantes(
            search_text=resp["pergunta"],
            filtro=filtro,
            selecao=select,
            top=top_documents,
            search_fields=None,
            using_vectors=True,
        )

        trechos = []
        results = []

        async for doc in res:
            label, id_arquivo_mongo, trecho = self._processar_documento(doc, docs_sel)
            results.append(f"{label}: {trecho}")

            trechos.append(
                Trecho(
                    id_arquivo_mongo=id_arquivo_mongo,
                    pagina_arquivo=doc["numero_pagina"],
                    conteudo=trecho,
                    parametro_tamanho_trecho=doc["tamanho_trecho"],
                    search_score=doc["@search.score"],
                    id_registro=label,
                    link_sistema=None,
                )
            )

        content = "\n\n".join(results)
        return {"content": content, "trechos": trechos}

    def _construir_filtro(self, docs_sel: List[ItemSistema], resp) -> str:
        separator = ","
        filtro = f"search.in(hash, '{separator.join([doc.nome_blob for doc in docs_sel])}', '{separator}')"

        if resp["pagina_inicial"]:
            filtro += f" and numero_pagina ge {resp['pagina_inicial']}"

        if resp["pagina_final"]:
            filtro += f" and numero_pagina le {resp['pagina_final']}"

        logger.info(filtro)
        return filtro

    def _processar_documento(self, doc, docs_sel: List[ItemSistema]) -> (str, str, str):
        padrao_hash = r"^(.*?)-[^-]+$"
        correspondencia_hash = re.match(padrao_hash, doc["id"])
        nome_blob_cs = doc["id"]

        if correspondencia_hash:
            nome_blob_cs = correspondencia_hash.group(1)

        label = doc["pagina_arquivo"]
        id_arquivo_mongo = None

        for docsel in docs_sel:
            nome_blob_arq = re.sub("[^0-9a-zA-Z_-]", "_", f"{docsel.nome_blob}")

            if nome_blob_cs == nome_blob_arq:
                complemento = "RESUMO"
                if doc["numero_pagina"]:
                    complemento = (
                        "página "
                        + str(doc["numero_pagina"])
                        + " - número do trecho "
                        + doc["id"].split("-")[-1]
                    )

                label = f"Arquivo {docsel.nome} - {complemento}"
                id_arquivo_mongo = docsel.id
                break

        logger.info(label)
        logger.info(id_arquivo_mongo)

        if "RESUMO RESUMO RESUMO " in doc["trecho"]:
            doc["trecho"] = doc["trecho"].replace("RESUMO RESUMO RESUMO ", "")

        return label, id_arquivo_mongo, doc["trecho"]
