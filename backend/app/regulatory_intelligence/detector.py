from datetime import datetime
import hashlib

from sqlalchemy.orm import Session

from .comparator import (
    classify_candidate_change,
    create_text_diff,
)
from .eurlex_adapter import (
    extract_celex_id,
    fetch_cellar_document,
)
from .fetcher import (
    extract_content,
    fetch_source,
)
from .models import (
    RegulatoryChange,
    RegulatorySnapshot,
    RegulatorySource,
)


def get_latest_snapshot(
    db: Session,
    source_id: int,
) -> RegulatorySnapshot | None:
    return (
        db.query(RegulatorySnapshot)
        .filter(
            RegulatorySnapshot.source_id == source_id
        )
        .order_by(
            RegulatorySnapshot.captured_at.desc(),
            RegulatorySnapshot.id.desc(),
        )
        .first()
    )


def create_snapshot(
    db: Session,
    source: RegulatorySource,
    content_hash: str,
    normalized_content: str,
    snapshot_type: str,
) -> RegulatorySnapshot:
    snapshot = RegulatorySnapshot(
        source_id=source.id,
        content_hash=content_hash,
        normalized_content=normalized_content,
        snapshot_type=snapshot_type,
    )

    db.add(snapshot)
    db.flush()

    return snapshot


async def get_authoritative_content(
    source: RegulatorySource,
) -> tuple[str | None, str | None]:
    """
    Retrieve authoritative normalized regulatory content.

    EU legislation with a known CELEX identifier is retrieved
    from the Publications Office Cellar repository.

    Other official sources continue through the normal
    source-specific webpage extraction pipeline.

    Returns:
        (content, error_reason)
    """

    celex_id = extract_celex_id(
        source.regulation_code
    )

    if celex_id:
        result = await fetch_cellar_document(
            celex_id
        )

        if result.source_status != "ok":
            return (
                None,
                result.reason
                or "Cellar content could not be retrieved.",
            )

        return result.content, None

    html = await fetch_source(
        source.official_url
    )

    normalized_content = extract_content(
        source.official_url,
        html,
    )

    if not normalized_content:
        return (
            None,
            "Authoritative regulatory content "
            "could not be retrieved safely.",
        )

    return normalized_content, None


async def check_regulatory_source(
    db: Session,
    source: RegulatorySource,
) -> dict:
    now = datetime.utcnow()

    normalized_content, error_reason = (
        await get_authoritative_content(source)
    )

    if not normalized_content:
        source.last_checked_at = now
        db.commit()

        return {
            "source_id": source.id,
            "regulation": source.regulation_name,
            "status": "source_unavailable",
            "changed": False,
            "reason": error_reason,
        }

    new_hash = hashlib.sha256(
        normalized_content.encode("utf-8")
    ).hexdigest()

    previous_snapshot = get_latest_snapshot(
        db,
        source.id,
    )

    source.last_checked_at = now

    # No snapshot exists yet.
    if previous_snapshot is None:
        create_snapshot(
            db=db,
            source=source,
            content_hash=new_hash,
            normalized_content=normalized_content,
            snapshot_type="baseline",
        )

        source.content_hash = new_hash

        if source.last_changed_at is None:
            source.last_changed_at = now

        db.commit()

        return {
            "source_id": source.id,
            "regulation": source.regulation_name,
            "status": "snapshot_baseline_created",
            "changed": False,
        }

    # Authoritative content unchanged.
    if previous_snapshot.content_hash == new_hash:
        source.content_hash = new_hash
        db.commit()

        return {
            "source_id": source.id,
            "regulation": source.regulation_name,
            "status": "unchanged",
            "changed": False,
        }

    # Potential authoritative-content change.
    new_snapshot = create_snapshot(
        db=db,
        source=source,
        content_hash=new_hash,
        normalized_content=normalized_content,
        snapshot_type="change_candidate",
    )

    analysis = classify_candidate_change(
        previous_snapshot.normalized_content,
        normalized_content,
    )

    diff_summary = create_text_diff(
        previous_snapshot.normalized_content,
        normalized_content,
    )

    summary = (
        "Potential change detected in authoritative "
        "regulatory content.\n\n"
        f"Previous snapshot ID: {previous_snapshot.id}\n"
        f"New snapshot ID: {new_snapshot.id}\n"
        f"Similarity ratio: {analysis['similarity_ratio']}\n"
        f"Difference ratio: {analysis['difference_ratio']}\n"
        f"Technical severity: {analysis['technical_severity']}\n\n"
        "Extracted difference:\n"
        f"{diff_summary}"
    )

    change = RegulatoryChange(
        source_id=source.id,
        old_hash=previous_snapshot.content_hash,
        new_hash=new_hash,
        change_type="unclassified",
        review_status="pending_review",
        impact_status="not_analysed",
        summary=summary,
    )

    db.add(change)

    source.content_hash = new_hash
    source.last_changed_at = now

    db.commit()
    db.refresh(change)

    return {
        "source_id": source.id,
        "regulation": source.regulation_name,
        "status": "change_candidate_detected",
        "changed": True,
        "change_id": change.id,
        "previous_snapshot_id": previous_snapshot.id,
        "new_snapshot_id": new_snapshot.id,
        "technical_severity": analysis["technical_severity"],
        "difference_ratio": analysis["difference_ratio"],
        "review_status": change.review_status,
    }


async def check_all_sources(
    db: Session,
) -> list[dict]:
    sources = (
        db.query(RegulatorySource)
        .filter(
            RegulatorySource.monitoring_enabled.is_(True)
        )
        .all()
    )

    results: list[dict] = []

    for source in sources:
        try:
            result = await check_regulatory_source(
                db,
                source,
            )

            results.append(result)

        except Exception as exc:
            results.append(
                {
                    "source_id": source.id,
                    "regulation": source.regulation_name,
                    "status": "check_failed",
                    "changed": False,
                    "error": str(exc),
                }
            )

    return results