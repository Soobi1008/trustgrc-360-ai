"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
  getStoredUser,
  isPlatformRole,
} from "../../../../lib/auth";

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
  created_at?: string | null;
}

type OrganizationStatus = "active" | "archived";

type ApiError = {
  detail?: string;
};

export default function OrganizationDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const organizationId = params.id;

  const [organization, setOrganization] =
    useState<Organization | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [statusErrorMessage, setStatusErrorMessage] =
    useState("");

  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState(false);

  const currentUser = getStoredUser();

  const canManageOrganization =
    currentUser !== null &&
    isPlatformRole(currentUser.role);

  useEffect(() => {
    async function loadOrganization() {
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
          `${API_URL}/api/v1/organizations/${organizationId}`,
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
            "You do not have permission to view this organization."
          );
        }

        if (response.status === 404) {
          throw new Error(
            "Organization not found."
          );
        }

        if (!response.ok) {
          throw new Error(
            "The organization details could not be loaded."
          );
        }

        const data =
          (await response.json()) as Organization;

        setOrganization(data);
      } catch (error) {
        console.error(
          "Error loading organization:",
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

    loadOrganization();
  }, [organizationId, router]);

  async function updateOrganizationStatus(
    newStatus: OrganizationStatus
  ) {
    if (!organization) {
      return;
    }

    if (!canManageOrganization) {
      setStatusErrorMessage(
        "You do not have permission to change the organization status."
      );
      return;
    }

    const isArchiving =
      newStatus === "archived";

    const confirmed = window.confirm(
      isArchiving
        ? `Archive "${organization.name}"?\n\nThe organization and all related records will remain in the database, but the tenant will be marked as archived.`
        : `Restore "${organization.name}" to active status?`
    );

    if (!confirmed) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      clearAuthentication();
      router.replace("/login");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setStatusErrorMessage("");

      const response = await fetch(
        `${API_URL}/api/v1/organizations/${organization.id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const responseData =
        (await response.json()) as
          | Organization
          | ApiError;

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          isArchiving
            ? "You do not have permission to archive this organization."
            : "You do not have permission to restore this organization."
        );
      }

      if (!response.ok) {
        throw new Error(
          "detail" in responseData &&
            typeof responseData.detail === "string"
            ? responseData.detail
            : isArchiving
              ? "The organization could not be archived."
              : "The organization could not be restored."
        );
      }

      const updatedOrganization =
        responseData as Organization;

      setOrganization(updatedOrganization);

      if (isArchiving) {
        router.push("/admin/organizations");
        router.refresh();
      }
    } catch (error) {
      console.error(
        "Error updating organization status:",
        error
      );

      setStatusErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoading) {
    return (
      <div style={messageBoxStyle}>
        Loading organization details...
      </div>
    );
  }

  if (errorMessage || !organization) {
    return (
      <main>
        <div
          style={{
            ...messageBoxStyle,
            borderColor: "#fecaca",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {errorMessage ||
            "The organization could not be found."}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/organizations")
          }
          style={{
            ...secondaryButtonStyle,
            marginTop: "18px",
          }}
        >
          Back to Organizations
        </button>
      </main>
    );
  }

  const normalizedStatus =
    organization.status
      ?.toLowerCase()
      .trim() || "unknown";

  const isArchived =
    normalizedStatus === "archived";

  const statusStyle =
    getStatusStyle(normalizedStatus);

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
            {organization.name}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Organization profile and tenant information.
          </p>
        </div>

        <span
          style={{
            display: "inline-block",
            padding: "7px 12px",
            borderRadius: "999px",
            backgroundColor:
              statusStyle.backgroundColor,
            color: statusStyle.color,
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {organization.status || "Unknown"}
        </span>
      </header>

      {statusErrorMessage && (
        <div
          style={{
            marginBottom: "20px",
            padding: "13px 15px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
          }}
        >
          {statusErrorMessage}
        </div>
      )}

      {isArchived && (
        <div
          style={{
            marginBottom: "20px",
            padding: "13px 15px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            backgroundColor: "#f8fafc",
            color: "#475569",
          }}
        >
          This organization is archived. Its users, AI
          systems, assessments, risks and other records
          remain in the database.
        </div>
      )}

      <section
        style={{
          maxWidth: "1000px",
          padding: "26px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 8px 24px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "22px",
          }}
        >
          <DetailItem
            label="Organization ID"
            value={String(organization.id)}
          />

          <DetailItem
            label="Organization Name"
            value={organization.name}
          />

          <DetailItem
            label="Legal Name"
            value={
              organization.legal_name ||
              "Not specified"
            }
          />

          <DetailItem
            label="Industry"
            value={
              organization.industry ||
              "Not specified"
            }
          />

          <DetailItem
            label="Country"
            value={
              organization.country ||
              "Not specified"
            }
          />

          <DetailItem
            label="Organization Size"
            value={
              organization.organization_size ||
              "Not specified"
            }
          />

          <DetailItem
            label="Contact Email"
            value={
              organization.contact_email ||
              "Not specified"
            }
          />

          <DetailItem
            label="Created At"
            value={
              organization.created_at
                ? new Date(
                    organization.created_at
                  ).toLocaleString()
                : "Not available"
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginTop: "30px",
            paddingTop: "22px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() =>
              router.push("/admin/organizations")
            }
            style={secondaryButtonStyle}
          >
            Back to Organizations
          </button>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/organizations/${organization.id}/edit`
                )
              }
              style={secondaryButtonStyle}
            >
              Edit Organization
            </button>

            {canManageOrganization &&
              (isArchived ? (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    updateOrganizationStatus(
                      "active"
                    )
                  }
                  style={{
                    ...restoreButtonStyle,
                    opacity: isUpdatingStatus
                      ? 0.65
                      : 1,
                    cursor: isUpdatingStatus
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isUpdatingStatus
                    ? "Restoring..."
                    : "Restore Organization"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    updateOrganizationStatus(
                      "archived"
                    )
                  }
                  style={{
                    ...dangerButtonStyle,
                    opacity: isUpdatingStatus
                      ? 0.65
                      : 1,
                    cursor: isUpdatingStatus
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isUpdatingStatus
                    ? "Archiving..."
                    : "Archive Organization"}
                </button>
              ))}
          </div>
        </div>
      </section>
    </main>
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
    <div>
      <p
        style={{
          marginTop: 0,
          marginBottom: "7px",
          color: "#64748b",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          color: "#0f172a",
          fontSize: "16px",
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function getStatusStyle(status: string) {
  if (status === "active") {
    return {
      backgroundColor: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "archived") {
    return {
      backgroundColor: "#e2e8f0",
      color: "#475569",
    };
  }

  if (status === "suspended") {
    return {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  };
}

const messageBoxStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
  color: "#64748b",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 700,
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #dc2626",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#dc2626",
  cursor: "pointer",
  fontWeight: 700,
};

const restoreButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #16a34a",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#15803d",
  cursor: "pointer",
  fontWeight: 700,
};