from datetime import UTC, date, datetime

from app.db.session import SessionLocal
from app.models.regulation import Regulation
from app.models.regulation_article import RegulationArticle
from app.models.regulation_obligation import RegulationObligation
from app.models.obligation_control import ObligationControl


print("Starting EU AI Act Knowledge Pack v1...")

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
        effective_from=date(2024, 8, 1),
        last_verified_at=datetime.now(UTC),
        source_url=(
            "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        ),
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
    applicability_condition,
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
        applicability_condition=applicability_condition,
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
    test_method,
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
        test_method=test_method,
    )

    db.add(control)
    db.commit()
    db.refresh(control)

    return control


euaia = (
    db.query(Regulation)
    .filter(
        Regulation.name
        == "European Union Artificial Intelligence Act"
    )
    .first()
)

if not euaia:
    raise Exception(
        "European Union Artificial Intelligence Act "
        "regulation not found"
    )


euaia_articles = [
    {
        "article_number": "Article 9",
        "title": "Risk management system",
        "summary": (
            "High-risk AI systems must operate under a "
            "continuous and documented risk management process."
        ),
        "obligation_code": "AIA-9-01",
        "obligation_text": (
            "Establish, implement, document and maintain a "
            "risk management system for high-risk AI systems."
        ),
        "obligation_type": "Risk Management",
        "applies_to": "Providers of high-risk AI systems",
        "applicability_condition": (
            "Applies where the AI system is classified as high-risk."
        ),
        "control_code": "CTRL-AIA-9-01",
        "control_name": "AI Risk Management System",
        "control_description": (
            "Maintain a documented lifecycle-based AI risk "
            "management process."
        ),
        "evidence_required": (
            "AI risk register, risk assessment methodology, "
            "risk treatment records, review history."
        ),
        "test_method": (
            "Verify that risks are identified, evaluated, "
            "treated, documented and periodically reviewed."
        ),
        "risk_level": "High",
    },
    {
        "article_number": "Article 10",
        "title": "Data and data governance",
        "summary": (
            "Training, validation and testing datasets for "
            "high-risk AI systems must meet appropriate "
            "data governance and quality requirements."
        ),
        "obligation_code": "AIA-10-01",
        "obligation_text": (
            "Implement data governance and management practices "
            "for datasets used by high-risk AI systems."
        ),
        "obligation_type": "Data Governance",
        "applies_to": "Providers of high-risk AI systems",
        "applicability_condition": (
            "Applies where datasets are used for training, "
            "validation or testing of high-risk AI systems."
        ),
        "control_code": "CTRL-AIA-10-01",
        "control_name": "AI Data Governance Control",
        "control_description": (
            "Establish documented controls for data provenance, "
            "quality, relevance, representativeness and bias."
        ),
        "evidence_required": (
            "Dataset documentation, provenance records, "
            "quality tests, bias assessments, data governance policy."
        ),
        "test_method": (
            "Review dataset lineage, quality controls, "
            "representativeness and bias testing evidence."
        ),
        "risk_level": "High",
    },
    {
        "article_number": "Article 11",
        "title": "Technical documentation",
        "summary": (
            "High-risk AI systems require technical documentation "
            "demonstrating compliance before being placed on the market "
            "or put into service."
        ),
        "obligation_code": "AIA-11-01",
        "obligation_text": (
            "Prepare and maintain technical documentation for "
            "the high-risk AI system."
        ),
        "obligation_type": "Documentation",
        "applies_to": "Providers of high-risk AI systems",
        "applicability_condition": (
            "Applies to high-risk AI systems before market placement "
            "or putting into service."
        ),
        "control_code": "CTRL-AIA-11-01",
        "control_name": "AI Technical Documentation",
        "control_description": (
            "Maintain current technical documentation describing "
            "the AI system, design, operation and compliance measures."
        ),
        "evidence_required": (
            "Technical specifications, architecture documents, "
            "model documentation, intended-purpose documentation."
        ),
        "test_method": (
            "Confirm required technical documentation exists, "
            "is current and is traceable to the deployed system."
        ),
        "risk_level": "High",
    },
    {
        "article_number": "Article 12",
        "title": "Record-keeping",
        "summary": (
            "High-risk AI systems must technically enable "
            "automatic recording of events over the system lifetime."
        ),
        "obligation_code": "AIA-12-01",
        "obligation_text": (
            "Enable and maintain appropriate logging capabilities "
            "for high-risk AI systems."
        ),
        "obligation_type": "Logging",
        "applies_to": "Providers of high-risk AI systems",
        "applicability_condition": (
            "Applies to high-risk AI systems requiring traceability."
        ),
        "control_code": "CTRL-AIA-12-01",
        "control_name": "AI Event Logging",
        "control_description": (
            "Implement automatic logging sufficient to support "
            "traceability, monitoring and incident investigation."
        ),
        "evidence_required": (
            "System logs, logging configuration, retention policy, "
            "monitoring records."
        ),
        "test_method": (
            "Inspect logging configuration and confirm relevant "
            "AI lifecycle events are captured and retained."
        ),
        "risk_level": "High",
    },
    {
        "article_number": "Article 13",
        "title": "Transparency and provision of information to deployers",
        "summary": (
            "High-risk AI systems must be sufficiently transparent "
            "to allow deployers to interpret output and use the system "
            "appropriately."
        ),
        "obligation_code": "AIA-13-01",
        "obligation_text": (
            "Provide sufficient information and instructions "
            "to enable appropriate use of the high-risk AI system."
        ),
        "obligation_type": "Transparency",
        "applies_to": "Providers of high-risk AI systems",
        "applicability_condition": (
            "Applies where the system is supplied or made available "
            "to deployers."
        ),
        "control_code": "CTRL-AIA-13-01",
        "control_name": "AI Transparency and Instructions",
        "control_description": (
            "Provide clear system capabilities, limitations, "
            "intended purpose and instructions for use."
        ),
        "evidence_required": (
            "Instructions for use, model/system documentation, "
            "limitations statement, transparency documentation."
        ),
        "test_method": (
            "Review whether deployers receive clear and usable "
            "information regarding operation and limitations."
        ),
        "risk_level": "High",
    },
    {
        "article_number": "Article 14",
        "title": "Human oversight",
        "summary": (
            "High-risk AI systems must be designed so they can "
            "be effectively overseen by natural persons."
        ),
        "obligation_code": "AIA-14-01",
        "obligation_text": (
            "Implement effective human oversight measures for "
            "high-risk AI systems."
        ),
        "obligation_type": "Human Oversight",
        "applies_to": "Providers and deployers of high-risk AI systems",
        "applicability_condition": (
            "Applies throughout operation of high-risk AI systems."
        ),
        "control_code": "CTRL-AIA-14-01",
        "control_name": "Human Oversight Mechanism",
        "control_description": (
            "Ensure authorised personnel can understand, monitor, "
            "intervene in and, where appropriate, stop AI operation."
        ),
        "evidence_required": (
            "Human oversight procedure, role assignments, "
            "override mechanism documentation, training records."
        ),
        "test_method": (
            "Verify that qualified personnel can monitor and "
            "intervene in AI-driven decisions."
        ),
        "risk_level": "High",
    },
    {
        "article_number": "Article 15",
        "title": "Accuracy, robustness and cybersecurity",
        "summary": (
            "High-risk AI systems must achieve appropriate levels "
            "of accuracy, robustness and cybersecurity throughout "
            "their lifecycle."
        ),
        "obligation_code": "AIA-15-01",
        "obligation_text": (
            "Design and operate high-risk AI systems to achieve "
            "appropriate accuracy, robustness and cybersecurity."
        ),
        "obligation_type": "Security and Resilience",
        "applies_to": "Providers of high-risk AI systems",
        "applicability_condition": (
            "Applies throughout the lifecycle of high-risk AI systems."
        ),
        "control_code": "CTRL-AIA-15-01",
        "control_name": "AI Accuracy, Robustness and Cybersecurity",
        "control_description": (
            "Implement testing and technical safeguards addressing "
            "performance degradation, faults and AI-specific attacks."
        ),
        "evidence_required": (
            "Accuracy metrics, robustness testing, security testing, "
            "threat modelling, vulnerability assessments, incident logs."
        ),
        "test_method": (
            "Review performance and security test results and verify "
            "controls against foreseeable faults and attacks."
        ),
        "risk_level": "High",
    },
]


for item in euaia_articles:
    article = get_or_create_article(
        regulation_id=euaia.id,
        article_number=item["article_number"],
        title=item["title"],
        summary=item["summary"],
    )

    obligation = get_or_create_obligation(
        article_id=article.id,
        obligation_code=item["obligation_code"],
        obligation_text=item["obligation_text"],
        obligation_type=item["obligation_type"],
        applies_to=item["applies_to"],
        applicability_condition=item[
            "applicability_condition"
        ],
        risk_level=item["risk_level"],
    )

    get_or_create_control(
        obligation_id=obligation.id,
        control_code=item["control_code"],
        control_name=item["control_name"],
        control_description=item["control_description"],
        evidence_required=item["evidence_required"],
        test_method=item["test_method"],
    )


print("EU AI Act Knowledge Pack v1 seeded successfully")

print(
    "EU AI Act Articles:",
    db.query(RegulationArticle)
    .filter(
        RegulationArticle.regulation_id == euaia.id
    )
    .count(),
)

article_ids = [
    article.id
    for article in (
        db.query(RegulationArticle)
        .filter(
            RegulationArticle.regulation_id == euaia.id
        )
        .all()
    )
]

obligation_count = (
    db.query(RegulationObligation)
    .filter(
        RegulationObligation.article_id.in_(
            article_ids
        )
    )
    .count()
    if article_ids
    else 0
)

print(
    "EU AI Act Obligations:",
    obligation_count,
)

db.close()