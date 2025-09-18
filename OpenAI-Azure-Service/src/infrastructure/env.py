## PARA AUTORIZAÇÃO
import os
from typing import Dict, List

import pytz

from src.domain.llm.util.util import get_ministros_as_string

FUSO_HORARIO = pytz.timezone("America/Sao_Paulo")

RECURSO_COMPUTACIONAL = [74, 400]
RECURSO_COMPUTACIONAL_AUTHJWT = 300

VERBOSE = os.getenv("PROFILE") in ["local", "desenvol"]

# horas
VALIDADE_REFRESH_TOKEN = 12

HEADERS = {"Content-Type": "application/json"}

PADDING = "=="

## PARA LLM/RAG
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 250

INDICE_ELASTIC = "openai-azure-log"
INDEX_NAME_DOCUMENTOS = "documentos_upload"
INDEX_NAME_SISTEMA_CASA = "sistema_casa-embedding-3-large"
INDEX_NAME_JURISPRUDENCIA = "jurisprudencia_selecionada"
INDEX_NAME_NORMAS = "normas"

DB_NAME_DOCUMENTOS = "documentos"
COLLECTION_NAME_DOCUMENTOS = "arquivos"

DB_NAME_COMPARTILHAMENTO = "share_data"
COLLECTION_NAME_COMPARTILHAMENTOS = "compartilhamentos"

DB_NAME_AGENTS = "agents_data"
COLLECTION_NAME_AGENTS = "agents"

DB_NAME_STORE = "store_data"
COLLECTION_NAME_ESPECIALISTA = "especialista"
COLLECTION_NAME_CATEGORIA = "categoria"


MODELO_EMBEDDING = "Text-Embedding-Ada"
MODELO_EMBEDDING_002 = "Text-Embedding-Ada-002"

QTD_MAX_CARACTERES_TITULO = 100

## PARA UPLOADS
PERMITIDOS = ["pdf", "docx", "xlsx", "csv", "mp3", "mp4"]
MIME_TYPES_PERMITIDOS = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "audio/mpeg",
    "video/mp4",
]

EXT_ALVOS_GABI = ["mp3", "mp4"]

# 50 MB
TAM_MAXIMO_ARQUIVO: int = 50 * 1024 * 1024
CONTAINER_NAME = "container-chattcu"
NOME_PASTA_PADRAO = "Arquivos gerais"

# https://learn.microsoft.com/pt-br/azure/ai-services/openai/concepts/models
# https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
MODELOS = {
    "GPT-35-Turbo-4k": {
        "model_type": "LLM",
        "deployment_name": "GPT-35-Turbo-4k",
        "version": "2024-02-15-preview",
        "max_tokens": 4096,
        "max_words": 1000,
        "max_tokens_out": 4096,
        "icon": "icon-chat-gpt",
        "description": "",
        "tiktoken_modelo": "gpt-3.5-turbo-0613",
        "tiktoken_encodding": "cl100k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GPT-35-Turbo-16k": {
        "model_type": "LLM",
        "deployment_name": "GPT-35-Turbo-16k",
        "version": "2024-02-15-preview",
        "max_tokens": 16384,
        "max_words": 8000,
        "max_tokens_out": 4096,
        "icon": "icon-chat-gpt",
        "description": "",
        "tiktoken_modelo": "gpt-3.5-turbo-16k-0613",
        "tiktoken_encodding": "cl100k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GPT-4-8k": {
        "model_type": "LLM",
        "deployment_name": "GPT-4-8K",
        "version": "2024-02-15-preview",
        "max_tokens": 8192,
        "max_words": 3000,
        "max_tokens_out": 4096,
        "icon": "icon-chat-gpt",
        "description": "",
        "tiktoken_modelo": "gpt-4-0613",
        "tiktoken_encodding": "cl100k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GPT-4-32K": {
        "model_type": "LLM",
        "deployment_name": "GPT-4-32K",
        "version": "2024-02-15-preview",
        "max_tokens": 32768,
        "max_words": 8000,
        "max_tokens_out": 4096,
        "icon": "icon-chat-gpt",
        "description": "",
        "tiktoken_modelo": "gpt-4-32k-0613",
        "tiktoken_encodding": "cl100k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GPT-4-Turbo": {
        "model_type": "LLM",
        "deployment_name": "GPT-4-Turbo",
        "version": "2024-02-15-preview",
        "max_words": 60000,
        "max_tokens": 128000,
        "max_tokens_out": 4096,
        "icon": "icon-chat-gpt",
        "description": "Modelo mais antigo",
        "tiktoken_modelo": "gpt-4-turbo-0125-preview",
        "tiktoken_encodding": "cl100k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": True,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GPT-4o": {
        "model_type": "LLM",
        "deployment_name": "gpt-4o",
        # "version": "2024-08-06", comentado alteração do Selmison visto dar 404
        "version": "2024-02-15-preview",
        "max_tokens": 128000,
        "max_words": 60000,
        "max_tokens_out": 16384,
        "icon": "icon-chat-gpt",
        "description": "Excelente para a maioria das tarefas",
        "tiktoken_modelo": "gpt-4o-2024-08-06",
        "tiktoken_encodding": "o200k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": True,
        "is_beta": False,
        "inputs": {"text": True, "image": True, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GPT-4o-mini": {
        "model_type": "LLM",
        "deployment_name": "gpt-4o-mini",
        # "version": "2024-08-06", comentado alteração do Selmison visto dar 404
        "version": "2024-02-15-preview",
        "max_tokens": 128000,
        "max_words": 60000,
        "max_tokens_out": 16384,
        "icon": "icon-chat-gpt",
        "description": "Mais rápido para as tarefas do dia a dia",
        "tiktoken_modelo": "gpt-4o-mini-2024-07-18",
        "tiktoken_encodding": "o200k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": True,
        "disponivel": True,
        "is_beta": False,
        "inputs": {"text": True, "image": True, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "o1-preview": {
        "model_type": "LLM",
        "deployment_name": "o1-preview",
        # "version": "2024-08-06", comentado alteração do Selmison visto dar 404
        "version": "2024-08-01-preview",
        "max_tokens": 128000,
        "max_words": 60000,
        "max_tokens_out": 32768,
        "icon": "icon-chat-gpt",
        "description": "Usa reflexão avançada",
        "tiktoken_modelo": "gpt-4o-2024-08-06",
        "tiktoken_encodding": "o200k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": False,
        "disponivel": True,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "o1-mini": {
        "model_type": "LLM",
        "deployment_name": "o1-mini",
        # "version": "2024-08-06", comentado alteração do Selmison visto dar 404
        "version": "2024-08-01-preview",
        "max_tokens": 128000,
        "max_words": 60000,
        "max_tokens_out": 65536,
        "icon": "icon-chat-gpt",
        "description": "Mais rápido ao refletir",
        "tiktoken_modelo": "gpt-4o-mini-2024-07-18",
        "tiktoken_encodding": "o200k_base",
        "fornecedora": "AZURE",
        "regiao": None,
        "stream_support": False,
        "disponivel": True,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "GEMINI-1.5-Pro": {
        "model_type": "LLM",
        "deployment_name": "gemini-1.5-pro",
        "version": "",
        "max_tokens": 0,
        "max_words": 0,
        "max_tokens_out": 0,
        "icon": "",
        "description": "",
        "tiktoken_modelo": "",
        "tiktoken_encodding": "",
        "fornecedora": "GOOGLE",
        "regiao": None,
        "stream_support": True,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": True, "image": True, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "Claude 3.5 Sonnet": {
        "model_type": "LLM",
        "deployment_name": "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "version": "",
        "max_tokens": 200000,
        "max_words": 95000,
        # "max_tokens_out": 8192 # doc anthropic
        "max_tokens_out": 4096,
        "icon": "icon-claude",
        "description": "Maior janela de contexto",
        "tiktoken_modelo": "gpt-4o-2024-08-06",
        "tiktoken_encodding": "o200k_base",
        "fornecedora": "AWS",
        "regiao": "us-east-1",
        "stream_support": True,
        "disponivel": True,
        "is_beta": True,
        "inputs": {"text": True, "image": True, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "WHISPER": {
        # Automatic Speech Recognition
        "model_type": "ASR",
        "deployment_name": "whisper",
        "version": "2024-05-01-preview",
        "max_tokens": 0,
        "max_words": 0,
        "max_tokens_out": 0,
        "icon": "",
        "description": "",
        "tiktoken_modelo": "",
        "tiktoken_encodding": "",
        "fornecedora": "AZURE",
        "stream_support": False,
        "regiao": None,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": False, "image": False, "audio": True, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
    "Gemini-2.0-Flash-exp": {
        "model_type": "LLM",
        "deployment_name": "gemini-2.0-flash-exp",
        "version": "2024-02-15-preview",
        "max_tokens": 128000,
        "max_words": 60000,
        "max_tokens_out": 16384,
        "icon": "",
        "description": "",
        "tiktoken_modelo": "gpt-4o-2024-08-06",
        "tiktoken_encodding": "o200k_base",
        "fornecedora": "GOOGLE",
        "regiao": None,
        "disponivel": False,
        "is_beta": False,
        "inputs": {"text": True, "image": False, "audio": False, "video": False},
        "outputs": {"text": True, "image": False, "audio": False, "video": False},
    },
}

MODELO_PADRAO = "GPT-4o"
MODELO_PADRAO_FILTROS = "GPT-4o"

#### EXPERIMENTO COM O GEMINI #####
GEMINI_API_KEY = ""

#### GABI ####
FUNCTION_SCHEMA_PARTICIPANTS = {
    "name": "extract_meeting_participants",
    "parameters": {
        "type": "object",
        "properties": {
            "participants": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The name of the participant",
                        },
                        "position": {
                            "type": "string",
                            "description": "The position of the participant",
                        },
                    },
                    # Campos obrigatórios do objeto participante
                    "required": [
                        "name",
                        "position",
                    ],
                },
            }
        },
    },
    # Campo obrigatório no nível superior (a lista de participantes)
    "required": ["participants"],
}


GABI_PROMPTS_FUNCTIONS: Dict[str, List[Dict[str, str]]] = {
    "geral": [
        {
            "prompt": """
                Este texto é uma {{Transcrição}} de um áudio. Após analisá-lo, sua saída deve usar o seguinte modelo:
                ### Resumo
                (contendo um resumo detalhado do assunto tratado no texto, necessariamente em dois parágrafos)
                ### Destaques
                - [Emoji] Bulletpoint

                Sua tarefa é resumir o texto que forneci em até sete pontos concisos, 
                começando com um destaque curto. Escolha um emoji apropriado para cada ponto. Use o texto abaixo.

                {{Transcrição}}: '
            """,
            "function": "",
            "cascade": False,
        }
    ],
    "reuniao": [
        {
            "prompt": """
                Este texto é uma transcrição de um áudio de uma reunião. 
                Após analisá-lo, sua saída deve ser um JSON válido e seguir exatamente o seguinte formato:

                [
                {"name": "Nome do participante 1", "position": "Posição do participante 1"},
                {"name": "Nome do participante 2", "position": "Posição do participante 2"},
                ...
                ]

                A saída deve ser um JSON válido e não deve conter texto adicional.
                Apenas retorne o JSON. Use o texto abaixo para análise:

                {{Transcrição}}: '
            """,
            "function": "extract_participants",
            "cascade": False,
        },
        {
            "prompt": """
                Essa é uma {{Transcrição}} de uma reunião. Após o processamento, a sua saída deve seguir o seguinte modelo:
                #### Objetivos da reunião 
                - Aqui você deve listar os objetivos da reunião, em dois parágrafos.
                #### Resumo 
                - Aqui você deve resumir o conteúdo da reunião, em três parágrafos completos e verbosos.


                {{Transcrição}}: '
            """,
            "function": "",
            "cascade": False,
        },
        {
            "prompt": """
                Essa é uma {{Transcrição}} de uma reunião. Após o processamento, a sua saída deve seguir o seguinte modelo:
                #### Principais destaques, 
                contendo de forma resumida em até sete pontos concisos os principais destaques da reunião, 
                com um emoji apropriado para cada ponto, da seguinte maneira:
                - [Emoji] Tópico)
                #### Conclusões 
                - Aqui você deve listar as conclusões da reunião, em três parágrafos completos e verbosos.

                Use o texto abaixo.

                {{Transcrição}}: '
            """,
            "function": "",
            "cascade": False,
        },
    ],
}


# Dicionários
DICIONARIO_TCU = """
"Na leitura, pode ser que você encontre nomes dos ministros do Tribunal de Contas da União. 
Para evitar erros, verifique o ortografia dos seguintes nomes:
"""

DICIONARIO_MINISTROS = DICIONARIO_TCU + get_ministros_as_string()

MINISTROS_TCU = """
Ministro Walton, Ministro Benjamin, Ministro Augusto, Ministro André, Ministro Weder, Ministro Vital, Ministro Aroldo, 
Ministro José, Ministro Marcos, Zymler, Sherman, Carvalho, Oliveira, Rêgo, Cedraz, Monteiro, Bemquerer
"""
