from app.db.session import SessionLocal

from app.models.regulation import Regulation
from app.models.jurisdiction import Jurisdiction
from app.models.industry import Industry
from app.models.data_category import DataCategory

from app.models.regulation_jurisdiction import RegulationJurisdiction
from app.models.regulation_industry import RegulationIndustry
from app.models.regulation_data_category import RegulationDataCategory

db = SessionLocal()

# --------------------------------------------------
# Helper functions
# --------------------------------------------------

def get_regulation(name):
    return db.query(Regulation).filter(Regulation.name == name).first()

def get_jurisdiction(name):
    return db.query(Jurisdiction).filter(Jurisdiction.name == name).first()

def get_industry(name):
    return db.query(Industry).filter(Industry.name == name).first()

def get_data_category(name):
    return db.query(DataCategory).filter(DataCategory.name == name).first()

# --------------------------------------------------
# Regulations
# --------------------------------------------------

GDPR = get_regulation("General Data Protection Regulation")
EU_AI = get_regulation("European Union Artificial Intelligence Act")
HIPAA = get_regulation("HIPAA Privacy Rule")
NZ_PRIVACY = get_regulation("Privacy Act 2020")
AU_PRIVACY = get_regulation("Privacy Act 1988")

# --------------------------------------------------
# Regulation → Jurisdiction mappings
# --------------------------------------------------

jurisdiction_mappings = [
    (GDPR, "Germany"),
    (GDPR, "France"),

    (EU_AI, "Germany"),
    (EU_AI, "France"),

    (HIPAA, "United States"),

    (NZ_PRIVACY, "New Zealand"),

    (AU_PRIVACY, "Australia"),
]

created_j = 0

for regulation, jurisdiction_name in jurisdiction_mappings:

    jurisdiction = get_jurisdiction(jurisdiction_name)

    exists = (
        db.query(RegulationJurisdiction)
        .filter(
            RegulationJurisdiction.regulation_id == regulation.id,
            RegulationJurisdiction.jurisdiction_id == jurisdiction.id,
        )
        .first()
    )

    if exists:
        continue

    db.add(
        RegulationJurisdiction(
            regulation_id=regulation.id,
            jurisdiction_id=jurisdiction.id,
            applicability_level="Applicable",
        )
    )

    created_j += 1

# --------------------------------------------------
# Regulation → Industry mappings
# --------------------------------------------------

gdpr_industries = [
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

for industry_name in gdpr_industries:

    industry = get_industry(industry_name)

    for regulation in [GDPR, EU_AI]:

        exists = (
            db.query(RegulationIndustry)
            .filter(
                RegulationIndustry.regulation_id == regulation.id,
                RegulationIndustry.industry_id == industry.id,
            )
            .first()
        )

        if not exists:
            db.add(
                RegulationIndustry(
                    regulation_id=regulation.id,
                    industry_id=industry.id,
                    applicability_level="Applicable",
                )
            )

# HIPAA → Healthcare

healthcare = get_industry("Healthcare")

db.merge(
    RegulationIndustry(
        regulation_id=HIPAA.id,
        industry_id=healthcare.id,
        applicability_level="Applicable",
    )
)

# --------------------------------------------------
# Regulation → Data Category mappings
# --------------------------------------------------

data_mappings = [
    (GDPR, [
        "Personal Data",
        "Sensitive Personal Data",
        "Employee Data",
        "Biometric Data",
    ]),

    (EU_AI, [
        "Personal Data",
        "Sensitive Personal Data",
        "Biometric Data",
    ]),

    (HIPAA, [
        "Health Data",
    ]),

    (NZ_PRIVACY, [
        "Personal Data",
        "Employee Data",
    ]),

    (AU_PRIVACY, [
        "Personal Data",
        "Employee Data",
    ]),
]

created_d = 0

for regulation, categories in data_mappings:

    for category_name in categories:

        category = get_data_category(category_name)

        exists = (
            db.query(RegulationDataCategory)
            .filter(
                RegulationDataCategory.regulation_id == regulation.id,
                RegulationDataCategory.data_category_id == category.id,
            )
            .first()
        )

        if exists:
            continue

        db.add(
            RegulationDataCategory(
                regulation_id=regulation.id,
                data_category_id=category.id,
                applicability_level="Applicable",
            )
        )

        created_d += 1

db.commit()

print(f"Jurisdiction mappings created: {created_j}")
print("Industry mappings seeded")
print(f"Data category mappings created: {created_d}")