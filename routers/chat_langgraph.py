"""Streaming chat endpoint compatible with LangGraph's native streaming format."""

import json
import uuid

from assistant_stream import RunController, create_run
from assistant_stream.serialization.assistant_transport import (
    AssistantTransportResponse,
)
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from pydantic import BaseModel

from agent import graph

router = APIRouter(prefix="/api/langgraph", tags=["langgraph"])


class ThreadResponse(BaseModel):
    thread_id: str


class RunInput(BaseModel):
    messages: list[dict]


class ChatInput(BaseModel):
    prompt: str
    thread_id: str | None = None


def message_to_dict(msg: BaseMessage) -> dict:
    """Convert LangChain message to dict format."""
    return {
        "id": msg.id or str(uuid.uuid4()),
        "type": msg.type,
        "content": msg.content,
    }


@router.post("/threads")
def create_thread() -> ThreadResponse:
    """Create a new thread."""
    return ThreadResponse(thread_id=str(uuid.uuid4()))


@router.get("/threads/{thread_id}/states")
def get_thread_state(thread_id: str):
    """Get thread state in LangGraph format."""
    config = {"configurable": {"thread_id": thread_id}}

    try:
        state = graph.get_state(config)
        messages = [message_to_dict(m) for m in state.values.get("messages", [])]
        return {"values": {"messages": messages}}
    except Exception:
        return {"values": {"messages": []}}


@router.post("/threads/{thread_id}/runs/stream")
def stream_run(thread_id: str, request: RunInput):
    """Stream a run in LangGraph's native SSE format."""

    def generate():
        config = {"configurable": {"thread_id": thread_id}}

        # Convert input messages to LangChain format
        lc_messages = []
        for msg in request.messages:
            content = msg.get("content", "")
            if msg.get("type") == "human":
                lc_messages.append(HumanMessage(content=content))
            else:
                lc_messages.append(AIMessage(content=content))

        # Stream using LangGraph's messages mode
        for chunk in graph.stream(
            {"messages": lc_messages},
            config,
            stream_mode="messages",
        ):
            # chunk is (message, metadata) tuple in messages mode
            if isinstance(chunk, tuple):
                msg, metadata = chunk
                if isinstance(msg, AIMessage):
                    # Emit in LangGraph's native format
                    event_data = [message_to_dict(msg)]
                    yield f"event: messages/partial\ndata: {json.dumps(event_data)}\n\n"

        # Signal completion
        yield "event: messages/complete\ndata: []\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/lgchat")
async def lgchat(request: ChatInput):
    """Simple chat endpoint with AssistantTransportResponse streaming."""
    thread_id = request.thread_id or str(uuid.uuid4())

    async def callback(controller: RunController):
        config = {"configurable": {"thread_id": thread_id}}
        input_message = HumanMessage(content=request.prompt)

        for chunk in graph.stream(
            {"messages": [input_message]},
            config,
            stream_mode="messages",
        ):
            if isinstance(chunk, tuple):
                msg, metadata = chunk
                if isinstance(msg, AIMessage) and msg.content:
                    controller.append_text(msg.content)

    return AssistantTransportResponse(create_run(callback))
