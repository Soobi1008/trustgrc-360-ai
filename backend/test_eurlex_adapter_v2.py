import asyncio

from app.regulatory_intelligence.fetcher import fetch_source
from app.regulatory_intelligence.eurlex_adapter import (
    extract_eurlex_html,
)


EU_AI_ACT_URL = (
    "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
)


async def main():
    print("Fetching EU AI Act...")
    print()

    html = await fetch_source(EU_AI_ACT_URL)

    print("Raw response length:", len(html))
    print()

    result = extract_eurlex_html(html)

    print("Source status:", result.source_status)
    print("Reason:", result.reason)
    print("Extracted content length:", len(result.content))
    print()

    print("First 500 extracted characters:")
    print("=" * 70)
    print(result.content[:500])
    print("=" * 70)


asyncio.run(main())