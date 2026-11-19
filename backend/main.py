from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.database import init_db
from routers import chat, analyze, report, summarize, tasks, logs, documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="AI Agent Platform",
    description="Multi-agent AI platform for enterprise automation",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router,      prefix="/api", tags=["Chat"])
app.include_router(analyze.router,   prefix="/api", tags=["Analyze"])
app.include_router(report.router,    prefix="/api", tags=["Report"])
app.include_router(summarize.router, prefix="/api", tags=["Summarize"])
app.include_router(tasks.router,     prefix="/api", tags=["Tasks"])
app.include_router(logs.router,      prefix="/api", tags=["Logs"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])

@app.get("/")
async def root():
    return {"message": "AI Agent Platform is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
