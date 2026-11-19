from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./platform.db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class TaskRecord(Base):
    __tablename__ = "tasks"
    id          = Column(Integer, primary_key=True, index=True)
    task_id     = Column(String(64), unique=True, index=True)
    task_type   = Column(String(64))
    status      = Column(String(32), default="pending")
    input_text  = Column(Text)
    result      = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    duration_ms = Column(Float, nullable=True)

class AgentLog(Base):
    __tablename__ = "agent_logs"
    id          = Column(Integer, primary_key=True, index=True)
    task_id     = Column(String(64), index=True)
    agent_name  = Column(String(64))
    action      = Column(String(128))
    detail      = Column(Text, nullable=True)
    timestamp   = Column(DateTime, default=datetime.utcnow)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
