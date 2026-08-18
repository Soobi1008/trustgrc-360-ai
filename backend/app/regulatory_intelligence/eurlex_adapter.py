import re
from dataclasses import dataclass

import httpx
from bs4 import BeautifulSoup
from bs4.element import Tag


CELLAR_BASE_URL = (
    "https://publications.europa.eu/resource/celex"
)


# =========================================================
# EUR-LEX DOCUMENT RESULT
# =========================================================

@dataclass
class EurLexContentResult:
    content: str
    source_status: str
    celex_id: str
    source_url: str
    reason: str | None = None

    # Raw XHTML is retained separately so the
    # Regulatory Library can extract individual
    # provisions without re-fetching the source.
    raw_xhtml: str | None = None

    content_type: str | None = None


# =========================================================
# EUR-LEX PROVISION RESULT
# =========================================================

@dataclass
class EurLexProvision:
    """
    One structured legal provision extracted from
    the authoritative EUR-Lex / Cellar document.

    The current implementation focuses on EU
    Articles but uses generic terminology so the
    Regulatory Library can evolve toward sections,
    clauses and other provision types later.
    """

    provision_type: str

    reference: str

    number: str

    title: str | None

    official_text: str

    celex_id: str

    source_url: str


# =========================================================
# TEXT NORMALISATION
# =========================================================

def clean_legal_text(
    text: str,
) -> str:
    """
    Normalise presentation noise while preserving
    legal wording, dates, Article numbers,
    paragraph numbers and references.

    This function is suitable for monitoring and
    individual provision extraction.
    """

    text = (
        text.replace("\u200b", "")
        .replace("\u200c", "")
        .replace("\u200d", "")
        .replace("\ufeff", "")
        .replace("\xa0", " ")
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\s*\n\s*",
        "\n",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# =========================================================
# FULL DOCUMENT EXTRACTION
# =========================================================

def extract_cellar_xhtml(
    content: str,
) -> str:
    """
    Extract visible legal text from the XHTML
    manifestation returned by Cellar.

    This remains the normalized full-document text
    used by Regulatory Intelligence hashing and
    source-change detection.
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
        for tag in soup.find_all(
            tag_name
        ):
            tag.decompose()

    legal_text = soup.get_text(
        separator=" ",
        strip=True,
    )

    legal_text = re.sub(
        r"\s+",
        " ",
        legal_text,
    )

    return legal_text.strip()


# =========================================================
# ARTICLE HEADING DETECTION
# =========================================================

ARTICLE_HEADING_PATTERN = re.compile(
    r"^\s*Article\s+(\d+[A-Za-z]?)\s*$",
    re.IGNORECASE,
)


def _normalise_node_text(
    node: Tag,
) -> str:
    return clean_legal_text(
        node.get_text(
            separator="\n",
            strip=True,
        )
    )


def _find_article_heading_tags(
    soup: BeautifulSoup,
) -> list[
    tuple[
        Tag,
        str,
    ]
]:
    """
    Identify DOM nodes whose visible text is
    exactly an Article heading, for example:

        Article 9
        Article 10

    We deliberately require the entire node text
    to match so references such as
    'in accordance with Article 9' are not
    mistaken for headings.
    """

    results: list[
        tuple[
            Tag,
            str,
        ]
    ] = []

    for tag in soup.find_all(
        [
            "p",
            "div",
            "span",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
        ]
    ):
        text = (
            tag.get_text(
                " ",
                strip=True,
            )
        )

        match = (
            ARTICLE_HEADING_PATTERN
            .fullmatch(
                text
            )
        )

        if match is None:
            continue

        results.append(
            (
                tag,
                match.group(1),
            )
        )

    return results


# =========================================================
# GENERIC TEXT FALLBACK ARTICLE EXTRACTION
# =========================================================

def _extract_articles_from_text(
    legal_text: str,
    celex_id: str,
    source_url: str,
) -> list[EurLexProvision]:
    """
    Conservative fallback for XHTML structures
    where DOM-level Article boundaries cannot be
    identified reliably.

    It searches only explicit Article-heading
    boundaries.

    The fallback is not used when structured DOM
    extraction succeeds.
    """

    heading_pattern = re.compile(
        r"(?<!\w)"
        r"Article\s+(\d+[A-Za-z]?)"
        r"(?=\s+[A-ZÀ-ÖØ-Þ])",
        re.IGNORECASE,
    )

    matches = list(
        heading_pattern.finditer(
            legal_text
        )
    )

    provisions: list[
        EurLexProvision
    ] = []

    for index, match in enumerate(
        matches
    ):
        number = (
            match.group(1)
        )

        start = (
            match.start()
        )

        end = (
            matches[
                index + 1
            ].start()
            if index + 1
            < len(matches)
            else len(
                legal_text
            )
        )

        block = clean_legal_text(
            legal_text[
                start:end
            ]
        )

        if len(block) < 25:
            continue

        # Split:
        #
        # Article 9
        # Risk management system
        # 1. ...
        #
        # The title is treated conservatively and
        # left None where it cannot be separated
        # reliably.
        title = None

        title_match = re.match(
            (
                r"^Article\s+"
                + re.escape(
                    number
                )
                + r"\s+"
                + r"(.+?)"
                + r"(?=\s+\d+\.)"
            ),
            block,
            flags=re.IGNORECASE,
        )

        if title_match:
            candidate = (
                title_match
                .group(1)
                .strip()
            )

            if (
                candidate
                and len(candidate)
                <= 500
            ):
                title = candidate

        provisions.append(
            EurLexProvision(
                provision_type="article",

                reference=(
                    f"Article {number}"
                ),

                number=number,

                title=title,

                official_text=block,

                celex_id=celex_id,

                source_url=source_url,
            )
        )

    return provisions


# =========================================================
# STRUCTURED ARTICLE EXTRACTION
# =========================================================

def extract_articles_from_xhtml(
    raw_xhtml: str,
    celex_id: str,
    source_url: str,
) -> list[EurLexProvision]:
    """
    Extract individual Articles from authoritative
    Cellar XHTML.

    The extractor first attempts DOM-based
    boundaries. If the manifestation does not
    expose usable Article-heading nodes, it falls
    back to conservative normalized-text parsing.

    No extracted text is paraphrased.
    """

    soup = BeautifulSoup(
        raw_xhtml,
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
        for tag in soup.find_all(
            tag_name
        ):
            tag.decompose()

    headings = (
        _find_article_heading_tags(
            soup
        )
    )

    provisions: list[
        EurLexProvision
    ] = []

    # -----------------------------------------------------
    # DOM EXTRACTION
    # -----------------------------------------------------

    if headings:
        for (
            index,
            (
                heading,
                number,
            ),
        ) in enumerate(
            headings
        ):
            next_heading = (
                headings[
                    index + 1
                ][0]
                if index + 1
                < len(headings)
                else None
            )

            parts: list[
                str
            ] = [
                f"Article {number}"
            ]

            title: (
                str
                | None
            ) = None

            node = (
                heading.next_sibling
            )

            while node is not None:
                if (
                    next_heading
                    is not None
                    and node
                    is next_heading
                ):
                    break

                if isinstance(
                    node,
                    Tag,
                ):
                    text = (
                        _normalise_node_text(
                            node
                        )
                    )

                    if text:
                        # Stop if the sibling itself is
                        # another Article heading.
                        if (
                            ARTICLE_HEADING_PATTERN
                            .fullmatch(
                                text
                            )
                        ):
                            break

                        parts.append(
                            text
                        )

                node = (
                    node.next_sibling
                )

            article_text = (
                clean_legal_text(
                    "\n".join(
                        parts
                    )
                )
            )

            # Many Cellar manifestations expose the
            # Article title immediately after the
            # heading. Capture it only when the first
            # content line looks like a short title,
            # not a numbered legal paragraph.
            lines = [
                line.strip()
                for line in (
                    article_text
                    .splitlines()
                )
                if line.strip()
            ]

            if len(lines) >= 2:
                candidate = (
                    lines[1]
                )

                if (
                    len(candidate)
                    <= 500
                    and not re.match(
                        r"^\d+[\.\)]",
                        candidate,
                    )
                ):
                    title = (
                        candidate
                    )

            if (
                len(article_text)
                >= 25
            ):
                provisions.append(
                    EurLexProvision(
                        provision_type=(
                            "article"
                        ),

                        reference=(
                            f"Article {number}"
                        ),

                        number=number,

                        title=title,

                        official_text=(
                            article_text
                        ),

                        celex_id=(
                            celex_id
                        ),

                        source_url=(
                            source_url
                        ),
                    )
                )

    # -----------------------------------------------------
    # QUALITY CHECK
    # -----------------------------------------------------
    #
    # If DOM extraction found too little meaningful
    # content, fall back to normalized full text.
    # -----------------------------------------------------

    meaningful = [
        item
        for item in provisions
        if len(
            item.official_text
        ) >= 50
    ]

    if meaningful:
        return meaningful

    full_text = (
        extract_cellar_xhtml(
            raw_xhtml
        )
    )

    return (
        _extract_articles_from_text(
            legal_text=full_text,

            celex_id=celex_id,

            source_url=source_url,
        )
    )


# =========================================================
# ARTICLE LOOKUP
# =========================================================

def get_article_from_result(
    result: EurLexContentResult,
    article_number: str,
) -> EurLexProvision | None:
    """
    Retrieve one Article from a successfully
    fetched Cellar document.

    article_number may be supplied as:
        "9"
        "Article 9"
    """

    if (
        result.source_status
        != "ok"
        or not result.raw_xhtml
    ):
        return None

    requested = (
        article_number
        .strip()
    )

    requested = re.sub(
        r"^Article\s+",
        "",
        requested,
        flags=re.IGNORECASE,
    )

    provisions = (
        extract_articles_from_xhtml(
            raw_xhtml=(
                result.raw_xhtml
            ),

            celex_id=(
                result.celex_id
            ),

            source_url=(
                result.source_url
            ),
        )
    )

    for provision in provisions:
        if (
            provision.number
            .casefold()
            == requested.casefold()
        ):
            return provision

    return None


# =========================================================
# CELLAR FETCH
# =========================================================

async def fetch_cellar_document(
    celex_id: str,
    language: str = "eng",
) -> EurLexContentResult:
    """
    Retrieve authoritative EU legal content from
    the Publications Office Cellar repository.

    Cellar supports CELEX identifiers and HTTP
    content negotiation.

    Both normalized full-document text and the raw
    XHTML manifestation are retained. This permits
    Regulatory Intelligence monitoring and
    provision-level Regulatory Library extraction
    to use the same authoritative retrieval.
    """

    url = (
        f"{CELLAR_BASE_URL}/{celex_id}"
    )

    headers = {
        "Accept":
            "application/xhtml+xml",

        "Accept-Language":
            language,

        "User-Agent": (
            "TrustGRC-AI-360-"
            "Regulatory-Monitor/1.0"
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

            source_status=(
                "connection_timeout"
            ),

            celex_id=celex_id,

            source_url=url,

            reason=(
                "Cellar request timed out."
            ),
        )

    except httpx.ConnectError as exc:
        return EurLexContentResult(
            content="",

            source_status=(
                "connection_error"
            ),

            celex_id=celex_id,

            source_url=url,

            reason=str(
                exc
            ),
        )

    except httpx.HTTPStatusError as exc:
        return EurLexContentResult(
            content="",

            source_status=(
                "http_error"
            ),

            celex_id=celex_id,

            source_url=url,

            reason=(
                "Cellar returned HTTP "
                f"{exc.response.status_code}."
            ),
        )

    content_type = (
        response.headers
        .get(
            "content-type",
            "",
        )
        .lower()
    )

    raw_content = (
        response.text
    )

    if not raw_content.strip():
        return EurLexContentResult(
            content="",

            source_status=(
                "empty_response"
            ),

            celex_id=celex_id,

            source_url=str(
                response.url
            ),

            reason=(
                "Cellar returned an "
                "empty response."
            ),

            content_type=(
                content_type
                or None
            ),
        )

    extracted = (
        extract_cellar_xhtml(
            raw_content
        )
    )

    if len(extracted) < 1000:
        return EurLexContentResult(
            content="",

            source_status=(
                "content_validation_failed"
            ),

            celex_id=celex_id,

            source_url=str(
                response.url
            ),

            reason=(
                "Retrieved Cellar content was "
                "too short to be treated as "
                "authoritative legal text."
            ),

            raw_xhtml=(
                raw_content
            ),

            content_type=(
                content_type
                or None
            ),
        )

    # -----------------------------------------------------
    # BASIC LEGAL CONTENT VALIDATION
    # -----------------------------------------------------

    lowered = (
        extracted.lower()
    )

    legal_markers = [
        "regulation",
        "article",
        "official journal",
        "european union",
    ]

    marker_hits = sum(
        marker in lowered
        for marker
        in legal_markers
    )

    if marker_hits < 2:
        return EurLexContentResult(
            content="",

            source_status=(
                "content_validation_failed"
            ),

            celex_id=celex_id,

            source_url=str(
                response.url
            ),

            reason=(
                "Retrieved content did not "
                "contain sufficient legal-"
                "document markers."
            ),

            raw_xhtml=(
                raw_content
            ),

            content_type=(
                content_type
                or None
            ),
        )

    return EurLexContentResult(
        content=extracted,

        source_status="ok",

        celex_id=celex_id,

        source_url=str(
            response.url
        ),

        reason=None,

        raw_xhtml=(
            raw_content
        ),

        content_type=(
            content_type
            or (
                "application/xhtml+xml"
            )
        ),
    )


# =========================================================
# CELEX LOOKUP
# =========================================================

def extract_celex_id(
    regulation_code: str,
) -> str | None:
    """
    Temporary TrustGRC CELEX mapping.

    Later this identifier should move into the
    canonical RegulatorySource / Regulation
    metadata rather than remain embedded in code.
    """

    mapping = {
        "EU_AI_ACT":
            "32024R1689",

        "GDPR":
            "32016R0679",
    }

    return mapping.get(
        regulation_code
    )