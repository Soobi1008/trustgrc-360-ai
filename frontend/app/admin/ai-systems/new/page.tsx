"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type Organization = {
  id: number;
  name: string;
  status: string;
};

type AISystemForm = {
  organization_id: string;
  name: string;
  description: string;
  business_owner: string;
  vendor: string;
  ai_technologies: string[];
  other_ai_technology: string;
  deployment_status: string;
  risk_level: string;
  eu_ai_act_category: string;
  data_classification: string;
  status: string;
};

type AISystemResponse = {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  business_owner?: string | null;
  vendor?: string | null;
  ai_technologies: string[];
  deployment_status: string;
  risk_level: string;
  eu_ai_act_category: string;
  data_classification?: string | null;
  status: string;
  created_at: string;
};

type ApiError = {
  detail?: string | unknown;
};

const AI_TECHNOLOGIES = [
  "Generative AI",
  "Machine Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Predictive Analytics",
  "Robotic Process Automation",
  "Expert System",
  "Recommendation System",
  "Speech Recognition",
  "Other",
];

const initialForm: AISystemForm = {
  organization_id: "",
  name: "",
  description: "",
  business_owner: "",
  vendor: "",
  ai_technologies: [],
  other_ai_technology: "",
  deployment_status: "Planned",
  risk_level: "Not Assessed",
  eu_ai_act_category: "Not Classified",
  data_classification: "",
  status: "Active",
};

export default function RegisterAISystemPage() {
  const router = useRouter();

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [form, setForm] =
    useState<AISystemForm>(initialForm);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadOrganizations() {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `${API_URL}/api/v1/organizations`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const responseData =
          (await response.json()) as
            | Organization[]
            | ApiError;

        if (response.status === 401) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to load organizations."
          );
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              responseData,
              "Organizations could not be loaded."
            )
          );
        }

        const activeOrganizations = (
          responseData as Organization[]
        ).filter(
          (organization) =>
            organization.status
              .toLowerCase()
              .trim() === "active"
        );

        setOrganizations(activeOrganizations);
      } catch (error) {
        console.error(
          "Error loading organizations:",
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

    loadOrganizations();
  }, [router]);

  function updateField(
    field: keyof AISystemForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleTechnology(
  technology: string
) {
  setForm((current) => {
    const isSelected =
      current.ai_technologies.includes(
        technology
      );

    return {
      ...current,
      ai_technologies: isSelected
        ? current.ai_technologies.filter(
            (item) => item !== technology
          )
        : [
            ...current.ai_technologies,
            technology,
          ],
      other_ai_technology:
        technology === "Other" && isSelected
          ? ""
          : current.other_ai_technology,
    };
  });
}

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.organization_id) {
      setErrorMessage(
        "Please select an organization."
      );
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage(
        "AI system name is required."
      );
      return;
    }

    if (
      form.ai_technologies.length === 0
    ) {
      setErrorMessage(
        "Please select at least one AI technology."
      );
      return;
    }

    if (
      form.ai_technologies.includes("Other") &&
        !form.other_ai_technology.trim()
        ) {
          setErrorMessage(
            "Please enter the other AI technology."
        );
        return;
      }
     
    const submittedTechnologies =
      form.ai_technologies.includes("Other")
        ? [ ...form.ai_technologies.filter(
            (technology) =>
              technology !== "Other"
          ),
            form.other_ai_technology.trim(),
        ]
        : form.ai_technologies;

    const token = getAccessToken();

    if (!token) {
      clearAuthentication();
      router.replace("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_URL}/api/v1/ai-systems`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            organization_id: Number(
              form.organization_id
            ),
            name: form.name.trim(),
            description:
              form.description.trim() || null,
            business_owner:
              form.business_owner.trim() || null,
            vendor:
              form.vendor.trim() || null,
            ai_technologies:
              submittedTechnologies,
            deployment_status:
              form.deployment_status,
            risk_level:
              form.risk_level,
            eu_ai_act_category:
              form.eu_ai_act_category,
            data_classification:
              form.data_classification || null,
            status: form.status,
          }),
        }
      );

      const responseData =
        (await response.json()) as
          | AISystemResponse
          | ApiError;

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to register AI systems."
        );
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            responseData,
            "The AI system could not be created."
          )
        );
      }

      router.push("/admin/ai-systems");
      router.refresh();
    } catch (error) {
      console.error(
        "Error creating AI system:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div style={messageBoxStyle}>
        Loading organizations...
      </div>
    );
  }

  return (
    <main>
      <header style={pageHeaderStyle}>
        <p style={eyebrowStyle}>
          AI Governance
        </p>

        <h1 style={pageTitleStyle}>
          Register AI System
        </h1>

        <p style={pageDescriptionStyle}>
          Add an AI system to the inventory and
          record its ownership, technologies,
          lifecycle, risk and regulatory
          classification.
        </p>
      </header>

      <section style={formCardStyle}>
        <div style={formBannerStyle}>
          <p style={bannerEyebrowStyle}>
            AI system onboarding
          </p>

          <h2 style={bannerTitleStyle}>
            Inventory registration
          </h2>

          <p style={bannerDescriptionStyle}>
            Record the information required to
            support AI governance, risk
            assessments, regulatory
            classification and audit readiness.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={formBodyStyle}
        >
          {errorMessage && (
            <div style={errorBoxStyle}>
              {errorMessage}
            </div>
          )}

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionNumberStyle}>
                1
              </span>

              <div>
                <h3 style={sectionTitleStyle}>
                  System identification
                </h3>

                <p
                  style={
                    sectionDescriptionStyle
                  }
                >
                  Identify the AI system and the
                  organization responsible for
                  it.
                </p>
              </div>
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Organization *
                <select
                  required
                  value={
                    form.organization_id
                  }
                  onChange={(event) =>
                    updateField(
                      "organization_id",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select organization
                  </option>

                  {organizations.map(
                    (organization) => (
                      <option
                        key={organization.id}
                        value={
                          organization.id
                        }
                      >
                        {organization.name}
                      </option>
                    )
                  )}
                </select>

                <span style={helperTextStyle}>
                  One organization may register
                  multiple AI systems.
                </span>
              </label>

              <label style={labelStyle}>
                AI System Name *
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Example: Customer Service Chatbot"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Business Owner
                <input
                  type="text"
                  value={
                    form.business_owner
                  }
                  onChange={(event) =>
                    updateField(
                      "business_owner",
                      event.target.value
                    )
                  }
                  placeholder="Example: Customer Success Team"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Vendor
                <input
                  type="text"
                  value={form.vendor}
                  onChange={(event) =>
                    updateField(
                      "vendor",
                      event.target.value
                    )
                  }
                  placeholder="Example: OpenAI"
                  style={inputStyle}
                />
              </label>
            </div>

            <label
              style={fullWidthLabelStyle}
            >
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe the system's business purpose, users and intended outcomes."
                rows={4}
                style={textareaStyle}
              />
            </label>
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionNumberStyle}>
                2
              </span>

              <div>
                <h3 style={sectionTitleStyle}>
                  AI technologies
                </h3>

                <p
                  style={
                    sectionDescriptionStyle
                  }
                >
                  Select every AI technology
                  used within this system.
                </p>
              </div>
            </div>

            <fieldset
              style={technologyFieldsetStyle}
            >
              <legend
                style={
                  technologyLegendStyle
                }
              >
                Technologies used *
              </legend>

              <p
                style={
                  technologyDescriptionStyle
                }
              >
                An AI system can combine several
                technologies. Select all that
                apply.
              </p>

              <div
                style={
                  technologyGridStyle
                }
              >
                {AI_TECHNOLOGIES.map(
                  (technology) => {
                    const isSelected =
                      form.ai_technologies.includes(
                        technology
                      );

                    return (
                      <label
                        key={technology}
                        style={{
                          ...technologyOptionStyle,
                          borderColor:
                            isSelected
                              ? "#2563eb"
                              : "#e2e8f0",
                          backgroundColor:
                            isSelected
                              ? "#eff6ff"
                              : "#ffffff",
                          color: isSelected
                            ? "#1d4ed8"
                            : "#334155",
                          boxShadow:
                            isSelected
                              ? "0 0 0 1px rgba(37, 99, 235, 0.08)"
                              : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            isSelected
                          }
                          onChange={() =>
                            toggleTechnology(
                              technology
                            )
                          }
                          style={
                            checkboxStyle
                          }
                        />

                        <span>
                          {technology}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
              
              
              {form.ai_technologies.includes("Other"
                ) && (
            
                <label
                  style={{
                    ...labelStyle,
                    marginTop: "18px",
                  }}
                  >
    
                Other AI Technology *
                  <input
                    type="text"
                      required
                        value={
                    form.other_ai_technology
                    }

                  onChange={(event) =>
                    updateField(
                      "other_ai_technology",
                      event.target.value
                      )
                    }
        
                  placeholder="Example: Knowledge Graph AI"
                    style={inputStyle}
                  />

                  <span style={helperTextStyle}>
                    Enter the actual technology that is not listed above.
                  </span>
                </label>
                )}

              <p
                style={
                  selectedTechnologyTextStyle
                }
              >
                Selected:{" "}
                {form.ai_technologies.length === 0
                  ? "None"
                    : form.ai_technologies
                      .map((technology) =>
                        technology === "Other" &&
                        form.other_ai_technology.trim()
                          ? form.other_ai_technology.trim()
                          : technology
                      )
                      .join(", ")}
              </p>
            </fieldset>
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionNumberStyle}>
                3
              </span>

              <div>
                <h3 style={sectionTitleStyle}>
                  Lifecycle and data
                </h3>

                <p
                  style={
                    sectionDescriptionStyle
                  }
                >
                  Record the deployment stage,
                  inventory status and data
                  classification.
                </p>
              </div>
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Deployment Status
                <select
                  value={
                    form.deployment_status
                  }
                  onChange={(event) =>
                    updateField(
                      "deployment_status",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Planned">
                    Planned
                  </option>

                  <option value="Development">
                    Development
                  </option>

                  <option value="Pilot">
                    Pilot
                  </option>

                  <option value="Production">
                    Production
                  </option>

                  <option value="Suspended">
                    Suspended
                  </option>

                  <option value="Retired">
                    Retired
                  </option>
                </select>
              </label>

              <label style={labelStyle}>
                Inventory Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Active">
                    Active
                  </option>

                  <option value="Under Review">
                    Under Review
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                  <option value="Archived">
                    Archived
                  </option>
                </select>
              </label>

              <label style={labelStyle}>
                Data Classification
                <select
                  value={
                    form.data_classification
                  }
                  onChange={(event) =>
                    updateField(
                      "data_classification",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select classification
                  </option>

                  <option value="Public">
                    Public
                  </option>

                  <option value="Internal">
                    Internal
                  </option>

                  <option value="Confidential">
                    Confidential
                  </option>

                  <option value="Restricted">
                    Restricted
                  </option>

                  <option value="Personal Data">
                    Personal Data
                  </option>

                  <option value="Special Category Data">
                    Special Category Data
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span style={sectionNumberStyle}>
                4
              </span>

              <div>
                <h3 style={sectionTitleStyle}>
                  Risk and regulatory
                  classification
                </h3>

                <p
                  style={
                    sectionDescriptionStyle
                  }
                >
                  Record the initial governance
                  classification. These values
                  can be updated after formal
                  assessment.
                </p>
              </div>
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Risk Level
                <select
                  value={form.risk_level}
                  onChange={(event) =>
                    updateField(
                      "risk_level",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Not Assessed">
                    Not Assessed
                  </option>

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>
                </select>
              </label>

              <label style={labelStyle}>
                EU AI Act Category
                <select
                  value={
                    form.eu_ai_act_category
                  }
                  onChange={(event) =>
                    updateField(
                      "eu_ai_act_category",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Not Classified">
                    Not Classified
                  </option>

                  <option value="Minimal Risk">
                    Minimal Risk
                  </option>

                  <option value="Limited Risk">
                    Limited Risk
                  </option>

                  <option value="High Risk">
                    High Risk
                  </option>

                  <option value="Prohibited">
                    Prohibited
                  </option>

                  <option value="General-Purpose AI">
                    General-Purpose AI
                  </option>
                </select>
              </label>
            </div>

            <div style={guidanceBoxStyle}>
              <strong>
                Classification guidance:
              </strong>{" "}
              Select “Not Assessed” or “Not
              Classified” where a formal risk or
              EU AI Act assessment has not yet
              been completed. TrustGRC AI 360
              will later support structured
              assessments and evidence-based
              classification.
            </div>
          </section>

          <div style={actionRowStyle}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                router.push(
                  "/admin/ai-systems"
                )
              }
              style={{
                ...secondaryButtonStyle,
                opacity: isSubmitting
                  ? 0.65
                  : 1,
                cursor: isSubmitting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...primaryButtonStyle,
                background: isSubmitting
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                cursor: isSubmitting
                  ? "not-allowed"
                  : "pointer",
                boxShadow: isSubmitting
                  ? "none"
                  : "0 8px 18px rgba(37, 99, 235, 0.22)",
              }}
            >
              {isSubmitting
                ? "Registering..."
                : "Register AI System"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function getApiErrorMessage(
  responseData:
    | ApiError
    | AISystemResponse
    | Organization[],
  fallbackMessage: string
) {
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "detail" in responseData
  ) {
    const detail = responseData.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "msg" in item &&
            typeof item.msg === "string"
          ) {
            return item.msg;
          }

          return JSON.stringify(item);
        })
        .join(" ");
    }
  }

  return fallbackMessage;
}

const pageHeaderStyle: React.CSSProperties = {
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
  maxWidth: "880px",
  margin: 0,
  color: "#64748b",
  lineHeight: 1.6,
};

const formCardStyle: React.CSSProperties = {
  maxWidth: "1050px",
  overflow: "hidden",
  border: "1px solid #bfdbfe",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  boxShadow:
    "0 12px 30px rgba(37, 99, 235, 0.10)",
};

const formBannerStyle: React.CSSProperties = {
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
  maxWidth: "780px",
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.92,
};

const formBodyStyle: React.CSSProperties = {
  padding: "28px",
};

const sectionStyle: React.CSSProperties = {
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

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: 700,
};

const fullWidthLabelStyle: React.CSSProperties = {
  ...labelStyle,
  marginTop: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  border: "1px solid #bfdbfe",
  borderRadius: "9px",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "105px",
  fontFamily: "inherit",
};

const helperTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.4,
};

const technologyFieldsetStyle:
  React.CSSProperties = {
  margin: 0,
  padding: "20px",
  border: "1px solid #bfdbfe",
  borderRadius: "11px",
  backgroundColor: "#f8fafc",
};

const technologyLegendStyle:
  React.CSSProperties = {
  padding: "0 8px",
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: 700,
};

const technologyDescriptionStyle:
  React.CSSProperties = {
  marginTop: 0,
  marginBottom: "16px",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const technologyGridStyle:
  React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const technologyOptionStyle:
  React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 13px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  transition:
    "border-color 0.15s ease, background-color 0.15s ease",
};

const checkboxStyle: React.CSSProperties = {
  width: "17px",
  height: "17px",
  accentColor: "#2563eb",
  cursor: "pointer",
};

const selectedTechnologyTextStyle:
  React.CSSProperties = {
  marginTop: "16px",
  marginBottom: 0,
  color: "#475569",
  fontSize: "12px",
  lineHeight: 1.5,
};

const guidanceBoxStyle: React.CSSProperties = {
  marginTop: "22px",
  padding: "16px",
  border: "1px solid #bfdbfe",
  borderRadius: "10px",
  backgroundColor: "#eff6ff",
  color: "#1e3a8a",
  fontSize: "13px",
  lineHeight: 1.6,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 17px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#1d4ed8",
  fontWeight: 700,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "11px 20px",
  border: "none",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
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
  marginBottom: "22px",
  padding: "14px 16px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  backgroundColor: "#fef2f2",
  color: "#991b1b",
};