"use client";

import { useEffect, useState } from "react";

type BackendHealth = {
  status: string;
  service: string;
};

const summaryCards = [
  { label: "Organizations", value: 0 },
  { label: "AI Systems", value: 0 },
  { label: "Assessments", value: 0 },
  { label: "Open Risks", value: 0 },
];

export default function Home() {
  const [backend, setBackend] = useState<BackendHealth | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch("http://127.0.0.1:8000/health");

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data: BackendHealth = await response.json();

        setBackend(data);
        setConnectionError(false);
      } catch (error) {
        console.error("Backend health check failed:", error);
        setBackend(null);
        setConnectionError(true);
      }
    }

    checkBackend();
  }, []);

  return (
    <section style={{ padding: "32px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "30px", margin: 0 }}>Dashboard</h2>

          <p style={{ marginTop: "8px", color: "#667085" }}>
            Overview of your AI governance and compliance environment.
          </p>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "12px 18px",
          }}
        >
          Prototype v0.1.0
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {summaryCards.map((card) => (
          <article
            key={card.label}
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "22px",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
            }}
          >
            <p style={{ margin: 0, color: "#667085", fontSize: "14px" }}>
              {card.label}
            </p>

            <p
              style={{
                margin: "14px 0 0",
                fontSize: "34px",
                fontWeight: 700,
              }}
            >
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        <article
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Compliance Frameworks</h3>

          {["GDPR", "EU AI Act", "ISO/IEC 42001", "NIST AI RMF"].map(
            (framework) => (
              <div
                key={framework}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: "1px solid #eef0f2",
                }}
              >
                <span>{framework}</span>
                <span style={{ color: "#667085" }}>Not assessed</span>
              </div>
            ),
          )}
        </article>

        <article
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>System Status</h3>

          <p>
            <strong>Backend:</strong>{" "}
            <span style={{ color: connectionError ? "#dc2626" : "#16a34a" }}>
              {connectionError ? "Offline" : backend?.status ?? "Checking..."}
            </span>
          </p>

          <p>
            <strong>Service:</strong>{" "}
            {backend?.service ?? "Waiting for response"}
          </p>

          <p>
            <strong>Frontend:</strong>{" "}
            <span style={{ color: "#16a34a" }}>Online</span>
          </p>

          <p>
            <strong>Database:</strong>{" "}
            <span style={{ color: "#d97706" }}>Not connected</span>
          </p>
        </article>
      </div>
    </section>
  );
}