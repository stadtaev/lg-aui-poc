  ⎿ ## Project Overview: lg-aui-poc

    This is a **LangGraph + Assistant UI Proof of Concept** - a lightweight Python
     project for testing AI chat connectivity.

    ### Structure
    ```
    ├── main.py          # FastAPI app with POST /chat endpoint
    ├── agent.py         # LangGraph agent (currently using mock LLM)
    ├── pyproject.toml   # Dependencies (FastAPI, LangGraph, LangChain)
    ├── run.sh           # Startup script
    └── uv.lock          # uv package manager lock file
    ```

    ### Tech Stack
    - **FastAPI** - Web framework
    - **LangGraph** - LLM agent orchestration
    - **LangChain-OpenAI** - OpenAI integration
    - **uv** - Package manager

    ### Current State
    - Single `/chat` endpoint accepts `{"message": "text"}` and returns `{"reply":
     "response"}`
    - Agent uses `FakeListChatModel` (mock) that returns test responses
    - Simple START → chatbot → END workflow

    ### Run the Project
    ```bash
    ./run.sh
    # or
    uv run uvicorn main:app --reload --log-level info
    ```

    API docs available at `http://localhost:8000/docs`

    What would you like to do with this project?