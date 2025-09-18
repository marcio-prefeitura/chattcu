import io
import logging
from datetime import datetime
from typing import Type

from starlette.responses import StreamingResponse

from src.domain.chat import Chat, Credencial
from src.domain.documento import Documento
from src.domain.enum.type_channel_redis_enum import TypeChannelRedisEnum
from src.domain.feedback import Feedback
from src.domain.mensagem import Mensagem
from src.domain.papel_enum import PapelEnum
from src.domain.reacao_enum import ReacaoEnum
from src.domain.schemas import (
    ChatGptInput,
    ChatLLMResponse,
    ChatOut,
    CompartilhamentoIn,
    CompartilhamentoOut,
    DestinatarioOut,
    FeedbackOut,
    ItemSistema,
    MessageOut,
    ServicoSegedam,
)
from src.domain.trecho import Trecho
from src.domain.unidade import SituacaoUnidade, Unidade
from src.messaging.mensagem_chatstop_redis import MensagemChatStopRedis

logger = logging.getLogger(__name__)


class AsyncIterator:
    def __init__(self, seq):
        self.iter = iter(seq)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.iter)
        except StopIteration:
            raise StopAsyncIteration


class MockObjects:
    mock_servico_segedam = ServicoSegedam(
        cod=1,
        descr_nome="nome_test",
        texto_publico_alvo="texto_publico_alvo_test",
        texto_requisitos="texto_requisitos_test",
        texto_como_solicitar="texto_como_solicitar_test",
        texto_palavras_chave="texto_palavras_chave_test",
        texto_etapas="texto_etapas_test",
        texto_o_que_e="texto_o_que_e_test",
        descr_categoria="descr_categoria_test",
        descr_subcategoria="descr_subcategoria_test",
        descr_unidade_responsavel="descr_unidade_responsavel_test",
        link_sistema="link_sistema_test",
        nome_sistema="nome_sistema_test",
    )

    mock_documento = Documento(
        codigo=1,
        numero_ordem_peca=123456,
        tipo_documento="tipo_documento_teste",
        assunto="assunto_teste",
        data_hora_juntada="2024-05-05 00:00",
        quantidade_paginas=1,
        codigo_confidencialidade=123456,
        confidencialidade="confidencialidade",
        link_documento="link_documento",
    )

    mock_peca = {
        "codigo": "1234567891011",
        "numeroOrdemPeca": "1234567891011",
        "tipoDocumento": "tipo_teste",
        "assunto": "assunto_teste",
        "dataHora": "2024-05-05 00:00",
        "quantidadePaginas": 1,
        "codigoConfidencialidade": 12345,
        "confidencialidade": "confidencialidade_teste",
        "codigoDocumentoGestao": "codigoDocumentoGestao_teste",
    }
    mock_item = (
        {
            "_id": "0123456789abcdef01234567",
            "nome": "teste",
            "usuario": "teste",
            "st_removido": False,
            "id_pasta_pai": -1,
            "data_criacao": "",
            "st_arquivo": True,
            "tamanho": "1024",
            "tipo_midia": "teste",
            "nome_blob": "teste",
            "status": "pronto",
        },
    )

    mock_raw_token = {
        "tus": "SISTEMA",
        "cod": "12345",
        "nus": "12345",
        "nuls": "12345",
        "clot": "12345",
        "sloo": "12345",
        "roles": "12345",
        "luls": "12345",
        "slot": "12345",
    }

    mock_feedback_out = FeedbackOut(
        conteudo="conteudo_teste",
        nao_ajudou=False,
        inveridico=False,
        ofensivo=False,
        reacao="_teste",
    )

    mock_message_out = MessageOut(
        feedback=mock_feedback_out,
        codigo="12345",
        papel="USER",
        conteudo="conteudo_teste",
        favoritado=False,
        arquivos_busca="arquivos_busca_teste",
        arquivos_selecionados=[],
        arquivos_selecionados_prontos=[],
        trechos=[],
        especialista_utilizado=None,
    )
    mock_chat_out = ChatOut(
        id="1",
        usuario="teste",
        titulo="teste_titulo",
        data_ultima_iteracao="2024-05-05 00:00",
        fixado=True,
        arquivado=False,
        mensagens=[],
    )

    mock_compartilhamento_in = CompartilhamentoIn(
        id_chat="122",
    )

    mock_compartilhamento_out = CompartilhamentoOut(
        id="122",
        id_chat="122",
        chat=mock_chat_out,
        usuario="usuario_teste",
        st_removido=False,
        data_compartilhamento="2024-05-05 00:00",
        destinatarios=[DestinatarioOut(codigo="P_1", nome="teste123")],
        arquivos=["Teste arquivo"],
    )
    mock_unidade = Unidade(
        id="123",
        sigla="sigla_teste",
        denominacao="denominacao_teste",
        situacaoUnidade=SituacaoUnidade(id=1, descricao="desc_teste"),
        subunidades=[],
    )

    mock_item_sistema = ItemSistema(nome="Nome Teste", usuario="Ususario Teste")

    mock_stream = StreamingResponse(
        io.BytesIO(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment;filename=Teste.zip"},
    )

    mock_chat_gpt_input = ChatGptInput(
        # temp_chat_id="id_teste",
        login="teste",
        stream=False,
        prompt_usuario="teste prompt do usuario",
        arquivos_selecionados=[],
        arquivos_selecionados_prontos=[],
        # historico_mensagens=[],
        temperature=0,
        top_p=0.95,
        top_documentos=5,
        # rag=None,
        # id_jurisprudencia=None,
    )

    mock_chat_new_gpt_input = ChatGptInput(
        # temp_chat_id="",
        chat_id="",
        login="teste",
        stream=True,
        prompt_usuario="teste prompt do usuario",
        arquivos_selecionados=[],
        arquivos_selecionados_prontos=[],
        # historico_mensagens=[],
        temperature=0,
        top_p=0.95,
        top_documentos=5,
        # rag=None,
        # id_jurisprudencia=None,
    )

    mock_chat_llm_response = ChatLLMResponse(
        # temp_chat_id="id_teste",
        chat_id="id_teste",
        chat_titulo="teste",
        codigo_prompt="codigo_teste",
        response="response_teste",
        codigo_response="codigo_response_teste",
        trechos=[],
        arquivos_busca="",
    )
    mock_feedback = Feedback(
        cod_mensagem="cod_mensagem",
        conteudo="conteudo_teste",
        reacao=ReacaoEnum.LIKED,
        ofensivo=False,
        inveridico=False,
        nao_ajudou=False,
    )
    mock_trecho = Trecho(
        id_arquivo_mongo=None,
        nome_arquivo_mongo=None,
        pagina_arquivo=None,
        parametro_tamanho_trecho=None,
        search_score=None,
        conteudo="conteudo_teste token_test Teste",
        id_registro="Arquivo Teste",
        link_sistema=None,
    )

    mock_mensagem = Mensagem(
        chat_id="chat_id_teste",
        codigo="teste_codigo",
        papel=PapelEnum.USER,
        conteudo="conteudo_teste",
        data_envio=datetime.now(),
        favoritado=False,
        feedback=mock_feedback,
        parametro_tipo_busca=None,
        parametro_quantidade_trechos_relevantes_busca=None,
        parametro_nome_indice_busca=None,
        parametro_modelo_llm=None,
        parametro_versao_modelo_llm=None,
        arquivos_busca="Jurisprudência Selecionada",
        arquivos_selecionados=None,
        arquivos_selecionados_prontos=None,
        trechos=[mock_trecho],
        especialista_utilizado=None,
    )

    mock_chat = Chat(
        id="1",
        usuario="Usuario Teste",
        titulo="Titulo Teste",
        data_criacao=datetime.now(),
        data_ultima_iteracao=datetime.now(),
        fixado=False,
        apagado=False,
        mensagens=[mock_mensagem],
        credencial=Credencial(aplicacao_origem="teste", usuario="teste"),
    )

    mock_redis_message = MensagemChatStopRedis(
        channel_subscricao=TypeChannelRedisEnum.CHAT_STOP_CHANNEL.value,
        correlacao_chamada_id="correlacao_chamada_id_teste",
        usuario="usuario_teste",
        origem="CHATTCU",
        data_hora=datetime.now(),
    )

    base64_pdf = "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QUFBK0FyaWFsTVQKL0ZsYWdzIDQKL0FzY2VudCA5MDUuMjczNDQKL0Rlc2NlbnQgLTIxMS45MTQwNgovU3RlbVYgNDUuODk4NDM4Ci9DYXBIZWlnaHQgNzE1LjgyMDMxCi9JdGFsaWNBbmdsZSAwCi9Gb250QkJveCBbLTY2NC41NTA3OCAtMzI0LjcwNzAzIDIwMDAgMTAwNS44NTkzOF0KL0ZvbnRGaWxlMiA4IDAgUj4+CmVuZG9iagoxMCAwIG9iago8PC9UeXBlIC9Gb250Ci9Gb250RGVzY3JpcHRvciA5IDAgUgovQmFzZUZvbnQgL0FBQUFBQStBcmlhbE1UCi9TdWJ0eXBlIC9DSURGb250VHlwZTIKL0NJRFRvR0lETWFwIC9JZGVudGl0eQovQ0lEU3lzdGVtSW5mbyA8PC9SZWdpc3RyeSAoQWRvYmUpCi9PcmRlcmluZyAoSWRlbnRpdHkpCi9TdXBwbGVtZW50IDA+PgovVyBbMCBbNzUwXSA2OCBbNTU2LjE1MjM0XSA3MSA3NSA1NTYuMTUyMzQgODAgWzgzMy4wMDc4MV0gODEgODMgNTU2LjE1MjM0IDg3IFsyNzcuODMyMDMgNTU2LjE1MjM0XV0KL0RXIDUwMD4+CmVuZG9iagoxMSAwIG9iago8PC9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9MZW5ndGggMjc3Pj4gc3RyZWFtCnicXZHNaoQwFIX3eYq7nC4GddSZKYjQcVpw0R9q+wAxudpATUKMC9+++ZlaaEDhyz3nJJwkTXttpbCQvBnFOrQwCMkNzmoxDKHHUUiSHYALZm8U/myimiTO3K2zxamVgyJVBZC8u+lszQq7B656vCPJq+FohBxh99l0jrtF62+cUFpISV0Dx8ElPVP9QieEJNj2LXdzYde98/wpPlaNcAicxdswxXHWlKGhckRSpW7VUD25VROU/N+8iK5+YF/UeHVROHWaHrM60CXSOdJjpEugsgl0ug+5t4T8N287vjgGWXGO3jx600BlHjevcTMqy6g85bfcmOSv7iveemGLMa6S8A6hC9+CkLg9lVbau/z3AzqljToKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUwCi9CYXNlRm9udCAvQUFBQUFBK0FyaWFsTVQKL0VuY29kaW5nIC9JZGVudGl0eS1ICi9EZXNjZW5kYW50Rm9udHMgWzEwIDAgUl0KL1RvVW5pY29kZSAxMSAwIFI+PgplbmRvYmoKeHJlZgowIDEyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwNDU1IDAwMDAwIG4gCjAwMDAwMDAxMDUgMDAwMDAgbiAKMDAwMDAxNDM0MiAwMDAwMCBuIAowMDAwMDAwMTQyIDAwMDAwIG4gCjAwMDAwMDA2NjMgMDAwMDAgbiAKMDAwMDAwMDcxOCAwMDAwMCBuIAowMDAwMDAwODM1IDAwMDAwIG4gCjAwMDAwMTM0NTQgMDAwMDAgbiAKMDAwMDAxMzY4OCAwMDAwMCBuIAowMDAwMDEzOTk0IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSAxMgovUm9vdCA3IDAgUgovSW5mbyAxIDAgUj4+CnN0YXJ0eHJlZgoxNDQ4MQolJUVPRgo="
