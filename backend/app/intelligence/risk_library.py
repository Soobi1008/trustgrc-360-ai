RISK_LIBRARY = {
    "llm": [
        {
            "title": "Prompt Injection Attack",
            "category": "AI Risk",
            "description": "Malicious prompts may manipulate model behaviour.",
            "control": "Input validation and prompt filtering",
            "regulation": "NIST AI RMF",
        },
        {
            "title": "Hallucination Risk",
            "category": "AI Risk",
            "description": "The model may generate inaccurate or misleading outputs.",
            "control": "Human review before critical decisions",
            "regulation": "ISO/IEC 42001",
        },
        {
            "title": "Data Leakage Through Prompts",
            "category": "Privacy Risk",
            "description": "Sensitive information may be disclosed through prompts.",
            "control": "DLP controls and user awareness training",
            "regulation": "GDPR Article 32",
        },
        {
            "title": "Model Misuse",
            "category": "Governance Risk",
            "description": "Users may employ the AI system outside approved purposes.",
            "control": "Acceptable Use Policy and monitoring",
            "regulation": "ISO/IEC 42001",
        },
    ],

    "high_risk_ai": [
        {
            "title": "Lack of Human Oversight",
            "category": "Governance Risk",
            "description": "Insufficient human supervision of AI decisions.",
            "control": "Human oversight procedures",
            "regulation": "EU AI Act",
        },
        {
            "title": "Insufficient Documentation",
            "category": "Governance Risk",
            "description": "Missing technical and compliance documentation.",
            "control": "Maintain model cards and audit evidence",
            "regulation": "EU AI Act",
        },
    ],

    "personal_data": [
        {
            "title": "Unauthorized Data Disclosure",
            "category": "Privacy Risk",
            "description": "Personal data could be exposed or improperly shared.",
            "control": "Access controls and encryption",
            "regulation": "GDPR Article 32",
        },
        {
            "title": "GDPR Article 5 Risk",
            "category": "Compliance Risk",
            "description": "Potential violation of data minimisation principles.",
            "control": "Data minimisation assessment",
            "regulation": "GDPR Article 5",
        },
        {
            "title": "GDPR Article 25 Risk",
            "category": "Compliance Risk",
            "description": "Privacy by Design controls may be inadequate.",
            "control": "Privacy by Design review",
            "regulation": "GDPR Article 25",
        },
    ],

    "third_party_vendor": [
        {
            "title": "Supply Chain Dependency",
            "category": "Third-Party Risk",
            "description": "Dependency on external AI service providers.",
            "control": "Vendor due diligence",
            "regulation": "ISO/IEC 42001",
        }
    ]
}