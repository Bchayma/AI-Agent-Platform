from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    collection: Optional[str] = None
    retrieval_limit: int = 5

class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent: str = "coordinator"

class AnalyzeRequest(BaseModel):
    topic: str
    depth: Optional[str] = "standard"  # "quick", "standard", "deep"
    collection: Optional[str] = None
    retrieval_limit: int = 5

class SummarizeRequest(BaseModel):
    content: str
    format: Optional[str] = "bullet"   # "bullet", "paragraph", "executive"
    collection: Optional[str] = None
    retrieval_limit: int = 5

class ReportRequest(BaseModel):
    topic: str
    include_sections: Optional[List[str]] = None
    collection: Optional[str] = None
    retrieval_limit: int = 5

class TaskStatus(BaseModel):
    task_id: str
    task_type: str
    status: str
    input_text: str
    result: Optional[str]
    created_at: datetime
    updated_at: datetime
    duration_ms: Optional[float]

class AgentLogEntry(BaseModel):
    id: int
    task_id: str
    agent_name: str
    action: str
    detail: Optional[str]
    timestamp: datetime

class AgentRunResult(BaseModel):
    task_id: str
    status: str
    result: str
    agents_used: List[str]
    duration_ms: float
    logs: List[dict]
