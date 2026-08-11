import asyncio

from app.regulatory_intelligence.fetcher import fetch_source


EU_AI_ACT_URL = (
    "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng"
)


async def main():
    html = await fetch_source(EU_AI_ACT_URL)

    print("Downloaded length:", len(html))
    print()
    print("First 1000 characters:")
    print("=" * 80)
    print(html[:1000])


if __name__ == "__main__":
    asyncio.run(main())