"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";

type Answer = "yes" | "no" | "unknown" | "";

type Question = {
  id: string;
  category: string;
  question: string;
  description?: string;
};

type Answers = Record<string, Answer>;

type Sector =
  | ""
  | "healthcare"
  | "finance"
  | "government"
  | "education"
  | "technology"
  | "manufacturing"
  | "transport"
  | "aviation"
  | "hospitality";

type UseCase =
  | "decision_support"
  | "customer_service"
  | "generative_ai"
  | "fraud_detection"
  | "recruitment"
  | "monitoring"
  | "biometric"
  | "clinical"
  | "automation"
  | "analytics"
  | "other";

const sectorOptions: {
  value: Sector;
  label: string;
}[] = [
  { value: "", label: "Select company sector" },
  { value: "healthcare", label: "Healthcare / Hospital" },
  { value: "finance", label: "Banking / Finance / Insurance" },
  { value: "government", label: "Government / Public Sector" },
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology / SaaS" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "transport", label: "Transport / Logistics" },
  { value: "aviation", label: "Aviation" },
  { value: "hospitality", label: "Tourism / Hospitality" },
];

const useCaseOptions: {
  value: UseCase;
  label: string;
  description: string;
}[] = [
  {
    value: "decision_support",
    label: "Decision Support",
    description:
      "AI that assists or influences operational, professional or management decisions.",
  },
  {
    value: "customer_service",
    label: "Customer / Citizen / Patient Service",
    description:
      "Chatbots, virtual assistants and other AI interacting directly with individuals.",
  },
  {
    value: "generative_ai",
    label: "Generative AI",
    description:
      "AI generating text, images, audio, video, code or other synthetic content.",
  },
  {
    value: "fraud_detection",
    label: "Fraud / Risk Detection",
    description:
      "AI used for fraud, anomaly, financial crime or risk detection.",
  },
  {
    value: "recruitment",
    label: "Recruitment / Workforce Management",
    description:
      "AI used in hiring, screening, employee monitoring or workforce decisions.",
  },
  {
    value: "monitoring",
    label: "Monitoring / Surveillance",
    description:
      "AI monitoring individuals, activities, environments, behaviour or operations.",
  },
  {
    value: "biometric",
    label: "Biometric Identification / Recognition",
    description:
      "AI using facial, voice, fingerprint or other biometric characteristics.",
  },
  {
    value: "clinical",
    label: "Clinical / Medical Decision Support",
    description:
      "AI supporting diagnosis, treatment, triage, medical imaging or clinical decisions.",
  },
  {
    value: "automation",
    label: "Process Automation",
    description:
      "AI automating administrative, operational, technical or business processes.",
  },
  {
    value: "analytics",
    label: "Analytics / Prediction",
    description:
      "AI used for forecasting, scoring, classification, prediction or optimisation.",
  },
  {
    value: "other",
    label: "Other AI Use Case",
    description:
      "An AI use case that is not represented by the categories above.",
  },
];

const coreQuestions: Question[] = [
  {
    id: "eu_operation",
    category: "Jurisdiction",
    question:
      "Is the AI system developed, deployed, offered or used within the European Union?",
    description:
      "This helps determine potential applicability of European AI and data-protection requirements.",
  },
  {
    id: "eu_impact",
    category: "Jurisdiction",
    question:
      "Could the AI system's output affect individuals located in the European Union?",
    description:
      "Certain EU requirements may be relevant even where the provider or deployer is established outside the EU.",
  },
  {
    id: "personal_data",
    category: "Data & Privacy",
    question: "Does the AI system process personal data?",
    description:
      "Examples include names, identifiers, customer records, employee information, device identifiers or behavioural data.",
  },
  {
    id: "sensitive_data",
    category: "Data & Privacy",
    question:
      "Does the AI system process sensitive or special-category personal data?",
    description:
      "Examples may include health, biometric, genetic, racial or ethnic origin, religious beliefs or other specially protected information.",
  },
  {
    id: "biometric",
    category: "Data & Privacy",
    question:
      "Does the AI system perform biometric identification, categorisation, verification or recognition?",
    description:
      "Biometric processing may require additional privacy, governance and AI-risk assessment.",
  },
  {
    id: "automated_decision",
    category: "Decision Making",
    question:
      "Does the AI system make or materially support decisions affecting individuals?",
    description:
      "Examples include eligibility, recruitment, credit, insurance, healthcare, access to services or workforce decisions.",
  },
  {
    id: "human_oversight",
    category: "Decision Making",
    question:
      "Can a qualified human meaningfully review, challenge or override important AI decisions?",
    description:
      "Human oversight is an important safeguard for many higher-risk AI applications.",
  },
  {
    id: "customer_facing",
    category: "Transparency",
    question:
      "Does the AI system interact directly with customers, citizens, employees, patients, students or other individuals?",
    description:
      "Human-facing AI may create transparency and disclosure requirements.",
  },
  {
    id: "generated_content",
    category: "Transparency",
    question:
      "Does the AI system generate synthetic text, images, audio, video or other content?",
    description:
      "Generative AI may require additional transparency, provenance and content-governance measures.",
  },
  {
    id: "third_party",
    category: "Third-Party Risk",
    question:
      "Does the organisation rely on an external AI provider, foundation model, API or third-party AI service?",
    description:
      "Third-party AI introduces supplier governance, due-diligence, contractual and monitoring considerations.",
  },
];

const sectorQuestions: Record<
  Exclude<Sector, "">,
  Question[]
> = {
  healthcare: [
    {
      id: "health_patient_data",
      category: "Healthcare",
      question:
        "Does the AI system process patient health records, clinical information or medical history?",
      description:
        "Patient information may involve highly sensitive personal data and enhanced confidentiality requirements.",
    },
    {
      id: "health_clinical_decision",
      category: "Healthcare",
      question:
        "Does the AI system support diagnosis, treatment, prognosis or other clinical decisions?",
      description:
        "Clinical decision support can create significant safety, governance and regulatory obligations.",
    },
    {
      id: "health_medical_device",
      category: "Healthcare",
      question:
        "Is the AI system embedded in, connected to or used as part of a medical device?",
      description:
        "Medical-device use may trigger additional product-safety and sector-specific regulatory requirements.",
    },
    {
      id: "health_triage",
      category: "Healthcare",
      question:
        "Does the AI system prioritise patients, recommend treatment pathways or support clinical triage?",
      description:
        "Systems influencing patient prioritisation can have significant effects on individuals.",
    },
    {
      id: "health_patient_harm",
      category: "Healthcare",
      question:
        "Could an incorrect AI output reasonably contribute to patient injury, delayed treatment or other significant harm?",
      description:
        "Potential patient harm is an important factor in determining governance and assurance requirements.",
    },
    {
      id: "health_external_provider",
      category: "Healthcare",
      question:
        "Is patient information transmitted to an external AI provider or cloud-based model?",
      description:
        "External processing may create additional privacy, security, data-transfer and vendor-risk obligations.",
    },
  ],

  finance: [
    {
      id: "finance_credit",
      category: "Financial Services",
      question:
        "Is the AI system used to assess creditworthiness, lending eligibility or access to financial services?",
      description:
        "AI affecting access to financial services may be subject to enhanced regulatory scrutiny.",
    },
    {
      id: "finance_fraud",
      category: "Financial Services",
      question:
        "Is AI used for fraud detection, anti-money-laundering monitoring or suspicious-activity detection?",
      description:
        "Financial crime applications require appropriate governance, accuracy and human-review controls.",
    },
    {
      id: "finance_pricing",
      category: "Financial Services",
      question:
        "Does the AI system determine or materially influence pricing, insurance premiums or financial terms offered to individuals?",
    },
    {
      id: "finance_trading",
      category: "Financial Services",
      question:
        "Does the AI system autonomously execute or materially support trading, investment or portfolio decisions?",
    },
  ],

  government: [
    {
      id: "gov_public_decision",
      category: "Government",
      question:
        "Does the AI system determine or materially influence access to public benefits, services or government decisions?",
    },
    {
      id: "gov_law_enforcement",
      category: "Government",
      question:
        "Is the AI system used for law enforcement or criminal investigation?",
    },
    {
      id: "gov_border",
      category: "Government",
      question:
        "Is the AI system used for border control, migration or asylum-related decisions?",
    },
    {
      id: "gov_justice",
      category: "Government",
      question:
        "Is the AI system used within judicial, sentencing or justice-related processes?",
    },
  ],

  education: [
    {
      id: "edu_admission",
      category: "Education",
      question:
        "Does the AI system influence student admission, selection or access to education?",
    },
    {
      id: "edu_assessment",
      category: "Education",
      question:
        "Does the AI system score, grade, rank or assess student performance?",
    },
    {
      id: "edu_monitoring",
      category: "Education",
      question:
        "Is AI used to monitor student behaviour, attention, participation or examination activity?",
    },
    {
      id: "edu_minors",
      category: "Education",
      question:
        "Does the system process information relating to children or minors?",
    },
  ],

  technology: [
    {
      id: "tech_gpai",
      category: "Technology",
      question:
        "Does your organisation develop, fine-tune, distribute or provide a general-purpose AI model or AI platform?",
    },
    {
      id: "tech_customer_models",
      category: "Technology",
      question:
        "Can customers integrate your AI system into their own products or decision-making processes?",
    },
    {
      id: "tech_training_data",
      category: "Technology",
      question:
        "Does your organisation collect or curate data to train, fine-tune or improve AI models?",
    },
    {
      id: "tech_api",
      category: "Technology",
      question:
        "Is the AI system primarily delivered to customers through an API, SDK or hosted service?",
    },
  ],

  manufacturing: [
    {
      id: "man_safety",
      category: "Manufacturing",
      question:
        "Does the AI system control or influence machinery, robots or safety-critical industrial processes?",
    },
    {
      id: "man_quality",
      category: "Manufacturing",
      question:
        "Does AI automatically accept, reject or classify products based on quality or safety criteria?",
    },
    {
      id: "man_worker_monitoring",
      category: "Manufacturing",
      question:
        "Is AI used to monitor worker performance, behaviour, safety or productivity?",
    },
  ],

  transport: [
    {
      id: "transport_safety",
      category: "Transport & Logistics",
      question:
        "Does AI control, optimise or materially influence safety-critical transport operations?",
    },
    {
      id: "transport_route",
      category: "Transport & Logistics",
      question:
        "Does AI automatically determine routing, dispatching or operational decisions that may affect safety?",
    },
    {
      id: "transport_driver",
      category: "Transport & Logistics",
      question:
        "Is AI used to monitor or score drivers, operators or other employees?",
    },
  ],

  aviation: [
    {
      id: "aviation_safety",
      category: "Aviation",
      question:
        "Does the AI system influence flight operations, navigation, aircraft safety or other safety-critical functions?",
    },
    {
      id: "aviation_passenger",
      category: "Aviation",
      question:
        "Is AI used to profile, identify, screen or assess passengers?",
    },
    {
      id: "aviation_maintenance",
      category: "Aviation",
      question:
        "Does AI influence aircraft maintenance, fault prediction or airworthiness decisions?",
    },
  ],

  hospitality: [
    {
      id: "hotel_pricing",
      category: "Tourism & Hospitality",
      question:
        "Does AI automatically personalise or determine prices, offers or eligibility for customers?",
    },
    {
      id: "hotel_guest_profile",
      category: "Tourism & Hospitality",
      question:
        "Does the AI system profile guests based on behaviour, preferences or personal characteristics?",
    },
    {
      id: "hotel_biometric",
      category: "Tourism & Hospitality",
      question:
        "Is biometric technology used for check-in, access control or guest identification?",
    },
  ],
};

const biometricFollowUps: Question[] = [
  {
    id: "bio_remote",
    category: "Biometric Assessment",
    question:
      "Does the biometric system perform remote identification of individuals?",
    description:
      "Remote biometric identification requires more detailed regulatory analysis.",
  },
  {
    id: "bio_public_space",
    category: "Biometric Assessment",
    question:
      "Is the biometric system used in a publicly accessible space?",
  },
  {
    id: "bio_realtime",
    category: "Biometric Assessment",
    question:
      "Does biometric identification occur in real time?",
  },
  {
    id: "bio_emotion",
    category: "Biometric Assessment",
    question:
      "Does the system infer or recognise emotions from biometric or behavioural information?",
  },
  {
    id: "bio_sensitive_categories",
    category: "Biometric Assessment",
    question:
      "Does the system categorise individuals using sensitive personal characteristics?",
  },
];

const employmentFollowUps: Question[] = [
  {
    id: "employment_screening",
    category: "Employment",
    question:
      "Does AI screen, rank or reject job applicants?",
  },
  {
    id: "employment_performance",
    category: "Employment",
    question:
      "Does AI evaluate employee performance, productivity or behaviour?",
  },
  {
    id: "employment_termination",
    category: "Employment",
    question:
      "Can AI materially influence promotion, disciplinary or termination decisions?",
  },
];

export default function AssessmentsPage() {
  const searchParams = useSearchParams();
  const aiSystemId = searchParams.get("ai_system_id");

  const [sector, setSector] = useState<Sector>("");
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [assessmentStarted, setAssessmentStarted] =
    useState(false);
  const [assessmentCompleted, setAssessmentCompleted] =
    useState(false);

  const visibleQuestions = useMemo(() => {
    const questionList: Question[] = [...coreQuestions];

    if (sector) {
      questionList.push(...sectorQuestions[sector]);
    }

    if (
      answers.biometric === "yes" ||
      useCases.includes("biometric")
    ) {
      questionList.push(...biometricFollowUps);
    }

    const employmentBranchRequired =
      useCases.includes("recruitment") ||
      (
        answers.automated_decision === "yes" &&
        sector !== "healthcare" &&
        answers.customer_facing === "yes"
      );

    if (employmentBranchRequired) {
      questionList.push(...employmentFollowUps);
    }

    return Array.from(
      new Map(
        questionList.map((question) => [
          question.id,
          question,
        ])
      ).values()
    );
  }, [sector, useCases, answers]);

  const answeredCount = visibleQuestions.filter(
    (question) =>
      answers[question.id] &&
      answers[question.id] !== ""
  ).length;

  const progress =
    visibleQuestions.length === 0
      ? 0
      : Math.round(
          (answeredCount /
            visibleQuestions.length) *
            100
        );

  const result = useMemo(() => {
    const yes = (id: string) =>
      answers[id] === "yes";

    const euRelevant =
      yes("eu_operation") ||
      yes("eu_impact");

    const gdprApplicable =
      euRelevant &&
      (
        yes("personal_data") ||
        yes("sensitive_data") ||
        yes("biometric") ||
        yes("health_patient_data") ||
        yes("edu_minors") ||
        yes("hotel_guest_profile")
      );

    const highRiskIndicators: string[] = [];

    if (
      yes("health_clinical_decision") ||
      useCases.includes("clinical")
    ) {
      highRiskIndicators.push(
        "Clinical decision support"
      );
    }

    if (yes("health_medical_device")) {
      highRiskIndicators.push(
        "Medical-device-related AI"
      );
    }

    if (yes("finance_credit")) {
      highRiskIndicators.push(
        "Creditworthiness / access to financial services"
      );
    }

    if (yes("gov_public_decision")) {
      highRiskIndicators.push(
        "Access to public services or benefits"
      );
    }

    if (yes("gov_law_enforcement")) {
      highRiskIndicators.push(
        "Law-enforcement use"
      );
    }

    if (yes("gov_border")) {
      highRiskIndicators.push(
        "Migration / border-control use"
      );
    }

    if (yes("edu_admission")) {
      highRiskIndicators.push(
        "Education admission / access"
      );
    }

    if (
      yes("employment_screening") ||
      useCases.includes("recruitment")
    ) {
      highRiskIndicators.push(
        "Employment applicant screening / workforce AI"
      );
    }

    if (yes("man_safety")) {
      highRiskIndicators.push(
        "Safety-critical industrial operation"
      );
    }

    if (yes("transport_safety")) {
      highRiskIndicators.push(
        "Safety-critical transport operation"
      );
    }

    if (yes("aviation_safety")) {
      highRiskIndicators.push(
        "Safety-critical aviation operation"
      );
    }

    const transparencyIndicators =
      yes("customer_facing") ||
      yes("generated_content") ||
      useCases.includes("generative_ai") ||
      useCases.includes("customer_service");

    const article5ScreeningRequired =
      yes("bio_remote") ||
      yes("bio_realtime") ||
      yes("bio_emotion") ||
      yes("bio_sensitive_categories") ||
      yes("gov_law_enforcement");

    let regulatoryClassification =
      "No elevated classification identified yet";

    if (article5ScreeningRequired) {
      regulatoryClassification =
        "Article 5 / Prohibited-Practice Screening Required";
    } else if (
      euRelevant &&
      highRiskIndicators.length > 0
    ) {
      regulatoryClassification =
        "Potential High-Risk AI";
    } else if (
      euRelevant &&
      transparencyIndicators
    ) {
      regulatoryClassification =
        "Transparency Obligations May Apply";
    }

    let governanceRisk:
      | "Low"
      | "Moderate"
      | "High"
      | "Critical" = "Low";

    let governanceScore = 0;

    if (yes("personal_data")) {
      governanceScore += 1;
    }

    if (yes("sensitive_data")) {
      governanceScore += 2;
    }

    if (yes("automated_decision")) {
      governanceScore += 2;
    }

    if (
      yes("biometric") ||
      useCases.includes("biometric")
    ) {
      governanceScore += 2;
    }

    if (yes("third_party")) {
      governanceScore += 1;
    }

    if (highRiskIndicators.length > 0) {
      governanceScore += 2;
    }

    if (yes("health_patient_harm")) {
      governanceScore += 3;
    }

    if (yes("aviation_safety")) {
      governanceScore += 3;
    }

    if (yes("transport_safety")) {
      governanceScore += 3;
    }

    if (yes("man_safety")) {
      governanceScore += 3;
    }

    if (
      useCases.includes("monitoring")
    ) {
      governanceScore += 1;
    }

    if (governanceScore >= 8) {
      governanceRisk = "Critical";
    } else if (governanceScore >= 5) {
      governanceRisk = "High";
    } else if (governanceScore >= 2) {
      governanceRisk = "Moderate";
    }

    const euAiActApplicable =
      euRelevant &&
      (
        highRiskIndicators.length > 0 ||
        transparencyIndicators ||
        article5ScreeningRequired ||
        yes("automated_decision") ||
        yes("biometric") ||
        useCases.includes("biometric") ||
        useCases.includes("clinical") ||
        useCases.includes("recruitment")
      );

    const reasons: string[] = [];

    if (euRelevant) {
      reasons.push(
        "The AI activity has an identified connection to the European Union."
      );
    }

    if (yes("personal_data")) {
      reasons.push(
        "The AI activity processes personal data."
      );
    }

    if (yes("sensitive_data")) {
      reasons.push(
        "Sensitive or specially protected personal data is involved."
      );
    }

    if (yes("automated_decision")) {
      reasons.push(
        "AI makes or materially supports decisions affecting individuals."
      );
    }

    if (
      yes("biometric") ||
      useCases.includes("biometric")
    ) {
      reasons.push(
        "Biometric functionality requires enhanced regulatory and privacy analysis."
      );
    }

    if (
      yes("health_clinical_decision") ||
      useCases.includes("clinical")
    ) {
      reasons.push(
        "Clinical or medical AI use has been identified."
      );
    }

    if (yes("health_patient_harm")) {
      reasons.push(
        "Incorrect AI output could contribute to significant patient harm."
      );
    }

    if (yes("finance_credit")) {
      reasons.push(
        "The AI activity may influence access to credit or financial services."
      );
    }

    if (yes("third_party")) {
      reasons.push(
        "The organisation relies on an external AI provider or service."
      );
    }

    if (
      yes("generated_content") ||
      useCases.includes("generative_ai")
    ) {
      reasons.push(
        "Generative AI or synthetic content generation has been identified."
      );
    }

    if (
      useCases.includes("recruitment")
    ) {
      reasons.push(
        "Recruitment or workforce-management AI has been selected."
      );
    }

    if (
      useCases.includes("monitoring")
    ) {
      reasons.push(
        "Monitoring or surveillance functionality has been selected."
      );
    }

    const modules: string[] = [];

    if (euAiActApplicable) {
      modules.push(
        "EU AI Act Assessment"
      );
    }

    if (gdprApplicable) {
      modules.push(
        "GDPR / Privacy Assessment"
      );
    }

    if (
      yes("health_patient_data") ||
      yes("health_clinical_decision") ||
      useCases.includes("clinical")
    ) {
      modules.push(
        "Healthcare AI Assessment"
      );
    }

    if (
      yes("biometric") ||
      useCases.includes("biometric")
    ) {
      modules.push(
        "Biometric AI Assessment"
      );
    }

    if (
      useCases.includes("recruitment")
    ) {
      modules.push(
        "Employment AI Assessment"
      );
    }

    if (
      useCases.includes("generative_ai")
    ) {
      modules.push(
        "Generative AI Governance Assessment"
      );
    }

    if (
      useCases.includes("monitoring")
    ) {
      modules.push(
        "Monitoring & Surveillance Assessment"
      );
    }

    if (yes("third_party")) {
      modules.push(
        "Third-Party AI Risk Assessment"
      );
    }

    if (
      yes("automated_decision") ||
      highRiskIndicators.length > 0
    ) {
      modules.push(
        "Human Oversight Assessment"
      );
    }

    if (
      governanceRisk === "High" ||
      governanceRisk === "Critical"
    ) {
      modules.push(
        "AI Cybersecurity & Resilience Assessment"
      );
    }

    return {
      gdprApplicable,
      euAiActApplicable,
      highRiskIndicators,
      article5ScreeningRequired,
      regulatoryClassification,
      governanceRisk,
      reasons: Array.from(
        new Set(reasons)
      ),
      modules: Array.from(
        new Set(modules)
      ),
    };
  }, [answers, useCases]);

  function updateAnswer(
    id: string,
    value: Answer
  ) {
    setAnswers((current) => ({
      ...current,
      [id]: value,
    }));

    setAssessmentCompleted(false);
  }

  function toggleUseCase(
    value: UseCase
  ) {
    if (assessmentStarted) {
      return;
    }

    setUseCases((current) => {
      if (current.includes(value)) {
        return current.filter(
          (item) => item !== value
        );
      }

      return [...current, value];
    });

    setAssessmentCompleted(false);
  }

  function selectAllUseCases() {
    if (assessmentStarted) {
      return;
    }

    setUseCases(
      useCaseOptions.map(
        (option) => option.value
      )
    );

    setAssessmentCompleted(false);
  }

  function clearAllUseCases() {
    if (assessmentStarted) {
      return;
    }

    setUseCases([]);
    setAssessmentCompleted(false);
  }

  function resetAssessment() {
    setAnswers({});
    setAssessmentStarted(false);
    setAssessmentCompleted(false);
    setSector("");
    setUseCases([]);
  }

  function handleSectorChange(
    value: Sector
  ) {
    setSector(value);
    setAnswers({});
    setAssessmentCompleted(false);
  }

  function startAssessment() {
    if (!sector) {
      window.alert(
        "Please select the organisation's sector before starting the applicability assessment."
      );

      return;
    }

    if (useCases.length === 0) {
      window.alert(
        "Please select at least one AI use case before starting the applicability assessment."
      );

      return;
    }

    setAssessmentStarted(true);
  }

  function completeAssessment() {
    if (
      answeredCount !==
      visibleQuestions.length
    ) {
      window.alert(
        `Please answer all currently applicable questions. ${
          visibleQuestions.length -
          answeredCount
        } question(s) remain.`
      );

      return;
    }

    setAssessmentCompleted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 55%, #f8fafc 100%)",
      padding: "34px 34px 64px",
      color: "#0f172a",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    } as CSSProperties,

    container: {
      maxWidth: "1440px",
      margin: "0 auto",
    } as CSSProperties,

    eyebrow: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 10px",
      borderRadius: "999px",
      backgroundColor: "#eef2ff",
      color: "#4338ca",
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      marginBottom: "14px",
    } as CSSProperties,

    title: {
      margin: 0,
      fontSize: "34px",
      lineHeight: 1.15,
      fontWeight: 750,
      letterSpacing: "-0.03em",
      color: "#0f172a",
    } as CSSProperties,

    subtitle: {
      marginTop: "12px",
      marginBottom: 0,
      maxWidth: "790px",
      color: "#64748b",
      fontSize: "15px",
      lineHeight: 1.7,
    } as CSSProperties,

    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      boxShadow:
        "0 8px 30px rgba(15, 23, 42, 0.04)",
    } as CSSProperties,

    label: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    } as CSSProperties,

    primaryButton: {
      border: "none",
      borderRadius: "10px",
      padding: "11px 18px",
      fontSize: "14px",
      fontWeight: 700,
      background:
        "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
      color: "#ffffff",
      cursor: "pointer",
      boxShadow:
        "0 8px 20px rgba(37, 99, 235, 0.18)",
    } as CSSProperties,

    secondaryButton: {
      border: "1px solid #cbd5e1",
      borderRadius: "10px",
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: 650,
      backgroundColor: "#ffffff",
      color: "#334155",
      cursor: "pointer",
    } as CSSProperties,

    smallButton: {
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      padding: "7px 10px",
      fontSize: "11px",
      fontWeight: 700,
      backgroundColor: "#ffffff",
      color: "#475569",
      cursor: "pointer",
    } as CSSProperties,

    select: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: "9px",
      border: "1px solid #cbd5e1",
      backgroundColor: "#ffffff",
      color: "#0f172a",
      fontSize: "13px",
      outline: "none",
    } as CSSProperties,
  };

  const sectorLabel =
    sectorOptions.find(
      (item) =>
        item.value === sector
    )?.label || "Not selected";

  const selectedUseCaseLabels =
    useCaseOptions
      .filter((option) =>
        useCases.includes(option.value)
      )
      .map((option) => option.label);

  const useCaseSummary =
    selectedUseCaseLabels.length > 0
      ? selectedUseCaseLabels.join(", ")
      : "Not selected";

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: "24px",
            alignItems:
              "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={styles.eyebrow}>
              <span>◆</span>
              TrustGRC Intelligence
            </div>

            <h1 style={styles.title}>
              Applicability Engine
            </h1>

            <p style={styles.subtitle}>
              Determine which AI governance,
              privacy, security and regulatory
              requirements may apply using a
              dynamic assessment tailored to the
              organisation&apos;s sector, AI use
              cases, data, affected individuals
              and jurisdiction.
            </p>
          </div>

          <div
            style={{
              ...styles.card,
              padding: "14px 18px",
              minWidth: "230px",
            }}
          >
            <div style={styles.label}>
              Assessment Status
            </div>

            <div
              style={{
                marginTop: "7px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor:
                    assessmentCompleted
                      ? "#16a34a"
                      : assessmentStarted
                        ? "#f59e0b"
                        : "#94a3b8",
                }}
              />

              {assessmentCompleted
                ? "Assessment completed"
                : assessmentStarted
                  ? "Assessment in progress"
                  : "Not started"}
            </div>
          </div>
        </div>

        <section
          style={{
            ...styles.card,
            marginTop: "28px",
            padding: "22px",
          }}
        >
          <div style={styles.label}>
            Assessment Scope
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "18px",
              fontWeight: 750,
            }}
          >
            {aiSystemId
              ? `AI System ${aiSystemId}`
              : "Preliminary organisation assessment"}
          </div>

          <div
            style={{
              marginTop: "6px",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {aiSystemId
              ? "This assessment is linked to an AI system in the AI Inventory."
              : "Select the organisation sector and all relevant AI use cases. The result can later be linked to specific AI systems in the AI Inventory."}
          </div>

          <div
            style={{
              marginTop: "22px",
            }}
          >
            <div
              style={{
                ...styles.label,
                marginBottom: "7px",
              }}
            >
              Organisation Sector
            </div>

            <select
              value={sector}
              onChange={(event) =>
                handleSectorChange(
                  event.target
                    .value as Sector
                )
              }
              disabled={
                assessmentStarted
              }
              style={{
                ...styles.select,
                maxWidth: "520px",
                opacity:
                  assessmentStarted
                    ? 0.75
                    : 1,
              }}
            >
              {sectorOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "22px",
              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "flex-end",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={
                    styles.label
                  }
                >
                  AI Use Cases
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  Select all AI
                  activities that apply
                  to the assessment.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  style={{
                    ...styles.smallButton,
                    opacity:
                      assessmentStarted
                        ? 0.55
                        : 1,
                    cursor:
                      assessmentStarted
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={
                    assessmentStarted
                  }
                  onClick={
                    selectAllUseCases
                  }
                >
                  Select All
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.smallButton,
                    opacity:
                      assessmentStarted
                        ? 0.55
                        : 1,
                    cursor:
                      assessmentStarted
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={
                    assessmentStarted
                  }
                  onClick={
                    clearAllUseCases
                  }
                >
                  Clear All
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: "14px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "10px",
              }}
            >
              {useCaseOptions.map(
                (option) => (
                  <UseCaseCheckbox
                    key={
                      option.value
                    }
                    option={option}
                    checked={useCases.includes(
                      option.value
                    )}
                    disabled={
                      assessmentStarted
                    }
                    onToggle={() =>
                      toggleUseCase(
                        option.value
                      )
                    }
                  />
                )
              )}
            </div>

            <div
              style={{
                marginTop: "13px",
                fontSize: "12px",
                color:
                  useCases.length > 0
                    ? "#475569"
                    : "#b45309",
                fontWeight: 650,
              }}
            >
              {useCases.length > 0
                ? `${useCases.length} AI use case${
                    useCases.length === 1
                      ? ""
                      : "s"
                  } selected`
                : "Select at least one AI use case."}
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent:
                "space-between",
              gap: "14px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              TrustGRC will combine
              core, sector-specific and
              conditional assessment
              modules based on these
              selections.
            </div>

            {!assessmentStarted ? (
              <button
                type="button"
                style={
                  styles.primaryButton
                }
                onClick={
                  startAssessment
                }
              >
                Start Assessment →
              </button>
            ) : (
              <button
                type="button"
                style={
                  styles.secondaryButton
                }
                onClick={
                  resetAssessment
                }
              >
                Reset Assessment
              </button>
            )}
          </div>
        </section>

        <section
          style={{
            ...styles.card,
            marginTop: "18px",
            padding: "18px 22px",
          }}
        >
          <div style={styles.label}>
            Frameworks Evaluated
          </div>

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexWrap: "wrap",
              gap: "9px",
            }}
          >
            {[
              "EU AI Act",
              "GDPR",
              "ISO/IEC 42001",
              "NIST AI RMF",
              "Sector Requirements",
              "Privacy & AI Governance",
            ].map((framework) => (
              <span
                key={framework}
                style={{
                  padding: "7px 10px",
                  borderRadius: "8px",
                  backgroundColor:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  fontSize: "12px",
                  fontWeight: 650,
                  color: "#475569",
                }}
              >
                {framework}
              </span>
            ))}
          </div>
        </section>

        {assessmentStarted && (
          <>
            <section
              style={{
                ...styles.card,
                marginTop: "18px",
                padding: "18px 22px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <ContextItem
                  label="Sector"
                  value={sectorLabel}
                />

                <ContextItem
                  label="AI Use Cases"
                  value={useCaseSummary}
                />

                <ContextItem
                  label="Use Cases Selected"
                  value={`${useCases.length}`}
                />

                <ContextItem
                  label="Questions Loaded"
                  value={`${visibleQuestions.length}`}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 750,
                    }}
                  >
                    Assessment Progress
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {answeredCount} of{" "}
                    {
                      visibleQuestions.length
                    }{" "}
                    applicable questions
                    answered
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#2563eb",
                  }}
                >
                  {progress}%
                </div>
              </div>

              <div
                style={{
                  marginTop: "13px",
                  height: "7px",
                  borderRadius: "999px",
                  backgroundColor:
                    "#e2e8f0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)",
                    transition:
                      "width 250ms ease",
                  }}
                />
              </div>
            </section>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.65fr) minmax(310px, 0.75fr)",
                gap: "20px",
                marginTop: "20px",
                alignItems: "start",
              }}
            >
              <section>
                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >
                  {visibleQuestions.map(
                    (
                      question,
                      index
                    ) => (
                      <QuestionCard
                        key={
                          question.id
                        }
                        index={
                          index + 1
                        }
                        question={
                          question
                        }
                        value={
                          answers[
                            question.id
                          ] || ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateAnswer(
                            question.id,
                            value
                          )
                        }
                      />
                    )
                  )}
                </div>

                <div
                  style={{
                    ...styles.card,
                    marginTop: "18px",
                    padding: "20px",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize:
                          "14px",
                        fontWeight: 750,
                      }}
                    >
                      Complete the
                      applicability
                      assessment
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        color:
                          "#64748b",
                        fontSize:
                          "12px",
                      }}
                    >
                      Conditional
                      questions may
                      appear depending
                      on your selected
                      AI use cases and
                      answers.
                    </div>
                  </div>

                  <button
                    type="button"
                    style={
                      styles.primaryButton
                    }
                    onClick={
                      completeAssessment
                    }
                  >
                    Generate Applicability
                    Result
                  </button>
                </div>
              </section>

              <aside
                style={{
                  position: "sticky",
                  top: "20px",
                  display: "grid",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    ...styles.card,
                    padding: "20px",
                  }}
                >
                  <div
                    style={
                      styles.label
                    }
                  >
                    Regulatory
                    Applicability
                  </div>

                  <h3
                    style={{
                      margin:
                        "8px 0 4px",
                      fontSize:
                        "18px",
                      fontWeight: 750,
                    }}
                  >
                    Preliminary Result
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color:
                        "#64748b",
                      fontSize:
                        "12px",
                      lineHeight: 1.6,
                    }}
                  >
                    Results update as
                    relevant assessment
                    branches are
                    completed.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      marginTop:
                        "18px",
                    }}
                  >
                    <FrameworkResult
                      name="EU AI Act"
                      status={
                        result.euAiActApplicable
                          ? "Potentially Applicable"
                          : "Not yet triggered"
                      }
                      tone={
                        result.euAiActApplicable
                          ? "warning"
                          : "neutral"
                      }
                    />

                    <FrameworkResult
                      name="GDPR"
                      status={
                        result.gdprApplicable
                          ? "Potentially Applicable"
                          : "Not yet triggered"
                      }
                      tone={
                        result.gdprApplicable
                          ? "warning"
                          : "neutral"
                      }
                    />

                    <FrameworkResult
                      name="ISO/IEC 42001"
                      status="Recommended"
                      tone="info"
                    />

                    <FrameworkResult
                      name="NIST AI RMF"
                      status="Recommended"
                      tone="info"
                    />
                  </div>
                </div>

                <div
                  style={{
                    ...styles.card,
                    padding: "20px",
                  }}
                >
                  <div
                    style={
                      styles.label
                    }
                  >
                    Regulatory
                    Classification
                  </div>

                  <div
                    style={{
                      marginTop:
                        "12px",
                      padding:
                        "14px",
                      borderRadius:
                        "11px",
                      backgroundColor:
                        result.article5ScreeningRequired
                          ? "#fff7ed"
                          : result
                                .highRiskIndicators
                                .length > 0
                            ? "#fffbeb"
                            : "#f8fafc",
                      border:
                        result.article5ScreeningRequired
                          ? "1px solid #fed7aa"
                          : result
                                .highRiskIndicators
                                .length > 0
                            ? "1px solid #fde68a"
                            : "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "11px",
                        fontWeight:
                          750,
                        color:
                          "#64748b",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.05em",
                      }}
                    >
                      Preliminary
                      Classification
                    </div>

                    <div
                      style={{
                        marginTop:
                          "6px",
                        fontSize:
                          "14px",
                        fontWeight:
                          800,
                        lineHeight:
                          1.45,
                      }}
                    >
                      {
                        result.regulatoryClassification
                      }
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop:
                        "14px",
                      paddingTop:
                        "13px",
                      borderTop:
                        "1px solid #e2e8f0",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "12px",
                        color:
                          "#64748b",
                      }}
                    >
                      Governance risk
                    </span>

                    <strong
                      style={{
                        fontSize:
                          "12px",
                      }}
                    >
                      {
                        result.governanceRisk
                      }
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.card,
                    padding: "20px",
                  }}
                >
                  <div
                    style={
                      styles.label
                    }
                  >
                    Why This Matters
                  </div>

                  {result.reasons
                    .length === 0 ? (
                    <p
                      style={{
                        margin:
                          "10px 0 0",
                        fontSize:
                          "12px",
                        color:
                          "#64748b",
                        lineHeight:
                          1.7,
                      }}
                    >
                      Answer the
                      questions to see
                      regulatory
                      reasoning.
                    </p>
                  ) : (
                    <div
                      style={{
                        display:
                          "grid",
                        gap: "10px",
                        marginTop:
                          "12px",
                      }}
                    >
                      {result.reasons
                        .slice(0, 6)
                        .map(
                          (
                            reason,
                            index
                          ) => (
                            <ReasonItem
                              key={`${reason}-${index}`}
                              text={
                                reason
                              }
                            />
                          )
                        )}
                    </div>
                  )}
                </div>

                {result.modules
                  .length > 0 && (
                  <div
                    style={{
                      ...styles.card,
                      padding: "20px",
                    }}
                  >
                    <div
                      style={
                        styles.label
                      }
                    >
                      Recommended
                      Assessments
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gap: "8px",
                        marginTop:
                          "12px",
                      }}
                    >
                      {result.modules.map(
                        (module) => (
                          <div
                            key={
                              module
                            }
                            style={{
                              padding:
                                "9px 10px",
                              borderRadius:
                                "9px",
                              backgroundColor:
                                "#f8fafc",
                              border:
                                "1px solid #e2e8f0",
                              fontSize:
                                "11px",
                              fontWeight:
                                700,
                              color:
                                "#334155",
                            }}
                          >
                            → {module}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </aside>
            </div>

            {assessmentCompleted && (
              <section
                style={{
                  ...styles.card,
                  marginTop: "24px",
                  padding: "24px",
                  border:
                    "1px solid #bfdbfe",
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "22px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display:
                          "inline-flex",
                        padding:
                          "5px 9px",
                        borderRadius:
                          "999px",
                        backgroundColor:
                          "#dcfce7",
                        color:
                          "#166534",
                        fontSize:
                          "11px",
                        fontWeight:
                          750,
                      }}
                    >
                      ✓ ASSESSMENT
                      COMPLETE
                    </div>

                    <h2
                      style={{
                        margin:
                          "10px 0 6px",
                        fontSize:
                          "22px",
                        fontWeight:
                          800,
                      }}
                    >
                      Sector-aware,
                      multi-use-case
                      applicability
                      analysis generated
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        maxWidth:
                          "760px",
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                        lineHeight:
                          1.65,
                      }}
                    >
                      TrustGRC AI 360 has
                      analysed the
                      organisation
                      sector, selected
                      AI use cases,
                      jurisdiction,
                      data
                      characteristics
                      and relevant
                      conditional risk
                      factors.
                    </p>
                  </div>

                  <button
                    type="button"
                    style={
                      styles.primaryButton
                    }
                    onClick={() =>
                      window.alert(
                        "The next step will connect these results to the Regulatory Library and applicable obligations."
                      )
                    }
                  >
                    View Applicable
                    Obligations →
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

type UseCaseCheckboxProps = {
  option: {
    value: UseCase;
    label: string;
    description: string;
  };
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

function UseCaseCheckbox({
  option,
  checked,
  disabled,
  onToggle,
}: UseCaseCheckboxProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        padding: "13px",
        borderRadius: "11px",
        border: checked
          ? "1px solid #818cf8"
          : "1px solid #e2e8f0",
        backgroundColor: checked
          ? "#eef2ff"
          : "#ffffff",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        opacity: disabled ? 0.72 : 1,
        transition:
          "border-color 160ms ease, background-color 160ms ease",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        style={{
          marginTop: "3px",
          width: "16px",
          height: "16px",
          accentColor: "#4f46e5",
          cursor: disabled
            ? "not-allowed"
            : "pointer",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          display: "block",
          minWidth: 0,
        }}
      >
        <span
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 750,
            color: checked
              ? "#312e81"
              : "#0f172a",
          }}
        >
          {option.label}
        </span>

        <span
          style={{
            display: "block",
            marginTop: "4px",
            fontSize: "11px",
            lineHeight: 1.5,
            color: "#64748b",
          }}
        >
          {option.description}
        </span>
      </span>
    </label>
  );
}

type QuestionCardProps = {
  index: number;
  question: Question;
  value: Answer;
  onChange: (
    value: Answer
  ) => void;
};

function QuestionCard({
  index,
  question,
  value,
  onChange,
}: QuestionCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: value
          ? "1px solid #cbd5e1"
          : "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "19px",
        boxShadow:
          "0 5px 18px rgba(15, 23, 42, 0.025)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems:
            "flex-start",
          gap: "13px",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "9px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            backgroundColor: value
              ? "#eef2ff"
              : "#f8fafc",
            color: value
              ? "#4338ca"
              : "#64748b",
            fontSize: "12px",
            fontWeight: 800,
            border:
              "1px solid #e2e8f0",
          }}
        >
          {index}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 750,
              letterSpacing:
                "0.05em",
              textTransform:
                "uppercase",
              color: "#6366f1",
              marginBottom: "5px",
            }}
          >
            {question.category}
          </div>

          <div
            style={{
              fontSize: "15px",
              lineHeight: 1.5,
              fontWeight: 700,
            }}
          >
            {question.question}
          </div>

          {question.description && (
            <div
              style={{
                marginTop: "6px",
                color: "#64748b",
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              {
                question.description
              }
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "15px",
            }}
          >
            <AnswerButton
              label="Yes"
              active={
                value === "yes"
              }
              onClick={() =>
                onChange("yes")
              }
            />

            <AnswerButton
              label="No"
              active={
                value === "no"
              }
              onClick={() =>
                onChange("no")
              }
            />

            <AnswerButton
              label="Unknown"
              active={
                value === "unknown"
              }
              onClick={() =>
                onChange(
                  "unknown"
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnswerButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: "82px",
        padding: "8px 13px",
        borderRadius: "8px",
        border: active
          ? "1px solid #6366f1"
          : "1px solid #cbd5e1",
        backgroundColor: active
          ? "#eef2ff"
          : "#ffffff",
        color: active
          ? "#4338ca"
          : "#475569",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}

function FrameworkResult({
  name,
  status,
  tone,
}: {
  name: string;
  status: string;
  tone:
    | "warning"
    | "info"
    | "neutral";
}) {
  const toneStyle =
    tone === "warning"
      ? {
          backgroundColor:
            "#fffbeb",
          color: "#92400e",
          border:
            "1px solid #fde68a",
        }
      : tone === "info"
        ? {
            backgroundColor:
              "#eff6ff",
            color: "#1d4ed8",
            border:
              "1px solid #bfdbfe",
          }
        : {
            backgroundColor:
              "#f8fafc",
            color: "#64748b",
            border:
              "1px solid #e2e8f0",
          };

  return (
    <div
      style={{
        padding: "11px 12px",
        borderRadius: "10px",
        backgroundColor:
          "#f8fafc",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 750,
            color: "#334155",
          }}
        >
          {name}
        </span>

        <span
          style={{
            ...toneStyle,
            padding: "4px 7px",
            borderRadius:
              "999px",
            fontSize: "9px",
            lineHeight: 1.2,
            fontWeight: 800,
            whiteSpace:
              "nowrap",
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function ContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "10px",
        backgroundColor:
          "#f8fafc",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 750,
          color: "#64748b",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.05em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "4px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.5,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ReasonItem({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "9px",
        alignItems:
          "flex-start",
      }}
    >
      <div
        style={{
          marginTop: "5px",
          width: "6px",
          height: "6px",
          flexShrink: 0,
          borderRadius: "50%",
          backgroundColor:
            "#6366f1",
        }}
      />

      <span
        style={{
          fontSize: "12px",
          color: "#475569",
          lineHeight: 1.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}