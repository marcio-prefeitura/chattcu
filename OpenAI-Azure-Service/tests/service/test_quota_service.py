import pytest
from aiohttp import ClientResponseError
from aioresponses import aioresponses

from src.conf.env import configs
from src.service.quota_service import get_quota, update_quota


class TestQuotaService:

    @pytest.mark.asyncio
    async def test_get_quota_success(self):
        user_account = "user123"
        quota_url = configs.GET_QUOTA_URL
        quota_query_key = configs.QUOTA_QUERY_KEY

        expected_response = {"quota": 100}

        with aioresponses() as m:
            m.get(
                f"{quota_url}/{user_account}",
                payload=expected_response,
                status=200,
                headers={"x-functions-key": quota_query_key},
            )

            result = await get_quota(user_account)

        assert result == expected_response

    @pytest.mark.asyncio
    async def test_get_quota_failure(self):
        user_account = "user123"
        quota_url = configs.GET_QUOTA_URL
        quota_query_key = configs.QUOTA_QUERY_KEY

        with aioresponses() as m:
            m.get(
                f"{quota_url}/{user_account}",
                status=500,
                headers={"x-functions-key": quota_query_key},
            )

            try:
                result = await get_quota(user_account)
            except ClientResponseError as e:
                assert e.status == 500
                assert e.message == "Internal Server Error"
            else:
                pytest.fail("ClientResponseError not raised")

    @pytest.mark.asyncio
    async def test_update_quota_success(self):
        user_account = "user123"
        chatgpt_input = "Qual é a sua cota?"
        resposta = "A cota é de 100."
        model = "gpt-4"
        update_url = configs.UPDATE_QUOTA_URL
        quota_query_key = configs.QUOTA_QUERY_KEY

        expected_response = {"status": "success"}

        with aioresponses() as m:
            m.post(
                update_url,
                payload=expected_response,
                status=200,
                headers={
                    "x-functions-key": quota_query_key,
                    "Content-Type": "application/json",
                },
            )

            result = await update_quota(user_account, chatgpt_input, resposta, model)

        assert result == expected_response

    @pytest.mark.asyncio
    async def test_update_quota_failure(self):
        user_account = "user123"
        chatgpt_input = "Qual é a sua cota?"
        resposta = "A cota é de 100."
        model = "gpt-4"
        update_url = configs.UPDATE_QUOTA_URL
        quota_query_key = configs.QUOTA_QUERY_KEY

        with aioresponses() as m:
            m.post(
                update_url,
                status=500,
                headers={
                    "x-functions-key": quota_query_key,
                    "Content-Type": "application/json",
                },
            )

            try:
                result = await update_quota(
                    user_account, chatgpt_input, resposta, model
                )
            except ClientResponseError as e:
                assert e.status == 500
                assert e.message == "Internal Server Error"
            else:
                pytest.fail("ClientResponseError not raised")
