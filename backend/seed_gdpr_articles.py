from datetime import UTC, date, datetime

from app.db.session import SessionLocal
from app.models.regulation import Regulation
from app.models.regulation_article import RegulationArticle
from app.models.regulation_obligation import RegulationObligation
from app.models.obligation_control import ObligationControl

print("Starting GDPR Knowledge Pack v1...")

db = SessionLocal()


def get_or_create_article(
    regulation_id,
    article_number,
    title,
    summary,
):
    article = (
        db.query(RegulationArticle)
        .filter(
            RegulationArticle.regulation_id == regulation_id,
            RegulationArticle.article_number == article_number,
            RegulationArticle.version == "current",
        )
        .first()
    )

    if article:
        return article

    article = RegulationArticle(
        regulation_id=regulation_id,
        article_number=article_number,
        title=title,
        summary=summary,
        version="current",
        effective_from=date(2018, 5, 25),
        last_verified_at=datetime.now(UTC),
    )

    db.add(article)
    db.commit()
    db.refresh(article)

    return article


def get_or_create_obligation(
    article_id,
    obligation_code,
    obligation_text,
    obligation_type,
    applies_to,
    risk_level,
):
    obligation = (
        db.query(RegulationObligation)
        .filter(
            RegulationObligation.article_id == article_id,
            RegulationObligation.obligation_code == obligation_code,
        )
        .first()
    )

    if obligation:
        return obligation

    obligation = RegulationObligation(
        article_id=article_id,
        obligation_code=obligation_code,
        obligation_text=obligation_text,
        obligation_type=obligation_type,
        applies_to=applies_to,
        mandatory=True,
        risk_level=risk_level,
    )

    db.add(obligation)
    db.commit()
    db.refresh(obligation)

    return obligation


def get_or_create_control(
    obligation_id,
    control_code,
    control_name,
    control_description,
    evidence_required,
):
    control = (
        db.query(ObligationControl)
        .filter(
            ObligationControl.obligation_id == obligation_id,
            ObligationControl.control_code == control_code,
        )
        .first()
    )

    if control:
        return control

    control = ObligationControl(
        obligation_id=obligation_id,
        control_code=control_code,
        control_name=control_name,
        control_description=control_description,
        evidence_required=evidence_required,
    )

    db.add(control)
    db.commit()
    db.refresh(control)

    return control


gdpr = (
    db.query(Regulation)
    .filter(
        Regulation.name == "General Data Protection Regulation"
    )
    .first()
)

if not gdpr:
    raise Exception("GDPR regulation not found")


gdpr_articles = [
    {
        "article_number": "Article 5",
        "title": "Principles relating to processing of personal data",
        "summary": "Personal data shall be processed lawfully, fairly and transparently.",
        "obligation_code": "GDPR-5-01",
        "obligation_text": "Process personal data lawfully, fairly and transparently.",
        "control_code": "CTRL-GDPR-5-01",
        "control_name": "Lawful Basis Documentation",
        "risk_level": "High",
    },
    {
        "article_number": "Article 13",
        "title": "Information to be provided where personal data are collected",
        "summary": "Provide transparent information to data subjects.",
        "obligation_code": "GDPR-13-01",
        "obligation_text": "Provide privacy information to data subjects.",
        "control_code": "CTRL-GDPR-13-01",
        "control_name": "Privacy Notice Management",
        "risk_level": "Medium",
    },
    {
        "article_number": "Article 22",
        "title": "Automated individual decision-making",
        "summary": "Safeguards for decisions based solely on automated processing.",
        "obligation_code": "GDPR-22-01",
        "obligation_text": "Provide safeguards for automated decision-making.",
        "control_code": "CTRL-GDPR-22-01",
        "control_name": "Human Review Process",
        "risk_level": "High",
    },
    {
        "article_number": "Article 25",
        "title": "Data protection by design and by default",
        "summary": "Implement privacy by design and by default.",
        "obligation_code": "GDPR-25-01",
        "obligation_text": "Implement technical and organisational privacy measures.",
        "control_code": "CTRL-GDPR-25-01",
        "control_name": "Privacy-by-Design Assessment",
        "risk_level": "High",
    },
    {
        "article_number": "Article 32",
        "title": "Security of processing",
        "summary": "Implement appropriate security controls.",
        "obligation_code": "GDPR-32-01",
        "obligation_text": "Protect personal data through security measures.",
        "control_code": "CTRL-GDPR-32-01",
        "control_name": "Security Control Assessment",
        "risk_level": "High",
    },
    {
        "article_number": "Article 35",
        "title": "Data Protection Impact Assessment",
        "summary": "Conduct DPIAs where processing is likely to result in high risk.",
        "obligation_code": "GDPR-35-01",
        "obligation_text": "Conduct and maintain DPIAs where required.",
        "control_code": "CTRL-GDPR-35-01",
        "control_name": "Documented DPIA",
        "risk_level": "High",
    },
]

for item in gdpr_articles:

    article = get_or_create_article(
        regulation_id=gdpr.id,
        article_number=item["article_number"],
        title=item["title"],
        summary=item["summary"],
    )

    obligation = get_or_create_obligation(
        article_id=article.id,
        obligation_code=item["obligation_code"],
        obligation_text=item["obligation_text"],
        obligation_type="Compliance",
        applies_to="Controller",
        risk_level=item["risk_level"],
    )

    get_or_create_control(
        obligation_id=obligation.id,
        control_code=item["control_code"],
        control_name=item["control_name"],
        control_description=item["summary"],
        evidence_required="Documented evidence demonstrating implementation of the control.",
    )

print("GDPR Knowledge Pack v1 seeded successfully")

print(
    "Articles:",
    db.query(RegulationArticle)
    .filter(RegulationArticle.regulation_id == gdpr.id)
    .count(),
)

print(
    "Obligations:",
    db.query(RegulationObligation).count(),
)

print(
    "Controls:",
    db.query(ObligationControl).count(),
)