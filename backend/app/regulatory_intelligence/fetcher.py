import hashlib

import httpx

from .adapters import extract_regulatory_content


DEFAULT_HEADERS = {
    "User-Agent": (
        "TrustGRC-AI-360-Regulatory-Monitor/1.0 "
        "(Regulatory compliance monitoring)"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,"
        "application/xml;q=0.9,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


async def fetch_source(
    url: str,
) -> str:
    async with httpx.AsyncClient(
        timeout=30.0,
        follow_redirects=True,
        headers=DEFAULT_HEADERS,
    ) as client:
        response = await client.get(url)

        response.raise_for_status()

        return response.text


def create_content_hash(
    url: str,
    content: str,
) -> str | None:
    meaningful_content = (
        extract_regulatory_content(
            url=url,
            html=content,
        )
    )

    if not meaningful_content:
        return None

    return hashlib.sha256(
        meaningful_content.encode("utf-8")
    ).hexdigest()


def extract_content(
    url: str,
    content: str,
) -> str:
    """
    Public helper used later for snapshots,
    comparison and change classification.
    """

    return extract_regulatory_content(
        url=url,
        html=content,
    )