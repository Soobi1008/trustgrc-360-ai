from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai_systems import router as ai_systems_router
from app.api.intelligence import router as intelligence_router
from app.api.organizations import router as organizations_router
from app.db.base import Base
from app.db.session import engine

import app.models  # Registers all SQLAlchemy models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrustGRC AI 360 API",
    description="Backend API for the TrustGRC AI 360 platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organizations_router)
app.include_router(ai_systems_router)
app.include_router(intelligence_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "application": "TrustGRC AI 360",
        "message": "TrustGRC AI 360 API is running",
        "version": "0.1.0",
    }


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "trustgrc-api",
    }


@app.get("/api/v1/version")
async def version() -> dict[str, str]:
    return {
        "name": "TrustGRC AI 360 API",
        "version": "0.1.0",
    }