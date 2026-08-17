"""eye see backend — FastAPI service that proxies vision + navigation APIs.

Keeps Gemini and Google Maps keys server-side so the mobile app never ships
secrets in its client bundle.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .routers import health, navigation, vision

app = FastAPI(
    title="eye see backend",
    description="Real-time AI guide for blind and low-vision users.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(vision.router, prefix="/api/v1/vision", tags=["vision"])
app.include_router(navigation.router, prefix="/api/v1/navigation", tags=["navigation"])


@app.get("/")
def root():
    return {"service": "eye see backend", "docs": "/docs", "health": "/health"}
