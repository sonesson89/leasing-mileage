from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.api import router as api_router

app = FastAPI(title="Renault Leasing Checker")

# CORS – allow the Vite dev server during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")

# ---------- Serve the built React client ----------
CLIENT_BUILD_DIR = Path(__file__).resolve().parent.parent / "client" / "dist"


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if CLIENT_BUILD_DIR.is_dir():
    # Serve static assets (js, css, images, etc.)
    app.mount("/assets", StaticFiles(directory=CLIENT_BUILD_DIR / "assets"), name="assets")

    # Catch-all: serve index.html for any non-API route (SPA client-side routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file = CLIENT_BUILD_DIR / full_path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(CLIENT_BUILD_DIR / "index.html")
