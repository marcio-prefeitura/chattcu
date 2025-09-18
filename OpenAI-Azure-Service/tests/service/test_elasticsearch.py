import json
import unittest
from unittest.mock import AsyncMock, patch

from src.infrastructure.elasticsearch.elasticsearch import ElasticSearch


class TestElasticSearch(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.elasticsearch = ElasticSearch(
            elasticsearch_login="test_login",
            elasticsearch_password="test_password",
            elasticsearch_url="http://localhost:9200",
            elasticsearch_indice="test_index",
        )

    @patch("aiohttp.ClientSession.get")
    async def test_get_indices(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=json.dumps({"test": "data"}))
        mock_get.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.get_indices()
        self.assertEqual(result, {"test": "data"})

    @patch("aiohttp.ClientSession.post")
    async def test_elasticsearch_query_post(self, mock_post):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=json.dumps({"test": "data"}))
        mock_post.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.elasticsearch_query(
            "test_query", '{"query": "test"}', "post"
        )
        self.assertEqual(result, {"test": "data"})

    @patch("aiohttp.ClientSession.get")
    async def test_elasticsearch_query_get(self, mock_post):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=json.dumps({"test": "data"}))
        mock_post.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.elasticsearch_query(
            "test_query", '{"query": "test"}', "get"
        )
        self.assertEqual(result, {"test": "data"})

    @patch("aiohttp.ClientSession.get")
    async def test_scroll(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=json.dumps({"test": "data"}))
        mock_get.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.scroll("test_scroll_id")
        self.assertEqual(result, {"test": "data"})

    @patch("aiohttp.ClientSession.post")
    async def test_scroll_post(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=json.dumps({"test": "data"}))
        mock_get.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.scroll("test_scroll_id", "post")
        self.assertEqual(result, {"test": "data"})

    @patch("aiohttp.ClientSession.put")
    async def test_create_indice(self, mock_put):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_put.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.create_indice(
            "test_index", '{"mappings": {}}'
        )
        self.assertTrue(result)

    @patch("aiohttp.ClientSession.delete")
    async def test_delete_indice(self, mock_delete):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_delete.return_value.__aenter__.return_value = mock_response

        await self.elasticsearch.delete_indice("test_index")

    @patch("aiohttp.ClientSession.post")
    async def test_populate_indice(self, mock_post):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(
            return_value=json.dumps(
                {
                    "errors": False,
                    "items": [{"index": {"status": 200, "result": "created"}}],
                }
            )
        )
        mock_post.return_value.__aenter__.return_value = mock_response

        registros = [{"SEQ_PAGINACAO": 1, "data": "test"}]
        await self.elasticsearch.populate_indice("test_index", registros)

    @patch("aiohttp.ClientSession.post")
    async def test_insert_ou_update_campo(self, mock_post):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=json.dumps({"result": "updated"}))
        mock_post.return_value.__aenter__.return_value = mock_response

        result = await self.elasticsearch.insert_ou_update_campo(
            "test_id", {"field": "value"}
        )
        self.assertEqual(result, {"result": "updated"})

    @patch("aiohttp.ClientSession.get")
    async def test_get_indices_unauthorized(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status = 401
        mock_get.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.get_indices()
        self.assertIn("UNAUTHORIZED", str(context.exception))

    @patch("aiohttp.ClientSession.post")
    async def test_elasticsearch_query_post_unauthorized(self, mock_post):
        mock_response = AsyncMock()
        mock_response.status = 401
        mock_post.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.elasticsearch_query(
                "test_query", '{"query": "test"}', "post"
            )
        self.assertIn("UNAUTHORIZED", str(context.exception))

    @patch("aiohttp.ClientSession.get")
    async def test_scroll_unauthorized(self, mock_get):
        mock_response = AsyncMock()
        mock_response.status = 401
        mock_get.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.scroll("test_scroll_id")
        self.assertIn("UNAUTHORIZED", str(context.exception))

    @patch("aiohttp.ClientSession.put")
    async def test_create_indice_error_403(self, mock_put):
        mock_response = AsyncMock()
        mock_response.status = 403
        mock_put.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.create_indice("test_index", '{"mappings": {}}')
        self.assertIn("UNAUTHORIZED", str(context.exception))

    @patch("aiohttp.ClientSession.put")
    async def test_create_indice_error_404(self, mock_put):
        mock_response = AsyncMock()
        mock_response.status = 404
        mock_put.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.create_indice("test_index", '{"mappings": {}}')
        self.assertIn(
            "Erro ao criar o indice! RESPONSE STATUS CODE:404", str(context.exception)
        )

    @patch("aiohttp.ClientSession.delete")
    async def test_delete_indice_error_403(self, mock_delete):
        mock_response = AsyncMock()
        mock_response.status = 403
        mock_delete.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.delete_indice("test_index")
        self.assertIn("UNAUTHORIZED", str(context.exception))

    @patch("aiohttp.ClientSession.delete")
    async def test_delete_indice_error_404(self, mock_delete):
        mock_response = AsyncMock()
        mock_response.status = 404
        mock_delete.return_value.__aenter__.return_value = mock_response

        with self.assertRaises(Exception) as context:
            await self.elasticsearch.delete_indice("test_index")
        self.assertIn(
            "Erro ao deletar o indice! RESPONSE STATUS CODE:404", str(context.exception)
        )

    @patch("aiohttp.ClientSession.post")
    async def test_populate_indice_error(self, mock_post):
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.text = AsyncMock(
            return_value=json.dumps(
                {
                    "errors": True,
                    "items": [
                        {
                            "index": {
                                "status": 400,
                                "error": {"caused_by": {"reason": "test error"}},
                            }
                        }
                    ],
                }
            )
        )
        mock_post.return_value.__aenter__.return_value = mock_response

        registros = [{"SEQ_PAGINACAO": 1, "data": "test"}]
        with self.assertRaises(Exception) as context:
            await self.elasticsearch.populate_indice("test_index", registros)
        self.assertIn("Query com erro", str(context.exception))


if __name__ == "__main__":
    unittest.main()
