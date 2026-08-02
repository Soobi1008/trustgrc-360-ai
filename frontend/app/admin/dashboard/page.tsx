"use client";

import { useEffect, useState } from "react";

import {
  type AuthUser,
  getStoredUser,
} from "../../../lib/auth";

const summaryCards = [
  {
    title: "Organizations",
    value: "1",
    description: "Registered customer organizations",
  },
  {
    title: "Platform Users",
    value: "2",
    description: "Active platform and company users",
  },
  {
    title: "AI Systems",
    value: "2",
    description: "AI systems registered across tenants",
  },
  {
    title: "Open Risks",
    value: "5",
    description: "Generated risks awaiting review",
  },
];

export default function AdminDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <main>
      <header
        style={{
          marginBottom: "30px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#2563eb",
            fontWeight: 700,
          }}
        >
          TrustGRC AI 360 Administration
        </p>

        <h1
          style={{
            marginTop: "8px",
            marginBottom: "8px",
            color: "#0f172a",
            fontSize: "36px",
          }}
        >
          Platform Dashboard
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
          }}
        >
          Welcome back
          {user?.full_name ? `, ${user.full_name}` : ""}.
          Monitor the TrustGRC AI 360 platform from one
          place.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "26px",
        }}
      >
        {summaryCards.map((card) => (
          <article
            key={card.title}
            style={{
              padding: "22px",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              boxShadow:
                "0 8px 24px rgba(15, 23, 42, 0.05)",
            }}
          >
            <p
              style={{
                marginTop: 0,
                marginBottom: "10px",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {card.title}
            </p>

            <p
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              {card.value}
            </p>

            <p
              style={{
                marginTop: "10px",
                marginBottom: 0,
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "18px",
        }}
      >
        <article style={panelStyle}>
          <h2 style={panelHeadingStyle}>
            Platform administration
          </h2>

          <p style={panelTextStyle}>
            Manage organizations, user membership, roles,
            governance frameworks and platform settings.
          </p>
        </article>

        <article style={panelStyle}>
          <h2 style={panelHeadingStyle}>
            Governance intelligence
          </h2>

          <p style={panelTextStyle}>
            Maintain risk libraries, compliance mappings,
            assessment logic and explainable risk rules.
          </p>
        </article>
      </section>
    </main>
  );
}

const panelStyle: React.CSSProperties = {
  minHeight: "170px",
  padding: "24px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
};

const panelHeadingStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "10px",
  color: "#0f172a",
  fontSize: "20px",
};

const panelTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.65,
};