from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from models.schemas import TaskStatus
from db.database import get_db, TaskRecord
from typing import List

router = APIRouter()

@router.get("/tasks", response_model=List[TaskStatus])
async def list_tasks(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaskRecord).order_by(desc(TaskRecord.created_at)).limit(limit)
    )
    tasks = result.scalars().all()
    return [TaskStatus(
        task_id    = t.task_id,
        task_type  = t.task_type,
        status     = t.status,
        input_text = t.input_text,
        result     = t.result,
        created_at = t.created_at,
        updated_at = t.updated_at,
        duration_ms = t.duration_ms,
    ) for t in tasks]

@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaskRecord).where(TaskRecord.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskStatus(
        task_id    = task.task_id,
        task_type  = task.task_type,
        status     = task.status,
        input_text = task.input_text,
        result     = task.result,
        created_at = task.created_at,
        updated_at = task.updated_at,
        duration_ms = task.duration_ms,
    )
