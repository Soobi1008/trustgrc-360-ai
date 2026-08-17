from dataclasses import dataclass
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


# =========================================================
# AUTHORITATIVE CONTENT RESULT
# =========================================================


@dataclass
class AuthoritativeContentResult:
    """
    Normalised result returned by the regulatory
    source retrieval layer.

    Provenance information is kept together with
    the authoritative regulatory content used by
    the monitoring engine.
    """

    content: str | None
    source_url: str
    retrieval_status: str
    retrieved_at: datetime

    authoritative_identifier: str | None = None
    authoritative_version: str | None = None
    content_type: str | None = None
    error_reason: str | None = None


# =========================================================
# SNAPSHOT RETRIEVAL
# =========================================================


def get_latest_snapshot(
    db: Session,
    source_id: int,
) -> RegulatorySnapshot | None:
    return (
        db.query(RegulatorySnapshot)
        .filter(
            RegulatorySnapshot.source_id
            == source_id
        )
        .order_by(
            RegulatorySnapshot.captured_at.desc(),
            RegulatorySnapshot.id.desc(),
        )
        .first()
    )


# =========================================================
# SNAPSHOT CREATION
# =========================================================


def create_snapshot(
    db: Session,
    source: RegulatorySource,
    content_hash: str,
    normalized_content: str,
    snapshot_type: str,
    provenance: AuthoritativeContentResult,
) -> RegulatorySnapshot:
    """
    Create a regulatory snapshot together with the
    available source-provenance evidence.
    """

    snapshot = RegulatorySnapshot(
        source_id=source.id,
        content_hash=content_hash,
        normalized_content=normalized_content,
        snapshot_type=snapshot_type,

        source_url=provenance.source_url,

        retrieval_status=(
            provenance.retrieval_status
        ),

        content_type=provenance.content_type,

        authoritative_identifier=(
            provenance.authoritative_identifier
        ),

        authoritative_version=(
            provenance.authoritative_version
        ),

        retrieved_at=provenance.retrieved_at,
    )

    db.add(snapshot)
    db.flush()

    return snapshot


# =========================================================
# AUTHORITATIVE CONTENT RETRIEVAL
# =========================================================


async def get_authoritative_content(
    source: RegulatorySource,
) -> AuthoritativeContentResult:
    """
    Retrieve authoritative regulatory content and
    preserve the available provenance metadata.

    EU legislation with a known CELEX identifier is
    retrieved from the Publications Office Cellar
    repository.

    Other official sources continue through the
    source-specific webpage extraction pipeline.

    Unknown provenance values remain None rather than
    being inferred or fabricated.
    """

    retrieved_at = datetime.utcnow()

    celex_id = extract_celex_id(
        source.regulation_code
    )

    # -----------------------------------------------------
    # EU / CELLAR AUTHORITATIVE SOURCE
    # -----------------------------------------------------

    if celex_id:
        result = await fetch_cellar_document(
            celex_id
        )

        if result.source_status != "ok":
            return AuthoritativeContentResult(
                content=None,

                source_url=(
                    result.source_url
                ),

                retrieval_status=(
                    result.source_status
                ),

                retrieved_at=retrieved_at,

                authoritative_identifier=(
                    celex_id
                ),

                authoritative_version=(
                    source.current_version
                ),

                content_type=None,

                error_reason=(
                    result.reason
                    or (
                        "Cellar content could not "
                        "be retrieved."
                    )
                ),
            )

        return AuthoritativeContentResult(
            content=result.content,

            source_url=result.source_url,

            retrieval_status="ok",

            retrieved_at=retrieved_at,

            authoritative_identifier=(
                celex_id
            ),

            authoritative_version=(
                source.current_version
            ),

            content_type=(
                "application/xhtml+xml"
            ),

            error_reason=None,
        )

    # -----------------------------------------------------
    # OTHER AUTHORITATIVE WEB SOURCES
    # -----------------------------------------------------

    try:
        html = await fetch_source(
            source.official_url
        )

    except Exception as exc:
        return AuthoritativeContentResult(
            content=None,

            source_url=(
                source.official_url
            ),

            retrieval_status=(
                "fetch_failed"
            ),

            retrieved_at=retrieved_at,

            authoritative_identifier=None,

            authoritative_version=(
                source.current_version
            ),

            content_type=None,

            error_reason=str(exc),
        )

    normalized_content = extract_content(
        source.official_url,
        html,
    )

    if not normalized_content:
        return AuthoritativeContentResult(
            content=None,

            source_url=(
                source.official_url
            ),

            retrieval_status=(
                "content_validation_failed"
            ),

            retrieved_at=retrieved_at,

            authoritative_identifier=None,

            authoritative_version=(
                source.current_version
            ),

            content_type=None,

            error_reason=(
                "Authoritative regulatory content "
                "could not be retrieved safely."
            ),
        )

    return AuthoritativeContentResult(
        content=normalized_content,

        source_url=source.official_url,

        retrieval_status="ok",

        retrieved_at=retrieved_at,

        authoritative_identifier=None,

        authoritative_version=(
            source.current_version
        ),

        content_type="text/html",

        error_reason=None,
    )


# =========================================================
# SINGLE SOURCE MONITORING
# =========================================================


async def check_regulatory_source(
    db: Session,
    source: RegulatorySource,
) -> dict:
    now = datetime.utcnow()

    provenance = (
        await get_authoritative_content(
            source
        )
    )

    normalized_content = (
        provenance.content
    )

    # -----------------------------------------------------
    # SOURCE RETRIEVAL FAILED
    # -----------------------------------------------------

    if not normalized_content:
        source.last_checked_at = now

        db.commit()

        return {
            "source_id":
                source.id,

            "regulation":
                source.regulation_name,

            "status":
                "source_unavailable",

            "changed":
                False,

            "reason":
                provenance.error_reason,

            "retrieval_status":
                provenance.retrieval_status,

            "source_url":
                provenance.source_url,
        }

    # -----------------------------------------------------
    # HASH AUTHORITATIVE CONTENT
    # -----------------------------------------------------

    new_hash = hashlib.sha256(
        normalized_content.encode(
            "utf-8"
        )
    ).hexdigest()

    previous_snapshot = (
        get_latest_snapshot(
            db,
            source.id,
        )
    )

    source.last_checked_at = now

    # -----------------------------------------------------
    # FIRST SNAPSHOT / BASELINE
    # -----------------------------------------------------

    if previous_snapshot is None:
        baseline_snapshot = create_snapshot(
            db=db,
            source=source,
            content_hash=new_hash,
            normalized_content=(
                normalized_content
            ),
            snapshot_type="baseline",
            provenance=provenance,
        )

        source.content_hash = new_hash

        if source.last_changed_at is None:
            source.last_changed_at = now

        db.commit()

        return {
            "source_id":
                source.id,

            "regulation":
                source.regulation_name,

            "status":
                "snapshot_baseline_created",

            "changed":
                False,

            "snapshot_id":
                baseline_snapshot.id,

            "retrieval_status":
                provenance.retrieval_status,

            "source_url":
                provenance.source_url,

            "authoritative_identifier":
                provenance.authoritative_identifier,
        }

    # -----------------------------------------------------
    # AUTHORITATIVE CONTENT UNCHANGED
    # -----------------------------------------------------

    if (
        previous_snapshot.content_hash
        == new_hash
    ):
        source.content_hash = new_hash

        # -------------------------------------------------
        # LEGACY PROVENANCE BRIDGE
        # -------------------------------------------------
        #
        # Snapshots created before provenance tracking was
        # introduced may contain:
        #
        # retrieval_status = "legacy_unknown"
        # source_url = None
        #
        # If the authoritative content is unchanged, create
        # a NEW provenance baseline rather than rewriting
        # the historical snapshot.
        #
        # This preserves audit integrity while establishing
        # a fully evidenced baseline for future comparison.
        # -------------------------------------------------

        needs_provenance_baseline = (
            previous_snapshot.retrieval_status
            == "legacy_unknown"
            or not previous_snapshot.source_url
        )

        if needs_provenance_baseline:
            provenance_snapshot = (
                create_snapshot(
                    db=db,
                    source=source,
                    content_hash=new_hash,
                    normalized_content=(
                        normalized_content
                    ),
                    snapshot_type=(
                        "provenance_baseline"
                    ),
                    provenance=provenance,
                )
            )

            db.commit()

            return {
                "source_id":
                    source.id,

                "regulation":
                    source.regulation_name,

                "status":
                    "provenance_baseline_created",

                "changed":
                    False,

                "previous_snapshot_id":
                    previous_snapshot.id,

                "snapshot_id":
                    provenance_snapshot.id,

                "retrieval_status":
                    provenance.retrieval_status,

                "source_url":
                    provenance.source_url,

                "authoritative_identifier":
                    provenance.authoritative_identifier,
            }

        db.commit()

        return {
            "source_id":
                source.id,

            "regulation":
                source.regulation_name,

            "status":
                "unchanged",

            "changed":
                False,

            "previous_snapshot_id":
                previous_snapshot.id,

            "retrieval_status":
                provenance.retrieval_status,

            "source_url":
                provenance.source_url,

            "authoritative_identifier":
                provenance.authoritative_identifier,
        }

    # -----------------------------------------------------
    # POTENTIAL AUTHORITATIVE CONTENT CHANGE
    # -----------------------------------------------------

    new_snapshot = create_snapshot(
        db=db,
        source=source,
        content_hash=new_hash,
        normalized_content=(
            normalized_content
        ),
        snapshot_type="change_candidate",
        provenance=provenance,
    )

    # -----------------------------------------------------
    # TECHNICAL COMPARISON
    # -----------------------------------------------------

    analysis = (
        classify_candidate_change(
            previous_snapshot
            .normalized_content,

            normalized_content,
        )
    )

    diff_summary = create_text_diff(
        previous_snapshot.normalized_content,
        normalized_content,
    )

    technical_severity = (
        analysis[
            "technical_severity"
        ]
    )

    difference_ratio = (
        analysis[
            "difference_ratio"
        ]
    )

    similarity_ratio = (
        analysis[
            "similarity_ratio"
        ]
    )

    # -----------------------------------------------------
    # HUMAN-READABLE TECHNICAL SUMMARY
    # -----------------------------------------------------

    summary = (
        "Potential change detected in authoritative "
        "regulatory content.\n\n"

        f"Source URL: "
        f"{provenance.source_url}\n"

        f"Previous snapshot ID: "
        f"{previous_snapshot.id}\n"

        f"New snapshot ID: "
        f"{new_snapshot.id}\n"

        f"Previous hash: "
        f"{previous_snapshot.content_hash}\n"

        f"New hash: "
        f"{new_hash}\n"

        f"Similarity ratio: "
        f"{similarity_ratio}\n"

        f"Difference ratio: "
        f"{difference_ratio}\n"

        f"Technical severity: "
        f"{technical_severity}\n\n"

        "Extracted difference:\n"
        f"{diff_summary}"
    )

    # -----------------------------------------------------
    # CREATE AUDITABLE CHANGE CANDIDATE
    # -----------------------------------------------------

    change = RegulatoryChange(
        source_id=source.id,

        old_hash=(
            previous_snapshot.content_hash
        ),

        new_hash=new_hash,

        previous_snapshot_id=(
            previous_snapshot.id
        ),

        new_snapshot_id=(
            new_snapshot.id
        ),

        technical_severity=(
            technical_severity
        ),

        difference_ratio=(
            difference_ratio
        ),

        evidence_status="captured",

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

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "source_id":
            source.id,

        "regulation":
            source.regulation_name,

        "status":
            "change_candidate_detected",

        "changed":
            True,

        "change_id":
            change.id,

        "previous_snapshot_id":
            previous_snapshot.id,

        "new_snapshot_id":
            new_snapshot.id,

        "technical_severity":
            technical_severity,

        "difference_ratio":
            difference_ratio,

        "evidence_status":
            change.evidence_status,

        "review_status":
            change.review_status,

        "retrieval_status":
            provenance.retrieval_status,

        "source_url":
            provenance.source_url,

        "authoritative_identifier":
            provenance.authoritative_identifier,
    }


# =========================================================
# CHECK ALL ENABLED SOURCES
# =========================================================


async def check_all_sources(
    db: Session,
) -> list[dict]:
    sources = (
        db.query(
            RegulatorySource
        )
        .filter(
            RegulatorySource
            .monitoring_enabled
            .is_(True)
        )
        .all()
    )

    results: list[dict] = []

    for source in sources:
        try:
            result = (
                await check_regulatory_source(
                    db,
                    source,
                )
            )

            results.append(
                result
            )

        except Exception as exc:
            # Roll back any failed SQLAlchemy transaction
            # so one failed authority does not poison the
            # following Regulatory Intelligence checks.
            db.rollback()

            results.append(
                {
                    "source_id":
                        source.id,

                    "regulation":
                        source.regulation_name,

                    "status":
                        "check_failed",

                    "changed":
                        False,

                    "error":
                        str(exc),
                }
            )

    return results