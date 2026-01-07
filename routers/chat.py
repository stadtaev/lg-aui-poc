from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from agent import graph

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    result = graph.invoke({"messages": [HumanMessage(content=request.message)]})
    reply = result["messages"][-1].content
    return ChatResponse(reply=reply)
