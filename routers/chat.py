import uuid

from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from agent import graph

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    thread_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    thread_id: str


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    thread_id = request.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    result = graph.invoke({"messages": [HumanMessage(content=request.message)]}, config)
    reply = result["messages"][-1].content
    return ChatResponse(reply=reply, thread_id=thread_id)
