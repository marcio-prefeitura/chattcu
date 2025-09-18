import logging
import traceback
import uuid
from typing import List

from azure.core.exceptions import HttpResponseError
from azure.search.documents.aio import SearchClient
from azure.search.documents.indexes.aio import SearchIndexClient
from azure.search.documents.indexes.models import *
from opentelemetry import trace

from src.conf.env import configs
from src.domain.schemas import ServicoSegedam
from src.infrastructure.cognitive_search.cognitive_search import CognitiveSearch

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


class SegedamCS(CognitiveSearch):
    @tracer.start_as_current_span("trata_none")
    def trata_none(self, palavra):
        return palavra if palavra else ""

    @tracer.start_as_current_span("verifica_existencia_indice")
    async def verifica_existencia_indice(self):
        logger.info("Verificando a existência do índice")

        index_client: SearchIndexClient = None

        try:
            index_client = SearchIndexClient(
                configs.AZURE_SEARCH_SISTEMAS_URL, self.azure_credential
            )

            await index_client.get_index(self.index_name)

            logger.info(f"O indice '{self.index_name}' já existe!")

            return True
        except HttpResponseError:
            logger.info(f"O indice '{self.index_name}' ainda não foi criado!")

            return False
        finally:
            if index_client:
                await index_client.close()

    @tracer.start_as_current_span("cria_indice")
    async def cria_indice(self):
        logger.info(f"Criando o indice: {self.index_name}")

        # se o indice já existe, não há necessidade de cria-lo, então sai
        if await self.verifica_existencia_indice():
            return

        index_client: SearchIndexClient = None

        try:
            index_client = SearchIndexClient(
                endpoint=configs.AZURE_SEARCH_SISTEMAS_URL,
                credential=self.azure_credential,
            )

            fields = [
                # campos definidos como key devem ser strings
                SimpleField(name="id", type="Edm.String", key=True, retrievable=True),
                # adiciona uma cópia do id sendo do tipo inteiro para odernação
                SimpleField(
                    name="id_num",
                    type="Edm.Int32",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                    sortable=True,
                ),
                SearchField(
                    name="conteudoVector",
                    type="Collection(Edm.Single)",
                    vector_search_dimensions=1536,
                    searchable=True,
                    vector_search_configuration="vectorConfig",
                ),
                SearchableField(
                    name="conteudo",
                    type="Edm.String",
                    retrievable=True,
                    analyzer="pt-Br.microsoft",
                    facetable=False,
                    searchable=True,
                ),
                SimpleField(
                    name="codigo_servico",
                    type="Edm.Int32",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="nome_servico",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="descricao_servico",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="palavras_chave",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="categoria",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="subcategoria",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="nome_sistema",
                    type="Edm.String",
                    filterable=True,
                    facetable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="link_sistema",
                    type="Edm.String",
                    facetable=False,
                    filterable=False,
                    retrievable=True,
                ),
                SimpleField(
                    name="publico_alvo",
                    type="Edm.String",
                    facetable=True,
                    filterable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="unidade_responsavel",
                    type="Edm.String",
                    facetable=True,
                    filterable=True,
                    retrievable=True,
                ),
                SimpleField(
                    name="etapas",
                    type="Edm.String",
                    retrievable=True,
                    facetable=False,
                    filterable=False,
                ),
                SimpleField(
                    name="requisitos",
                    type="Edm.String",
                    retrievable=True,
                    facetable=False,
                    filterable=False,
                ),
                SimpleField(
                    name="como_solicitar",
                    type="Edm.String",
                    retrievable=True,
                    facetable=False,
                    filterable=False,
                ),
            ]

            vector_search = VectorSearch(
                algorithm_configurations=[
                    HnswVectorSearchAlgorithmConfiguration(
                        name="vectorConfig", kind="hnsw"
                    )
                ]
            )

            index = SearchIndex(
                name=self.index_name, fields=fields, vector_search=vector_search
            )

            result = await index_client.create_or_update_index(index)

            logger.info(f" {result.name} created")
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error
        finally:
            if index_client:
                await index_client.close()

    @tracer.start_as_current_span("exclui_indice")
    async def exclui_indice(self):
        logger.info(f"Excluíndo o índice '{self.index_name}'!")

        # já sai se o indice não existe
        if not await self.verifica_existencia_indice():
            return

        index_client: SearchIndexClient = None

        try:
            index_client = SearchIndexClient(
                endpoint=configs.AZURE_SEARCH_SISTEMAS_URL,
                credential=self.azure_credential,
            )

            # Exclusão do índice
            await index_client.delete_index(self.index_name)
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error
        finally:
            if index_client:
                await index_client.close()

    @tracer.start_as_current_span("create_sections_servicos")
    async def create_sections_servicos(
        self, servicos: List[ServicoSegedam], documents, parcial: bool = False
    ):
        logger.info("Criando seções")

        embeddings_openai = self._get_embeddings(execution_id=uuid.uuid4())

        # se for atualização resgata o ultimo id para
        # incrementar o id de novos que não estejam indexados
        # no momento da atualização
        if parcial:
            ultimo_id = await self.obtem_ultimo_id()

        j = 1
        for i, servico in enumerate(servicos):
            conteudo = documents[i].page_content

            sec_id: int = i + 1

            if parcial:
                # quando for atualização busca o servico para obter seu id
                tmp = await self.buscar_servico_pelo_codigo(servico.cod)

                if tmp:
                    sec_id = int(tmp["id"])
                else:
                    # incrementa a quantidade para definir
                    # id de novo serviço que não conste no indice
                    ultimo_id = ultimo_id + j
                    sec_id = ultimo_id

                    j = j + 1

            yield {
                "id": f"{sec_id}",
                "id_num": sec_id,
                "conteudoVector": await embeddings_openai.create(
                    input=conteudo, model=self.modelo_embeddding
                ),
                "conteudo": conteudo,
                "codigo_servico": servico.cod,
                "nome_servico": servico.descr_nome,
                "descricao_servico": self.trata_none(servico.texto_o_que_e),
                "palavras_chave": self.trata_none(servico.texto_palavras_chave),
                "categoria": servico.descr_categoria,
                "subcategoria": servico.descr_subcategoria,
                "nome_sistema": self.trata_none(servico.nome_sistema),
                "link_sistema": self.trata_none(servico.link_sistema),
                "publico_alvo": self.trata_none(servico.texto_publico_alvo),
                "unidade_responsavel": self.trata_none(
                    servico.descr_unidade_responsavel
                ),
                "etapas": self.trata_none(servico.texto_etapas),
                "requisitos": self.trata_none(servico.texto_requisitos),
                "como_solicitar": self.trata_none(servico.texto_como_solicitar),
            }

    @tracer.start_as_current_span("popular_indice")
    async def popular_indice(self, sections):
        logger.info("Populando o indice")

        search_client: SearchClient = None

        try:
            search_client = SearchClient(
                endpoint=configs.AZURE_SEARCH_SISTEMAS_URL,
                index_name=self.index_name,
                credential=self.azure_credential,
            )

            i = 0
            batch = []

            async for s in sections:
                batch.append(s)
                i += 1

                if i % 100 == 0:
                    results = await search_client.upload_documents(documents=batch)
                    succeeded = sum([1 for r in results if r.succeeded])

                    logger.info(
                        f"\tIndexed {len(results)} sections, {succeeded} succeeded"
                    )

                    batch = []
            if batch:
                results = await search_client.upload_documents(documents=batch)
                succeeded = sum([1 for r in results if r.succeeded])

                logger.info(f"\tIndexed {len(results)} sections, {succeeded} succeeded")
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error
        finally:
            if search_client:
                await search_client.close()

    @tracer.start_as_current_span("buscar_servico_pelo_codigo")
    async def buscar_servico_pelo_codigo(self, codigo):
        search_client: SearchClient = None

        try:
            # Cria uma instância do cliente de pesquisa
            search_client: SearchClient = self._get_search_client()

            filtro = f"codigo_servico eq {codigo}"

            res = await search_client.search("", filter=filtro, top=1)

            resultado = [serv async for serv in res]

            return resultado[0] if len(resultado) > 0 else None
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error
        finally:
            if search_client:
                await search_client.close()

    @tracer.start_as_current_span("obtem_ultimo_id")
    async def obtem_ultimo_id(self):
        search_client: SearchClient = None

        try:
            # Cria uma instância do cliente de pesquisa
            search_client: SearchClient = self._get_search_client()

            res = await search_client.search("", order_by="id_num desc", top=1)

            resultado = [serv async for serv in res]

            return int(resultado[0]["id"]) if len(resultado) > 0 else 0
        except Exception as error:
            logger.error(error)
            traceback.print_exc()

            raise error
        finally:
            if search_client:
                await search_client.close()
