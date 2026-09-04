"""
One Gemini call, constrained to a JSON schema. Used only to turn a free-text
property description into candidate values for the model's 8 real input
features -- it never computes or is asked for a price. Trimmed port of the
same pattern in ai-research-agent/backend/llm.py (see that file for the
fuller tool-calling version this project doesn't need).
"""

import asyncio
import os
from typing import TypeVar

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
MAX_RETRIES = 4

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class LLMError(Exception):
    """Raised when a Gemini call fails after retries, or the client isn't configured."""


def is_configured() -> bool:
    return client is not None


async def generate_structured(
    prompt: str,
    schema: type[SchemaT],
    *,
    system_instruction: str | None = None,
    max_output_tokens: int = 512,
) -> SchemaT:
    """One Gemini call constrained to return JSON matching `schema`."""
    if client is None:
        raise LLMError("GEMINI_API_KEY is not configured on the server")

    def call():
        return client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=schema,
                max_output_tokens=max_output_tokens,
            ),
        )

    for attempt in range(MAX_RETRIES):
        try:
            response = await asyncio.to_thread(call)
            break
        except APIError as exc:
            if exc.code == 429 and attempt < MAX_RETRIES - 1:
                await asyncio.sleep(min(2**attempt, 15))
                continue
            if exc.code == 429:
                raise LLMError("Hit the Gemini free-tier rate limit -- try again shortly.") from exc
            raise LLMError(f"Gemini API error: {exc}") from exc

    if response.parsed is not None:
        return response.parsed
    return schema.model_validate_json(response.text)
