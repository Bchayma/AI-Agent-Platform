from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from models.schemas import ChatRequest, AgentRunResult
from agents.coordinator_agent import CoordinatorAgent
from db.database import get_db, TaskRecord, AgentLog
from datetime import datetime
import uuid, json

router = APIRouter()

@router.post("/chat", response_model=AgentRunResult)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    task_id   = str(uuid.uuid4())
    task      = TaskRecord(
        task_id    = task_id,
        task_type  = "chat",
        status     = "running",
        input_text = req.message,
        created_at = datetime.utcnow(),
    )
    db.add(task)
    await db.commit()

    try:
        coordinator = CoordinatorAgent()
        out = await coordinator.run("chat", req.model_dump(exclude_none=True))

        task.status     = "completed"
        task.result     = out["result"]
        task.updated_at = datetime.utcnow()
        task.duration_ms = out["duration_ms"]
        await db.commit()

        for entry in out["logs"]:
            db.add(AgentLog(
                task_id    = task_id,
                agent_name = entry["agent"],
                action     = entry["action"],
                detail     = entry.get("detail", ""),
                timestamp  = datetime.fromisoformat(entry["timestamp"]),
            ))
        await db.commit()

        return AgentRunResult(
            task_id      = task_id,
            status       = "completed",
            result       = out["result"],
            agents_used  = out["agents_used"],
            duration_ms  = out["duration_ms"],
            logs         = out["logs"],
        )
    except Exception as e:
        task.status     = "failed"
        task.result     = str(e)
        task.updated_at = datetime.utcnow()
        await db.commit()
        raise
