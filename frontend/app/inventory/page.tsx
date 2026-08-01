"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Organization {
  id: number;
  name: string;
}

interface AISystem {
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
}

interface AISystemForm {
  organization_id: string;
  name: string;
  description: string;
  business_owner: string;
  vendor: string;
  model_types: string[];
  deployment_status: string;
  data_classification: string;
  status: string;
}

const AI_TECHNOLOGIES = [
  "Large Language Model",
  "Generative AI",
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Predictive Analytics",
  "Robotic Process Automation",
  "Agentic AI",
  "Reinforcement Learning",
  "Speech Recognition",
  "Optical Character Recognition",
  "Recommendation System",
  "Expert System",
  "Other",
];

const emptyAISystemForm: AISystemForm = {
  organization_id: "",
  name: "",
  description: "",
  business_owner: "",
  vendor: "",
  model_types: [],
  deployment_status: "Planned",
  data_classification: "",
  status: "Active",
};

export default function InventoryPage() {
  const [aiSystems, setAISystems] = useState<AISystem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [newAISystem, setNewAISystem] =
    useState<AISystemForm>(emptyAISystemForm);

  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        if (!API_URL) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is missing. Check .env.local and restart Next.js."
          );
        }

        const [aiSystemsResponse, organizationsResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/v1/ai-systems`, {
              headers: {
                Accept: "application/json",
              },
            }),
            fetch(`${API_URL}/api/v1/organizations`, {
              headers: {
                Accept: "application/json",
              },
            }),
          ]);

        if (!aiSystemsResponse.ok) {
          throw new Error(
            `Unable to load AI systems. Server returned ${aiSystemsResponse.status}.`
          );
        }

        if (!organizationsResponse.ok) {
          throw new Error(
            `Unable to load organizations. Server returned ${organizationsResponse.status}.`
          );
        }

        const aiSystemsData: AISystem[] =
          await aiSystemsResponse.json();

        const organizationsData: Organization[] =
          await organizationsResponse.json();

        setAISystems(aiSystemsData);
        setOrganizations(organizationsData);
      } catch (error) {
        console.error("Error loading AI Inventory:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The AI Inventory could not be loaded."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  function getOrganizationName(organizationId: number) {
    const organization = organizations.find(
      (item) => item.id === organizationId
    );

    return organization?.name ?? "Unknown organization";
  }

  function updateFormField(
    field: keyof AISystemForm,
    value: string
  ) {
    setNewAISystem((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function toggleModelType(modelType: string) {
    setNewAISystem((currentForm) => {
      const isSelected =
        currentForm.model_types.includes(modelType);

      return {
        ...currentForm,
        model_types: isSelected
          ? currentForm.model_types.filter(
              (item) => item !== modelType
            )
          : [...currentForm.model_types, modelType],
      };
    });
  }

  function handleOpenForm() {
    setShowForm(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleCancel() {
    setShowForm(false);
    setNewAISystem(emptyAISystemForm);
    setErrorMessage("");
  }

  function getAssessmentStatus(system: AISystem) {
    const riskLevel =
      system.risk_level?.toLowerCase() ?? "";

    const aiActCategory =
      system.eu_ai_act_category?.toLowerCase() ?? "";

    if (
      riskLevel === "not assessed" &&
      aiActCategory === "not classified"
    ) {
      return "Not Assessed";
    }

    if (
      riskLevel === "not assessed" ||
      aiActCategory === "not classified"
    ) {
      return "In Progress";
    }

    return "Completed";
  }

  async function handleSaveAISystem(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!newAISystem.organization_id) {
      setErrorMessage("Please select an organization.");
      return;
    }

    if (!newAISystem.name.trim()) {
      setErrorMessage("Please enter the AI system name.");
      return;
    }

    if (newAISystem.model_types.length === 0) {
      setErrorMessage(
        "Please select at least one AI technology."
      );
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!API_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_URL is missing. Check .env.local and restart Next.js."
        );
      }

      const response = await fetch(
        `${API_URL}/api/v1/ai-systems`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            organization_id: Number(
              newAISystem.organization_id
            ),
            name: newAISystem.name.trim(),
            description:
              newAISystem.description.trim() || null,
            business_owner:
              newAISystem.business_owner.trim() || null,
            vendor:
              newAISystem.vendor.trim() || null,

            // MVP storage approach:
            // selected technologies are stored as one
            // comma-separated string.
            model_type:
              newAISystem.model_types.join(", "),

            deployment_status:
              newAISystem.deployment_status,

            data_classification:
              newAISystem.data_classification || null,

            status: newAISystem.status,

            // These remain backend defaults until the
            // assessment engine calculates them.
            risk_level: "Not Assessed",
            eu_ai_act_category: "Not Classified",
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        const detail =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "Unable to register the AI system.";

        throw new Error(detail);
      }

      const createdAISystem: AISystem = responseData;

      setAISystems((previousSystems) => [
        createdAISystem,
        ...previousSystems,
      ]);

      setNewAISystem(emptyAISystemForm);
      setShowForm(false);

      setSuccessMessage(
        `${createdAISystem.name} was registered successfully and is ready for assessment.`
      );
    } catch (error) {
      console.error("Error saving AI system:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to register the AI system."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleStartAssessment(systemId: number) {
    window.location.href =
      `/assessments?ai_system_id=${systemId}`;
  }

  return (
    <main
      style={{
        padding: "32px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 600,
            }}
          >
            AI Inventory
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: "10px",
              marginBottom: 0,
            }}
          >
            Register the AI systems and technologies used
            by your organization. Risk classification is
            determined through the TrustGRC assessment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenForm}
          style={primaryButtonStyle}
        >
          + Register AI System
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            padding: "14px 16px",
            marginBottom: "20px",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            backgroundColor: "#f0fdf4",
            color: "#166534",
          }}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: "14px 16px",
            marginBottom: "20px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {errorMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSaveAISystem}
          style={{
            marginBottom: "24px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "21px",
              fontWeight: 600,
            }}
          >
            Register AI System
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "20px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Enter factual information about the system.
            TrustGRC AI 360 will determine its risk level
            and regulatory classification during assessment.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <label style={labelStyle}>
              Organization *
              <select
                required
                value={newAISystem.organization_id}
                onChange={(event) =>
                  updateFormField(
                    "organization_id",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select organization
                </option>

                {organizations.map((organization) => (
                  <option
                    key={organization.id}
                    value={organization.id}
                  >
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              AI System Name *
              <input
                required
                type="text"
                value={newAISystem.name}
                onChange={(event) =>
                  updateFormField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="e.g. TrustGRC Compliance Assistant"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Business Owner
              <input
                type="text"
                value={newAISystem.business_owner}
                onChange={(event) =>
                  updateFormField(
                    "business_owner",
                    event.target.value
                  )
                }
                placeholder="e.g. Compliance Team"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Vendor or Provider
              <input
                type="text"
                value={newAISystem.vendor}
                onChange={(event) =>
                  updateFormField(
                    "vendor",
                    event.target.value
                  )
                }
                placeholder="e.g. OpenAI, Microsoft, Google"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Deployment Status
              <select
                value={newAISystem.deployment_status}
                onChange={(event) =>
                  updateFormField(
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

                <option value="Retired">
                  Retired
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Data Classification
              <select
                value={newAISystem.data_classification}
                onChange={(event) =>
                  updateFormField(
                    "data_classification",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select data classification
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

                <option value="Sensitive Personal Data">
                  Sensitive Personal Data
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Operational Status
              <select
                value={newAISystem.status}
                onChange={(event) =>
                  updateFormField(
                    "status",
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

                <option value="Under Review">
                  Under Review
                </option>
              </select>
            </label>

            <div style={labelStyle}>
              Assessment Status
              <div
                style={{
                  ...inputStyle,
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                }}
              >
                Not Assessed — automatically assigned
              </div>
            </div>
          </div>

          <fieldset
            style={{
              marginTop: "20px",
              padding: "18px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
            }}
          >
            <legend
              style={{
                padding: "0 8px",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              AI Technologies Used *
            </legend>

            <p
              style={{
                marginTop: 0,
                marginBottom: "14px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Select every AI technology used by this system.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {AI_TECHNOLOGIES.map((technology) => (
                <label
                  key={technology}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding: "10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    backgroundColor:
                      newAISystem.model_types.includes(
                        technology
                      )
                        ? "#eff6ff"
                        : "#ffffff",
                    color: "#334155",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newAISystem.model_types.includes(
                      technology
                    )}
                    onChange={() =>
                      toggleModelType(technology)
                    }
                  />

                  {technology}
                </label>
              ))}
            </div>

            {newAISystem.model_types.length > 0 && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  fontSize: "13px",
                }}
              >
                Selected:{" "}
                {newAISystem.model_types.join(", ")}
              </div>
            )}
          </fieldset>

          <label
            style={{
              ...labelStyle,
              marginTop: "18px",
            }}
          >
            Description and Intended Purpose
            <textarea
              rows={4}
              value={newAISystem.description}
              onChange={(event) =>
                updateFormField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Describe what the AI system does, who uses it and its intended purpose."
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                ...saveButtonStyle,
                backgroundColor: isSaving
                  ? "#94a3b8"
                  : "#16a34a",
                cursor: isSaving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {isSaving
                ? "Saving..."
                : "Save AI System"}
            </button>
          </div>
        </form>
      )}

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Total AI Systems: {aiSystems.length}
        </h2>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            color: "#64748b",
          }}
        >
          Loading AI systems...
        </div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <th style={headerCellStyle}>
                  AI System
                </th>

                <th style={headerCellStyle}>
                  Organization
                </th>

                <th style={headerCellStyle}>
                  Vendor
                </th>

                <th style={headerCellStyle}>
                  AI Technologies
                </th>

                <th style={headerCellStyle}>
                  Deployment
                </th>

                <th style={headerCellStyle}>
                  Assessment Status
                </th>

                <th style={headerCellStyle}>
                  Operational Status
                </th>

                <th style={headerCellStyle}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {aiSystems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: "28px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No AI systems have been registered yet.
                  </td>
                </tr>
              ) : (
                aiSystems.map((system) => {
                  const assessmentStatus =
                    getAssessmentStatus(system);

                  return (
                    <tr
                      key={system.id}
                      style={{
                        borderBottom:
                          "1px solid #e2e8f0",
                      }}
                    >
                      <td style={bodyCellStyle}>
                        {system.name}
                      </td>

                      <td style={bodyCellStyle}>
                        {getOrganizationName(
                          system.organization_id
                        )}
                      </td>

                      <td style={bodyCellStyle}>
                        {system.vendor ||
                          "Not specified"}
                      </td>

                      <td style={bodyCellStyle}>
                        {system.model_type ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "6px",
                            }}
                          >
                            {system.model_type
                              .split(",")
                              .map((technology) => (
                                <span
                                  key={technology.trim()}
                                  style={technologyBadgeStyle}
                                >
                                  {technology.trim()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          "Not specified"
                        )}
                      </td>

                      <td style={bodyCellStyle}>
                        {system.deployment_status}
                      </td>

                      <td style={bodyCellStyle}>
                        <span
                          style={getAssessmentBadgeStyle(
                            assessmentStatus
                          )}
                        >
                          {assessmentStatus}
                        </span>
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
                            handleStartAssessment(
                              system.id
                            )
                          }
                          style={assessmentButtonStyle}
                        >
                          {assessmentStatus ===
                          "Completed"
                            ? "View Assessment"
                            : assessmentStatus ===
                                "In Progress"
                              ? "Continue Assessment"
                              : "Start Assessment"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "7px",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "11px 18px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600,
};

const saveButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "8px",
  color: "#ffffff",
  fontWeight: 600,
};

const assessmentButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #2563eb",
  borderRadius: "7px",
  backgroundColor: "#eff6ff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const headerCellStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "left",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const bodyCellStyle: React.CSSProperties = {
  padding: "14px 12px",
  color: "#334155",
  fontSize: "14px",
  verticalAlign: "middle",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const technologyBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "999px",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 600,
};

function getAssessmentBadgeStyle(
  status: string
): React.CSSProperties {
  if (status === "Completed") {
    return {
      ...badgeStyle,
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "In Progress") {
    return {
      ...badgeStyle,
      backgroundColor: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    ...badgeStyle,
    backgroundColor: "#e2e8f0",
    color: "#475569",
  };
}

function getStatusBadgeStyle(
  status: string
): React.CSSProperties {
  const normalizedStatus =
    status?.toLowerCase() ?? "";

  if (normalizedStatus === "active") {
    return {
      ...badgeStyle,
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  if (normalizedStatus === "under review") {
    return {
      ...badgeStyle,
      backgroundColor: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    ...badgeStyle,
    backgroundColor: "#e2e8f0",
    color: "#475569",
  };
}