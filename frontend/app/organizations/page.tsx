"use client";

import { useEffect, useState } from "react";

interface Organization {
  id: number;
  name: string;
  legal_name?: string;
  industry: string;
  country: string;
  organization_size?: string;
  contact_email?: string;
  status: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showForm, setShowForm] = useState(false);

const [newOrganization, setNewOrganization] = useState({
  name: "",
  legal_name: "",
  industry: "",
  country: "",
  organization_size: "",
  contact_email: "",
  status: "Active",
});

  useEffect(() => {
    async function loadOrganizations() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "http://195.216.168.137:8000/api/v1/organizations"
        );

        if (!response.ok) {
          throw new Error("Unable to load organizations.");
        }

        const data: Organization[] = await response.json();
        setOrganizations(data);
      } catch (error) {
        console.error("Error loading organizations:", error);
        setErrorMessage(
          "The organizations could not be loaded. Please check that the FastAPI backend is running."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadOrganizations();
  }, []);

  function handleAddOrganization() {
  setShowForm(true);
}

async function handleSaveOrganization() {
  try {
    const response = await fetch(
      "http://195.216.168.137:8000/api/v1/organizations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOrganization),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save organization");
    }

    const createdOrganization = await response.json();

    setOrganizations((previous) => [
      ...previous,
      createdOrganization,
    ]);

    setShowForm(false);

    setNewOrganization({
      name: "",
      legal_name: "",
      industry: "",
      country: "",
      organization_size: "",
      contact_email: "",
      status: "Active",
    });
  } catch (error) {
    console.error(error);
    alert("Unable to save organization.");
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
          fontSize: "32px",
          fontWeight: 600,
          marginBottom: "10px",
        }}
      >
        Organizations
      </h1>

      <p
        style={{
          marginBottom: "28px",
          color: "#64748b",
        }}
      >
        Manage organizations registered in TrustGRC AI 360.
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

        {showForm && (
  <div
    style={{
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "20px",
      marginBottom: "20px",
      backgroundColor: "#ffffff",
    }}
  >
    <h3>Add Organization</h3>

    <input
      placeholder="Organization Name"
      value={newOrganization.name}
      onChange={(e) =>
        setNewOrganization({
          ...newOrganization,
          name: e.target.value,
        })
      }
      style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
    />

    <input
      placeholder="Legal Name"
      value={newOrganization.legal_name}
      onChange={(e) =>
        setNewOrganization({
          ...newOrganization,
          legal_name: e.target.value,
        })
      }
      style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
    />

    <input
      placeholder="Industry"
      value={newOrganization.industry}
      onChange={(e) =>
        setNewOrganization({
          ...newOrganization,
          industry: e.target.value,
        })
      }
      style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
    />

    <input
      placeholder="Country"
      value={newOrganization.country}
      onChange={(e) =>
        setNewOrganization({
          ...newOrganization,
          country: e.target.value,
        })
      }
      style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
    />

    <input
      placeholder="Email"
      value={newOrganization.contact_email}
      onChange={(e) =>
        setNewOrganization({
          ...newOrganization,
          contact_email: e.target.value,
        })
      }
      style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
    />

    <button
      onClick={handleSaveOrganization}
      style={{
        padding: "10px 16px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#16a34a",
        color: "#ffffff",
        cursor: "pointer",
      }}
    >
      Save Organization
    </button>
  </div>
)}

        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Total Organizations: {organizations.length}
        </h2>

        <button
          type="button"
          onClick={handleAddOrganization}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          + Add Organization
        </button>
      </div>

      {isLoading && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            color: "#64748b",
            backgroundColor: "#ffffff",
          }}
        >
          Loading organizations...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div
          style={{
            padding: "16px",
            marginBottom: "20px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#991b1b",
            backgroundColor: "#fef2f2",
          }}
        >
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
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
                <th style={headerCellStyle}>Name</th>
                <th style={headerCellStyle}>Industry</th>
                <th style={headerCellStyle}>Country</th>
                <th style={headerCellStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "28px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const isActive =
                    org.status?.toLowerCase() === "active";

                  return (
                    <tr
                      key={org.id}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={bodyCellStyle}>{org.name}</td>
                      <td style={bodyCellStyle}>
                        {org.industry || "Not specified"}
                      </td>
                      <td style={bodyCellStyle}>
                        {org.country || "Not specified"}
                      </td>
                      <td style={bodyCellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            backgroundColor: isActive
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: isActive
                              ? "#166534"
                              : "#991b1b",
                            fontSize: "13px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {org.status || "Unknown"}
                        </span>
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

const headerCellStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
};

const bodyCellStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "left",
  fontSize: "14px",
  color: "#334155",
};