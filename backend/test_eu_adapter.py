import asyncio
import difflib

from app.regulatory_intelligence.fetcher import fetch_source
from app.regulatory_intelligence.adapters import extract_regulatory_content


EU_AI_ACT_URL = (
    "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
)


async def main():
    print("Fetching EU AI Act - snapshot 1...")
    html_1 = await fetch_source(EU_AI_ACT_URL)

    text_1 = extract_regulatory_content(
        EU_AI_ACT_URL,
        html_1,
    )
    
    await asyncio.sleep(5)

    print("Fetching EU AI Act - snapshot 2...")
    html_2 = await fetch_source(EU_AI_ACT_URL)

    text_2 = extract_regulatory_content(
        EU_AI_ACT_URL,
        html_2,
    )

    print()
    print("Snapshot 1 length:", len(text_1))
    print("Snapshot 2 length:", len(text_2))
    print("Identical:", text_1 == text_2)
    print()

    if text_1 == text_2:
        print("EU AI Act adapter is stable.")
        return

    print("DIFFERENCES DETECTED")
    print("=" * 80)

    diff = difflib.unified_diff(
        text_1.splitlines(),
        text_2.splitlines(),
        fromfile="snapshot_1",
        tofile="snapshot_2",
        lineterm="",
    )

    for line in diff:
        print(line)


if __name__ == "__main__":
    asyncio.run(main())