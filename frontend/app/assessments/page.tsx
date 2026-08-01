"use client";

import { useSearchParams } from "next/navigation";

export default function AssessmentsPage() {
  const searchParams = useSearchParams();
  const aiSystemId = searchParams.get("ai_system_id");

  return (
    <main
      style={{
        padding: "32px",
        width: "100%",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "32px",
          fontWeight: 600,
        }}
      >
        AI Assessment
      </h1>

      <p
        style={{
          marginTop: "10px",
          color: "#64748b",
        }}
      >
        Assess the AI system against governance, privacy,
        cybersecurity and EU AI Act requirements.
      </p>

      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "20px",
          }}
        >
          Assessment Details
        </h2>

        <p>
          <strong>AI System ID:</strong>{" "}
          {aiSystemId || "Not selected"}
        </p>

        {!aiSystemId && (
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              border: "1px solid #fcd34d",
              borderRadius: "8px",
              backgroundColor: "#fffbeb",
              color: "#92400e",
            }}
          >
            Please select an AI system from the AI Inventory.
          </div>
        )}

        {aiSystemId && (
          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "16px",
            }}
          >
            <AssessmentQuestion
              number={1}
              question="Does the AI system process personal data?"
            />

            <AssessmentQuestion
              number={2}
              question="Does the AI system make or support decisions that affect individuals?"
            />

            <AssessmentQuestion
              number={3}
              question="Is the AI system customer-facing?"
            />

            <AssessmentQuestion
              number={4}
              question="Does the AI system use biometric or sensitive personal data?"
            />

            <AssessmentQuestion
              number={5}
              question="Is human review required before important decisions are made?"
            />

            <button
              type="button"
              style={{
                width: "fit-content",
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Save Assessment
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

type AssessmentQuestionProps = {
  number: number;
  question: string;
};

function AssessmentQuestion({
  number,
  question,
}: AssessmentQuestionProps) {
  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        backgroundColor: "#f8fafc",
      }}
    >
      <p
        style={{
          marginTop: 0,
          marginBottom: "12px",
          fontWeight: 600,
          color: "#0f172a",
        }}
      >
        {number}. {question}
      </p>

      <div
        style={{
          display: "flex",
          gap: "18px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="radio"
            name={`question-${number}`}
            value="yes"
          />
          Yes
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="radio"
            name={`question-${number}`}
            value="no"
          />
          No
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="radio"
            name={`question-${number}`}
            value="unknown"
          />
          Unknown
        </label>
      </div>
    </div>
  );
}