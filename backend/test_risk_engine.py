from app.intelligence.risk_engine import generate_risks

class DemoAISystem:
    model_type = "LLM"
    vendor = "OpenAI"
    data_classification = "Personal Data"
    eu_ai_act_category = "Limited Risk"

risks = generate_risks(DemoAISystem())

for risk in risks:
    print(risk["title"])