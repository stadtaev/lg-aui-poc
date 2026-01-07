import sqlite3
from datetime import datetime
from typing import Annotated

from langchain_core.language_models import FakeListChatModel
from langchain_core.messages import AIMessage
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class State(TypedDict):
    messages: Annotated[list, add_messages]


llm = FakeListChatModel(responses=[
    "I'm not a real AI, but I play one on localhost.",
    "Error 418: I'm a teapot. Just kidding, I'm a fake LLM.",
    "I asked GPT for help, but it said I'm on my own.",
    "Beep boop. That's all the intelligence I've got.",
    "I'd give you a real answer, but my neurons are on vacation.",
])


def chatbot(state: State) -> State:
    response = llm.invoke(state["messages"])
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    content = f"{response.content} [{timestamp}]"
    return {"messages": [AIMessage(content=content)]}


graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)

_conn = sqlite3.connect("conversations.db", check_same_thread=False)
checkpointer = SqliteSaver(_conn)
graph = graph_builder.compile(checkpointer=checkpointer)
