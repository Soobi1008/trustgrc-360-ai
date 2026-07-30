"use client";

import { useEffect, useState } from "react";

interface Organization {
  id: number;
  name: string;
}

interface AISystem {
  id: number;
  organization_id: number;
  name: string;
  description?: string;
  business_owner?: string;
  vendor?: string;
  model_type?: string;
  deployment_status: string;
  risk_level: string;
  eu_ai_act_category: string;
  data_classification?: string;
  status: string;
}

const emptyAISystemForm = {
  organization_id: "",
  name: "",
  description: "",
  business_owner: "",
  vendor: "",
  model_type: "",
  deployment_status: "Planned",
  risk_level: "Not Assessed",
  eu_ai_act_category: "Not Classified",
  data_classification: "",
  status: "Active",
};

export default function InventoryPage() {
  const [aiSystems, setAISystems] = useState<AISystem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [newAISystem, setNewAISystem] = useState(emptyAISystemForm);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [aiSystemsResponse, organizationsResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/v1/ai-systems"),
          fetch("http://127.0.0.1:8000/api/v1/organizations"),
        ]);

        if (!aiSystemsResponse.ok) {
          throw new Error("Unable to load AI systems.");
        }

        if (!organizationsResponse.ok) {
          throw new Error("Unable to load organizations.");
        }

        const aiSystemsData: AISystem[] = await aiSystemsResponse.json();
        const organizationsData: Organization[] =
          await organizationsResponse.json();

        setAISystems(aiSystemsData);
        setOrganizations(organizationsData);
      } catch (error) {
        console.error("Error loading AI Inventory:", error);
        setErrorMessage(
          "The AI Inventory could not be loaded. Please check that the FastAPI backend is running."
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

  function handleCancel() {
    setShowForm(false);
    setNewAISystem(emptyAISystemForm);
    setErrorMessage("");
  }

  async function handleSaveAISystem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newAISystem.organization_id || !newAISystem.name.trim()) {
      setErrorMessage(
        "Please select an organization and enter the AI system name."
      );
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/ai-systems",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newAISystem,
            organization_id: Number(newAISystem.organization_id),
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail || "Unable to register the AI system."
        );
      }

      const createdAISystem: AISystem = responseData;

      setAISystems((previousSystems) => [
        createdAISystem,
        ...previousSystems,
      ]);

      setNewAISystem(emptyAISystemForm);
      setShowForm(false);
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
        AI Inventory
      </h1>

      <p
        style={{
          color: "#64748b",
          marginTop: "10px",
          marginBottom: "28px",
        }}
      >
        Register and manage the AI systems used by your organization.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
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

        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setErrorMessage("");
          }}
          style={{
            border: "none",
            borderRadius: "8px",
            padding: "11px 18px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Register AI System
        </button>
      </div>

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
          <h3
            style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "20px",
            }}
          >
            Register AI System
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <label style={labelStyle}>
              Organization
              <select
                required
                value={newAISystem.organization_id}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    organization_id: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="">Select organization</option>

                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              AI System Name
              <input
                required
                type="text"
                value={newAISystem.name}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    name: event.target.value,
                  })
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
                  setNewAISystem({
                    ...newAISystem,
                    business_owner: event.target.value,
                  })
                }
                placeholder="e.g. Compliance Team"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Vendor
              <input
                type="text"
                value={newAISystem.vendor}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    vendor: event.target.value,
                  })
                }
                placeholder="e.g. OpenAI"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Model Type
              <select
                value={newAISystem.model_type}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    model_type: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="">Select model type</option>
                <option value="LLM">Large Language Model</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="NLP">Natural Language Processing</option>
                <option value="Computer Vision">Computer Vision</option>
                <option value="Predictive Analytics">
                  Predictive Analytics
                </option>
                <option value="RPA">Robotic Process Automation</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label style={labelStyle}>
              Deployment Status
              <select
                value={newAISystem.deployment_status}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    deployment_status: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="Planned">Planned</option>
                <option value="Pilot">Pilot</option>
                <option value="Development">Development</option>
                <option value="Production">Production</option>
                <option value="Retired">Retired</option>
              </select>
            </label>

            <label style={labelStyle}>
              Risk Level
              <select
                value={newAISystem.risk_level}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    risk_level: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="Not Assessed">Not Assessed</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </label>

            <label style={labelStyle}>
              EU AI Act Category
              <select
                value={newAISystem.eu_ai_act_category}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    eu_ai_act_category: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="Not Classified">Not Classified</option>
                <option value="Minimal Risk">Minimal Risk</option>
                <option value="Limited Risk">Limited Risk</option>
                <option value="High Risk">High Risk</option>
                <option value="Prohibited">Prohibited</option>
                <option value="General-Purpose AI">
                  General-Purpose AI
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Data Classification
              <select
                value={newAISystem.data_classification}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    data_classification: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="">Select data classification</option>
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
                <option value="Personal Data">Personal Data</option>
                <option value="Sensitive Personal Data">
                  Sensitive Personal Data
                </option>
              </select>
            </label>

            <label style={labelStyle}>
              Status
              <select
                value={newAISystem.status}
                onChange={(event) =>
                  setNewAISystem({
                    ...newAISystem,
                    status: event.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Under Review">Under Review</option>
              </select>
            </label>
          </div>

          <label
            style={{
              ...labelStyle,
              marginTop: "16px",
            }}
          >
            Description
            <textarea
              rows={4}
              value={newAISystem.description}
              onChange={(event) =>
                setNewAISystem({
                  ...newAISystem,
                  description: event.target.value,
                })
              }
              placeholder="Describe the AI system and its intended purpose."
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
              style={{
                padding: "10px 16px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#334155",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: isSaving ? "#94a3b8" : "#16a34a",
                color: "#ffffff",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {isSaving ? "Saving..." : "Save AI System"}
            </button>
          </div>
        </form>
      )}

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
                <th style={headerCellStyle}>AI System</th>
                <th style={headerCellStyle}>Organization</th>
                <th style={headerCellStyle}>Vendor</th>
                <th style={headerCellStyle}>Model Type</th>
                <th style={headerCellStyle}>Risk Level</th>
                <th style={headerCellStyle}>AI Act Category</th>
                <th style={headerCellStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {aiSystems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                aiSystems.map((system) => (
                  <tr
                    key={system.id}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <td style={bodyCellStyle}>{system.name}</td>

                    <td style={bodyCellStyle}>
                      {getOrganizationName(system.organization_id)}
                    </td>

                    <td style={bodyCellStyle}>
                      {system.vendor || "Not specified"}
                    </td>

                    <td style={bodyCellStyle}>
                      {system.model_type || "Not specified"}
                    </td>

                    <td style={bodyCellStyle}>
                      <span style={getRiskBadgeStyle(system.risk_level)}>
                        {system.risk_level}
                      </span>
                    </td>

                    <td style={bodyCellStyle}>
                      {system.eu_ai_act_category}
                    </td>

                    <td style={bodyCellStyle}>
                      <span style={getStatusBadgeStyle(system.status)}>
                        {system.status}
                      </span>
                    </td>
                  </tr>
                ))
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

function getRiskBadgeStyle(riskLevel: string): React.CSSProperties {
  const normalizedRisk = riskLevel.toLowerCase();

  if (normalizedRisk === "critical") {
    return {
      ...badgeStyle,
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (normalizedRisk === "high") {
    return {
      ...badgeStyle,
      backgroundColor: "#ffedd5",
      color: "#9a3412",
    };
  }

  if (normalizedRisk === "medium") {
    return {
      ...badgeStyle,
      backgroundColor: "#fef3c7",
      color: "#92400e",
    };
  }

  if (normalizedRisk === "low") {
    return {
      ...badgeStyle,
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  return {
    ...badgeStyle,
    backgroundColor: "#e2e8f0",
    color: "#475569",
  };
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const normalizedStatus = status.toLowerCase();

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

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};