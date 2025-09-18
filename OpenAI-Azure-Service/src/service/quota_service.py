import json
import logging
from logging import config

import aiohttp
from opentelemetry import trace

from src.conf.env import configs

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("get_quota")
async def get_quota(user_account):
    quota_url = configs.GET_QUOTA_URL
    quota_query_key = configs.QUOTA_QUERY_KEY

    headers = {"x-functions-key": quota_query_key}

    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.get(
            f"{quota_url}/{user_account}", headers=headers, timeout=timeout
        ) as response:

            if response.status == 200:
                logger.info("Request was successful.")
                response_text = await response.text()
                logger.info(f"Response data: {response_text}")
            else:
                logger.info("Request failed.")
                logger.info(f"Status code: {response.status}")
                response_text = await response.text()
                logger.info(f"Response data: {response_text}")

            return await response.json()


@tracer.start_as_current_span("update_quota")
async def update_quota(user_account, chatgpt_input, resposta, model):
    quota_url = configs.UPDATE_QUOTA_URL
    quota_query_key = configs.QUOTA_QUERY_KEY

    headers = {"x-functions-key": quota_query_key, "Content-Type": "application/json"}

    resposta = json.dumps({"model": model, "resposta": resposta}, ensure_ascii=False)

    json_payload = {
        "SubscriptionKey": user_account,
        "prompt": chatgpt_input,
        "responseBody": resposta,
    }
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.post(
            quota_url, headers=headers, json=json_payload
        ) as response:

            if response.status == 200:
                logger.info("Quota Update Request was successful.")

                response_text = await response.text()

                logger.info(f"Response data: {response_text}")
                return {"status": "success"}
            else:
                logger.error("Quota Update Request failed.")
                logger.error(f"Status code: {response.status}")

                response_text = await response.text()

                logger.error(f"Response data: {response_text}")
                return {"status": "error"}
