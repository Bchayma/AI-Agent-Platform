from __future__ import annotations

import asyncio
import io
import os
import re
import uuid
from pathlib import Path
from typing import Any

from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
DEFAULT_COLLECTION = "default"
DEFAULT_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")


class DocumentValidationError(ValueError):
    """Raised when an uploaded document cannot be safely indexed."""


def _embedding_function() -> Any:
    provider = os.getenv("RAG_EMBEDDING_PROVIDER", os.getenv("LLM_PROVIDER", "gemini")).lower()
    if provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        return GoogleGenerativeAIEmbeddings(
            model=os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001")
        )
    if provider == "openai":
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(
            model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        )
    if provider == "openrouter":
        if not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError(
                "OpenRouter does not provide a portable embeddings API. "
                "Set OPENAI_API_KEY or RAG_EMBEDDING_PROVIDER to gemini/openai."
            )
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(
            model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        )
    raise ValueError(f"Unsupported RAG_EMBEDDING_PROVIDER: {provider}")


def _store(collection: str) -> Chroma:
    safe_collection = re.sub(r"[^a-zA-Z0-9_-]", "-", collection).strip("-") or DEFAULT_COLLECTION
    if len(safe_collection) < 3:
        safe_collection = f"{safe_collection}-kb"
    return Chroma(
        collection_name=safe_collection[:63],
        embedding_function=_embedding_function(),
        persist_directory=DEFAULT_PERSIST_DIRECTORY,
    )


def _extract_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise DocumentValidationError("Only PDF, TXT, and Markdown files are supported.")
    if not content:
        raise DocumentValidationError("The uploaded document is empty.")
    if len(content) > MAX_DOCUMENT_BYTES:
        raise DocumentValidationError("Documents must be 10 MB or smaller.")

    if suffix == ".pdf":
        pages = PdfReader(io.BytesIO(content)).pages
        text = "\n\n".join(page.extract_text() or "" for page in pages)
    else:
        text = content.decode("utf-8-sig")

    cleaned = re.sub(r"[ \t]+", " ", text)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    if not cleaned:
        raise DocumentValidationError("No readable text was found in the document.")
    return cleaned


def _index_document(filename: str, content: bytes, collection: str) -> dict[str, Any]:
    text = _extract_text(filename, content)
    document_id = str(uuid.uuid4())
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=int(os.getenv("RAG_CHUNK_SIZE", "1000")),
        chunk_overlap=int(os.getenv("RAG_CHUNK_OVERLAP", "150")),
    )
    chunks = splitter.create_documents(
        [text],
        metadatas=[{"source": filename, "document_id": document_id}],
    )
    ids = [f"{document_id}:{index}" for index in range(len(chunks))]
    _store(collection).add_documents(chunks, ids=ids)
    return {
        "document_id": document_id,
        "filename": filename,
        "collection": collection,
        "chunks": len(chunks),
        "characters": len(text),
    }


async def index_document(filename: str, content: bytes, collection: str = DEFAULT_COLLECTION) -> dict[str, Any]:
    return await asyncio.to_thread(_index_document, filename, content, collection)


def _search_documents(query: str, collection: str, limit: int) -> list[dict[str, Any]]:
    if not query.strip():
        raise ValueError("Search query must not be empty.")
    results = _store(collection).similarity_search_with_relevance_scores(query, k=max(1, min(limit, 20)))
    return [
        {
            "content": document.page_content,
            "metadata": document.metadata,
            "score": score,
        }
        for document, score in results
    ]


async def search_documents(
    query: str, collection: str = DEFAULT_COLLECTION, limit: int = 5
) -> list[dict[str, Any]]:
    return await asyncio.to_thread(_search_documents, query, collection, limit)


async def context_for_query(
    query: str, collection: str = DEFAULT_COLLECTION, limit: int = 5
) -> str:
    results = await search_documents(query, collection, limit)
    if not results:
        return ""
    return "\n\n".join(
        f"[Source: {item['metadata'].get('source', 'uploaded document')}]\n{item['content']}"
        for item in results
    )
