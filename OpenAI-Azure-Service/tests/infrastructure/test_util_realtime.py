import json

import pytest
from fastapi import WebSocket

from src.exceptions import BusinessException
from src.infrastructure.realtimeaudio.util_realtime import ConfigRealtime, UtilStreams


class TestConfigRealtime:

    def test_eh_singleton(self):
        assert ConfigRealtime() is ConfigRealtime()

    def test_get_standard_sucesso(self):

        expected_result = {
            "type": "session.update",
            "session": {
                "instructions": """Você é um assistente virtual educado e prestativo, que responde de forma sucinta.
                                Responde sempre usando a língua portuguesa do Brasil.""",
                "modalities": ["audio", "text"],
                "input_audio_transcription": {
                    "model": "whisper-1",
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 1400,
                },
                "voice": "marilyn",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "temperature": 0.6,
                "max_response_output_tokens": 2000,
            },
        }

        result = ConfigRealtime.get_standard_session_creation()
        assert result == expected_result

    def test_update_dict(self):

        original_dict = {
            "key1": "value1",
            "key2": {
                "subkey1": "subvalue1",
                "subkey2": "subvalue2",
            },
            "key3": "value3",
        }
        updates = {
            "key2": {
                "subkey1": "new_subvalue1",
            },
            "key3": "new_value3",
        }
        expected_result = {
            "key1": "value1",
            "key2": {
                "subkey1": "new_subvalue1",
                "subkey2": "subvalue2",
            },
            "key3": "new_value3",
        }

        result = ConfigRealtime.update_dict(original_dict, updates)
        assert result == expected_result

    def test_update_dict_se_nao_existe_key_nao_cria_nova(self):

        original_dict = {
            "key1": "value1",
        }
        updates = {
            "key2": "value2",
        }

        result = ConfigRealtime.update_dict(original_dict, updates)
        assert result == original_dict

    @pytest.mark.asyncio
    async def test_amerge(self):

        async def stream1():
            yield 1
            yield 2
            yield 3

        async def stream2():
            yield "a"
            yield "b"
            yield "c"

        async def stream3():
            yield "x"
            yield "y"
            yield "z"

        streams = {
            "input_ws_user": stream1(),
            "tool_outputs": stream2(),
            "output_speaker": stream3(),
        }

        expected_result = [
            ("input_ws_user", 1),
            ("tool_outputs", "a"),
            ("input_ws_user", 2),
            ("tool_outputs", "b"),
            ("input_ws_user", 3),
            ("tool_outputs", "c"),
            ("output_speaker", "x"),
            ("output_speaker", "y"),
            ("output_speaker", "z"),
        ]

        result = [item async for item in UtilStreams.amerge(**streams)]
        assert set(result) == set(expected_result)

    @pytest.mark.asyncio
    async def test_websocket_se_timeout_lanca_business_exception(self, mocker):
        websocket = mocker.Mock(spec=WebSocket)
        websocket.receive_text = mocker.AsyncMock(
            side_effect=["message1", "message2", TimeoutError]
        )

        expected_result = ["message1", "message2"]

        result = []
        with pytest.raises(BusinessException):
            async for message in UtilStreams.websocket_stream(websocket):
                result.append(message)

        assert result == expected_result

    @pytest.mark.asyncio
    async def test_validar_payload(self, mocker):
        payload = json.dumps({"token": "valid_token"})
        mocker.patch(
            "src.service.auth_service.verify_decode_entraid_token",
            return_value={"user": "test_user"},
        )

        result = await UtilStreams.validar_payload(payload)
        assert result == {"user": "test_user"}

    def test_get_config_instructions_from_payload(self):
        payload = json.dumps({"config_instructions": {"instruction": "test"}})
        result = UtilStreams.get_config_instructions_from_payload(payload)
        assert result == {"instruction": "test"}

    def test_get_config_instructions_from_payload_invalid_json(self):
        payload = "invalid_json"
        result = UtilStreams.get_config_instructions_from_payload(payload)
        assert result == {}
