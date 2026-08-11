from sqlalchemy.orm import Session

from .models import RegulatorySource


INITIAL_REGULATORY_SOURCES = [
    {
        "regulation_code": "EU_AI_ACT",
        "regulation_name":
            "EU Artificial Intelligence Act",
        "authority":
            "European Union / EUR-Lex",
        "jurisdiction_code": "EU",
        "jurisdiction_name":
            "European Union",
        "official_url":
            "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
        "source_type": "official_legislation",
        "legal_status": "active",
        "trust_tier": 1,
    },

    {
        "regulation_code": "HIPAA_SECURITY",
        "regulation_name":
            "HIPAA Security Rule",
        "authority":
            "U.S. Department of Health and Human Services",
        "jurisdiction_code": "US",
        "jurisdiction_name":
            "United States",
        "official_url":
            "https://www.hhs.gov/hipaa/for-professionals/security/index.html",
        "source_type":
            "regulator_official",
        "legal_status": "active",
        "trust_tier": 1,
    },

    {
        "regulation_code": "COPPA",
        "regulation_name":
            "Children's Online Privacy Protection Rule",
        "authority":
            "Federal Trade Commission",
        "jurisdiction_code": "US",
        "jurisdiction_name":
            "United States",
        "official_url":
            "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa",
        "source_type":
            "regulator_official",
        "legal_status": "active",
        "trust_tier": 1,
    },

    {
        "regulation_code": "PIPEDA",
        "regulation_name":
            "Personal Information Protection and Electronic Documents Act",
        "authority":
            "Office of the Privacy Commissioner of Canada",
        "jurisdiction_code": "CA",
        "jurisdiction_name": "Canada",
        "official_url":
            "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/",
        "source_type":
            "regulator_official",
        "legal_status": "active",
        "trust_tier": 1,
    },
]

def seed_regulatory_sources(
    db: Session,
) -> int:

    created = 0

    for data in INITIAL_REGULATORY_SOURCES:

        existing = (
            db.query(RegulatorySource)
            .filter(
                RegulatorySource.regulation_code
                == data["regulation_code"]
            )
            .first()
        )

        if existing:
            continue

        source = RegulatorySource(
            **data
        )

        db.add(source)
        created += 1

    db.commit()

    return created