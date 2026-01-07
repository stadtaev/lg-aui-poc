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

- `POST /chat` - Chat endpoint accepting `{"message": "text"}` and returning `{"reply": "response"}`
- `GET /docs` - OpenAPI documentation
