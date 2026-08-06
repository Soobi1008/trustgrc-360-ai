"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAccessToken } from "../../../lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type Assessment = {
  id: number;
  organization_id: number;
  ai_system_id: number;
  assessment_name: string;
  framework: string;
  status: string;
  score: number;
  assessor: string;
};

type AISystem = {
  id: number;
  name: string;
  organization_id: number;
};

type Organization = {
  id: number;
  name: string;
};

/*function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ??
    localStorage.getItem("token") ??
    sessionStorage.getItem("access_token") ??
    sessionStorage.getItem("token")
  );
}*/

function getScoreStyle(score: number): React.CSSProperties {
  if (score >= 80) {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (score >= 60) {
    return {
      background: "#fef9c3",
      color: "#854d0e",
      border: "1px solid #fde047",
    };
  }

  if (score >= 40) {
    return {
      background: "#ffedd5",
      color: "#9a3412",
      border: "1px solid #fdba74",
    };
  }

  return {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
  };
}

function getStatusStyle(status: string): React.CSSProperties {
  const normalized = status.toLowerCase();

  if (normalized === "completed") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (normalized === "in progress") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    };
  }

  if (normalized === "approved") {
    return {
      background: "#ede9fe",
      color: "#6d28d9",
      border: "1px solid #c4b5fd",
    };
  }

  if (normalized === "archived") {
    return {
      background: "#e5e7eb",
      color: "#374151",
      border: "1px solid #d1d5db",
    };
  }

  return {
    background: "#fef9c3",
    color: "#854d0e",
    border: "1px solid #fde047",
  };
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiSystems, setAISystems] = useState<AISystem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const token = getAccessToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please sign in again.",
          );
        }

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [
          assessmentsResponse,
          aiSystemsResponse,
          organizationsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/assessments`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/api/v1/ai-systems`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/api/v1/organizations`, {
            headers,
            cache: "no-store",
          }),
        ]);

        if (assessmentsResponse.status === 401) {
          throw new Error(
            "Your session has expired. Please sign in again.",
          );
        }

        if (!assessmentsResponse.ok) {
          const responseBody = await assessmentsResponse
            .json()
            .catch(() => null);

          throw new Error(
            responseBody?.detail ??
              "Failed to load assessments.",
          );
        }

        const assessmentsData: Assessment[] =
          await assessmentsResponse.json();

        const aiSystemsData: AISystem[] = aiSystemsResponse.ok
          ? await aiSystemsResponse.json()
          : [];

        const organizationsData: Organization[] =
          organizationsResponse.ok
            ? await organizationsResponse.json()
            : [];

        setAssessments(assessmentsData);
        setAISystems(aiSystemsData);
        setOrganizations(organizationsData);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load assessments.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const aiSystemNames = useMemo(() => {
    return new Map(
      aiSystems.map((system) => [system.id, system.name]),
    );
  }, [aiSystems]);

  const organizationNames = useMemo(() => {
    return new Map(
      organizations.map((organization) => [
        organization.id,
        organization.name,
      ]),
    );
  }, [organizations]);

  const frameworks = useMemo(() => {
    return Array.from(
      new Set(
        assessments
          .map((assessment) => assessment.framework)
          .filter(Boolean),
      ),
    ).sort();
  }, [assessments]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        assessments
          .map((assessment) => assessment.status)
          .filter(Boolean),
      ),
    ).sort();
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return assessments.filter((assessment) => {
      const aiSystemName =
        aiSystemNames.get(assessment.ai_system_id) ?? "";

      const organizationName =
        organizationNames.get(assessment.organization_id) ?? "";

      const matchesSearch =
        !normalizedSearch ||
        assessment.assessment_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        assessment.framework
          .toLowerCase()
          .includes(normalizedSearch) ||
        assessment.assessor
          .toLowerCase()
          .includes(normalizedSearch) ||
        aiSystemName
          .toLowerCase()
          .includes(normalizedSearch) ||
        organizationName
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFramework =
        frameworkFilter === "all" ||
        assessment.framework === frameworkFilter;

      const matchesStatus =
        statusFilter === "all" ||
        assessment.status === statusFilter;

      return (
        matchesSearch &&
        matchesFramework &&
        matchesStatus
      );
    });
  }, [
    assessments,
    searchTerm,
    frameworkFilter,
    statusFilter,
    aiSystemNames,
    organizationNames,
  ]);

  const totalAssessments = assessments.length;

  const draftAssessments = assessments.filter(
    (assessment) =>
      assessment.status.toLowerCase() === "draft",
  ).length;

  const inProgressAssessments = assessments.filter(
    (assessment) =>
      assessment.status.toLowerCase() === "in progress",
  ).length;

  const completedAssessments = assessments.filter(
    (assessment) =>
      assessment.status.toLowerCase() === "completed",
  ).length;

  const averageScore =
    assessments.length === 0
      ? 0
      : Math.round(
          assessments.reduce(
            (sum, assessment) => sum + assessment.score,
            0,
          ) / assessments.length,
        );

  return (
    <main style={styles.page}>
      <section style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>AI Governance</p>

          <h1 style={styles.heading}>Assessments</h1>

          <p style={styles.subheading}>
            Create, manage and monitor AI governance and
            compliance assessments across organisations.
          </p>
        </div>

        <Link
          href="/admin/assessments/new"
          style={styles.primaryButton}
        >
          + New Assessment
        </Link>
      </section>

      <section style={styles.metricsGrid}>
        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>
            Total Assessments
          </p>
          <strong style={styles.metricValue}>
            {totalAssessments}
          </strong>
          <p style={styles.metricDescription}>
            Assessments registered across all frameworks
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Draft</p>
          <strong style={styles.metricValue}>
            {draftAssessments}
          </strong>
          <p style={styles.metricDescription}>
            Assessments awaiting completion
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>In Progress</p>
          <strong style={styles.metricValue}>
            {inProgressAssessments}
          </strong>
          <p style={styles.metricDescription}>
            Assessments currently being performed
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Completed</p>
          <strong style={styles.metricValue}>
            {completedAssessments}
          </strong>
          <p style={styles.metricDescription}>
            Finalised governance assessments
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Average Score</p>
          <strong style={styles.metricValue}>
            {averageScore}%
          </strong>
          <p style={styles.metricDescription}>
            Average assessment score
          </p>
        </article>
      </section>

      <section style={styles.filterCard}>
        <input
          type="search"
          placeholder="Search by assessment, framework, assessor, AI system or organization"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          style={styles.searchInput}
        />

        <select
          value={frameworkFilter}
          onChange={(event) =>
            setFrameworkFilter(event.target.value)
          }
          style={styles.select}
        >
          <option value="all">All frameworks</option>

          {frameworks.map((framework) => (
            <option key={framework} value={framework}>
              {framework}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          style={styles.select}
        >
          <option value="all">All statuses</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <section style={styles.messageCard}>
          Loading assessments...
        </section>
      )}

      {!loading && error && (
        <section style={styles.errorCard}>
          {error}
        </section>
      )}

      {!loading && !error && (
        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.tableTitle}>
                Assessment Register
              </h2>

              <p style={styles.tableSubtitle}>
                Showing {filteredAssessments.length} of{" "}
                {assessments.length} assessments
              </p>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Assessment</th>
                  <th style={styles.th}>AI System</th>
                  <th style={styles.th}>Organization</th>
                  <th style={styles.th}>Framework</th>
                  <th style={styles.th}>Assessor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssessments.map(
                  (assessment) => (
                    <tr key={assessment.id}>
                      <td style={styles.td}>
                        <strong style={styles.itemTitle}>
                          {assessment.assessment_name}
                        </strong>

                        <div style={styles.secondaryText}>
                          Assessment ID: {assessment.id}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {aiSystemNames.get(
                          assessment.ai_system_id,
                        ) ??
                          `AI System ${assessment.ai_system_id}`}
                      </td>

                      <td style={styles.td}>
                        {organizationNames.get(
                          assessment.organization_id,
                        ) ??
                          `Organization ${assessment.organization_id}`}
                      </td>

                      <td style={styles.td}>
                        {assessment.framework}
                      </td>

                      <td style={styles.td}>
                        {assessment.assessor}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getStatusStyle(
                              assessment.status,
                            ),
                          }}
                        >
                          {assessment.status}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...getScoreStyle(
                              assessment.score,
                            ),
                          }}
                        >
                          {assessment.score}%
                        </span>
                      </td>

                      <td style={styles.td}>
                        <Link
                          href={`/admin/assessments/${assessment.id}`}
                          style={styles.viewButton}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ),
                )}

                {filteredAssessments.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={styles.emptyState}
                    >
                      No assessments match the selected
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px",
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
  },

  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#2563eb",
    fontWeight: 700,
    fontSize: "15px",
  },

  heading: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.15,
    fontWeight: 500,
  },

  subheading: {
    margin: "12px 0 0",
    color: "#64748b",
    fontSize: "16px",
    maxWidth: "760px",
    lineHeight: 1.6,
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    padding: "0 20px",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.2)",
    whiteSpace: "nowrap",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
  },

  metricCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    padding: "22px",
    minHeight: "150px",
  },

  metricLabel: {
    margin: 0,
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },

  metricValue: {
    display: "block",
    marginTop: "14px",
    fontSize: "32px",
    lineHeight: 1,
  },

  metricDescription: {
    margin: "14px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  filterCard: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) 210px 180px",
    gap: "12px",
    padding: "16px",
    marginBottom: "20px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
  },

  searchInput: {
    width: "100%",
    minHeight: "46px",
    padding: "0 14px",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
  },

  select: {
    width: "100%",
    minHeight: "46px",
    padding: "0 12px",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    background: "#ffffff",
    fontSize: "14px",
  },

  messageCard: {
    padding: "22px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
  },

  errorCard: {
    padding: "18px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    color: "#b91c1c",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px",
    borderBottom: "1px solid #e2e8f0",
  },

  tableTitle: {
    margin: 0,
    fontSize: "18px",
  },

  tableSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  th: {
    padding: "15px 16px",
    textAlign: "left",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 700,
  },

  td: {
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "14px",
    verticalAlign: "middle",
  },

  itemTitle: {
    color: "#0f172a",
  },

  secondaryText: {
    marginTop: "5px",
    color: "#64748b",
    fontSize: "12px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  viewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 13px",
    border: "1px solid #2563eb",
    borderRadius: "7px",
    color: "#2563eb",
    fontWeight: 700,
    textDecoration: "none",
    background: "#ffffff",
  },

  emptyState: {
    padding: "36px",
    textAlign: "center",
    color: "#64748b",
  },
};