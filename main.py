from fastapi import FastAPI
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from agent import graph

app = FastAPI()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    result = graph.invoke({"messages": [HumanMessage(content=request.message)]})
    reply = result["messages"][-1].content
    return ChatResponse(reply=reply)
