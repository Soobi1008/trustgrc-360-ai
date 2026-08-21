from datetime import UTC, datetime

from app.db.session import SessionLocal
from app.models.regulation import Regulation
from app.models.regulation_article import RegulationArticle
from app.models.regulation_obligation import RegulationObligation
from app.models.obligation_control import ObligationControl


print("Starting COPPA Knowledge Pack v1...")

db = SessionLocal()


def get_or_create_article(
    regulation_id,
    article_number,
    title,
    summary,
    source_url,
):
    article = (
        db.query(RegulationArticle)
        .filter(
            RegulationArticle.regulation_id
            == regulation_id,
            RegulationArticle.article_number
            == article_number,
            RegulationArticle.version
            == "current",
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
        source_url=source_url,
        version="current",
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
    applicability_condition,
    risk_level,
):
    obligation = (
        db.query(RegulationObligation)
        .filter(
            RegulationObligation.article_id
            == article_id,
            RegulationObligation.obligation_code
            == obligation_code,
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
            ObligationControl.obligation_id
            == obligation_id,
            ObligationControl.control_code
            == control_code,
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


coppa = (
    db.query(Regulation)
    .filter(
        Regulation.short_name
        == "COPPA"
    )
    .first()
)

if not coppa:
    raise Exception(
        "COPPA canonical regulation not found."
    )


COPPA_SOURCE_URL = (
    "https://www.ftc.gov/legal-library/"
    "browse/rules/childrens-online-privacy-"
    "protection-rule-coppa"
)


coppa_articles = [
    {
        "article_number": "16 CFR 312.4",
        "title": "Notice",
        "summary": (
            "Requires covered operators to provide "
            "clear notice of their practices regarding "
            "the collection, use and disclosure of "
            "children's personal information."
        ),
        "obligation_code": "COPPA-312.4-01",
        "obligation_text": (
            "Provide clear and comprehensive notice "
            "of information practices concerning "
            "children's personal information."
        ),
        "obligation_type": "Transparency",
        "applies_to": "Covered operators",
        "applicability_condition": (
            "Applies when an operator is subject "
            "to the COPPA Rule."
        ),
        "risk_level": "High",
        "control_code": "CTRL-COPPA-312.4-01",
        "control_name": "Children's Privacy Notice",
        "control_description": (
            "Maintain and publish a COPPA-compliant "
            "children's privacy notice and direct "
            "parental notice where required."
        ),
        "evidence_required": (
            "Current children's privacy notice, "
            "direct notice templates and publication "
            "or delivery records."
        ),
        "test_method": (
            "Review notice content and verify that "
            "required disclosures are documented "
            "and communicated."
        ),
    },
    {
        "article_number": "16 CFR 312.5",
        "title": "Parental consent",
        "summary": (
            "Requires verifiable parental consent "
            "before collecting, using or disclosing "
            "children's personal information, subject "
            "to limited exceptions."
        ),
        "obligation_code": "COPPA-312.5-01",
        "obligation_text": (
            "Obtain verifiable parental consent "
            "before collecting, using or disclosing "
            "personal information from a child "
            "where required."
        ),
        "obligation_type": "Consent",
        "applies_to": "Covered operators",
        "applicability_condition": (
            "Applies before covered collection, "
            "use or disclosure unless a Rule "
            "exception applies."
        ),
        "risk_level": "High",
        "control_code": "CTRL-COPPA-312.5-01",
        "control_name": (
            "Verifiable Parental Consent Control"
        ),
        "control_description": (
            "Implement and document an approved "
            "method for obtaining verifiable "
            "parental consent."
        ),
        "evidence_required": (
            "Consent records, parental verification "
            "method documentation and consent logs."
        ),
        "test_method": (
            "Sample child-data collection events "
            "and verify valid parental consent "
            "preceded collection where required."
        ),
    },
    {
        "article_number": "16 CFR 312.6",
        "title": "Right of parent to review personal information",
        "summary": (
            "Provides parents rights to review "
            "children's personal information, "
            "request deletion and prevent further "
            "use or collection."
        ),
        "obligation_code": "COPPA-312.6-01",
        "obligation_text": (
            "Provide parents with mechanisms to "
            "review, delete and restrict further "
            "use or collection of their child's "
            "personal information."
        ),
        "obligation_type": "Data Subject Rights",
        "applies_to": "Covered operators",
        "applicability_condition": (
            "Applies when a verified parent "
            "exercises COPPA parental rights."
        ),
        "risk_level": "High",
        "control_code": "CTRL-COPPA-312.6-01",
        "control_name": "Parental Rights Request Process",
        "control_description": (
            "Maintain a documented process for "
            "verified parental access, deletion "
            "and restriction requests."
        ),
        "evidence_required": (
            "Request procedures, verification "
            "records, request logs and completion "
            "evidence."
        ),
        "test_method": (
            "Review a sample of parental requests "
            "and confirm identity verification and "
            "timely completion."
        ),
    },
    {
        "article_number": "16 CFR 312.7",
        "title": "Prohibition against conditioning participation",
        "summary": (
            "Prohibits conditioning a child's "
            "participation on disclosure of more "
            "personal information than is reasonably "
            "necessary for the activity."
        ),
        "obligation_code": "COPPA-312.7-01",
        "obligation_text": (
            "Do not require a child to disclose "
            "more personal information than is "
            "reasonably necessary to participate "
            "in an activity."
        ),
        "obligation_type": "Data Minimisation",
        "applies_to": "Covered operators",
        "applicability_condition": (
            "Applies to child-facing activities "
            "that request personal information."
        ),
        "risk_level": "High",
        "control_code": "CTRL-COPPA-312.7-01",
        "control_name": "Child Data Minimisation Review",
        "control_description": (
            "Assess each child-facing collection "
            "point to ensure only necessary data "
            "is required."
        ),
        "evidence_required": (
            "Data collection inventory, field-level "
            "necessity assessment and approved "
            "data minimisation review."
        ),
        "test_method": (
            "Compare required form fields and "
            "collected attributes against the "
            "documented purpose."
        ),
    },
    {
        "article_number": "16 CFR 312.8",
        "title": "Confidentiality, security, and integrity",
        "summary": (
            "Requires reasonable procedures to "
            "protect the confidentiality, security "
            "and integrity of children's personal "
            "information."
        ),
        "obligation_code": "COPPA-312.8-01",
        "obligation_text": (
            "Establish and maintain reasonable "
            "procedures to protect children's "
            "personal information."
        ),
        "obligation_type": "Security",
        "applies_to": "Covered operators",
        "applicability_condition": (
            "Applies where children's personal "
            "information is collected, stored, "
            "used or disclosed."
        ),
        "risk_level": "High",
        "control_code": "CTRL-COPPA-312.8-01",
        "control_name": "Children's Data Security Program",
        "control_description": (
            "Implement appropriate administrative, "
            "technical and organisational safeguards "
            "for children's personal information."
        ),
        "evidence_required": (
            "Security policies, risk assessments, "
            "access controls, encryption evidence "
            "and third-party security assurance."
        ),
        "test_method": (
            "Review security safeguards and test "
            "selected controls protecting children's "
            "personal information."
        ),
    },
    {
        "article_number": "16 CFR 312.10",
        "title": "Data retention and deletion",
        "summary": (
            "Requires children's personal information "
            "to be retained only as long as reasonably "
            "necessary for the purpose for which it "
            "was collected and then securely deleted."
        ),
        "obligation_code": "COPPA-312.10-01",
        "obligation_text": (
            "Retain children's personal information "
            "only for as long as reasonably necessary "
            "for the specific collection purpose and "
            "securely delete it afterwards."
        ),
        "obligation_type": "Retention",
        "applies_to": "Covered operators",
        "applicability_condition": (
            "Applies to retained children's "
            "personal information."
        ),
        "risk_level": "High",
        "control_code": "CTRL-COPPA-312.10-01",
        "control_name": "Children's Data Retention Schedule",
        "control_description": (
            "Define documented purposes, retention "
            "periods and secure deletion procedures "
            "for children's personal information."
        ),
        "evidence_required": (
            "Retention policy, deletion schedule, "
            "system configuration and deletion logs."
        ),
        "test_method": (
            "Sample retained children's records "
            "and verify retention duration and "
            "secure deletion align with policy."
        ),
    },
]


for item in coppa_articles:
    article = get_or_create_article(
        regulation_id=coppa.id,
        article_number=item["article_number"],
        title=item["title"],
        summary=item["summary"],
        source_url=COPPA_SOURCE_URL,
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
        control_description=item[
            "control_description"
        ],
        evidence_required=item[
            "evidence_required"
        ],
        test_method=item["test_method"],
    )


print(
    "COPPA Knowledge Pack v1 seeded successfully"
)

print(
    "COPPA Articles:",
    db.query(RegulationArticle)
    .filter(
        RegulationArticle.regulation_id
        == coppa.id
    )
    .count(),
)

article_ids = [
    article.id
    for article in (
        db.query(RegulationArticle)
        .filter(
            RegulationArticle.regulation_id
            == coppa.id
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
    "COPPA Obligations:",
    obligation_count,
)

db.close()