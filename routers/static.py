from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

router = APIRouter()

static_dir = Path(__file__).parent.parent / "static"


def configure(app):
    """Mount static files if the build directory exists."""
    if not static_dir.exists():
        return

    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
    app.include_router(router)


@router.get("/")
async def serve_index():
    return FileResponse(static_dir / "index.html")
