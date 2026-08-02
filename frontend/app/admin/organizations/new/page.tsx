"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

type OrganizationForm = {
  name: string;
  legal_name: string;
  industry: string;
  country: string;
  organization_size: string;
  contact_email: string;
};

type ApiError = {
  detail?: string;
};

const initialForm: OrganizationForm = {
  name: "",
  legal_name: "",
  industry: "",
  country: "",
  organization_size: "",
  contact_email: "",
};

export default function NewOrganizationPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<OrganizationForm>(initialForm);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  function updateField(
    field: keyof OrganizationForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setErrorMessage(
        "Organization name is required."
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

      const response = await fetch(
        `${API_URL}/api/v1/organizations`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            legal_name:
              form.legal_name.trim() || null,
            industry:
              form.industry.trim() || null,
            country:
              form.country.trim() || null,
            organization_size:
              form.organization_size.trim() || null,
            contact_email:
              form.contact_email.trim() || null,
          }),
        }
      );

      const responseData =
        (await response.json()) as
          | Record<string, unknown>
          | ApiError;

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to create organizations."
        );
      }

      if (!response.ok) {
        throw new Error(
          "detail" in responseData &&
            typeof responseData.detail === "string"
            ? responseData.detail
            : "The organization could not be created."
        );
      }

      setSuccessMessage(
        "Organization created successfully."
      );

      setForm(initialForm);

      setTimeout(() => {
        router.push("/admin/organizations");
        router.refresh();
      }, 800);
    } catch (error) {
      console.error(
        "Error creating organization:",
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
          Add Organization
        </h1>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Register a new customer organization and create
          its tenant record.
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
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              marginBottom: "20px",
              padding: "13px 15px",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              backgroundColor: "#f0fdf4",
              color: "#166534",
            }}
          >
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
            Organization Name *
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
              placeholder="Example: Demo AI Ltd"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Legal Name
            <input
              type="text"
              value={form.legal_name}
              onChange={(event) =>
                updateField(
                  "legal_name",
                  event.target.value
                )
              }
              placeholder="Registered legal name"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Industry
            <input
              type="text"
              value={form.industry}
              onChange={(event) =>
                updateField(
                  "industry",
                  event.target.value
                )
              }
              placeholder="Example: Technology"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Country
            <input
              type="text"
              value={form.country}
              onChange={(event) =>
                updateField(
                  "country",
                  event.target.value
                )
              }
              placeholder="Example: Germany"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Organization Size
            <select
              value={form.organization_size}
              onChange={(event) =>
                updateField(
                  "organization_size",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                Select organization size
              </option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">
                51-200
              </option>
              <option value="201-500">
                201-500
              </option>
              <option value="501-1000">
                501-1000
              </option>
              <option value="1000+">
                1000+
              </option>
            </select>
          </label>

          <label style={labelStyle}>
            Contact Email
            <input
              type="email"
              value={form.contact_email}
              onChange={(event) =>
                updateField(
                  "contact_email",
                  event.target.value
                )
              }
              placeholder="contact@example.com"
              style={inputStyle}
            />
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
            onClick={() =>
              router.push("/admin/organizations")
            }
            disabled={isSubmitting}
            style={{
              padding: "10px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              color: "#334155",
              cursor: isSubmitting
                ? "not-allowed"
                : "pointer",
              fontWeight: 700,
            }}
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
              ? "Creating..."
              : "Create Organization"}
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