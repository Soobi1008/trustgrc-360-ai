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

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
}

type ApiError = {
  detail?: string;
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    async function loadUsers() {
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
          `${API_URL}/api/v1/admin/users`,
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
          (await response.json()) as User[] | ApiError;

        if (response.status === 401) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view platform users."
          );
        }

        if (!response.ok) {
          throw new Error(
            "detail" in responseData &&
              typeof responseData.detail === "string"
              ? responseData.detail
              : "The users could not be loaded."
          );
        }

        setUsers(responseData as User[]);
      } catch (error) {
        console.error("Error loading users:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [router]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.full_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.email
          .toLowerCase()
          .includes(normalizedSearch) ||
        formatRole(user.role)
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          user.is_active) ||
        (statusFilter === "inactive" &&
          !user.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, users]);

  const activeCount = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveCount =
    users.length - activeCount;

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
            Users
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Manage platform administrators and users
            assigned to customer organizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/users/new")
          }
          style={primaryButtonStyle}
        >
          + Add User
        </button>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "20px",
        }}
      >
        <SummaryCard
          label="Total Users"
          value={users.length}
        />

        <SummaryCard
          label="Active Users"
          value={activeCount}
        />

        <SummaryCard
          label="Inactive Users"
          value={inactiveCount}
        />
      </section>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          padding: "16px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
        }}
      >
        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search by name, email or role"
          style={{
            flex: "1 1 320px",
            minWidth: "240px",
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            color: "#0f172a",
            fontSize: "14px",
          }}
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "all"
                | "active"
                | "inactive"
            )
          }
          style={{
            minWidth: "170px",
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontSize: "14px",
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </section>

      {isLoading && (
        <div style={messageBoxStyle}>
          Loading users...
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
              minWidth: "950px",
              borderCollapse: "collapse",
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
                  User
                </th>
                <th style={headerCellStyle}>
                  Role
                </th>
                <th style={headerCellStyle}>
                  Organization
                </th>
                <th style={headerCellStyle}>
                  Status
                </th>
                <th style={headerCellStyle}>
                  Created
                </th>
                <th style={headerCellStyle}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "34px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No users match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
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
                        {user.full_name}
                      </p>

                      <p
                        style={{
                          marginTop: "5px",
                          marginBottom: 0,
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        {user.email}
                      </p>
                    </td>

                    <td style={bodyCellStyle}>
                      {formatRole(user.role)}
                    </td>

                    <td style={bodyCellStyle}>
                      {user.organization_id === null
                        ? "Platform"
                        : `Organization ${user.organization_id}`}
                    </td>

                    <td style={bodyCellStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 10px",
                          borderRadius: "999px",
                          backgroundColor:
                            user.is_active
                              ? "#dcfce7"
                              : "#fee2e2",
                          color: user.is_active
                            ? "#166534"
                            : "#991b1b",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td style={bodyCellStyle}>
                      {new Date(
                        user.created_at
                      ).toLocaleString()}
                    </td>

                    <td style={bodyCellStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/admin/users/${user.id}`
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
}: {
  label: string;
  value: number;
}) {
  return (
    <article
      style={{
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
        {label}
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
        {value}
      </p>
    </article>
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "11px 17px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
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