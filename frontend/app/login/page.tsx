"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type AuthUser,
  getStoredUser,
  isCompanyRole,
  isPlatformRole,
  saveAuthentication,
} from "../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type ApiError = {
  detail?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const existingUser = getStoredUser();

    if (existingUser) {
      redirectByRole(existingUser);
    }
  }, []);

  function redirectByRole(user: AuthUser) {
    if (isPlatformRole(user.role)) {
      router.replace("/admin/dashboard");
      return;
    }

    if (isCompanyRole(user.role)) {
      router.replace("/company/dashboard");
      return;
    }

    setErrorMessage(
      "Your account does not have a supported portal role."
    );
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage(
        "Please enter your email address and password."
      );
      return;
    }

    if (!API_URL) {
      setErrorMessage(
        "NEXT_PUBLIC_API_URL is not configured."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const formData = new URLSearchParams();
      formData.set(
        "username",
        email.trim().toLowerCase()
      );
      formData.set("password", password);

      const loginResponse = await fetch(
        `${API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const loginData =
        (await loginResponse.json()) as
          | TokenResponse
          | ApiError;

      if (!loginResponse.ok) {
        throw new Error(
          "detail" in loginData && loginData.detail
            ? loginData.detail
            : "Unable to sign in."
        );
      }

      const token =
        (loginData as TokenResponse).access_token;

      const currentUserResponse = await fetch(
        `${API_URL}/api/v1/auth/me`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const currentUserData =
        (await currentUserResponse.json()) as
          | AuthUser
          | ApiError;

      if (!currentUserResponse.ok) {
        throw new Error(
          "detail" in currentUserData &&
            currentUserData.detail
            ? currentUserData.detail
            : "Unable to retrieve the user account."
        );
      }

      const currentUser =
        currentUserData as AuthUser;

      saveAuthentication(token, currentUser);
      redirectByRole(currentUser);
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 1.1fr) minmax(420px, 0.9fr)",
        backgroundColor: "#f8fafc",
      }}
    >
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background:
            "linear-gradient(145deg, #0f172a, #1d4ed8)",
          color: "#ffffff",
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          TRUSTGRC AI 360
        </p>

        <h1
          style={{
            maxWidth: "620px",
            marginTop: "22px",
            marginBottom: "18px",
            fontSize: "46px",
            lineHeight: 1.15,
          }}
        >
          Build trustworthy AI through governance,
          risk and compliance
        </h1>

        <p
          style={{
            maxWidth: "620px",
            margin: 0,
            color: "#dbeafe",
            fontSize: "18px",
            lineHeight: 1.7,
          }}
        >
          Secure role-based access for TrustGRC
          platform administrators and customer
          organizations.
        </p>
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "34px",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            boxShadow:
              "0 18px 40px rgba(15, 23, 42, 0.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "30px",
              color: "#0f172a",
            }}
          >
            Sign in
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "24px",
              color: "#64748b",
            }}
          >
            Enter your TrustGRC AI 360 account
            details.
          </p>

          {errorMessage && (
            <div
              style={{
                marginBottom: "18px",
                padding: "12px 14px",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                color: "#991b1b",
              }}
            >
              {errorMessage}
            </div>
          )}

          <label style={labelStyle}>
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="name@example.com"
              style={inputStyle}
            />
          </label>

          <label
            style={{
              ...labelStyle,
              marginTop: "18px",
            }}
          >
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "12px 18px",
              border: "none",
              borderRadius: "9px",
              backgroundColor: isSubmitting
                ? "#94a3b8"
                : "#2563eb",
              color: "#ffffff",
              cursor: isSubmitting
                ? "not-allowed"
                : "pointer",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: "15px",
};