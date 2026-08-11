import re
from dataclasses import dataclass

import httpx
from bs4 import BeautifulSoup


CELLAR_BASE_URL = (
    "https://publications.europa.eu/resource/celex"
)


@dataclass
class EurLexContentResult:
    content: str
    source_status: str
    celex_id: str
    source_url: str
    reason: str | None = None


def clean_legal_text(
    text: str,
) -> str:
    """
    Normalise presentation noise while preserving
    legal wording, dates, article numbers and references.
    """

    text = (
        text.replace("\u200b", "")
        .replace("\u200c", "")
        .replace("\u200d", "")
        .replace("\ufeff", "")
        .replace("\xa0", " ")
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def extract_cellar_xhtml(
    content: str,
) -> str:
    """
    Extract visible legal text from the XHTML
    manifestation returned by Cellar.
    """

    soup = BeautifulSoup(
        content,
        "html.parser",
    )

    for tag_name in [
        "script",
        "style",
        "noscript",
        "svg",
        "canvas",
        "iframe",
        "form",
        "button",
        "nav",
        "footer",
    ]:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    legal_text = soup.get_text(
        separator=" ",
        strip=True,
    )

    return clean_legal_text(
        legal_text
    )


async def fetch_cellar_document(
    celex_id: str,
    language: str = "eng",
) -> EurLexContentResult:
    """
    Retrieve authoritative EU legal content from
    the Publications Office Cellar repository.

    Cellar supports CELEX identifiers and HTTP
    content negotiation.
    """

    url = (
        f"{CELLAR_BASE_URL}/{celex_id}"
    )

    headers = {
        "Accept": "application/xhtml+xml",
        "Accept-Language": language,
        "User-Agent": (
            "TrustGRC-AI-360-Regulatory-Monitor/1.0"
        ),
    }

    try:
        async with httpx.AsyncClient(
            timeout=45.0,
            follow_redirects=True,
        ) as client:
            response = await client.get(
                url,
                headers=headers,
            )

            response.raise_for_status()

    except httpx.TimeoutException:
        return EurLexContentResult(
            content="",
            source_status="connection_timeout",
            celex_id=celex_id,
            source_url=url,
            reason=(
                "Cellar request timed out."
            ),
        )

    except httpx.ConnectError as exc:
        return EurLexContentResult(
            content="",
            source_status="connection_error",
            celex_id=celex_id,
            source_url=url,
            reason=str(exc),
        )

    except httpx.HTTPStatusError as exc:
        return EurLexContentResult(
            content="",
            source_status="http_error",
            celex_id=celex_id,
            source_url=url,
            reason=(
                f"Cellar returned HTTP "
                f"{exc.response.status_code}."
            ),
        )

    content_type = (
        response.headers
        .get("content-type", "")
        .lower()
    )

    raw_content = response.text

    if not raw_content.strip():
        return EurLexContentResult(
            content="",
            source_status="empty_response",
            celex_id=celex_id,
            source_url=str(response.url),
            reason=(
                "Cellar returned an empty response."
            ),
        )

    extracted = extract_cellar_xhtml(
        raw_content
    )

    if len(extracted) < 1000:
        return EurLexContentResult(
            content="",
            source_status="content_validation_failed",
            celex_id=celex_id,
            source_url=str(response.url),
            reason=(
                "Retrieved Cellar content was too short "
                "to be treated as authoritative legal text."
            ),
        )

    # Basic validation that we retrieved legal content,
    # rather than an error/intermediary page.
    lowered = extracted.lower()

    legal_markers = [
        "regulation",
        "article",
        "official journal",
        "european union",
    ]

    marker_hits = sum(
        marker in lowered
        for marker in legal_markers
    )

    if marker_hits < 2:
        return EurLexContentResult(
            content="",
            source_status="content_validation_failed",
            celex_id=celex_id,
            source_url=str(response.url),
            reason=(
                "Retrieved content did not contain "
                "sufficient legal-document markers."
            ),
        )

    return EurLexContentResult(
        content=extracted,
        source_status="ok",
        celex_id=celex_id,
        source_url=str(response.url),
        reason=None,
    )


def extract_celex_id(
    regulation_code: str,
) -> str | None:
    """
    Temporary TrustGRC mapping.

    Later this should come from the RegulatorySource
    database rather than being embedded in code.
    """

    mapping = {
        "EU_AI_ACT": "32024R1689",
        "GDPR": "32016R0679",
    }

    return mapping.get(
        regulation_code
    )