"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";

type ForgotPasswordResponse = {
  status: string;
  message: string;
};

type ApiError = {
  detail?: string;
};

export default function ForgotPasswordPage() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Please enter your email address."
      );
      return;
    }

    if (!API_URL) {
      setErrorMessage(
        "The TrustGRC API is not configured."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await fetch(
          `${API_URL}/api/v1/auth/forgot-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
            }),
          }
        );

      let data:
        | ForgotPasswordResponse
        | ApiError = {};

      try {
        data =
          (await response.json()) as
            | ForgotPasswordResponse
            | ApiError;
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          "detail" in data &&
          data.detail
            ? data.detail
            : "Unable to process the password reset request."
        );
      }

      const result =
        data as ForgotPasswordResponse;

      setSuccessMessage(
        result.message ||
          "If an eligible account exists for this email address, a password-reset email has been sent."
      );

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to process the password reset request."
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

        backgroundColor:
          "#f8fafc",
      }}
    >
      {/* LEFT PANEL */}

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
          Secure account recovery
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
          Recover access to your TrustGRC AI 360
          account through your verified work
          email address.
        </p>
      </section>

      {/* RIGHT PANEL */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "34px",

            border:
              "1px solid #e2e8f0",

            borderRadius:
              "16px",

            backgroundColor:
              "#ffffff",

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
            Forgot password?
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "24px",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Enter the verified work email
            associated with your TrustGRC AI 360
            account.
          </p>

          {successMessage ? (
            <>
              <div
                style={{
                  padding: "16px",

                  border:
                    "1px solid #bbf7d0",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    "#f0fdf4",

                  color:
                    "#166534",

                  lineHeight: 1.6,
                }}
              >
                <strong>
                  Check your email
                </strong>

                <div
                  style={{
                    marginTop: "6px",
                  }}
                >
                  {successMessage}
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",

                  border:
                    "1px solid #fde68a",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    "#fffbeb",

                  color:
                    "#92400e",

                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                Please check your{" "}
                <strong>
                  Spam or Junk folder
                </strong>{" "}
                if you do not see the
                password-reset email in your
                inbox.
              </div>

              <Link
                href="/login"
                style={{
                  display: "block",

                  marginTop: "22px",

                  padding:
                    "12px 18px",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    "#2563eb",

                  color:
                    "#ffffff",

                  textAlign:
                    "center",

                  textDecoration:
                    "none",

                  fontSize:
                    "14px",

                  fontWeight:
                    700,
                }}
              >
                Return to Sign In
              </Link>
            </>
          ) : (
            <form
              onSubmit={
                handleSubmit
              }
            >
              {errorMessage && (
                <div
                  style={{
                    marginBottom:
                      "18px",

                    padding:
                      "12px 14px",

                    border:
                      "1px solid #fecaca",

                    borderRadius:
                      "8px",

                    backgroundColor:
                      "#fef2f2",

                    color:
                      "#991b1b",

                    lineHeight:
                      1.5,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <label
                style={
                  labelStyle
                }
              >
                Work email address

                <input
                  type="email"
                  required
                  autoComplete="email"

                  value={
                    email
                  }

                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }

                  placeholder=
                    "name@company.com"

                  style={
                    inputStyle
                  }
                />
              </label>

              <button
                type="submit"

                disabled={
                  isSubmitting
                }

                style={{
                  width: "100%",

                  marginTop:
                    "24px",

                  padding:
                    "12px 18px",

                  border: "none",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    isSubmitting
                      ? "#94a3b8"
                      : "#2563eb",

                  color:
                    "#ffffff",

                  cursor:
                    isSubmitting
                      ? "not-allowed"
                      : "pointer",

                  fontSize:
                    "15px",

                  fontWeight:
                    700,
                }}
              >
                {isSubmitting
                  ? "Sending..."
                  : "Send reset link"}
              </button>

              <div
                style={{
                  marginTop:
                    "20px",

                  textAlign:
                    "center",
                }}
              >
                <Link
                  href="/login"

                  style={{
                    color:
                      "#2563eb",

                    fontSize:
                      "13px",

                    fontWeight:
                      700,

                    textDecoration:
                      "none",
                  }}
                >
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}


const labelStyle:
  React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
  };


const inputStyle:
  React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor:
      "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
  };