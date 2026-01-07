## Project Overview: lg-aui-poc

This is a **LangGraph + Assistant UI Proof of Concept** - a full-stack chat application with React frontend and FastAPI backend.

### Code Philosophy
- **Idiomatic Python** - Follow established conventions and patterns (PEP 8, PEP 20)
- **Readability first** - Code should be obvious to read and understand
- **Simplicity over cleverness** - Prefer straightforward solutions over complex abstractions

### Structure
```
├── main.py              # FastAPI app, serves API + static files
├── agent.py             # LangGraph agent with SQLite checkpointer
├── routers/
│   ├── chat.py          # Chat endpoint and schemas
│   ├── threads.py       # Thread management endpoints
│   └── static.py        # Serves built frontend
├── frontend/            # Vite + React app
│   ├── src/
│   │   ├── App.jsx      # Main chat component
│   │   └── App.css      # Styles
│   ├── vite.config.js   # Build config, API proxy
│   └── package.json
├── static/              # Built frontend (gitignored)
├── run.sh               # Production: build + serve
└── run-dev.sh           # Development: hot reload
```

### Tech Stack
**Backend:**
- FastAPI - Web framework with APIRouter pattern
- LangGraph - LLM agent orchestration with checkpointing
- SQLite - Thread persistence via LangGraph checkpointer

**Frontend:**
- React 18 - UI library
- Vite - Build tool
- Plain CSS - Styling

### Features
- **React chat UI** - Minimalistic interface with thread sidebar
- **Conversation threads** - Multi-turn conversations with persistent history
- **Thread management** - List, view history, and delete threads
- **Self-hosted** - Single server serves both API and UI
- Agent uses `FakeListChatModel` (mock) - swap for real LLM when ready

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve React app |
| POST | `/chat` | Send message, optionally with `thread_id` |
| GET | `/threads` | List all thread IDs |
| GET | `/threads/{id}/history` | Get conversation history |
| DELETE | `/threads/{id}` | Delete a thread |

### Run the Project
```bash
# Production (builds frontend, serves on :8000)
./run.sh

# Development (hot reload on :5173, API on :8000)
./run-dev.sh
```

App: `http://localhost:8000` (prod) or `http://localhost:5173` (dev)
API docs: `http://localhost:8000/docs`
