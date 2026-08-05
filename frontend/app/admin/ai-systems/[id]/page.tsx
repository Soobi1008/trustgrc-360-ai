"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../../lib/auth";

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
  model_type?: string | null;
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

export default function AISystemDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const aiSystemId = params.id;

  const [aiSystem, setAiSystem] =
    useState<AISystem | null>(null);

  const [organizationName, setOrganizationName] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadAISystem() {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          aiSystemResponse,
          organizationsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/v1/ai-systems/${aiSystemId}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/api/v1/organizations`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              cache: "no-store",
            }
          ),
        ]);

        if (
          aiSystemResponse.status === 401 ||
          organizationsResponse.status === 401
        ) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        if (
          aiSystemResponse.status === 403 ||
          organizationsResponse.status === 403
        ) {
          throw new Error(
            "You do not have permission to view this AI system."
          );
        }

        if (aiSystemResponse.status === 404) {
          throw new Error(
            "AI system not found."
          );
        }

        const aiSystemData =
          (await aiSystemResponse.json()) as
            | AISystem
            | ApiError;

        const organizationsData =
          (await organizationsResponse.json()) as
            | Organization[]
            | ApiError;

        if (!aiSystemResponse.ok) {
          throw new Error(
            "detail" in aiSystemData &&
              typeof aiSystemData.detail === "string"
              ? aiSystemData.detail
              : "The AI system could not be loaded."
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

        const loadedAISystem =
          aiSystemData as AISystem;

        const organization = (
          organizationsData as Organization[]
        ).find(
          (item) =>
            item.id ===
            loadedAISystem.organization_id
        );

        setAiSystem(loadedAISystem);

        setOrganizationName(
          organization?.name ??
            `Organization ${loadedAISystem.organization_id}`
        );
      } catch (error) {
        console.error(
          "Error loading AI system:",
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

    loadAISystem();
  }, [aiSystemId, router]);

  if (isLoading) {
    return (
      <div style={messageBoxStyle}>
        Loading AI system details...
      </div>
    );
  }

  if (errorMessage || !aiSystem) {
    return (
      <main>
        <div style={errorBoxStyle}>
          {errorMessage ||
            "The AI system could not be found."}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/ai-systems")
          }
          style={{
            ...secondaryButtonStyle,
            marginTop: "18px",
          }}
        >
          Back to AI Inventory
        </button>
      </main>
    );
  }

  return (
    <main>
      <header style={pageHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>
            AI Governance
          </p>

          <h1 style={pageTitleStyle}>
            {aiSystem.name}
          </h1>

          <p style={pageDescriptionStyle}>
            AI system profile, ownership, lifecycle,
            risk and regulatory classification.
          </p>
        </div>

        <div style={headerBadgeGroupStyle}>
          <span
            style={getRiskBadgeStyle(
              aiSystem.risk_level
            )}
          >
            {aiSystem.risk_level} Risk
          </span>

          <span
            style={getStatusBadgeStyle(
              aiSystem.status
            )}
          >
            {aiSystem.status}
          </span>
        </div>
      </header>

      <section style={profileCardStyle}>
        <div style={profileBannerStyle}>
          <div>
            <p style={bannerEyebrowStyle}>
              AI system record
            </p>

            <h2 style={bannerTitleStyle}>
              Governance profile
            </h2>

            <p style={bannerDescriptionStyle}>
              Review the registered information before
              starting risk assessments, controls mapping
              and evidence collection.
            </p>
          </div>

          <div style={systemIdBoxStyle}>
            <span style={systemIdLabelStyle}>
              System ID
            </span>

            <strong style={systemIdValueStyle}>
              {aiSystem.id}
            </strong>
          </div>
        </div>

        <div style={profileBodyStyle}>
          <section style={detailsSectionStyle}>
            <SectionHeading
              number="1"
              title="System identification"
              description="Core information about the AI system and accountable organization."
            />

            <div style={detailsGridStyle}>
              <DetailItem
                label="AI System Name"
                value={aiSystem.name}
              />

              <DetailItem
                label="Organization"
                value={organizationName}
              />

              <DetailItem
                label="Business Owner"
                value={
                  aiSystem.business_owner ||
                  "Not specified"
                }
              />

              <DetailItem
                label="Vendor"
                value={
                  aiSystem.vendor ||
                  "Not specified"
                }
              />
            </div>

            <div style={descriptionPanelStyle}>
              <p style={detailLabelStyle}>
                Description
              </p>

              <p style={descriptionTextStyle}>
                {aiSystem.description ||
                  "No description has been provided."}
              </p>
            </div>
          </section>

          <section style={detailsSectionStyle}>
            <SectionHeading
              number="2"
              title="Technology and lifecycle"
              description="Technology type, deployment stage and inventory lifecycle status."
            />

            <div style={detailsGridStyle}>
              <DetailItem
                label="Model Type"
                value={
                  aiSystem.model_type ||
                  "Not specified"
                }
              />

              <DetailItem
                label="Deployment Status"
                value={
                  aiSystem.deployment_status ||
                  "Not specified"
                }
              />

              <DetailItem
                label="Inventory Status"
                value={
                  aiSystem.status ||
                  "Not specified"
                }
              />

              <DetailItem
                label="Data Classification"
                value={
                  aiSystem.data_classification ||
                  "Not specified"
                }
              />
            </div>
          </section>

          <section style={detailsSectionStyle}>
            <SectionHeading
              number="3"
              title="Risk and regulatory classification"
              description="Initial risk rating and EU AI Act classification."
            />

            <div style={classificationGridStyle}>
              <article style={classificationCardStyle}>
                <p style={classificationLabelStyle}>
                  Risk Level
                </p>

                <span
                  style={getRiskBadgeStyle(
                    aiSystem.risk_level
                  )}
                >
                  {aiSystem.risk_level}
                </span>

                <p
                  style={
                    classificationDescriptionStyle
                  }
                >
                  Current governance risk rating for this
                  AI system.
                </p>
              </article>

              <article style={classificationCardStyle}>
                <p style={classificationLabelStyle}>
                  EU AI Act Category
                </p>

                <span style={euCategoryBadgeStyle}>
                  {aiSystem.eu_ai_act_category}
                </span>

                <p
                  style={
                    classificationDescriptionStyle
                  }
                >
                  Current regulatory classification under
                  the EU AI Act.
                </p>
              </article>
            </div>
          </section>

          <section
            style={{
              ...detailsSectionStyle,
              borderBottom: "none",
              marginBottom: 0,
              paddingBottom: 0,
            }}
          >
            <SectionHeading
              number="4"
              title="Record information"
              description="System metadata maintained for governance and audit purposes."
            />

            <div style={detailsGridStyle}>
              <DetailItem
                label="Organization ID"
                value={String(
                  aiSystem.organization_id
                )}
              />

              <DetailItem
                label="Created At"
                value={
                  aiSystem.created_at
                    ? new Date(
                        aiSystem.created_at
                      ).toLocaleString()
                    : "Not available"
                }
              />
            </div>
          </section>

          <div style={actionRowStyle}>
            <button
              type="button"
              onClick={() =>
                router.push("/admin/ai-systems")
              }
              style={secondaryButtonStyle}
            >
              Back to AI Inventory
            </button>

            <div style={rightActionGroupStyle}>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/ai-systems/${aiSystem.id}/edit`
                  )
                }
                style={secondaryButtonStyle}
              >
                Edit AI System
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/ai-systems/${aiSystem.id}/risks`
                  )
                }
                style={primaryButtonStyle}
              >
                View Generated Risks
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <span style={sectionNumberStyle}>
        {number}
      </span>

      <div>
        <h3 style={sectionTitleStyle}>
          {title}
        </h3>

        <p style={sectionDescriptionStyle}>
          {description}
        </p>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article style={detailItemStyle}>
      <p style={detailLabelStyle}>
        {label}
      </p>

      <p style={detailValueStyle}>
        {value}
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
      border: "1px solid #ef4444",
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
      border: "1px solid #86efac",
    };
  }

  if (normalizedStatus === "under review") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    };
  }

  if (normalizedStatus === "archived") {
    return {
      ...badgeBaseStyle,
      backgroundColor: "#e2e8f0",
      color: "#475569",
      border: "1px solid #cbd5e1",
    };
  }

  return {
    ...badgeBaseStyle,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  };
}

const pageHeaderStyle: React.CSSProperties = {
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

const headerBadgeGroupStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "10px",
};

const profileCardStyle: React.CSSProperties = {
  maxWidth: "1080px",
  overflow: "hidden",
  border: "1px solid #bfdbfe",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  boxShadow:
    "0 12px 30px rgba(37, 99, 235, 0.10)",
};

const profileBannerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  padding: "22px 28px",
  background:
    "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)",
  color: "#ffffff",
};

const bannerEyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  opacity: 0.9,
};

const bannerTitleStyle: React.CSSProperties = {
  marginTop: "7px",
  marginBottom: "6px",
  fontSize: "25px",
};

const bannerDescriptionStyle: React.CSSProperties = {
  maxWidth: "760px",
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.92,
};

const systemIdBoxStyle: React.CSSProperties = {
  minWidth: "95px",
  padding: "12px 15px",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: "10px",
  backgroundColor: "rgba(255,255,255,0.12)",
  textAlign: "center",
};

const systemIdLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "4px",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  opacity: 0.85,
};

const systemIdValueStyle: React.CSSProperties = {
  fontSize: "24px",
};

const profileBodyStyle: React.CSSProperties = {
  padding: "28px",
};

const detailsSectionStyle: React.CSSProperties = {
  marginBottom: "30px",
  paddingBottom: "28px",
  borderBottom: "1px solid #e2e8f0",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
  marginBottom: "20px",
};

const sectionNumberStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "30px",
  height: "30px",
  flexShrink: 0,
  borderRadius: "50%",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: 800,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "18px",
};

const sectionDescriptionStyle: React.CSSProperties = {
  marginTop: "5px",
  marginBottom: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const detailItemStyle: React.CSSProperties = {
  padding: "16px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  backgroundColor: "#f8fafc",
};

const detailLabelStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "7px",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const detailValueStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 700,
  wordBreak: "break-word",
};

const descriptionPanelStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "18px",
  border: "1px solid #dbeafe",
  borderRadius: "10px",
  backgroundColor: "#eff6ff",
};

const descriptionTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#334155",
  lineHeight: 1.7,
};

const classificationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "18px",
};

const classificationCardStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #dbeafe",
  borderRadius: "11px",
  backgroundColor: "#ffffff",
};

const classificationLabelStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
};

const classificationDescriptionStyle:
  React.CSSProperties = {
  marginTop: "13px",
  marginBottom: 0,
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.5,
};

const euCategoryBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 11px",
  border: "1px solid #93c5fd",
  borderRadius: "999px",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
};

const badgeBaseStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 11px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: "30px",
  paddingTop: "22px",
  borderTop: "1px solid #e2e8f0",
};

const rightActionGroupStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 17px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontWeight: 700,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "11px 18px",
  border: "none",
  borderRadius: "8px",
  background:
    "linear-gradient(135deg, #1d4ed8, #2563eb)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow:
    "0 8px 18px rgba(37, 99, 235, 0.22)",
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