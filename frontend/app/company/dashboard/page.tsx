"use client";

import Link from "next/link";
//import { useRouter } from "next/navigation";

/*import {
  clearAuthentication,
} from "../../../lib/auth";*/


export default function CompanyDashboard() {
  //const router = useRouter();

  /*function handleSignOut() {
    clearAuthentication();

    router.replace(
      "/login"
    );
  }*/

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            marginBottom: "32px",

            display: "flex",

            alignItems: "flex-start",

            justifyContent:
              "space-between",

            gap: "24px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#2563eb",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              TRUSTGRC AI 360
            </p>

            <h1
              style={{
                marginTop: "10px",
                marginBottom: "8px",
                color: "#0f172a",
                fontSize: "36px",
                lineHeight: 1.2,
              }}
            >
              Organisation Dashboard
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "16px",
                lineHeight: 1.6,
              }}
            >
              Welcome to your Governance,
              Risk and Compliance portal.
            </p>
          </div>          
        </div>


        {/* DASHBOARD CARDS */}

        <section
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: "18px",
          }}
        >
          <DashboardCard
            title="AI Inventory"
            description={
              "Register and manage the AI systems used by your organisation."
            }
            href="/inventory"
          />

          <DashboardCard
            title="Assessments"
            description={
              "Run governance, privacy, regulatory and AI-risk assessments."
            }
            href="/assessments"
          />

          <DashboardCard
            title="Generated Risks"
            description={
              "Review risks identified through assessments and AI-system analysis."
            }
            href="/generated-risks"
          />

          <DashboardCard
            title="Policies"
            description={
              "Manage AI governance, compliance and internal policy requirements."
            }
            href="#"
          />

          <DashboardCard
            title="Reports"
            description={
              "Review and export governance, risk and compliance reporting."
            }
            href="#"
          />

          <DashboardCard
            title="Regulatory Library"
            description={
              "Review applicable regulations, standards and regulatory obligations."
            }
            href="/platform/regulatory-library"
          />
        </section>
      </div>
    </main>
  );
}


function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  const card = (
    <div
      style={{
        height: "100%",
        padding: "22px",
        border:
          "1px solid #e2e8f0",
        borderRadius: "14px",
        backgroundColor:
          "#ffffff",
        boxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom:
            "10px",
          color:
            "#0f172a",
          fontSize:
            "20px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: 0,
          color:
            "#64748b",
          fontSize:
            "14px",
          lineHeight:
            1.6,
        }}
      >
        {description}
      </p>

      <div
        style={{
          marginTop:
            "18px",
          color:
            "#2563eb",
          fontSize:
            "13px",
          fontWeight:
            700,
        }}
      >
        Open →
      </div>
    </div>
  );

  if (href === "#") {
    return (
      <div
        style={{
          opacity:
            0.7,
          cursor:
            "not-allowed",
        }}
      >
        {card}
      </div>
    );
  }

  return (
    <Link
      href={href}
      style={{
        textDecoration:
          "none",
        color:
          "inherit",
      }}
    >
      {card}
    </Link>
  );
}