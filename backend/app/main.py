from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai_systems import router as ai_systems_router
from app.api.intelligence import router as intelligence_router
from app.api.organizations import router as organizations_router
from app.api.auth import router as auth_router
from app.api.admin_users import router as admin_users_router
from app.api.risks import router as risks_router
from app.api.assessments import router as assessments_router

from app.api.v1.regulations import router as regulations_router
from app.api.v1.applicability import router as applicability_router

from app.regulatory_intelligence.router import (
    router as regulatory_intelligence_router,
)

from app.db.base import Base
from app.db.session import engine

import app.models  # Registers existing SQLAlchemy models
import app.regulatory_intelligence.models  # Registers regulatory intelligence models


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="TrustGRC AI 360 API",
    description="Backend API for the TrustGRC AI 360 platform",
    version="0.1.0",
)


# CORS
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


# Existing platform routers
app.include_router(organizations_router)
app.include_router(ai_systems_router)
app.include_router(intelligence_router)
app.include_router(auth_router)
app.include_router(admin_users_router)
app.include_router(risks_router)
app.include_router(assessments_router)


# Regulatory Library
app.include_router(
    regulations_router,
    prefix="/api/v1/regulations",
    tags=["Regulatory Library"],
)


# Applicability Engine
app.include_router(
    applicability_router,
    prefix="/api/v1/applicability",
    tags=["Applicability Engine"],
)


# Regulatory Intelligence Engine
app.include_router(regulatory_intelligence_router)


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