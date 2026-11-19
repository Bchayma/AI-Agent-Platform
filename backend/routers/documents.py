from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from pypdf.errors import PdfReadError

from rag.service import (
    DEFAULT_COLLECTION,
    DocumentValidationError,
    index_document,
    search_documents,
)

router = APIRouter()


class DocumentSearchResponse(BaseModel):
    collection: str
    query: str
    results: list[dict]


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    collection: str = Query(DEFAULT_COLLECTION, min_length=1, max_length=63),
):
    try:
        content = await file.read()
        return await index_document(file.filename or "", content, collection)
    except (DocumentValidationError, UnicodeDecodeError, PdfReadError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (RuntimeError, ValueError, OSError) as exc:
        raise HTTPException(status_code=503, detail=f"Document indexing failed: {exc}") from exc


@router.get("/documents/search", response_model=DocumentSearchResponse)
async def search_uploaded_documents(
    query: str = Query(..., min_length=1),
    collection: str = Query(DEFAULT_COLLECTION, min_length=1, max_length=63),
    limit: int = Query(5, ge=1, le=20),
):
    try:
        results = await search_documents(query, collection, limit)
        return {"collection": collection, "query": query, "results": results}
    except (RuntimeError, ValueError, OSError) as exc:
        raise HTTPException(status_code=503, detail=f"Document search failed: {exc}") from exc
