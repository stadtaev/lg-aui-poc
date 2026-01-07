from fastapi import FastAPI

from routers import chat, threads, static

app = FastAPI()

app.include_router(chat.router)
app.include_router(threads.router)
static.configure(app)
