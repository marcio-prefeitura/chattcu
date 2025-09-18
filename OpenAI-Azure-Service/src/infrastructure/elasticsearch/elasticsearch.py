import json
import logging

import aiohttp
from opentelemetry import trace

from src.infrastructure.elasticsearch.chat_elasticsearch import ChatElasticSearch
from src.infrastructure.elasticsearch.mensagem_elasticsearch import (
    MensagemElasticSearch,
)

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class ElasticSearch(ChatElasticSearch, MensagemElasticSearch):
    @tracer.start_as_current_span("__init__ElasticSearch")
    def __init__(
        self,
        elasticsearch_login,
        elasticsearch_password,
        elasticsearch_url,
        elasticsearch_indice=None,
    ):
        self.elasticsearch_login = elasticsearch_login
        self.elasticsearch_password = elasticsearch_password
        self.elasticsearch_url = elasticsearch_url
        self.elasticsearch_indice = elasticsearch_indice

    @tracer.start_as_current_span("set_indice")
    def set_indice(self, elasticsearch_indice):
        self.elasticsearch_indice = elasticsearch_indice

    @tracer.start_as_current_span("elasticsearch_query")
    async def elasticsearch_query(self, tipo_query, query, req_tipo="get"):
        url_template = (
            f"{self.elasticsearch_url}/{self.elasticsearch_indice}/{tipo_query}"
        )

        logger.info(f"URL: {url_template}")

        if req_tipo == "get":
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url=url_template,
                    headers={"Content-Type": "application/json"},
                    data=query,
                    auth=aiohttp.BasicAuth(
                        self.elasticsearch_login, self.elasticsearch_password
                    ),
                ) as response:
                    results = await response.text()
        elif req_tipo == "post":
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url=url_template,
                    headers={"Content-Type": "application/json"},
                    data=query,
                    auth=aiohttp.BasicAuth(
                        self.elasticsearch_login, self.elasticsearch_password
                    ),
                ) as response:
                    results = await response.text()
        else:
            raise Exception(
                f"elasticsearch_query com erro de req_tipo: {tipo_query} - {query} - {req_tipo}"
            )

        logger.info(f"RESPONSE STATUS CODE: {response.status}")

        if response.status == 401:
            raise Exception(
                "FAILED - UNAUTHORIZED! - Request lacks valid"
                + " authentication credentials for the target resource."
            )

        results = json.loads(results)

        return results

    @tracer.start_as_current_span("get_indices")
    async def get_indices(self):
        url_template = f"{self.elasticsearch_url}/_aliases"

        logger.info("URL: %s", url_template)

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url=url_template,
                headers={"Content-Type": "application/json"},
                auth=aiohttp.BasicAuth(
                    self.elasticsearch_login, self.elasticsearch_password
                ),
            ) as response:
                logger.info("RESPONSE STATUS CODE: %d", response.status)

                if response.status == 401:
                    raise Exception(
                        "FAILED - UNAUTHORIZED! - Request lacks valid"
                        + " authentication credentials for the target resource."
                    )

                response_text = await response.text()
                results = json.loads(response_text)
                return results

    @tracer.start_as_current_span("scroll")
    async def scroll(self, scroll_id, req_tipo="get"):
        url_template = f"{self.elasticsearch_url}/_search/scroll"

        logger.info("URL: %s", url_template)

        if req_tipo == "get":
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url=url_template,
                    headers={"Content-Type": "application/json"},
                    data='{"scroll":"1m","scroll_id":"' + scroll_id + '"}',
                    auth=aiohttp.BasicAuth(
                        self.elasticsearch_login, self.elasticsearch_password
                    ),
                ) as response:
                    results = await response.text()

        elif req_tipo == "post":
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url=url_template,
                    headers={"Content-Type": "application/json"},
                    data='{"scroll":"1m","scroll_id":"' + scroll_id + '"}',
                    auth=aiohttp.BasicAuth(
                        self.elasticsearch_login, self.elasticsearch_password
                    ),
                ) as response:
                    results = await response.text()
        else:
            raise Exception("elasticsearch_query com erro de req_tipo scroll")

        logger.info("RESPONSE STATUS CODE: %d", response.status)

        if response.status == 401:
            raise Exception(
                "FAILED - UNAUTHORIZED! - "
                + "Request lacks valid authentication credentials for the target resource."
            )

        results = json.loads(results)

        return results

    @tracer.start_as_current_span("multi_search_ids")
    async def multi_search_ids(self, terms):
        query = ""
        for term in terms:
            query += "%s \n" % json.dumps({})
            query += "%s \n" % json.dumps(
                {"query": {"match": {"_id": term}}, "_source": "false"}
            )

        tipo_query = "_msearch"

        results = await self.elasticsearch_query(tipo_query, query)

        logger.info("Quantidade de responses: %d", len(results["responses"]))

        saida_ids = []

        for response in results["responses"]:
            if response["hits"]["total"]["value"] > 0:
                for res in response["hits"]["hits"]:
                    saida_ids.append(res["_id"])

        return saida_ids

    @tracer.start_as_current_span("create_indice")
    async def create_indice(self, index_name, mapping):
        url_template = f"{self.elasticsearch_url}/{index_name}"

        logger.info("URL: %s", url_template)

        async with aiohttp.ClientSession() as session:
            async with session.put(
                url_template,
                data=mapping,
                headers={"Content-Type": "application/json"},
                auth=aiohttp.BasicAuth(
                    self.elasticsearch_login, self.elasticsearch_password
                ),
            ) as response:
                logger.info("RESPONSE STATUS CODE: %d", response.status)

                if response.status != 200:
                    if response.status == 403:
                        msg_erro = "FAILED - UNAUTHORIZED! RESPONSE STATUS CODE:" + str(
                            response.status
                        )
                    else:
                        msg_erro = (
                            "Erro ao criar o indice! RESPONSE STATUS CODE:"
                            + str(response.status)
                            + " - "
                            + str(response.content)
                        )

                    logger.error(msg_erro)

                    raise Exception(msg_erro)

                return True

    @tracer.start_as_current_span("populate_indice")
    async def populate_indice(self, index_name, registros):
        query = ""

        for registro in registros:
            query += '{"index": {"_id": "' + str(registro["SEQ_PAGINACAO"]) + '"} } \n'
            query += json.dumps(registro, ensure_ascii=False) + "\n"

        query = query.encode("UTF-8")

        tipo_query = "_bulk"
        self.set_indice(index_name)

        results = await self.elasticsearch_query(tipo_query, query, "post")

        logger.info(f"Houve erro:{results['errors']}")
        logger.info(f"Resultado Status:{results['items'][0]['index']['status']}")

        if results["errors"]:
            raise Exception(
                "FAILED - Query com erro: {}. RAZAO: {}".format(
                    query, results["items"][0]["index"]["error"]["caused_by"]["reason"]
                )
            )

        logger.info(f"Resultado:{results['items'][0]['index']['result']}")

    @tracer.start_as_current_span("delete_indice")
    async def delete_indice(self, index_name):
        url_template = f"{self.elasticsearch_url}/{index_name}"

        logger.info("URL: %s", url_template)

        async with aiohttp.ClientSession() as session:
            async with session.delete(
                url_template,
                auth=aiohttp.BasicAuth(
                    self.elasticsearch_login, self.elasticsearch_password
                ),
            ) as response:
                logger.info("RESPONSE STATUS CODE: %d", response.status)
                if response.status != 200:
                    if response.status == 403:
                        msg_erro = "FAILED - UNAUTHORIZED! RESPONSE STATUS CODE:" + str(
                            response.status
                        )
                    else:
                        msg_erro = (
                            "Erro ao deletar o indice! RESPONSE STATUS CODE:"
                            + str(response.status)
                        )

                    logger.error(msg_erro)

                    raise Exception(msg_erro)

    @tracer.start_as_current_span("insert_ou_update_campo")
    async def insert_ou_update_campo(self, id, objeto_dict):

        query = """{"doc": """ + json.dumps(objeto_dict) + "}"

        tipo_query = f"_update/{id}"
        return await self.elasticsearch_query(tipo_query, query, req_tipo="post")
