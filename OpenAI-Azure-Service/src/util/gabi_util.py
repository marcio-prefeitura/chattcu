import io
import logging
import re
from datetime import timedelta
from time import sleep

import tiktoken
from opentelemetry import trace

from src.infrastructure.env import DICIONARIO_MINISTROS, MODELO_PADRAO, MODELOS

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("format_time_unit")
async def format_time_unit(value, unit="seconds"):
    """
    Convert seconds or milliseconds to a timestamp.

    Args:
    value (int, float): The time value in seconds or milliseconds.
    unit (str): The unit of the value ('seconds' or 'milliseconds').

    Returns:
    str: The formatted timestamp.
    """

    if unit == "milliseconds":
        td = timedelta(milliseconds=value)
    else:
        td = timedelta(seconds=value)

    total_seconds = td.total_seconds()
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    milliseconds = td.microseconds // 1000

    return f"{int(hours):02}:{int(minutes):02}:{int(seconds):02}.{milliseconds:03}"


@tracer.start_as_current_span("format_youtube_style_captions")
async def format_youtube_style_captions(json_content):
    """Convert JSON subtitle content to a custom text format for YouTube captions."""
    lines = []
    text_only = []
    events = json_content.get("events", [])

    for event in events:
        start_time = await format_time_unit(event["tStartMs"], "milliseconds")

        duration_ms = event.get("dDurationMs", 0)

        end_time = await format_time_unit(
            event["tStartMs"] + duration_ms, "milliseconds"
        )

        text_segments = [
            seg.get("utf8", "").strip()
            for seg in event.get("segs", [])
            if seg.get("utf8", "").strip()
        ]

        text = " ".join(text_segments)

        if text:
            lines.append(f"[{start_time}] --> [{end_time}]:  {text}")
            text_only.append(text)

    return "\n".join(lines), "\n".join(text_only)


@tracer.start_as_current_span("format_general_platform_style_captions")
async def format_general_platform_style_captions(transcript, duration, start_time=0):
    """Print the transcript with timestamps."""
    formatted_transcript = []
    start_offset = timedelta(seconds=start_time)

    # Iterate over each segment except the last one
    for segment in transcript.segments[:-1]:
        start = await format_time_unit(segment["start"], "seconds")
        end = await format_time_unit(segment["end"], "seconds")

        text = segment["text"]

        # Adjust the start and end times based on the start_offset
        start_adjusted = timedelta(seconds=segment["start"]) + start_offset
        end_adjusted = timedelta(seconds=segment["end"]) + start_offset

        # Format the line with microseconds
        formatted_line = f"[{await format_time_unit(start_adjusted.total_seconds(), 'seconds')}] --> [{await format_time_unit(end_adjusted.total_seconds(), 'seconds')}]: {text}"

        formatted_transcript.append(formatted_line)

    # Handle the last segment separately
    last_segment = transcript.segments[-1]
    text = last_segment["text"]
    # Adjust the start and end times based on the start_offset
    start_adjusted = timedelta(seconds=last_segment["start"]) + start_offset
    end_adjusted = timedelta(seconds=duration) + start_offset

    # Format the last line with microseconds
    formatted_line = f"[{await format_time_unit(start_adjusted.total_seconds(), 'seconds')}] --> [{await format_time_unit(end_adjusted.total_seconds(), 'seconds')}]: {text}"

    formatted_transcript.append(formatted_line)

    return "\n".join(formatted_transcript), transcript.text


@tracer.start_as_current_span("format_teams_transcription")
async def format_teams_transcription(transcription):
    # Define the regex pattern to match timestamps
    timestamp_pattern = (
        r"\d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3} --> \d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3}"
    )

    # Use re.sub() to replace timestamps with an empty string
    cleaned_transcription = re.sub(timestamp_pattern, "", transcription)

    # Remove any extra whitespace that might be left behind
    cleaned_transcription = re.sub(r"\n\s*\n", "\n", cleaned_transcription).strip()

    return cleaned_transcription


# Funções de apoio


@tracer.start_as_current_span("calculate_file_size")
async def calculate_file_size(data: io.BytesIO) -> int:
    data.seek(0, io.SEEK_END)  # Move to the end of the file
    size = data.tell()  # Get the current position, which is the size
    data.seek(0)  # Reset the pointer to the beginning
    return size


# async def name_file(content: io.BytesIO, extensao: str) -> str:
#     content.seek(0)  # Ensure the BytesIO object is at the beginning
#     content_bytes = content.read()  # Read the content as bytes
#     hash_arquivo = await calcula_hash(content_bytes)  # Pass bytes to calcula_hash
#     file_size = await calculate_file_size(content)
#     hash_arquivo = f"{hash_arquivo}-{file_size}"

#     nome_blob = f"{hash_arquivo}.{extensao}"
#     return nome_blob


@tracer.start_as_current_span("name_file")
async def name_file(
    original_blob_name: str, description: str, extension: str = ".txt"
) -> str:
    item_filename = original_blob_name.split(".")[0]
    item_filename += f"-{description}{extension}"

    return item_filename


# Funções de geradores de chat


@tracer.start_as_current_span("truncate_message_to_token_limit")
async def truncate_message_to_token_limit(message, modelo=MODELOS[MODELO_PADRAO]):
    """Truncate a message string to ensure the total token count does not exceed the token limit for the model."""

    token_limit = (
        modelo["max_tokens"] * 0.90
    )  # Leave a 10% margin for generating the response and for system prompt tokens

    if token_limit > modelo["max_tokens"] * 0.50:
        sleep(15)  # Sleep for 15 seconds to avoid rate limiting

    model = modelo["deployment_name"]

    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(text):
        """Returns the number of tokens used by a text."""
        return len(encoding.encode(text))

    total_tokens = count_tokens(message)

    coeficiente = 0
    if total_tokens > 5000:
        coeficiente = 1

    if total_tokens <= token_limit:
        warning_message = (
            f"The message contained {total_tokens} tokens and was not truncated."
            * coeficiente
        )
        logger.info(warning_message)
        return message, False, "The message did not exceed the token limit."

    truncated_message = message
    while count_tokens(truncated_message) > token_limit:
        truncated_message = truncated_message[:-1]

    warning_message = (
        f"The message contained {total_tokens} tokens and was truncated to fit within the {token_limit}-token limit of this model."
        * coeficiente
    )
    logger.info(warning_message)

    return (
        truncated_message,
        True,
        f"The message contained {total_tokens} tokens and was truncated to fit within the {token_limit}-token limit of this model.",
    )


@tracer.start_as_current_span("create_chat_messages")
async def create_chat_messages(content: str) -> list:

    truncated_message, _, _ = await truncate_message_to_token_limit(message=content)

    return [
        {
            "role": "system",
            "content": "Você é um assessor altamente especializado em resumos de vídeos de reuniões, do Youtube e de outras mídias sociais baseadas em transcrições de áudio.",
        },
        {
            "role": "user",
            "content": "Por favor, leia a transcrição com atenção a fim de identificar se ela se trata de uma reunião ou não.",
        },
        {
            "role": "assistant",
            "content": "Obrigado! Estou lendo a transcrição, com muita atenção e logo darei a resposta, conforme solicitado.",
        },
        {"role": "user", "content": truncated_message},
    ]


@tracer.start_as_current_span("create_chat_messages_social_media")
async def create_chat_messages_social_media(content: str) -> list:

    truncated_message, _, _ = await truncate_message_to_token_limit(message=content)

    return [
        {
            "role": "system",
            "content": "Você é um assessor altamente especializado em resumos de vídeos de reuniões, do Youtube e de outras mídias sociais baseadas em transcrições de áudio.",
        },
        {
            "role": "user",
            "content": "Por favor, leia a transcrição com atenção a fim de preparar um resumo ou uma ata da reunião, conforme lhe for solicitado.",
        },
        {
            "role": "assistant",
            "content": "Obrigado! Estou lendo a transcrição, com muita atenção e logo prepararei um resumo ou uma ata da sobre o conteúdo para você, conforme solicitado.",
        },
        {"role": "system", "content": DICIONARIO_MINISTROS},
        {"role": "user", "content": truncated_message},
    ]
