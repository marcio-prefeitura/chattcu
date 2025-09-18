import json
import os
import pprint

from anyio import Path, run
from azure.identity import (AuthenticationRecord, DefaultAzureCredential,
                            DeviceCodeCredential, TokenCachePersistenceOptions)
from azure.keyvault.secrets import SecretClient
from httpx import AsyncClient, Headers

HOME = os.environ['HOME']

TENANT_ID = os.environ['AZURE_TENANT_ID']
CHATTCU_HOMOL_AZURE_CLIENT_ID = ""

APP_ID = os.environ['APP_ID']
TEAMSAPP_ENV_NAME = os.environ['TEAMSAPP_ENV_NAME']

KEY_VAULT_NAME = os.environ['KEY_VAULT_NAME']

IDENTITY_SERVICE_PATH = f'{HOME}/.IdentityService'
auth_record_file_path = f'{IDENTITY_SERVICE_PATH}/msal_auth_record.json'
msal_cache_file_path = f'{IDENTITY_SERVICE_PATH}/msal.cache.nocae'


def get_secrets():
    KVUri = f'https://{KEY_VAULT_NAME}.vault.azure.net'
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=KVUri, credential=credential)

    global CHATTCU_HOMOL_AZURE_CLIENT_ID
    CHATTCU_HOMOL_AZURE_CLIENT_ID = str(
        client.get_secret('CHATTCU-HOMOL-AZURE-CLIENT-ID').value
    )

    os.makedirs(IDENTITY_SERVICE_PATH, exist_ok=True)

    auth_record = json.loads(client.get_secret('auth-record').value or '')
    with open(auth_record_file_path, 'w', encoding='utf-8') as f:
        json.dump(auth_record, f, ensure_ascii=False, indent=2)

    msal_cache = json.loads(client.get_secret('msal-cache').value or '')
    with open(msal_cache_file_path, 'w', encoding='utf-8') as f:
        json.dump(msal_cache, f, ensure_ascii=False, indent=2)


async def update_teamsapp():
    get_secrets()
    graph_scope = 'AppCatalog.ReadWrite.All'
    # https://github.com/Azure/azure-sdk-for-python/blob/d2f6a0ef948def0bfd1614b5059cf14c2a7df080/sdk/identity/azure-identity/azure/identity/_persistent_cache.py#L99
    auth_record = await get_auth_record(auth_record_file_path, [graph_scope])
    device_code_cred = DeviceCodeCredential(
        CHATTCU_HOMOL_AZURE_CLIENT_ID,
        tenant_id=TENANT_ID,
        cache_persistence_options=TokenCachePersistenceOptions(
            allow_unencrypted_storage=True
        ),
        authentication_record=auth_record,
    )
    access_token = device_code_cred.get_token(graph_scope)

    url = f'https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/{APP_ID}/appDefinitions'
    headers = Headers(
        {
            'Authorization': f'Bearer {access_token.token}',
            'Content-Type': 'application/zip',
        }
    )
    async with AsyncClient(headers=headers) as client:
        path = Path(f'./appPackage/build/appPackage.{TEAMSAPP_ENV_NAME}.zip')
        content = await path.read_bytes()
        data = await client.post(url, content=content, timeout=300)
        pprint.pprint(data.text, indent=2, compact=True)


async def get_auth_record(file_path, scopes):
    # https://github.com/Azure/azure-sdk-for-python/blob/azure-identity_1.14.0/sdk/identity/azure-identity/TOKEN_CACHING.md#persist-user-authentication-record
    path = Path(file_path)

    if not await path.is_file():
        device_code_cred = DeviceCodeCredential(
            CHATTCU_HOMOL_AZURE_CLIENT_ID,
            tenant_id=TENANT_ID,
            # https://github.com/Azure/azure-sdk-for-python/blob/azure-identity_1.14.0/sdk/identity/azure-identity/TOKEN_CACHING.md#code-sample
            cache_persistence_options=TokenCachePersistenceOptions(
                allow_unencrypted_storage=True
            ),
        )
        auth_record = device_code_cred.authenticate(scopes=scopes)
        await path.write_text(auth_record.serialize())
    else:
        auth_record = AuthenticationRecord.deserialize(await path.read_text())
    return auth_record


run(update_teamsapp)
# run(get_secrets)
