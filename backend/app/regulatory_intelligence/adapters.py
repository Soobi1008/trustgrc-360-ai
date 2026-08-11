import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup


def clean_text(text: str) -> str:
    """
    Normalise extracted regulatory text while preserving
    legal wording, numbers, dates and article references.
    """

    text = (
        text.replace("\u200b", "")
        .replace("\u200c", "")
        .replace("\u200d", "")
        .replace("\ufeff", "")
        .replace("\xa0", " ")
    )

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def remove_common_dynamic_elements(
    soup: BeautifulSoup,
) -> None:
    """
    Remove elements that normally do not form part of
    authoritative regulatory content.
    """

    removable_tags = [
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
    ]

    for tag_name in removable_tags:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    selectors = [
        "[aria-hidden='true']",
        ".cookie",
        ".cookies",
        ".cookie-banner",
        ".cookie-notice",
        ".breadcrumb",
        ".breadcrumbs",
        ".social",
        ".social-media",
        ".share",
        ".sharing",
        ".pagination",
        ".newsletter",
        ".site-footer",
        ".site-header",
        ".navigation",
        ".menu",
        ".search",
        ".feedback",
    ]

    for selector in selectors:
        try:
            for element in soup.select(selector):
                element.decompose()
        except Exception:
            continue


def generic_extractor(
    html: str,
) -> str:
    """
    Default extractor for official regulatory webpages.
    """

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    remove_common_dynamic_elements(soup)

    candidates = [
        soup.find("main"),
        soup.find("article"),
        soup.find(attrs={"role": "main"}),
    ]

    primary = None

    for candidate in candidates:
        if candidate is not None:
            primary = candidate
            break

    if primary is None:
        primary = soup.body or soup

    text = primary.get_text(
        separator=" ",
        strip=True,
    )

    return clean_text(text)


def ftc_extractor(
    html: str,
) -> str:
    """
    FTC-specific extractor.

    FTC pages may contain related-content blocks,
    sharing tools, page metadata and other dynamic
    content that can change independently of the
    underlying regulatory material.
    """

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    remove_common_dynamic_elements(soup)

    ftc_dynamic_selectors = [
        ".usa-banner",
        ".usa-header",
        ".usa-footer",
        ".region-header",
        ".region-footer",
        ".region-breadcrumb",
        ".field--name-field-related-content",
        ".related-content",
        ".related-resources",
        ".views-element-container",
        ".addtoany_list",
        ".a2a_kit",
        ".social-share",
        ".page-feedback",
        ".feedback",
        ".block-search",
        ".search-form",
        ".pager",
        ".pagination",
    ]

    for selector in ftc_dynamic_selectors:
        try:
            for element in soup.select(selector):
                element.decompose()
        except Exception:
            continue

    candidates = [
        soup.find("main"),
        soup.find("article"),
        soup.find(attrs={"role": "main"}),
    ]

    primary = None

    for candidate in candidates:
        if candidate is not None:
            primary = candidate
            break

    if primary is None:
        primary = soup.body or soup

    text = primary.get_text(
        separator=" ",
        strip=True,
    )

    return clean_text(text)


def extract_regulatory_content(
    url: str,
    html: str,
) -> str:
    """
    Choose the correct extraction strategy according
    to the authoritative regulatory source.
    """

    domain = (
        urlparse(url)
        .netloc
        .lower()
        .replace("www.", "")
    )

    if (
        domain == "ftc.gov"
        or domain.endswith(".ftc.gov")
    ):
        return ftc_extractor(html)

    return generic_extractor(html)