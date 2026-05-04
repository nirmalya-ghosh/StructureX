"""
StructureX — FastAPI Application Entry Point
Serves the API and static frontend files.
"""

import sys
from pathlib import Path

# Ensure project root is in path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import API_HOST, API_PORT, CORS_ORIGINS, FRONTEND_DIR
from backend.api.routes import router

# ──────────────────────────────────────────────
# App Configuration
# ──────────────────────────────────────────────
app = FastAPI(
    title="StructureX",
    description="Smart City Infrastructure Failure Detection System",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(router, prefix="/api")


# ──────────────────────────────────────────────
# Static files and frontend serving
# ──────────────────────────────────────────────
@app.get("/")
async def serve_root():
    """Redirect to login if not authenticated (handled by frontend), 
    but serve index.html as the main entry."""
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/login")
async def serve_login():
    """Serve the authentication page."""
    return FileResponse(FRONTEND_DIR / "auth.html")


@app.get("/dashboard")
async def serve_dashboard():
    """Serve the dashboard page."""
    return FileResponse(FRONTEND_DIR / "index.html")


# Mount static files
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "StructureX"}


if __name__ == "__main__":
    import uvicorn
    print(f"Starting StructureX API on http://localhost:{API_PORT}")
    print(f"Dashboard: http://localhost:{API_PORT}/")
    uvicorn.run(app, host=API_HOST, port=API_PORT)
