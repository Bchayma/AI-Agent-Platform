from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from models.schemas import AgentLogEntry
from db.database import get_db, AgentLog
from typing import List

router = APIRouter()

@router.get("/logs", response_model=List[AgentLogEntry])
async def list_logs(limit: int = 50, task_id: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(AgentLog).order_by(desc(AgentLog.timestamp)).limit(limit)
    if task_id:
        query = query.where(AgentLog.task_id == task_id)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [AgentLogEntry(
        id         = l.id,
        task_id    = l.task_id,
        agent_name = l.agent_name,
        action     = l.action,
        detail     = l.detail,
        timestamp  = l.timestamp,
    ) for l in logs]
