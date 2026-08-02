"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

interface Organization {
  id: number;
  name: string;
  legal_name?: string | null;
  industry?: string | null;
  country?: string | null;
  organization_size?: string | null;
  contact_email?: string | null;
  status: string;
  created_at?: string;
}

export default function OrganizationsPage() {
  const router = useRouter();

  const [organizations, setOrganizations] = useState<
    Organization[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

        if (response.status === 401) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view organizations."
          );
        }

        if (!response.ok) {
          throw new Error(
            "The organizations could not be loaded."
          );
        }

        const data =
          (await response.json()) as Organization[];

        setOrganizations(data);
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

  return (
    <main>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#2563eb",
              fontWeight: 700,
            }}
          >
            Platform Administration
          </p>

          <h1
            style={{
              marginTop: "8px",
              marginBottom: "8px",
              color: "#0f172a",
              fontSize: "34px",
            }}
          >
            Organizations
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Manage customer organizations, tenant
            onboarding and organization status.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/organizations/new")
          }
          style={{
            padding: "11px 17px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          + Add Organization
        </button>
      </header>

      <section
        style={{
          marginBottom: "20px",
          padding: "18px 20px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Total organizations
        </p>

        <p
          style={{
            marginTop: "6px",
            marginBottom: 0,
            color: "#0f172a",
            fontSize: "30px",
            fontWeight: 700,
          }}
        >
          {organizations.length}
        </p>
      </section>

      {isLoading && (
        <div style={messageBoxStyle}>
          Loading organizations...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div
          style={{
            ...messageBoxStyle,
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <section
          style={{
            overflowX: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "900px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:
                    "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <th style={headerCellStyle}>
                  Organization
                </th>

                <th style={headerCellStyle}>
                  Industry
                </th>

                <th style={headerCellStyle}>
                  Country
                </th>

                <th style={headerCellStyle}>
                  Size
                </th>

                <th style={headerCellStyle}>
                  Contact
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
              {organizations.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "34px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No organizations were found.
                  </td>
                </tr>
              ) : (
                organizations.map((organization) => {
                  const isActive =
                    organization.status
                      ?.toLowerCase()
                      .trim() === "active";

                  return (
                    <tr
                      key={organization.id}
                      style={{
                        borderBottom:
                          "1px solid #e2e8f0",
                      }}
                    >
                      <td style={bodyCellStyle}>
                        <p
                          style={{
                            margin: 0,
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          {organization.name}
                        </p>

                        <p
                          style={{
                            marginTop: "5px",
                            marginBottom: 0,
                            color: "#94a3b8",
                            fontSize: "12px",
                          }}
                        >
                          {organization.legal_name ||
                            `Organization ID: ${organization.id}`}
                        </p>
                      </td>

                      <td style={bodyCellStyle}>
                        {organization.industry ||
                          "Not specified"}
                      </td>

                      <td style={bodyCellStyle}>
                        {organization.country ||
                          "Not specified"}
                      </td>

                      <td style={bodyCellStyle}>
                        {organization.organization_size ||
                          "Not specified"}
                      </td>

                      <td style={bodyCellStyle}>
                        {organization.contact_email ||
                          "Not specified"}
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
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {organization.status ||
                            "Unknown"}
                        </span>
                      </td>

                      <td style={bodyCellStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/organizations/${organization.id}`
                            )
                          }
                          style={{
                            padding: "8px 12px",
                            border:
                              "1px solid #2563eb",
                            borderRadius: "7px",
                            backgroundColor:
                              "#ffffff",
                            color: "#2563eb",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

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

const messageBoxStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
  color: "#64748b",
};