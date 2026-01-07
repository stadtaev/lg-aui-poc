## Project Overview: lg-aui-poc

This is a **LangGraph + Assistant UI Proof of Concept** - a lightweight Python project for testing AI chat connectivity.

### Code Philosophy
- **Idiomatic Python** - Follow established conventions and patterns (PEP 8, PEP 20)
- **Readability first** - Code should be obvious to read and understand
- **Simplicity over cleverness** - Prefer straightforward solutions over complex abstractions

### Structure
```
├── main.py              # FastAPI app entry point
├── agent.py             # LangGraph agent with SQLite checkpointer
├── routers/
│   ├── __init__.py
│   ├── chat.py          # Chat endpoint and schemas
│   └── threads.py       # Thread management endpoints
├── pyproject.toml       # Dependencies (FastAPI, LangGraph, LangChain)
├── run.sh               # Startup script
└── uv.lock              # uv package manager lock file
```

### Tech Stack
- **FastAPI** - Web framework with APIRouter pattern
- **LangGraph** - LLM agent orchestration with checkpointing
- **LangChain-OpenAI** - OpenAI integration
- **SQLite** - Thread persistence via LangGraph checkpointer
- **uv** - Package manager

### Features
- **Conversation threads** - Multi-turn conversations with persistent history
- **Thread management** - List, view history, and delete threads
- **Auto-generated thread IDs** - New conversations get UUID if not provided
- Agent uses `FakeListChatModel` (mock) - swap for real LLM when ready

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message, optionally with `thread_id` |
| GET | `/threads` | List all thread IDs |
| GET | `/threads/{id}/history` | Get conversation history |
| DELETE | `/threads/{id}` | Delete a thread |

### Run the Project
```bash
./run.sh
# or
uv run uvicorn main:app --reload --log-level info
```

API docs available at `http://localhost:8000/docs`
