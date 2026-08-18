from datetime import datetime

from sqlalchemy.orm import Session

from app.models.regulation import Regulation
from app.models.regulation_article import RegulationArticle

from .eurlex_adapter import (
    EurLexContentResult,
    EurLexProvision,
    extract_articles_from_xhtml,
    fetch_cellar_document,
)


# =========================================================
# ERRORS
# =========================================================

class ProvisionSyncError(Exception):
    """
    Raised when authoritative provision
    synchronisation cannot be completed safely.
    """


# =========================================================
# HELPERS
# =========================================================

def get_regulation_or_error(
    db: Session,
    regulation_id: int,
) -> Regulation:
    regulation = (
        db.query(Regulation)
        .filter(
            Regulation.id == regulation_id
        )
        .first()
    )

    if regulation is None:
        raise ProvisionSyncError(
            "Canonical regulation not found."
        )

    return regulation


def normalise_article_reference(
    article_number: str,
) -> str:
    cleaned = article_number.strip()

    if cleaned.lower().startswith(
        "article "
    ):
        return cleaned

    return f"Article {cleaned}"


def normalise_article_number(
    article_number: str,
) -> str:
    cleaned = article_number.strip()

    if cleaned.lower().startswith(
        "article "
    ):
        cleaned = cleaned[8:].strip()

    return cleaned


def get_article_or_error(
    db: Session,
    regulation_id: int,
    article_number: str,
) -> RegulationArticle:
    canonical_reference = (
        normalise_article_reference(
            article_number
        )
    )

    article = (
        db.query(RegulationArticle)
        .filter(
            RegulationArticle.regulation_id
            == regulation_id,
            RegulationArticle.article_number
            == canonical_reference,
        )
        .first()
    )

    if article is None:
        raise ProvisionSyncError(
            (
                "Canonical regulation Article "
                f"{canonical_reference} was not found."
            )
        )

    return article


def validate_fetch_result(
    result: EurLexContentResult,
) -> None:
    if result.source_status != "ok":
        raise ProvisionSyncError(
            (
                "Authoritative EUR-Lex content "
                "could not be retrieved: "
                f"{result.source_status}"
            )
        )

    if not result.raw_xhtml:
        raise ProvisionSyncError(
            (
                "Authoritative EUR-Lex response "
                "did not contain XHTML suitable "
                "for provision extraction."
            )
        )


def build_provision_map(
    result: EurLexContentResult,
) -> dict[str, EurLexProvision]:
    """
    Parse the authoritative document once and
    return Articles indexed by their normalized
    Article number.

    Example:
        "9" -> EurLexProvision(...)
        "10" -> EurLexProvision(...)
    """

    validate_fetch_result(
        result
    )

    provisions = (
        extract_articles_from_xhtml(
            raw_xhtml=result.raw_xhtml,
            celex_id=result.celex_id,
            source_url=result.source_url,
        )
    )

    provision_map: dict[
        str,
        EurLexProvision,
    ] = {}

    for provision in provisions:
        if (
            provision.provision_type
            != "article"
        ):
            continue

        key = (
            normalise_article_number(
                provision.number
            )
            .casefold()
        )

        provision_map[key] = provision

    if not provision_map:
        raise ProvisionSyncError(
            (
                "No Article provisions could "
                "be extracted from the "
                "authoritative EUR-Lex document."
            )
        )

    return provision_map


def get_provision_or_error(
    provision_map: dict[
        str,
        EurLexProvision,
    ],
    article_number: str,
) -> EurLexProvision:
    requested = (
        normalise_article_number(
            article_number
        )
        .casefold()
    )

    provision = (
        provision_map.get(
            requested
        )
    )

    if provision is None:
        raise ProvisionSyncError(
            (
                "Requested Article "
                f"{normalise_article_reference(article_number)} "
                "could not be extracted from the "
                "authoritative EUR-Lex document."
            )
        )

    expected_reference = (
        normalise_article_reference(
            article_number
        )
    )

    if (
        provision.reference.casefold()
        != expected_reference.casefold()
    ):
        raise ProvisionSyncError(
            (
                "Extracted provision reference "
                "does not match the requested "
                "canonical Article reference."
            )
        )

    if (
        len(
            provision.official_text.strip()
        )
        < 25
    ):
        raise ProvisionSyncError(
            (
                "Extracted Article text was too "
                "short to be treated as "
                "authoritative legal content."
            )
        )

    return provision


# =========================================================
# SINGLE ARTICLE SYNC USING PRE-FETCHED DOCUMENT
# =========================================================

def sync_article_from_result(
    db: Session,
    *,
    regulation: Regulation,
    result: EurLexContentResult,
    provision_map: dict[
        str,
        EurLexProvision,
    ],
    article_number: str,
    verified_at: datetime,
) -> dict:
    """
    Synchronise one Article from an already-fetched
    authoritative EUR-Lex document.

    This function does not commit.
    The caller controls the transaction.
    """

    article = (
        get_article_or_error(
            db,
            regulation.id,
            article_number,
        )
    )

    provision = (
        get_provision_or_error(
            provision_map,
            article_number,
        )
    )

    previous_text = (
        article.official_text
        or ""
    )

    new_text = (
        provision.official_text
    )

    changed = (
        previous_text.strip()
        != new_text.strip()
    )

    article.official_text = (
        new_text
    )

    article.source_url = (
        provision.source_url
    )

    if (
        not article.title
        and provision.title
    ):
        article.title = (
            provision.title
        )

    article.last_verified_at = (
        verified_at
    )

    return {
        "status":
            (
                "updated"
                if changed
                else "verified_unchanged"
            ),

        "regulation_id":
            regulation.id,

        "regulation":
            regulation.name,

        "article_id":
            article.id,

        "article_number":
            article.article_number,

        "title":
            article.title,

        "official_text_length":
            len(
                article.official_text
                or ""
            ),

        "source_url":
            article.source_url,

        "celex_id":
            result.celex_id,

        "last_verified_at":
            article.last_verified_at,
    }


# =========================================================
# SINGLE ARTICLE SYNCHRONISATION
# =========================================================

async def sync_eurlex_article(
    db: Session,
    *,
    regulation_id: int,
    celex_id: str,
    article_number: str,
) -> dict:
    """
    Synchronise one canonical EU Article from the
    authoritative EUR-Lex / Cellar source.

    Only canonical provision data is updated:

    - official_text
    - source_url
    - title when currently missing
    - last_verified_at

    Derived obligations and controls are not
    modified automatically.
    """

    regulation = (
        get_regulation_or_error(
            db,
            regulation_id,
        )
    )

    result = (
        await fetch_cellar_document(
            celex_id
        )
    )

    validate_fetch_result(
        result
    )

    provision_map = (
        build_provision_map(
            result
        )
    )

    verified_at = (
        datetime.utcnow()
    )

    try:
        sync_result = (
            sync_article_from_result(
                db,
                regulation=regulation,
                result=result,
                provision_map=provision_map,
                article_number=article_number,
                verified_at=verified_at,
            )
        )

        regulation.last_verified_at = (
            verified_at
        )

        db.commit()

        return sync_result

    except Exception:
        db.rollback()
        raise


# =========================================================
# OPTIMIZED MULTI-ARTICLE SYNCHRONISATION
# =========================================================

async def sync_eurlex_articles(
    db: Session,
    *,
    regulation_id: int,
    celex_id: str,
    article_numbers: list[str],
) -> list[dict]:
    """
    Synchronise multiple canonical Articles from
    one authoritative EUR-Lex fetch.

    Important behaviour:

    - The Cellar document is fetched once.
    - The XHTML is parsed once.
    - Every requested Article is validated before
      commit.
    - The batch is atomic.
    - If one Article fails, no Article in the batch
      is committed.
    - Derived obligations and controls remain
      untouched.
    """

    if not article_numbers:
        return []

    regulation = (
        get_regulation_or_error(
            db,
            regulation_id,
        )
    )

    # -----------------------------------------------------
    # ONE AUTHORITATIVE FETCH
    # -----------------------------------------------------

    result = (
        await fetch_cellar_document(
            celex_id
        )
    )

    validate_fetch_result(
        result
    )

    # -----------------------------------------------------
    # ONE DOCUMENT PARSE
    # -----------------------------------------------------

    provision_map = (
        build_provision_map(
            result
        )
    )

    verified_at = (
        datetime.utcnow()
    )

    # -----------------------------------------------------
    # VALIDATE ALL REQUESTED ARTICLES BEFORE WRITING
    # -----------------------------------------------------

    validated_pairs: list[
        tuple[
            RegulationArticle,
            EurLexProvision,
        ]
    ] = []

    seen_references: set[
        str
    ] = set()

    for article_number in article_numbers:
        normalized = (
            normalise_article_number(
                article_number
            )
            .casefold()
        )

        if normalized in seen_references:
            raise ProvisionSyncError(
                (
                    "Duplicate Article requested "
                    "in synchronisation batch: "
                    f"{normalise_article_reference(article_number)}"
                )
            )

        seen_references.add(
            normalized
        )

        article = (
            get_article_or_error(
                db,
                regulation_id,
                article_number,
            )
        )

        provision = (
            get_provision_or_error(
                provision_map,
                article_number,
            )
        )

        validated_pairs.append(
            (
                article,
                provision,
            )
        )

    # -----------------------------------------------------
    # APPLY ALL CHANGES IN ONE TRANSACTION
    # -----------------------------------------------------

    results: list[
        dict
    ] = []

    try:
        for (
            article,
            provision,
        ) in validated_pairs:
            previous_text = (
                article.official_text
                or ""
            )

            new_text = (
                provision.official_text
            )

            changed = (
                previous_text.strip()
                != new_text.strip()
            )

            article.official_text = (
                new_text
            )

            article.source_url = (
                provision.source_url
            )

            if (
                not article.title
                and provision.title
            ):
                article.title = (
                    provision.title
                )

            article.last_verified_at = (
                verified_at
            )

            results.append(
                {
                    "status":
                        (
                            "updated"
                            if changed
                            else "verified_unchanged"
                        ),

                    "regulation_id":
                        regulation.id,

                    "regulation":
                        regulation.name,

                    "article_id":
                        article.id,

                    "article_number":
                        article.article_number,

                    "title":
                        article.title,

                    "official_text_length":
                        len(
                            article.official_text
                            or ""
                        ),

                    "source_url":
                        article.source_url,

                    "celex_id":
                        result.celex_id,

                    "last_verified_at":
                        article.last_verified_at,
                }
            )

        regulation.last_verified_at = (
            verified_at
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return results