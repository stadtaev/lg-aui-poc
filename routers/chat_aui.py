"""Chat endpoint compatible with assistant-ui's useExternalStoreRuntime."""

import uuid

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from agent import graph

router = APIRouter(prefix="/chat-aui-es", tags=["chat-aui"])


class TextContent(BaseModel):
    type: str = "text"
    text: str


class Message(BaseModel):
    id: str
    role: str
    content: list[TextContent]


class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None


class ChatResponse(BaseModel):
    thread_id: str
    messages: list[Message]


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    thread_id = request.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    result = graph.invoke(
        {"messages": [HumanMessage(content=request.message)]},
        config,
    )

    messages = []
    for msg in result["messages"]:
        role = "assistant" if msg.type == "ai" else "user"
        messages.append(Message(
            id=msg.id or str(uuid.uuid4()),
            role=role,
            content=[TextContent(text=msg.content)],
        ))

    return ChatResponse(thread_id=thread_id, messages=messages)
