from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent import checkpointer

router = APIRouter(prefix="/threads", tags=["threads"])


class Message(BaseModel):
    role: str
    content: str


class ThreadListResponse(BaseModel):
    thread_ids: list[str]


class ThreadHistoryResponse(BaseModel):
    thread_id: str
    messages: list[Message]


@router.get("", response_model=ThreadListResponse)
def list_threads() -> ThreadListResponse:
    thread_ids = set()
    for checkpoint in checkpointer.list(None):
        thread_id = checkpoint.config.get("configurable", {}).get("thread_id")
        if thread_id:
            thread_ids.add(thread_id)
    return ThreadListResponse(thread_ids=sorted(thread_ids))


@router.get("/{thread_id}/history", response_model=ThreadHistoryResponse)
def get_thread_history(thread_id: str) -> ThreadHistoryResponse:
    config = {"configurable": {"thread_id": thread_id}}
    checkpoint = checkpointer.get(config)
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = []
    for msg in checkpoint.get("channel_values", {}).get("messages", []):
        role = "assistant" if msg.type == "ai" else "user"
        messages.append(Message(role=role, content=msg.content))

    return ThreadHistoryResponse(thread_id=thread_id, messages=messages)


@router.delete("/{thread_id}")
def delete_thread(thread_id: str) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    checkpoint = checkpointer.get(config)
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Thread not found")

    checkpointer.delete_thread(thread_id)
    return {"status": "deleted", "thread_id": thread_id}
