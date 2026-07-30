from app.intelligence.risk_library import RISK_LIBRARY


def _add_risks(
    generated_risks: list[dict],
    risk_group: str,
    reason: str,
) -> None:
    for risk in RISK_LIBRARY[risk_group]:
        generated_risks.append(
            {
                **risk,
                "reason_generated": reason,
                "likelihood": risk.get("likelihood", "Medium"),
                "impact": risk.get("impact", "Medium"),
                "risk_score": risk.get("risk_score", 9),
            }
        )


def generate_risks(ai_system) -> list[dict]:
    generated_risks: list[dict] = []

    model_type = (ai_system.model_type or "").lower()
    data_classification = (
        ai_system.data_classification or ""
    ).lower()
    vendor = (ai_system.vendor or "").lower()
    eu_category = (
        ai_system.eu_ai_act_category or ""
    ).lower()

    if "llm" in model_type:
        _add_risks(
            generated_risks,
            "llm",
            "Generated because the registered AI system uses a "
            "large language model.",
        )

    if "high risk" in eu_category or "high-risk" in eu_category:
        _add_risks(
            generated_risks,
            "high_risk_ai",
            "Generated because the AI system is classified as "
            "high-risk under its EU AI Act profile.",
        )

    if (
        "personal" in data_classification
        or "sensitive" in data_classification
    ):
        _add_risks(
            generated_risks,
            "personal_data",
            "Generated because the AI system processes personal "
            "or sensitive information.",
        )

    if vendor:
        _add_risks(
            generated_risks,
            "third_party_vendor",
            f"Generated because the AI system depends on the "
            f"external vendor '{ai_system.vendor}'.",
        )

    # Prevent duplicate risks with the same title.
    unique_risks: dict[str, dict] = {}

    for risk in generated_risks:
        unique_risks[risk["title"]] = risk

    return list(unique_risks.values())