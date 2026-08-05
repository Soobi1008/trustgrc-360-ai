"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type AISystem = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  business_owner?: string | null;
  vendor?: string | null;
  ai_technologies?: string[];
  deployment_status: string;
  risk_level: string;
  eu_ai_act_category: string;
  data_classification?: string | null;
  status: string;
  created_at: string;
};

type Organization = {
  id: number;
  name: string;
  status: string;
};

type ApiError = {
  detail?: string;
};

type RiskFilter =
  | "all"
  | "not assessed"
  | "low"
  | "medium"
  | "high"
  | "critical";

export default function AISystemsPage() {
  const router = useRouter();

  const [aiSystems, setAiSystems] = useState<AISystem[]>(
    []
  );

  const [organizations, setOrganizations] = useState<
    Organization[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] =
    useState<RiskFilter>("all");

  useEffect(() => {
    async function loadInventory() {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [systemsResponse, organizationsResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/v1/ai-systems`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }),
            fetch(`${API_URL}/api/v1/organizations`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }),
          ]);

        if (
          systemsResponse.status === 401 ||
          organizationsResponse.status === 401
        ) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        if (
          systemsResponse.status === 403 ||
          organizationsResponse.status === 403
        ) {
          throw new Error(
            "You do not have permission to view the AI inventory."
          );
        }

        const systemsData =
          (await systemsResponse.json()) as
            | AISystem[]
            | ApiError;

        const organizationsData =
          (await organizationsResponse.json()) as
            | Organization[]
            | ApiError;

        if (!systemsResponse.ok) {
          throw new Error(
            "detail" in systemsData &&
              typeof systemsData.detail === "string"
              ? systemsData.detail
              : "AI systems could not be loaded."
          );
        }

        if (!organizationsResponse.ok) {
          throw new Error(
            "detail" in organizationsData &&
              typeof organizationsData.detail ===
                "string"
              ? organizationsData.detail
              : "Organizations could not be loaded."
          );
        }

        setAiSystems(systemsData as AISystem[]);
        setOrganizations(
          organizationsData as Organization[]
        );
      } catch (error) {
        console.error(
          "Error loading AI inventory:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadInventory();
  }, [router]);

  const organizationNames = useMemo(() => {
    return new Map(
      organizations.map((organization) => [
        organization.id,
        organization.name,
      ])
    );
  }, [organizations]);

  const filteredSystems = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return aiSystems.filter((system) => {
      const organizationName =
        organizationNames.get(
          system.organization_id
        ) ?? "";

      const searchableText = [
        system.name,
        system.vendor ?? "",
        (system.ai_technologies ?? []).join(" "),
        system.business_owner ?? "",
        organizationName,
        system.eu_ai_act_category,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const normalizedRisk =
        system.risk_level
          ?.toLowerCase()
          .trim() || "not assessed";

      const matchesRisk =
        riskFilter === "all" ||
        normalizedRisk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [
    aiSystems,
    organizationNames,
    riskFilter,
    searchTerm,
  ]);

  const activeCount = aiSystems.filter(
    (system) =>
      system.status.toLowerCase().trim() ===
      "active"
  ).length;

  const highRiskCount = aiSystems.filter((system) =>
    ["high", "critical"].includes(
      system.risk_level.toLowerCase().trim()
    )
  ).length;

  const notAssessedCount = aiSystems.filter(
    (system) =>
      system.risk_level.toLowerCase().trim() ===
      "not assessed"
  ).length;

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>
            AI Governance
          </p>

          <h1 style={pageTitleStyle}>
            AI Inventory
          </h1>

          <p style={pageDescriptionStyle}>
            Register, classify and monitor AI systems
            across customer organizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/ai-systems/new")
          }
          style={primaryButtonStyle}
        >
          + Register AI System
        </button>
      </header>

      <section style={summaryGridStyle}>
        <SummaryCard
          label="Total AI Systems"
          value={aiSystems.length}
          description="Systems registered across all tenants"
        />

        <SummaryCard
          label="Active Systems"
          value={activeCount}
          description="Currently active AI systems"
        />

        <SummaryCard
          label="High / Critical Risk"
          value={highRiskCount}
          description="Systems requiring priority oversight"
        />

        <SummaryCard
          label="Not Assessed"
          value={notAssessedCount}
          description="Systems awaiting risk assessment"
        />
      </section>

      <section style={filterPanelStyle}>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search by system, vendor, owner, technology or organization"
          style={searchInputStyle}
        />

        <select
          value={riskFilter}
          onChange={(event) =>
            setRiskFilter(
              event.target.value as RiskFilter
            )
          }
          style={filterSelectStyle}
        >
          <option value="all">
            All risk levels
          </option>
          <option value="not assessed">
            Not Assessed
          </option>
          <option value="low">Low</option>
          <option value="medium">
            Medium
          </option>
          <option value="high">High</option>
          <option value="critical">
            Critical
          </option>
        </select>
      </section>

      {isLoading && (
        <div style={messageBoxStyle}>
          Loading AI inventory...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div style={errorBoxStyle}>
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <section style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={headerCellStyle}>
                  AI System
                </th>

                <th style={headerCellStyle}>
                  Organization
                </th>

                <th style={headerCellStyle}>
                  Vendor / Technologies
                </th>

                <th style={headerCellStyle}>
                  Deployment
                </th>

                <th style={headerCellStyle}>
                  Risk Level
                </th>

                <th style={headerCellStyle}>
                  EU AI Act
                </th>

                <th style={headerCellStyle}>
                  Status
                </th>

                <th style={headerCellStyle}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSystems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={emptyCellStyle}
                  >
                    No AI systems match the selected
                    filters.
                  </td>
                </tr>
              ) : (
                filteredSystems.map((system) => (
                  <tr
                    key={system.id}
                    style={tableRowStyle}
                  >
                    <td style={bodyCellStyle}>
                      <p style={mainCellTextStyle}>
                        {system.name}
                      </p>

                      <p style={secondaryCellTextStyle}>
                        {system.business_owner ||
                          "Owner not specified"}
                      </p>
                    </td>

                    <td style={bodyCellStyle}>
                      {organizationNames.get(
                        system.organization_id
                      ) ??
                        `Organization ${system.organization_id}`}
                    </td>

                    <td style={bodyCellStyle}>
                      <p style={mainCellTextStyle}>
                        {system.vendor ||
                          "Not specified"}
                      </p>
                    
                       <p style={secondaryCellTextStyle}>
                          {system.ai_technologies?.length
                          ? system.ai_technologies.join(", ")
                            : "Technology not specified"}
                      </p>
                    </td>
                   
                    <td style={bodyCellStyle}>
                      {system.deployment_status}
                    </td>

                    <td style={bodyCellStyle}>
                      <span
                        style={getRiskBadgeStyle(
                          system.risk_level
                        )}
                      >
                        {system.risk_level}
                      </span>
                    </td>

                    <td style={bodyCellStyle}>
                      {system.eu_ai_act_category}
                    </td>

                    <td style={bodyCellStyle}>
                      <span
                        style={getStatusBadgeStyle(
                          system.status
                        )}
                      >
                        {system.status}
                      </span>
                    </td>

                    <td style={bodyCellStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/admin/ai-systems/${system.id}`
                          )
                        }
                        style={viewButtonStyle}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article style={summaryCardStyle}>
      <p style={summaryLabelStyle}>
        {label}
      </p>

      <p style={summaryValueStyle}>
        {value}
      </p>

      <p style={summaryDescriptionStyle}>
        {description}
      </p>
    </article>
  );
}

function getRiskBadgeStyle(
  riskLevel: string
): React.CSSProperties {
  const normalizedRisk = riskLevel
    .toLowerCase()
    .trim();

  if (normalizedRisk === "critical") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#fee2e2",
      color: "#7f1d1d",
      border: "1px solid #fca5a5",
    };
  }

  if (normalizedRisk === "high") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#fecaca",
      color: "#b91c1c",
      border: "1px solid #f87171",
    };
  }

  if (normalizedRisk === "medium") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#fef3c7",
      color: "#92400e",
      border: "1px solid #facc15",
    };
  }

  if (normalizedRisk === "low") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  return {
    ...badgeBaseStyle,
    backgroundColor: "#e2e8f0",
    color: "#475569",
    border: "1px solid #cbd5e1",
  };
}

function getStatusBadgeStyle(
  status: string
): React.CSSProperties {
  const normalizedStatus = status
    .toLowerCase()
    .trim();

  if (normalizedStatus === "active") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  if (
    normalizedStatus === "under review"
  ) {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  return {
    ...badgeBaseStyle,
    backgroundColor: "#e2e8f0",
    color: "#475569",
  };
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "#2563eb",
  fontWeight: 700,
};

const pageTitleStyle: React.CSSProperties = {
  marginTop: "8px",
  marginBottom: "8px",
  color: "#0f172a",
  fontSize: "34px",
};

const pageDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.6,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "11px 17px",
  border: "none",
  borderRadius: "8px",
  background:
    "linear-gradient(135deg, #1d4ed8, #2563eb)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
  boxShadow:
    "0 8px 18px rgba(37, 99, 235, 0.22)",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "20px",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "19px 20px",
  border: "1px solid #dbeafe",
  borderRadius: "11px",
  backgroundColor: "#ffffff",
  boxShadow:
    "0 6px 18px rgba(15, 23, 42, 0.04)",
};

const summaryLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "14px",
  fontWeight: 700,
};

const summaryValueStyle: React.CSSProperties = {
  marginTop: "7px",
  marginBottom: "5px",
  color: "#0f172a",
  fontSize: "30px",
  fontWeight: 800,
};

const summaryDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const filterPanelStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "20px",
  padding: "16px",
  border: "1px solid #dbeafe",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
};

const searchInputStyle: React.CSSProperties = {
  flex: "1 1 420px",
  minWidth: "260px",
  padding: "11px 12px",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  color: "#0f172a",
  fontSize: "14px",
};

const filterSelectStyle: React.CSSProperties = {
  minWidth: "190px",
  padding: "11px 12px",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "1180px",
  borderCollapse: "collapse",
};

const tableHeaderRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
};

const headerCellStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
};

const bodyCellStyle: React.CSSProperties = {
  padding: "16px",
  textAlign: "left",
  color: "#475569",
  fontSize: "14px",
  verticalAlign: "middle",
};

const mainCellTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontWeight: 700,
};

const secondaryCellTextStyle: React.CSSProperties = {
  marginTop: "5px",
  marginBottom: 0,
  color: "#64748b",
  fontSize: "12px",
};

const emptyCellStyle: React.CSSProperties = {
  padding: "36px",
  textAlign: "center",
  color: "#64748b",
};

const badgeBaseStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};

const viewButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #2563eb",
  borderRadius: "7px",
  backgroundColor: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 700,
};

const messageBoxStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #bfdbfe",
  borderRadius: "10px",
  backgroundColor: "#eff6ff",
  color: "#1e3a8a",
};

const errorBoxStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  backgroundColor: "#fef2f2",
  color: "#991b1b",
};