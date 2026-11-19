
import os
import asyncio
import httpx
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "mistralai/mistral-7b-instruct:free",
)

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


class BaseAgent:
    """
    Base class for all agents.
    Wraps LLM calls and provides logging utilities.
    """

    def __init__(self, name: str, role: str, goal: str):
        self.name = name
        self.role = role
        self.goal = goal
        self._logs: list[dict] = []

    async def call_llm(
        self,
        prompt: str,
        system: Optional[str] = None,
    ) -> str:
        """Invoke a LangChain chat model while preserving the legacy HTTP fallback."""

        providers = {"gemini", "openai", "openrouter"}

        if LLM_PROVIDER not in providers:
            raise ValueError(
                f"Unsupported LLM_PROVIDER: {LLM_PROVIDER}"
            )

        self._log(
            "llm_call",
            f"Calling {LLM_PROVIDER} with {len(prompt)} chars",
        )

        try:
            return await self._call_langchain(LLM_PROVIDER, prompt, system)
        except ModuleNotFoundError:
            self._log("llm_compatibility", "LangChain unavailable; using legacy provider client")
            return await self._call_legacy(LLM_PROVIDER, prompt, system)
        except Exception as primary_error:
            self._log("llm_error", str(primary_error))

            # Optional fallback: only activate when configured.
            fallback = os.getenv("LLM_FALLBACK_PROVIDER", "").lower()

            if not fallback:
                raise

            if fallback not in providers:
                raise ValueError(
                    f"Unsupported LLM_FALLBACK_PROVIDER: {fallback}"
                ) from primary_error

            if fallback == LLM_PROVIDER:
                raise

            self._log("llm_fallback", f"Trying {fallback}")

            try:
                return await self._call_langchain(fallback, prompt, system)
            except Exception as fallback_error:
                self._log("llm_fallback_error", str(fallback_error))
                raise RuntimeError(
                    f"Primary provider '{LLM_PROVIDER}' and fallback "
                    f"'{fallback}' both failed."
                ) from fallback_error

    async def _call_langchain(
        self, provider: str, prompt: str, system: Optional[str]
    ) -> str:
        from langchain_core.prompts import ChatPromptTemplate

        model = self._langchain_model(provider)
        template = ChatPromptTemplate.from_messages(
            [
                ("system", system or "You are a helpful AI assistant."),
                ("human", "{prompt}"),
            ]
        )
        response = await (template | model).ainvoke({"prompt": prompt})
        content = response.content
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        if not isinstance(content, str) or not content.strip():
            raise RuntimeError("The configured LLM returned an empty response.")
        return content

    def _langchain_model(self, provider: str):
        if provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI

            return ChatGoogleGenerativeAI(
                model=GEMINI_MODEL,
                google_api_key=GEMINI_API_KEY,
                temperature=0,
            )
        if provider == "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=OPENAI_MODEL,
                api_key=OPENAI_API_KEY,
                temperature=0,
            )
        if provider == "openrouter":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=OPENROUTER_MODEL,
                api_key=OPENROUTER_KEY,
                base_url="https://openrouter.ai/api/v1",
                default_headers={"HTTP-Referer": "https://ai-agent-platform"},
                temperature=0,
            )
        raise ValueError(f"Unsupported LLM provider: {provider}")

    async def _call_legacy(
        self, provider: str, prompt: str, system: Optional[str]
    ) -> str:
        legacy_providers = {
            "gemini": self._call_gemini,
            "openai": self._call_openai,
            "openrouter": self._call_openrouter,
        }
        return await legacy_providers[provider](prompt, system)

    async def _post_with_retry(
        self,
        client: httpx.AsyncClient,
        url: str,
        *,
        headers: Optional[dict] = None,
        json: dict,
    ) -> httpx.Response:
        """Retry transient HTTP/network failures up to three times."""

        for attempt in range(3):
            try:
                response = await client.post(
                    url,
                    headers=headers,
                    json=json,
                )

                if response.status_code not in RETRYABLE_STATUS_CODES:
                    response.raise_for_status()
                    return response

                if attempt == 2:
                    response.raise_for_status()

                self._log(
                    "llm_retry",
                    f"HTTP {response.status_code}; retry {attempt + 1}/2",
                )

            except httpx.HTTPStatusError as exc:
                if (
                    exc.response.status_code not in RETRYABLE_STATUS_CODES
                    or attempt == 2
                ):
                    raise

                self._log(
                    "llm_retry",
                    f"HTTP {exc.response.status_code}; retry {attempt + 1}/2",
                )

            except (httpx.TimeoutException, httpx.NetworkError):
                if attempt == 2:
                    raise

                self._log(
                    "llm_retry",
                    f"Network error; retry {attempt + 1}/2",
                )

            await asyncio.sleep(1 * (2 ** attempt))

        raise RuntimeError("LLM request failed after retries.")

    # Gemini
    async def _call_gemini(
        self,
        prompt: str,
        system: Optional[str],
    ) -> str:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set")

        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent"
        )

        payload = {
            "contents": [{"parts": [{"text": full_prompt}]}]
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await self._post_with_retry(
                client,
                url,
                headers={"x-goog-api-key": GEMINI_API_KEY},
                json=payload,
            )

        data = response.json()
        candidates = data.get("candidates", [])

        if not candidates:
            raise RuntimeError(
                f"Gemini returned no candidates: {data}"
            )

        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(
            part.get("text", "")
            for part in parts
            if isinstance(part.get("text"), str)
        )

        if not text.strip():
            raise RuntimeError("Gemini returned an empty response.")

        return text

    # OpenAI
    async def _call_openai(
        self,
        prompt: str,
        system: Optional[str],
    ) -> str:
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=60) as client:
            response = await self._post_with_retry(
                client,
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}"
                },
                json={
                    "model": OPENAI_MODEL,
                    "messages": messages,
                },
            )

        content = response.json()["choices"][0]["message"]["content"]

        if not content:
            raise RuntimeError("OpenAI returned an empty response.")

        return content

    # OpenRouter
    async def _call_openrouter(
        self,
        prompt: str,
        system: Optional[str],
    ) -> str:
        if not OPENROUTER_KEY:
            raise ValueError("OPENROUTER_API_KEY not set")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=60) as client:
            response = await self._post_with_retry(
                client,
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "HTTP-Referer": "https://ai-agent-platform",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": messages,
                },
            )

        content = response.json()["choices"][0]["message"]["content"]

        if not content:
            raise RuntimeError("OpenRouter returned an empty response.")

        return content

    # Logging
    def _log(self, action: str, detail: str = ""):
        self._logs.append({
            "agent": self.name,
            "action": action,
            "detail": detail,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def get_logs(self) -> list[dict]:
        return list(self._logs)

    def clear_logs(self):
        self._logs = []
