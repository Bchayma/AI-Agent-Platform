# 🤖 AI Agent Platform

A full-stack **multi-agent AI automation platform** that simulates an internal AI workforce. Specialized agents collaborate through intelligent pipelines to perform research, summarization, documentation, and reporting — automatically.

---

## 📸 What it Does

The platform exposes a beautiful web UI and a REST API. Users submit a task (e.g. *"Generate a report about Kubernetes deployment failures"*), and the **Coordinator Agent** dynamically routes it through a pipeline of specialist AI agents that work together to produce a polished output.

```
User Request
     │
     ▼
CoordinatorAgent (LangGraph stateful workflow)
     │
     ├── ResearchAgent      → gathers comprehensive information
     ├── SummarizationAgent → condenses findings to key insights
     ├── DocumentationAgent → formats as professional documentation
     └── ReportAgent        → wraps as a formal business report
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Multi-Agent Architecture** | 5 specialized agents: Coordinator, Research, Summarization, Documentation, Report |
| **4 Task Types** | Analyze, Summarize, Report, Chat |
| **LangGraph Workflows** | Stateful `StateGraph` routing with conditional agent execution and shared workflow state |
| **Retrieval-Augmented Generation** | Upload PDF, TXT, and Markdown files and retrieve relevant context before generation |
| **ChromaDB Knowledge Base** | Persistent semantic search over document chunks and source metadata |
| **Auto-Routing** | Coordinator classifies requests and selects the minimum required pipeline |
| **LangChain Integration** | Standardized chat models, prompt templates, document splitting, embeddings, and retrieval |
| **3 LLM Providers** | Google Gemini (free tier), OpenAI, OpenRouter |
| **SQLite Persistence** | Every task, result, and agent log is stored |
| **Full REST API** | FastAPI with Swagger docs at `/docs` |
| **Beautiful Dashboard** | React frontend with real-time results and Markdown rendering |
| **Agent Activity Logs** | Per-task detailed logs showing every agent action |
| **Task History** | Browse, filter, and revisit all past tasks |
| **Docker Ready** | One `docker-compose up` to run everything |

---

## 🏗 Architecture

### Backend (FastAPI + Python)

```
backend/
├── main.py                    # FastAPI app + CORS + router registration
├── requirements.txt
├── .env.example               # Configuration template
│
├── agents/
│   ├── base_agent.py          # LLM abstraction (Gemini / OpenAI / OpenRouter)
│   ├── coordinator_agent.py   # LangGraph workflow and conditional routing
│   ├── research_agent.py      # Gathers structured information
│   ├── summarization_agent.py # Condenses content (3 formats)
│   ├── documentation_agent.py # Generates professional Markdown docs
│   └── report_agent.py        # Creates formal business reports
│
├── rag/
│   └── service.py             # LangChain chunking, embeddings, and Chroma retrieval
│
├── routers/
│   ├── analyze.py    # POST /api/analyze
│   ├── report.py     # POST /api/report
│   ├── summarize.py  # POST /api/summarize
│   ├── chat.py       # POST /api/chat
│   ├── tasks.py      # GET  /api/tasks, GET /api/tasks/{id}
│   ├── logs.py       # GET  /api/logs
│   └── documents.py  # POST /api/documents/upload, GET /api/documents/search
│
├── models/
│   └── schemas.py    # Pydantic request/response models
│
└── db/
    └── database.py   # SQLAlchemy async + SQLite setup
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── App.jsx          # Router setup
│   ├── index.css        # Design system (CSS variables, animations)
│   │
│   ├── components/
│   │   └── Layout.jsx   # Sidebar navigation
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx    # Stats, quick actions, recent tasks
│   │   ├── NewTask.jsx      # Auto, Analyze, Summarize, Report, and Chat modes
│   │   ├── TaskHistory.jsx  # Browse all tasks with filters
│   │   ├── TaskDetail.jsx   # Full result + agent logs
│   │   ├── Agents.jsx       # Visual agent documentation
│   │   └── Documents.jsx    # Upload and search the RAG knowledge base
│   │
│   └── services/
│       └── api.js       # Axios API client
│
├── vite.config.js       # Dev server + API proxy
└── nginx.conf           # Production reverse proxy config
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/ai-agent-platform.git
cd ai-agent-platform

# 2. Set up your environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and add a supported provider API key.

# 3. Start everything
docker-compose up --build

# 4. Open the app
# Frontend: http://localhost:3000
# API Docs:  http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API key

# Run the server
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev

# Open http://localhost:3000
```

---

## 🔑 Configuration

All configuration lives in `backend/.env`:

```env
# Choose your LLM provider: gemini | openai | openrouter
LLM_PROVIDER=gemini

# Google Gemini (FREE tier — recommended for getting started)
# Get key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash

# OpenAI (optional)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# OpenRouter (optional — access many models, some free)
# OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free

# Database (SQLite by default, no setup needed)
DATABASE_URL=sqlite+aiosqlite:///./platform.db

# RAG embeddings and Chroma persistence
RAG_EMBEDDING_PROVIDER=gemini
GEMINI_EMBEDDING_MODEL=models/embedding-001
CHROMA_PERSIST_DIRECTORY=./chroma_db
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=150
```

### LangGraph and RAG

Every task is executed by a compiled LangGraph `StateGraph`. The coordinator
classifies the request, conditionally routes only the required specialist
nodes, and passes current content through shared state. Supplying a `collection`
field to `/api/chat`, `/api/analyze`, `/api/summarize`, or `/api/report` inserts
a retrieval node before the selected workflow.

Upload documents from the **Knowledge** page or directly:

```bash
curl -F "file=@handbook.md" "http://localhost:8000/api/documents/upload?collection=default"
curl "http://localhost:8000/api/documents/search?collection=default&query=deployment"
```

PDF, TXT, and Markdown files are validated, cleaned, split with
`RecursiveCharacterTextSplitter`, embedded through LangChain, and persisted in
ChromaDB. OpenRouter is supported for chat generation; use Gemini or OpenAI for
embeddings because OpenRouter does not expose a compatible embeddings API.

---

## 📡 API Reference

JSON endpoints accept and return JSON; document upload uses multipart form data.
Interactive docs are available at `/docs`.

### POST /api/chat

Free-form request — coordinator auto-routes to the best agents.

```json
// Request
{
  "message": "Explain how Kubernetes works",
  "collection": "default"
}

// Response
{
  "task_id": "uuid",
  "status": "completed",
  "result": "# How Kubernetes Works\n\n...",
  "agents_used": ["CoordinatorAgent", "ResearchAgent", "SummarizationAgent"],
  "duration_ms": 4821.5,
  "logs": [...]
}
```

`collection` is optional. When provided, the workflow retrieves relevant
chunks from that ChromaDB collection before routing the request.

### POST /api/analyze

Research + summarize + document any topic.

```json
// Request
{
  "topic": "Kubernetes deployment failures",
  "depth": "standard",
  "collection": "default"
}
```

### POST /api/summarize

Condense any content into key insights.

```json
// Request
{
  "content": "Long text to summarize...",
  "format": "bullet",
  "collection": "default"
}
```

### POST /api/report

Generate a formal multi-section report.

```json
// Request
{
  "topic": "Weekly infrastructure status",
  "include_sections": ["Executive Summary", "Key Findings", "Recommendations"],
  "collection": "default"
}
```

### GET /api/tasks

List recent tasks (up to 50).

```
GET /api/tasks?limit=20
GET /api/tasks/{task_id}
```

### GET /api/logs

Retrieve agent execution logs.

```
GET /api/logs?limit=50&task_id=optional-uuid
```

### Document retrieval endpoints

`POST /api/documents/upload?collection=default` accepts a multipart `file`
(`.pdf`, `.txt`, `.md`, or `.markdown`) up to 10 MB. `GET
/api/documents/search?query=...&collection=default&limit=5` returns matching
chunks and source metadata.

The upload response includes the generated document ID, collection, chunk
count, and extracted character count. Configure the embedding provider with
`RAG_EMBEDDING_PROVIDER`; use Gemini or OpenAI for embeddings. OpenRouter
continues to work for chat generation but is not used as an embeddings API.

---

## 🤖 Agent Details

### CoordinatorAgent

The brain of the platform. It compiles a LangGraph `StateGraph`, classifies
each request, optionally retrieves document context, conditionally selects the
minimum required agent nodes, passes outputs through shared state, and collects
execution logs. Task failures are propagated to the existing FastAPI handlers,
which persist the task as `failed`.

**Key design pattern:** explicit task types use deterministic pipelines, while
free-form chat uses an LLM classification prompt. Both paths execute through
the same LangGraph workflow.

### ResearchAgent

Prompts the LLM to act as an information gatherer. Produces structured output with overview, key components, common issues, best practices, and takeaways.

### SummarizationAgent

Three output formats:
- **bullet** — max 10 themed bullet points
- **paragraph** — 2–3 flowing paragraphs
- **executive** — bottom line + Key Findings + Risks + Recommended Actions

### DocumentationAgent

Transforms content into Markdown documentation with H1/H2/H3 hierarchy, code blocks, Quick Start section, and References.

### ReportAgent

Generates formal reports with standard sections (Executive Summary, Background, Key Findings, Analysis, Risks, Recommendations, Next Steps, Conclusion), status indicators (✅ ⚠️ ❌), and a signature block.

---

## 🔄 Agent Pipelines

| Task Type | Pipeline |
|---|---|
| `analyze` (quick) | Coordinator → Research → Summarization |
| `analyze` (standard) | Coordinator → Research → Summarization → Documentation |
| `analyze` (deep) | Coordinator → Research → Summarization (executive) → Documentation |
| `report` | Coordinator → Research → Summarization → Report |
| `summarize` | Coordinator → Summarization |
| `chat` | Coordinator → LLM decides → dynamic pipeline |

---

## 🗄 Database Schema

### tasks table

| Column | Type | Description |
|---|---|---|
| id | INTEGER | Primary key |
| task_id | VARCHAR(64) | UUID, unique |
| task_type | VARCHAR(64) | analyze/summarize/report/chat |
| status | VARCHAR(32) | pending/running/completed/failed |
| input_text | TEXT | User's input |
| result | TEXT | Final output (Markdown) |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| duration_ms | FLOAT | End-to-end time |

### agent_logs table

| Column | Type | Description |
|---|---|---|
| id | INTEGER | Primary key |
| task_id | VARCHAR(64) | Foreign key to tasks |
| agent_name | VARCHAR(64) | Which agent logged this |
| action | VARCHAR(128) | Action name (start/llm_call/complete/etc) |
| detail | TEXT | Additional detail |
| timestamp | DATETIME | |

---

## 🐳 Docker Details

The compose stack runs two services:

```yaml
services:
  backend:   Python/FastAPI on port 8000
  frontend:  React/Nginx on port 3000
```

The frontend Nginx config proxies all `/api/*` requests to the backend, so the frontend never needs to know the backend's URL in production.

SQLite database is persisted in a Docker volume (`db_data`).
ChromaDB data is persisted in the backend's `CHROMA_PERSIST_DIRECTORY`.

---

## 🛠 Development Tips

### Adding a New Agent

1. Create `backend/agents/my_agent.py` extending `BaseAgent`
2. Implement an `async def run(self, ...)` method
3. Add it to `CoordinatorAgent.__init__` in `coordinator_agent.py`
4. Add a node and routing entry to the LangGraph workflow in
   `coordinator_agent.py`

### Switching LLM Providers

Change `LLM_PROVIDER` in `.env`:
- `gemini` → uses Google Generative AI (free tier available)
- `openai` → uses OpenAI Chat Completions
- `openrouter` → uses OpenRouter (aggregator with free models)

### Adding RAG context to a task

1. Upload a document to a named collection.
2. Pass the same collection name in a task request.
3. The workflow retrieves relevant chunks before the first specialist node.

```bash
curl -F "file=@runbook.md" "http://localhost:8000/api/documents/upload?collection=ops"
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"topic":"deployment rollback","depth":"standard","collection":"ops"}'
```

### Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest
```

---

## 📋 Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI 0.115 |
| Async Runtime | uvicorn + asyncio |
| Database ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite (aiosqlite) |
| HTTP Client | httpx |
| Data Validation | Pydantic v2 |
| LLM APIs | Google Gemini / OpenAI / OpenRouter |
| Orchestration | LangGraph StateGraph |
| LLM and RAG framework | LangChain |
| Vector database | ChromaDB |
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Markdown | react-markdown + remark-gfm |
| Icons | lucide-react |
| Containerization | Docker + Docker Compose |
| Web Server | Nginx |

---

## 🗺 7-Day Build Roadmap

| Day | What was built |
|---|---|
| Day 1 | Project structure, FastAPI setup, Docker, GitHub |
| Day 2 | LLM abstraction (BaseAgent), `/api/chat` endpoint |
| Day 3 | ResearchAgent + `/api/analyze` |
| Day 4 | SummarizationAgent + `/api/summarize` |
| Day 5 | DocumentationAgent + ReportAgent + `/api/report` |
| Day 6 | CoordinatorAgent with dynamic routing; SQLite persistence |
| Day 7 | React frontend, Docker Compose, README |
| Upgrade | LangChain model/prompt integration, LangGraph orchestration, ChromaDB RAG, document APIs, and Knowledge UI |

---

## ✅ Internship Requirements Checklist

| Requirement | Implementation |
|---|---|
| ✅ Multi-agent architecture | 5 agents with clear roles and pipelines |
| ✅ Prompt engineering | Custom system prompts per agent, format-specific instructions |
| ✅ LLM integration | Gemini / OpenAI / OpenRouter, configurable via env |
| ✅ LangChain integration | Chat models, prompt templates, text splitters, embeddings, and retrieval |
| ✅ Stateful orchestration | LangGraph `StateGraph` with conditional routing and shared state |
| ✅ RAG pipeline | PDF/TXT/Markdown ingestion, chunking, embeddings, ChromaDB search, and retrieval-aware tasks |
| ✅ REST APIs | FastAPI: task, logging, and document upload/search endpoints |
| ✅ Workflow automation | Coordinator auto-routes, agents pipe output to next agent |
| ✅ Docker | Dockerfile for each service + Docker Compose |
| ✅ Git/GitHub | Git-ready with .gitignore and commit structure |
| ✅ Technical documentation | This README + FastAPI auto-docs at /docs |
| ✅ AI-powered business automation | Research, summarization, docs, reports — all automated |

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built as a portfolio project demonstrating multi-agent AI systems, API design, and full-stack development.*
