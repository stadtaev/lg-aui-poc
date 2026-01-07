# LangGraph Chat POC

A minimal full-stack chat application with React frontend and LangGraph-powered backend.

## Quick Start

```bash
# Install dependencies
uv sync

# Run (builds frontend + starts server)
./run.sh
```

Open `http://localhost:8000`

## Development

```bash
# Run with hot reload
./run-dev.sh
```

- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:8000` (FastAPI)
- API docs: `http://localhost:8000/docs`

## Features

- Chat UI with conversation threads
- Thread persistence (SQLite)
- Single server deployment

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message |
| GET | `/threads` | List threads |
| GET | `/threads/{id}/history` | Get history |
| DELETE | `/threads/{id}` | Delete thread |

## Tech Stack

- **Backend**: FastAPI, LangGraph, SQLite
- **Frontend**: React, Vite, Plain CSS
