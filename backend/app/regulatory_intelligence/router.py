from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db

from .detector import (
    check_all_sources,
    check_regulatory_source,
)
from .models import (
    RegulatoryChange,
    RegulatorySnapshot,
    RegulatorySource,
)
from .schemas import (
    RegulatoryChangeResponse,
    RegulatorySnapshotResponse,
    RegulatorySourceResponse,
)
from .sources import seed_regulatory_sources


router = APIRouter(
    prefix="/api/v1/regulatory-intelligence",
    tags=["Regulatory Intelligence"],
)


@router.post("/seed")
def seed_sources(
    db: Session = Depends(get_db),
):
    created = seed_regulatory_sources(db)

    return {
        "message": "Regulatory source registry seeded.",
        "created": created,
    }


@router.get(
    "/sources",
    response_model=list[RegulatorySourceResponse],
)
def list_sources(
    db: Session = Depends(get_db),
):
    return (
        db.query(RegulatorySource)
        .order_by(
            RegulatorySource.jurisdiction_name,
            RegulatorySource.regulation_name,
        )
        .all()
    )


@router.get("/jurisdictions")
def list_jurisdictions(
    db: Session = Depends(get_db),
):
    sources = (
        db.query(RegulatorySource)
        .filter(
            RegulatorySource.monitoring_enabled.is_(True)
        )
        .all()
    )

    jurisdictions: dict[str, dict] = {}

    for source in sources:
        code = source.jurisdiction_code

        if code not in jurisdictions:
            jurisdictions[code] = {
                "code": code,
                "name": source.jurisdiction_name,
                "regulations": 0,
            }

        jurisdictions[code]["regulations"] += 1

    return sorted(
        jurisdictions.values(),
        key=lambda item: item["name"],
    )


@router.post("/sources/{source_id}/check")
async def check_source(
    source_id: int,
    db: Session = Depends(get_db),
):
    source = (
        db.query(RegulatorySource)
        .filter(
            RegulatorySource.id == source_id
        )
        .first()
    )

    if source is None:
        raise HTTPException(
            status_code=404,
            detail="Regulatory source not found.",
        )

    return await check_regulatory_source(
        db,
        source,
    )


@router.post("/check-all")
async def check_sources(
    db: Session = Depends(get_db),
):
    return await check_all_sources(db)


@router.get(
    "/changes",
    response_model=list[RegulatoryChangeResponse],
)
def list_changes(
    db: Session = Depends(get_db),
):
    return (
        db.query(RegulatoryChange)
        .order_by(
            RegulatoryChange.detected_at.desc(),
            RegulatoryChange.id.desc(),
        )
        .all()
    )


@router.get(
    "/snapshots",
    response_model=list[RegulatorySnapshotResponse],
)
def list_snapshots(
    db: Session = Depends(get_db),
):
    return (
        db.query(RegulatorySnapshot)
        .order_by(
            RegulatorySnapshot.captured_at.desc(),
            RegulatorySnapshot.id.desc(),
        )
        .all()
    )


@router.get(
    "/sources/{source_id}/snapshots",
    response_model=list[RegulatorySnapshotResponse],
)
def list_source_snapshots(
    source_id: int,
    db: Session = Depends(get_db),
):
    source = (
        db.query(RegulatorySource)
        .filter(
            RegulatorySource.id == source_id
        )
        .first()
    )

    if source is None:
        raise HTTPException(
            status_code=404,
            detail="Regulatory source not found.",
        )

    return (
        db.query(RegulatorySnapshot)
        .filter(
            RegulatorySnapshot.source_id == source_id
        )
        .order_by(
            RegulatorySnapshot.captured_at.desc(),
            RegulatorySnapshot.id.desc(),
        )
        .all()
    )