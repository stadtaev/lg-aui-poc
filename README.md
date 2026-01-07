# Langgraph<->assistant-ui poc

Proof of concept for testing assistant-ui connectivity settings with LangGraph backend.

## Setup

```bash
uv sync
```

## Run

```bash
./run.sh
```

## Endpoints

- `POST /chat` - Chat endpoint with thread support
- `GET /threads` - List all conversation threads
- `GET /threads/{id}/history` - Get thread conversation history
- `DELETE /threads/{id}` - Delete a thread
- `GET /docs` - OpenAPI documentation

## Usage

### Start a new conversation

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

Response:
```json
{"reply": "...", "thread_id": "abc-123-..."}
```

### Continue a conversation

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more", "thread_id": "abc-123-..."}'
```

### List all threads

```bash
curl http://localhost:8000/threads
```

### Get conversation history

```bash
curl http://localhost:8000/threads/abc-123-.../history
```

### Delete a thread

```bash
curl -X DELETE http://localhost:8000/threads/abc-123-...
```
