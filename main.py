from fastapi import FastAPI

from routers import chat, chat_aui, chat_langgraph, threads, static

app = FastAPI()

app.include_router(chat.router)
app.include_router(chat_aui.router)
app.include_router(chat_langgraph.router)
app.include_router(threads.router)
static.configure(app)
