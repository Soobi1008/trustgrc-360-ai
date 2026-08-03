"use client";

import { FormEvent, useEffect, useState } from "react";
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

type UserForm = {
  full_name: string;
  email: string;
  password: string;
  role: string;
  organization_id: string;
  is_active: boolean;
};

type ApiError = {
  detail?: string;
};

const platformRoles = [
  {
    value: "super_admin",
    label: "Super Admin",
  },
  {
    value: "platform_admin",
    label: "Platform Admin",
  },
];

const companyRoles = [
  {
    value: "organization_admin",
    label: "Organization Admin",
  },
  {
    value: "compliance_officer",
    label: "Compliance Officer",
  },
  {
    value: "ai_governance_officer",
    label: "AI Governance Officer",
  },
  {
    value: "auditor",
    label: "Auditor",
  },
  {
    value: "executive_viewer",
    label: "Executive Viewer",
  },
];

const initialForm: UserForm = {
  full_name: "",
  email: "",
  password: "",
  role: "organization_admin",
  organization_id: "",
  is_active: true,
};

export default function CreateUserPage() {
  const router = useRouter();

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [form, setForm] =
    useState<UserForm>(initialForm);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const isPlatformRole = platformRoles.some(
    (role) => role.value === form.role
  );

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
            "detail" in responseData &&
              typeof responseData.detail === "string"
              ? responseData.detail
              : "Organizations could not be loaded."
          );
        }

        setOrganizations(
          (responseData as Organization[]).filter(
            (organization) =>
              organization.status
                .toLowerCase()
                .trim() === "active"
          )
        );
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
    field: keyof UserForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleRoleChange(role: string) {
    setForm((current) => ({
      ...current,
      role,
      organization_id: platformRoles.some(
        (item) => item.value === role
      )
        ? ""
        : current.organization_id,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.full_name.trim()) {
      setErrorMessage(
        "Full name is required."
      );
      return;
    }

    if (!form.email.trim()) {
      setErrorMessage(
        "Email address is required."
      );
      return;
    }

    if (form.password.length < 10) {
      setErrorMessage(
        "Password must contain at least 10 characters."
      );
      return;
    }

    if (
      !isPlatformRole &&
      !form.organization_id
    ) {
      setErrorMessage(
        "Company users must be assigned to an organization."
      );
      return;
    }

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
        `${API_URL}/api/v1/admin/users`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            organization_id: isPlatformRole
              ? null
              : Number(form.organization_id),
            is_active: form.is_active,
          }),
        }
      );

      const responseData =
        (await response.json()) as ApiError;

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to create users."
        );
      }

      if (!response.ok) {
        throw new Error(
          typeof responseData.detail === "string"
            ? responseData.detail
            : "The user could not be created."
        );
      }

      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error(
        "Error creating user:",
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
      <header
        style={{
          marginBottom: "28px",
        }}
      >
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
          Create User
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Create a platform administrator or assign a user
          to a customer organization.
        </p>
      </header>

      <section
        style={{
          maxWidth: "980px",
          overflow: "hidden",
          border: "1px solid #bfdbfe",
          borderRadius: "14px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 12px 30px rgba(37, 99, 235, 0.10)",
        }}
      >
        <div
          style={{
            padding: "20px 26px",
            background:
              "linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)",
            color: "#ffffff",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            User onboarding
          </p>

          <h2
            style={{
              marginTop: "7px",
              marginBottom: "6px",
              fontSize: "24px",
            }}
          >
            New account details
          </h2>

          <p
            style={{
              margin: 0,
              maxWidth: "700px",
              lineHeight: 1.6,
              opacity: 0.9,
            }}
          >
            Assign the correct role and organization so the
            user receives only the permissions required for
            their responsibilities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: "28px",
          }}
        >
          {errorMessage && (
            <div style={errorBoxStyle}>
              {errorMessage}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "22px",
            }}
          >
            <label style={labelStyle}>
              Full Name *
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(event) =>
                  updateField(
                    "full_name",
                    event.target.value
                  )
                }
                placeholder="Example: Jane Smith"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Email Address *
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="name@example.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Role *
              <select
                value={form.role}
                onChange={(event) =>
                  handleRoleChange(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <optgroup label="Platform Roles">
                  {platformRoles.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Company Roles">
                  {companyRoles.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label style={labelStyle}>
              Organization
              <select
                value={form.organization_id}
                disabled={isPlatformRole}
                onChange={(event) =>
                  updateField(
                    "organization_id",
                    event.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  backgroundColor: isPlatformRole
                    ? "#eff6ff"
                    : "#ffffff",
                  cursor: isPlatformRole
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <option value="">
                  {isPlatformRole
                    ? "Platform user"
                    : "Select organization"}
                </option>

                {organizations.map(
                  (organization) => (
                    <option
                      key={organization.id}
                      value={organization.id}
                    >
                      {organization.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label style={labelStyle}>
              Temporary Password *
              <input
                type="password"
                required
                minLength={10}
                value={form.password}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Minimum 10 characters"
                style={inputStyle}
              />

              <span
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                The user should change this password after
                their first sign-in.
              </span>
            </label>

            <label style={labelStyle}>
              Account Status
              <select
                value={
                  form.is_active
                    ? "active"
                    : "inactive"
                }
                onChange={(event) =>
                  updateField(
                    "is_active",
                    event.target.value === "active"
                  )
                }
                style={inputStyle}
              >
                <option value="active">
                  Active
                </option>
                <option value="inactive">
                  Inactive
                </option>
              </select>
            </label>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
              color: "#1e3a8a",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <strong>Role guidance:</strong> Platform roles
            manage TrustGRC AI 360 itself and are not assigned
            to customer organizations. Company roles must be
            linked to one active organization.
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "28px",
              paddingTop: "22px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                router.push("/admin/users")
              }
              style={{
                ...secondaryButtonStyle,
                opacity: isSubmitting ? 0.65 : 1,
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
                padding: "11px 20px",
                border: "none",
                borderRadius: "8px",
                background: isSubmitting
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #1d4ed8, #2563eb)",
                color: "#ffffff",
                cursor: isSubmitting
                  ? "not-allowed"
                  : "pointer",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow: isSubmitting
                  ? "none"
                  : "0 8px 18px rgba(37, 99, 235, 0.22)",
              }}
            >
              {isSubmitting
                ? "Creating..."
                : "Create User"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: 700,
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 17px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontWeight: 700,
};