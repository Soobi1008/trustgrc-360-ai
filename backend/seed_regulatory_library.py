from datetime import date, datetime, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.continent import Continent
from app.models.country import Country
from app.models.data_category import DataCategory
from app.models.industry import Industry
from app.models.regulation import Regulation


# ============================================================
# CONTINENTS
# ============================================================

CONTINENTS = [
    {"name": "Africa", "code": "AF"},
    {"name": "Asia", "code": "AS"},
    {"name": "Europe", "code": "EU"},
    {"name": "North America", "code": "NA"},
    {"name": "South America", "code": "SA"},
    {"name": "Oceania", "code": "OC"},
]


# ============================================================
# COUNTRIES
# ============================================================

COUNTRIES = [
    {
        "name": "Germany",
        "iso2_code": "DE",
        "iso3_code": "DEU",
        "continent": "Europe",
    },
    {
        "name": "France",
        "iso2_code": "FR",
        "iso3_code": "FRA",
        "continent": "Europe",
    },
    {
        "name": "United States",
        "iso2_code": "US",
        "iso3_code": "USA",
        "continent": "North America",
    },
    {
        "name": "Canada",
        "iso2_code": "CA",
        "iso3_code": "CAN",
        "continent": "North America",
    },
    {
        "name": "New Zealand",
        "iso2_code": "NZ",
        "iso3_code": "NZL",
        "continent": "Oceania",
    },
    {
        "name": "Australia",
        "iso2_code": "AU",
        "iso3_code": "AUS",
        "continent": "Oceania",
    },
    {
        "name": "Mauritius",
        "iso2_code": "MU",
        "iso3_code": "MUS",
        "continent": "Africa",
    },
    {
        "name": "South Africa",
        "iso2_code": "ZA",
        "iso3_code": "ZAF",
        "continent": "Africa",
    },
    {
        "name": "Singapore",
        "iso2_code": "SG",
        "iso3_code": "SGP",
        "continent": "Asia",
    },
    {
        "name": "United Kingdom",
        "iso2_code": "GB",
        "iso3_code": "GBR",
        "continent": "Europe",
    },
]


# ============================================================
# INDUSTRIES
# ============================================================

INDUSTRIES = [
    "Banking",
    "Financial Services",
    "Insurance",
    "Healthcare",
    "Government",
    "Education",
    "Technology",
    "Manufacturing",
    "Aviation",
    "Transport & Logistics",
    "Tourism & Hospitality",
    "Retail",
    "Telecommunications",
]


# ============================================================
# DATA CATEGORIES
# ============================================================

DATA_CATEGORIES = [
    "Personal Data",
    "Sensitive Personal Data",
    "Financial Data",
    "Health Data",
    "Biometric Data",
    "Children's Data",
    "Employee Data",
    "Location Data",
    "Authentication Data",
    "Criminal Conviction Data",
    "Commercially Sensitive Data",
]


# ============================================================
# INITIAL REGULATORY LIBRARY
# ============================================================

REGULATIONS = [
    {
        "name": "General Data Protection Regulation",
        "short_name": "GDPR",
        "regulation_type": "Privacy Law",
        "summary": (
            "European Union data protection regulation governing "
            "the processing and protection of personal data."
        ),
        "regulatory_authority": (
            "EU supervisory authorities / European Data "
            "Protection Board"
        ),
        "official_source_url": (
            "https://eur-lex.europa.eu/eli/reg/2016/679/oj"
        ),
        "effective_date": date(2018, 5, 25),
        "status": "Active",
        "extraterritorial": True,
        "mandatory": True,
    },
    {
        "name": "European Union Artificial Intelligence Act",
        "short_name": "EU AI Act",
        "regulation_type": "AI Law",
        "summary": (
            "European Union regulation establishing harmonised "
            "rules for artificial intelligence and risk-based "
            "obligations for AI systems."
        ),
        "regulatory_authority": "European Union",
        "official_source_url": (
            "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        ),
        "effective_date": date(2024, 8, 1),
        "status": "Active",
        "extraterritorial": True,
        "mandatory": True,
    },
    {
        "name": "Privacy Act 2020",
        "short_name": "NZ Privacy Act 2020",
        "regulation_type": "Privacy Law",
        "summary": (
            "New Zealand privacy legislation governing the "
            "collection, use, disclosure and protection of "
            "personal information."
        ),
        "regulatory_authority": (
            "Office of the Privacy Commissioner New Zealand"
        ),
        "official_source_url": (
            "https://www.legislation.govt.nz/act/public/"
            "2020/31/en/latest/"
        ),
        "effective_date": date(2020, 12, 1),
        "status": "Active",
        "extraterritorial": True,
        "mandatory": True,
    },
    {
        "name": "HIPAA Privacy Rule",
        "short_name": "HIPAA",
        "regulation_type": "Healthcare Privacy Regulation",
        "summary": (
            "United States federal privacy standards protecting "
            "protected health information for covered entities "
            "and applicable business associates."
        ),
        "regulatory_authority": (
            "U.S. Department of Health and Human Services"
        ),
        "official_source_url": (
            "https://www.hhs.gov/hipaa/for-professionals/"
            "privacy/index.html"
        ),
        "effective_date": None,
        "status": "Active",
        "extraterritorial": False,
        "mandatory": True,
    },
        {
        "name": (
            "Children's Online Privacy "
            "Protection Rule"
        ),
        "short_name": "COPPA",
        "regulation_type": (
            "Children's Privacy Regulation"
        ),
        "summary": (
            "United States federal rule "
            "implementing the Children's Online "
            "Privacy Protection Act and governing "
            "the online collection, use and "
            "disclosure of personal information "
            "from children under 13."
        ),
        "regulatory_authority": (
            "Federal Trade Commission"
        ),
        "official_source_url": (
            "https://www.ftc.gov/legal-library/"
            "browse/rules/childrens-online-privacy-"
            "protection-rule-coppa"
        ),
        "effective_date": None,
        "status": "Active",
        "extraterritorial": False,
        "mandatory": True,
    },
    {
        "name": "Privacy Act 1988",
        "short_name": "Australia Privacy Act",
        "regulation_type": "Privacy Law",
        "summary": (
            "Australian privacy legislation regulating how "
            "covered organisations and government agencies "
            "handle personal information."
        ),
        "regulatory_authority": (
            "Office of the Australian Information Commissioner"
        ),
        "official_source_url": (
            "https://www.oaic.gov.au/privacy/"
            "privacy-legislation/the-privacy-act"
        ),
        "effective_date": None,
        "status": "Active",
        "extraterritorial": True,
        "mandatory": True,
    },
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_or_create_continent(db, payload):
    existing = db.scalar(
        select(Continent).where(
            Continent.code == payload["code"]
        )
    )

    if existing:
        return existing

    item = Continent(**payload)

    db.add(item)
    db.flush()

    return item


def get_or_create_country(
    db,
    payload,
    continent_id,
):
    existing = db.scalar(
        select(Country).where(
            Country.iso2_code == payload["iso2_code"]
        )
    )

    if existing:
        return existing

    item = Country(
        name=payload["name"],
        iso2_code=payload["iso2_code"],
        iso3_code=payload["iso3_code"],
        continent_id=continent_id,
    )

    db.add(item)
    db.flush()

    return item


def get_or_create_industry(
    db,
    name,
):
    existing = db.scalar(
        select(Industry).where(
            Industry.name == name
        )
    )

    if existing:
        return existing

    item = Industry(
        name=name,
    )

    db.add(item)
    db.flush()

    return item


def get_or_create_data_category(
    db,
    name,
):
    existing = db.scalar(
        select(DataCategory).where(
            DataCategory.name == name
        )
    )

    if existing:
        return existing

    item = DataCategory(
        name=name,
    )

    db.add(item)
    db.flush()

    return item


def get_or_create_regulation(
    db,
    payload,
):
    existing = db.scalar(
        select(Regulation).where(
            Regulation.short_name
            == payload["short_name"]
        )
    )

    if existing:
        return existing

    item = Regulation(
        **payload,
        last_verified_at=datetime.now(
            timezone.utc
        ),
    )

    db.add(item)
    db.flush()

    return item


# ============================================================
# MAIN SEED FUNCTION
# ============================================================

def seed():
    db = SessionLocal()

    try:
        print(
            "Starting TrustGRC AI 360 "
            "Global Regulatory Library seed..."
        )

        continents_by_name = {}

        # ----------------------------------------------------
        # Continents
        # ----------------------------------------------------

        for payload in CONTINENTS:
            continent = get_or_create_continent(
                db,
                payload,
            )

            continents_by_name[
                continent.name
            ] = continent

        print(
            f"Continents processed: "
            f"{len(CONTINENTS)}"
        )

        # ----------------------------------------------------
        # Countries
        # ----------------------------------------------------

        for payload in COUNTRIES:
            continent = continents_by_name[
                payload["continent"]
            ]

            get_or_create_country(
                db,
                payload,
                continent.id,
            )

        print(
            f"Countries processed: "
            f"{len(COUNTRIES)}"
        )

        # ----------------------------------------------------
        # Industries
        # ----------------------------------------------------

        for industry_name in INDUSTRIES:
            get_or_create_industry(
                db,
                industry_name,
            )

        print(
            f"Industries processed: "
            f"{len(INDUSTRIES)}"
        )

        # ----------------------------------------------------
        # Data Categories
        # ----------------------------------------------------

        for category_name in DATA_CATEGORIES:
            get_or_create_data_category(
                db,
                category_name,
            )

        print(
            f"Data categories processed: "
            f"{len(DATA_CATEGORIES)}"
        )

        # ----------------------------------------------------
        # Regulations
        # ----------------------------------------------------

        for payload in REGULATIONS:
            get_or_create_regulation(
                db,
                payload,
            )

        print(
            f"Regulations processed: "
            f"{len(REGULATIONS)}"
        )

        db.commit()

        print(
            "\nGlobal Regulatory Library "
            "seed completed successfully."
        )

    except Exception as exc:
        db.rollback()

        print(
            "\nGlobal Regulatory Library "
            "seed failed."
        )

        print(
            f"Error: {exc}"
        )

        raise

    finally:
        db.close()


# ============================================================
# SCRIPT ENTRY POINT
# ============================================================

if __name__ == "__main__":
    seed()