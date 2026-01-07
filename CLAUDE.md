## Project Overview: lg-aui-poc

This is a **LangGraph + Assistant UI Proof of Concept** - a lightweight Python project for testing AI chat connectivity.

### Code Philosophy
- **Idiomatic Python** - Follow established conventions and patterns (PEP 8, PEP 20)
- **Readability first** - Code should be obvious to read and understand
- **Simplicity over cleverness** - Prefer straightforward solutions over complex abstractions

### Structure
```
├── main.py              # FastAPI app entry point
├── agent.py             # LangGraph agent (currently using mock LLM)
├── routers/
│   ├── __init__.py
│   └── chat.py          # Chat endpoint and schemas
├── pyproject.toml       # Dependencies (FastAPI, LangGraph, LangChain)
├── run.sh               # Startup script
└── uv.lock              # uv package manager lock file
```

### Tech Stack
- **FastAPI** - Web framework with APIRouter pattern
- **LangGraph** - LLM agent orchestration
- **LangChain-OpenAI** - OpenAI integration
- **uv** - Package manager

### Current State
- Single `/chat` endpoint accepts `{"message": "text"}` and returns `{"reply": "response"}`
- Agent uses `FakeListChatModel` (mock) that returns test responses
- Simple START → chatbot → END workflow

### Run the Project
```bash
./run.sh
# or
uv run uvicorn main:app --reload --log-level info
```

API docs available at `http://localhost:8000/docs`
