"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";

type ResetPasswordResponse = {
  status: string;
  message: string;
};

type ApiError = {
  detail?: unknown;
};

type PasswordRequirement = {
  label: string;
  valid: boolean;
};

function getApiErrorMessage(
  detail: unknown
): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }

        return "Invalid password-reset request.";
      })
      .join(" ");
  }

  return "Unable to reset the password.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token") ?? "";

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
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


  const passwordRequirements =
    useMemo<PasswordRequirement[]>(
      () => [
        {
          label:
            "12 or more characters",
          valid:
            newPassword.length >= 12,
        },
        {
          label:
            "At least one uppercase letter",
          valid:
            /[A-Z]/.test(
              newPassword
            ),
        },
        {
          label:
            "At least one lowercase letter",
          valid:
            /[a-z]/.test(
              newPassword
            ),
        },
        {
          label:
            "At least one number",
          valid:
            /\d/.test(
              newPassword
            ),
        },
        {
          label:
            "At least one special character",
          valid:
            /[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/.test(
              newPassword
            ),
        },
      ],
      [
        newPassword,
      ]
    );


  const passwordPolicyPassed =
    passwordRequirements.every(
      (
        requirement
      ) =>
        requirement.valid
    );


  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword ===
      confirmPassword;


  const passwordMismatch =
    confirmPassword.length > 0 &&
    newPassword !==
      confirmPassword;


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    if (!token) {
      setErrorMessage(
        "The password-reset link is invalid because no token was provided."
      );
      return;
    }


    if (!newPassword) {
      setErrorMessage(
        "Please enter a new password."
      );
      return;
    }


    if (!passwordPolicyPassed) {
      setErrorMessage(
        "The new password does not meet the TrustGRC AI 360 security requirements."
      );
      return;
    }


    if (!passwordsMatch) {
      setErrorMessage(
        "The new passwords do not match."
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

      const response =
        await fetch(
          `${API_URL}/api/v1/auth/reset-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                token,
                new_password:
                  newPassword,
                confirm_password:
                  confirmPassword,
              }),
          }
        );


      let data:
        | ResetPasswordResponse
        | ApiError = {};


      try {
        data =
          (await response.json()) as
            | ResetPasswordResponse
            | ApiError;
      } catch {
        data = {};
      }


      if (!response.ok) {
        throw new Error(
          "detail" in data
            ? getApiErrorMessage(
                data.detail
              )
            : "Unable to reset the password."
        );
      }


      const result =
        data as ResetPasswordResponse;


      setSuccessMessage(
        result.message
      );


      setNewPassword("");
      setConfirmPassword("");


      window.setTimeout(
        () => {
          router.replace(
            "/login"
          );
        },
        4000
      );

    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset the password."
      );

    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main
      style={{
        minHeight:
          "100vh",

        display:
          "grid",

        gridTemplateColumns:
          "minmax(0, 1.1fr) minmax(420px, 0.9fr)",

        backgroundColor:
          "#f8fafc",
      }}
    >
      {/* LEFT PANEL */}

      <section
        style={{
          display:
            "flex",

          flexDirection:
            "column",

          justifyContent:
            "center",

          padding:
            "64px",

          background:
            "linear-gradient(145deg, #0f172a, #1d4ed8)",

          color:
            "#ffffff",
        }}
      >
        <p
          style={{
            margin:
              0,

            fontWeight:
              700,

            letterSpacing:
              "0.08em",
          }}
        >
          TRUSTGRC AI 360
        </p>


        <h1
          style={{
            maxWidth:
              "620px",

            marginTop:
              "22px",

            marginBottom:
              "18px",

            fontSize:
              "46px",

            lineHeight:
              1.15,
          }}
        >
          Create a new secure password
        </h1>


        <p
          style={{
            maxWidth:
              "620px",

            margin:
              0,

            color:
              "#dbeafe",

            fontSize:
              "18px",

            lineHeight:
              1.7,
          }}
        >
          Choose a strong password to
          restore secure access to your
          TrustGRC AI 360 account.
        </p>
      </section>


      {/* RIGHT PANEL */}

      <section
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          padding:
            "40px",
        }}
      >
        <section
          style={{
            width:
              "100%",

            maxWidth:
              "440px",

            padding:
              "34px",

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
              marginTop:
                0,

              marginBottom:
                "8px",

              fontSize:
                "30px",

              color:
                "#0f172a",
            }}
          >
            Reset password
          </h2>


          <p
            style={{
              marginTop:
                0,

              marginBottom:
                "24px",

              color:
                "#64748b",

              lineHeight:
                1.6,
            }}
          >
            Enter and confirm your new
            TrustGRC AI 360 password.
          </p>


          {!token && (
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
              This password-reset link
              is invalid because no token
              was provided.
            </div>
          )}


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


          {successMessage ? (
            <>
              <div
                style={{
                  padding:
                    "16px",

                  border:
                    "1px solid #bbf7d0",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    "#f0fdf4",

                  color:
                    "#166534",

                  lineHeight:
                    1.6,
                }}
              >
                <strong>
                  ✓ Password reset successfully
                </strong>

                <div
                  style={{
                    marginTop:
                      "6px",
                  }}
                >
                  {successMessage}
                </div>
              </div>


              <p
                style={{
                  margin:
                    "18px 0 0",

                  color:
                    "#64748b",

                  fontSize:
                    "13px",

                  lineHeight:
                    1.6,
                }}
              >
                You will be redirected
                to the Sign In page in
                a few seconds.
              </p>


              <button
                type="button"

                onClick={() =>
                  router.replace(
                    "/login"
                  )
                }

                style={{
                  width:
                    "100%",

                  marginTop:
                    "22px",

                  padding:
                    "12px 18px",

                  border:
                    "none",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    "#2563eb",

                  color:
                    "#ffffff",

                  cursor:
                    "pointer",

                  fontWeight:
                    700,
                }}
              >
                Continue to Sign In
              </button>
            </>
          ) : (
            <form
              onSubmit={
                handleSubmit
              }
            >
              <label
                style={
                  labelStyle
                }
              >
                New password

                <input
                  type="password"
                  required

                  autoComplete=
                    "new-password"

                  value={
                    newPassword
                  }

                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }

                  placeholder=
                    "Enter a new password"

                  style={
                    inputStyle
                  }
                />
              </label>


              <label
                style={{
                  ...labelStyle,

                  marginTop:
                    "18px",
                }}
              >
                Confirm new password

                <input
                  type="password"
                  required

                  autoComplete=
                    "new-password"

                  value={
                    confirmPassword
                  }

                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }

                  placeholder=
                    "Repeat your new password"

                  style={{
                    ...inputStyle,

                    borderColor:
                      confirmPassword
                        ? passwordsMatch
                          ? "#86efac"
                          : "#ef4444"
                        : "#cbd5e1",
                  }}
                />


                {passwordMismatch && (
                  <span
                    style={{
                      marginTop:
                        "-2px",

                      color:
                        "#b91c1c",

                      fontSize:
                        "12px",

                      fontWeight:
                        700,

                      lineHeight:
                        1.5,
                    }}
                  >
                    Passwords do not match.
                  </span>
                )}


                {passwordsMatch && (
                  <span
                    style={{
                      marginTop:
                        "-2px",

                      color:
                        "#15803d",

                      fontSize:
                        "12px",

                      fontWeight:
                        600,
                    }}
                  >
                    ✓ Passwords match.
                  </span>
                )}
              </label>


              {newPassword && (
                <div
                  style={{
                    marginTop:
                      "14px",

                    padding:
                      "14px",

                    border:
                      "1px solid #e2e8f0",

                    borderRadius:
                      "10px",

                    backgroundColor:
                      "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      marginBottom:
                        "9px",

                      color:
                        "#334155",

                      fontSize:
                        "12px",

                      fontWeight:
                        800,

                      textTransform:
                        "uppercase",

                      letterSpacing:
                        "0.04em",
                    }}
                  >
                    Password security
                  </div>


                  <div
                    style={{
                      display:
                        "grid",

                      gap:
                        "6px",
                    }}
                  >
                    {passwordRequirements.map(
                      (
                        requirement
                      ) => (
                        <PasswordRule
                          key={
                            requirement.label
                          }

                          label={
                            requirement.label
                          }

                          valid={
                            requirement.valid
                          }
                        />
                      )
                    )}
                  </div>
                </div>
              )}


              <button
                type="submit"

                disabled={
                  isSubmitting ||
                  !token
                }

                style={{
                  width:
                    "100%",

                  marginTop:
                    "24px",

                  padding:
                    "12px 18px",

                  border:
                    "none",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    isSubmitting ||
                    !token
                      ? "#94a3b8"
                      : "#2563eb",

                  color:
                    "#ffffff",

                  cursor:
                    isSubmitting ||
                    !token
                      ? "not-allowed"
                      : "pointer",

                  fontSize:
                    "15px",

                  fontWeight:
                    700,
                }}
              >
                {isSubmitting
                  ? "Resetting password..."
                  : "Reset password"}
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


function PasswordRule({
  label,
  valid,
}: {
  label: string;
  valid: boolean;
}) {
  return (
    <div
      style={{
        display:
          "flex",

        alignItems:
          "center",

        gap:
          "7px",

        color:
          valid
            ? "#15803d"
            : "#64748b",

        fontSize:
          "11px",

        lineHeight:
          1.45,
      }}
    >
      <span
        style={{
          width:
            "16px",

          height:
            "16px",

          flexShrink:
            0,

          display:
            "grid",

          placeItems:
            "center",

          borderRadius:
            "50%",

          border:
            valid
              ? "1px solid #86efac"
              : "1px solid #cbd5e1",

          backgroundColor:
            valid
              ? "#f0fdf4"
              : "#ffffff",

          color:
            valid
              ? "#15803d"
              : "#94a3b8",

          fontSize:
            "9px",

          fontWeight:
            800,
        }}
      >
        {valid
          ? "✓"
          : "•"}
      </span>

      {label}
    </div>
  );
}


const labelStyle:
  React.CSSProperties = {
    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "8px",

    color:
      "#334155",

    fontSize:
      "14px",

    fontWeight:
      600,
  };


const inputStyle:
  React.CSSProperties = {
    width:
      "100%",

    boxSizing:
      "border-box",

    padding:
      "11px 12px",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "8px",

    backgroundColor:
      "#ffffff",

    color:
      "#0f172a",

    fontSize:
      "15px",
  };