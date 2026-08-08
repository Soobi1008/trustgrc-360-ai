from app.db.session import SessionLocal
from app.models.country import Country
from app.models.jurisdiction import Jurisdiction

db = SessionLocal()

jurisdictions = [
    ("Germany", "DE", "National"),
    ("France", "FR", "National"),
    ("United States", "US", "National"),
    ("Canada", "CA", "National"),
    ("New Zealand", "NZ", "National"),
    ("Australia", "AU", "National"),
    ("Mauritius", "MU", "National"),
    ("South Africa", "ZA", "National"),
    ("Singapore", "SG", "National"),
    ("United Kingdom", "UK", "National"),
]

created = 0

for country_name, code, jtype in jurisdictions:

    country = (
        db.query(Country)
        .filter(Country.name == country_name)
        .first()
    )

    if not country:
        print(f"Country not found: {country_name}")
        continue

    existing = (
        db.query(Jurisdiction)
        .filter(Jurisdiction.name == country_name)
        .first()
    )

    if existing:
        print(f"Already exists: {country_name}")
        continue

    db.add(
        Jurisdiction(
            country_id=country.id,
            name=country_name,
            code=code,
            jurisdiction_type=jtype,
        )
    )

    created += 1

db.commit()

print(f"Created {created} jurisdictions")