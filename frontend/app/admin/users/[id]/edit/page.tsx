"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type Organization = {
  id: number;
  name: string;
  status: string;
};

type UserForm = {
  email: string;
  full_name: string;
  password: string;
  role: string;
  organization_id: string;
  is_active: boolean;
};

type UserResponse = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
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
  email: "",
  full_name: "",
  password: "",
  role: "executive_viewer",
  organization_id: "",
  is_active: true,
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const userId = params.id;

  const [form, setForm] =
    useState<UserForm>(initialForm);

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const isPlatformRole = platformRoles.some(
    (role) => role.value === form.role
  );

  useEffect(() => {
    async function loadPageData() {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [userResponse, organizationsResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/v1/admin/users/${userId}`,
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
          userResponse.status === 401 ||
          organizationsResponse.status === 401
        ) {
          clearAuthentication();
          router.replace("/login");
          return;
        }

        const userData =
          (await userResponse.json()) as
            | UserResponse
            | ApiError;

        const organizationsData =
          (await organizationsResponse.json()) as
            | Organization[]
            | ApiError;

        if (!userResponse.ok) {
          throw new Error(
            "detail" in userData &&
              typeof userData.detail === "string"
              ? userData.detail
              : "The user could not be loaded."
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

        const user = userData as UserResponse;

        setForm({
          email: user.email,
          full_name: user.full_name,
          password: "",
          role: user.role,
          organization_id:
            user.organization_id === null
              ? ""
              : String(user.organization_id),
          is_active: user.is_active,
        });

        setOrganizations(
          (organizationsData as Organization[]).filter(
            (organization) =>
              organization.status
                .toLowerCase()
                .trim() === "active"
          )
        );
      } catch (error) {
        console.error(
          "Error loading edit-user page:",
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

    loadPageData();
  }, [router, userId]);

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
      setSuccessMessage("");

      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        role: form.role,
        organization_id: isPlatformRole
          ? null
          : Number(form.organization_id),
        is_active: form.is_active,
      };

      if (form.password.trim()) {
        payload.password =
          form.password.trim();
      }

      const response = await fetch(
        `${API_URL}/api/v1/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData =
        (await response.json()) as
          | UserResponse
          | ApiError;

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to update this user."
        );
      }

      if (!response.ok) {
        throw new Error(
          "detail" in responseData &&
            typeof responseData.detail === "string"
            ? responseData.detail
            : "The user could not be updated."
        );
      }

      setSuccessMessage(
        "User updated successfully."
      );

      setTimeout(() => {
        router.push(`/admin/users/${userId}`);
        router.refresh();
      }, 700);
    } catch (error) {
      console.error(
        "Error updating user:",
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
        Loading user...
      </div>
    );
  }

  if (errorMessage && !form.email) {
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
          {errorMessage}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/users")
          }
          style={{
            ...secondaryButtonStyle,
            marginTop: "18px",
          }}
        >
          Back to Users
        </button>
      </main>
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
          Edit User
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Update the user profile, role,
          organization assignment and status.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "920px",
          padding: "26px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 8px 24px rgba(15, 23, 42, 0.05)",
        }}
      >
        {errorMessage && (
          <div style={errorBoxStyle}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={successBoxStyle}>
            {successMessage}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "20px",
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
                  ? "#f1f5f9"
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
            New Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                updateField(
                  "password",
                  event.target.value
                )
              }
              placeholder="Leave blank to keep current password"
              minLength={10}
              style={inputStyle}
            />
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
                  event.target.value ===
                    "active"
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
              router.push(
                `/admin/users/${userId}`
              )
            }
            style={secondaryButtonStyle}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: isSubmitting
                ? "#94a3b8"
                : "#2563eb",
              color: "#ffffff",
              cursor: isSubmitting
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
            }}
          >
            {isSubmitting
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
};

const messageBoxStyle: React.CSSProperties = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  backgroundColor: "#ffffff",
  color: "#64748b",
};

const errorBoxStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "13px 15px",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  backgroundColor: "#fef2f2",
  color: "#991b1b",
};

const successBoxStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "13px 15px",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  backgroundColor: "#f0fdf4",
  color: "#166534",
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