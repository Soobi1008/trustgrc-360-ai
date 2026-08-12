"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  clearAuthentication,
} from "../../lib/auth";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";


type ApiError = {
  detail?: string;
};


type ChallengeType =
  | "arithmetic"
  | "number_pattern"
  | "letter_pattern"
  | "shape_pattern"
  | "odd_one_out";


type HumanChallengeResponse = {
  challenge_id: string;
  challenge_type: ChallengeType;
  question: string;
  options: string[];
  expires_in_seconds: number;
};


type RegistrationResponse = {
  status: string;
  message: string;
  organization_id: number;
  user_id: number;
};


type PasswordRequirement = {
  label: string;
  valid: boolean;
};


const blockedPersonalDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "yandex.com",
]);


const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "throwawaymail.com",
]);


const commonPasswordWords = [
  "password",
  "welcome",
  "admin",
  "administrator",
  "company",
  "trustgrc",
  "qwerty",
  "letmein",
  "login",
  "changeme",
  "secret",
  "default",
];


export default function RegisterPage() {
  const router = useRouter();

  const [
    organisationName,
    setOrganisationName,
  ] = useState("");

  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    humanAnswer,
    setHumanAnswer,
  ] = useState("");

  const [
    acceptTerms,
    setAcceptTerms,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    challenge,
    setChallenge,
  ] =
    useState<HumanChallengeResponse | null>(
      null
    );

  const [
    challengeLoading,
    setChallengeLoading,
  ] = useState(false);

  const [
    challengeError,
    setChallengeError,
  ] = useState("");


  /*
   * ---------------------------------------------------------
   * EMAIL VALIDATION
   * ---------------------------------------------------------
   */

  const emailStatus = useMemo(() => {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      return {
        valid: false,
        message: "",
      };
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        normalizedEmail
      )
    ) {
      return {
        valid: false,
        message:
          "Enter a valid company email address, for example name@company.com.",
      };
    }

    const parts =
      normalizedEmail.split("@");

    if (parts.length !== 2) {
      return {
        valid: false,
        message:
          "Enter a valid company email address.",
      };
    }

    const domain = parts[1];

    if (!domain) {
      return {
        valid: false,
        message:
          "Enter a valid company email address.",
      };
    }

    if (
      blockedPersonalDomains.has(
        domain
      )
    ) {
      return {
        valid: false,
        message:
          "Please use your organisation or company email address. Personal email domains are not accepted.",
      };
    }

    if (
      disposableDomains.has(
        domain
      )
    ) {
      return {
        valid: false,
        message:
          "Temporary or disposable email addresses are not accepted.",
      };
    }

    return {
      valid: true,
      message:
        "Business email format accepted. Domain ownership will be verified during registration.",
    };
  }, [email]);


  /*
   * ---------------------------------------------------------
   * PASSWORD POLICY
   * ---------------------------------------------------------
   */

  const passwordRequirements =
    useMemo<
      PasswordRequirement[]
    >(() => {
      const lowercasePassword =
        password.toLowerCase();

      const normalizedPassword =
        lowercasePassword.replace(
          /[^a-z0-9]/g,
          ""
        );

      const normalizedFirstName =
        firstName
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );

      const normalizedLastName =
        lastName
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );

      const normalizedOrganisation =
        organisationName
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );

      const emailUsername =
        email.includes("@")
          ? email
              .split("@")[0]
              .toLowerCase()
              .replace(
                /[^a-z0-9]/g,
                ""
              )
          : "";

      const containsPersonalInfo =
        [
          normalizedFirstName,
          normalizedLastName,
          normalizedOrganisation,
          emailUsername,
        ].some(
          (value) =>
            value.length >= 3 &&
            normalizedPassword.includes(
              value
            )
        );

      const containsCommonWord =
        commonPasswordWords.some(
          (word) =>
            lowercasePassword.includes(
              word
            )
        );

      return [
        {
          label:
            "12 or more characters",
          valid:
            password.length >= 12,
        },
        {
          label:
            "At least one uppercase letter",
          valid:
            /[A-Z]/.test(password),
        },
        {
          label:
            "At least one lowercase letter",
          valid:
            /[a-z]/.test(password),
        },
        {
          label:
            "At least one number",
          valid:
            /\d/.test(password),
        },
        {
          label:
            "At least one special character",
          valid:
            /[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/.test(
              password
            ),
        },
        {
          label:
            "Does not contain your name, email identifier or organisation name",
          valid:
            password.length > 0 &&
            !containsPersonalInfo,
        },
        {
          label:
            "Does not contain a common or prohibited password word",
          valid:
            password.length > 0 &&
            !containsCommonWord,
        },
      ];
    }, [
      password,
      firstName,
      lastName,
      organisationName,
      email,
    ]);


  const passwordPolicyPassed =
    passwordRequirements.every(
      (requirement) =>
        requirement.valid
    );


  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;


  /*
   * ---------------------------------------------------------
   * HUMAN VERIFICATION
   * ---------------------------------------------------------
   */

  const loadHumanChallenge =
    useCallback(async () => {
      if (!API_URL) {
        setChallengeError(
          "NEXT_PUBLIC_API_URL is not configured."
        );
        return;
      }

      try {
        setChallengeLoading(true);
        setChallengeError("");
        setHumanAnswer("");
        setChallenge(null);

        const response =
          await fetch(
            `${API_URL}/api/v1/auth/human-challenge`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              cache: "no-store",
            }
          );

        let data:
          | HumanChallengeResponse
          | ApiError = {};

        try {
          data =
            (await response.json()) as
              | HumanChallengeResponse
              | ApiError;
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            "detail" in data &&
            data.detail
              ? data.detail
              : "Unable to load human verification."
          );
        }

        setChallenge(
          data as HumanChallengeResponse
        );
      } catch (error) {
        if (
          error instanceof TypeError
        ) {
          setChallengeError(
            "The TrustGRC verification service is temporarily unavailable."
          );
        } else if (
          error instanceof Error
        ) {
          setChallengeError(
            error.message
          );
        } else {
          setChallengeError(
            "Unable to load human verification."
          );
        }
      } finally {
        setChallengeLoading(false);
      }
    }, []);


  useEffect(() => {
    void loadHumanChallenge();
  }, [loadHumanChallenge]);


  function clearSensitiveFields() {
    setPassword("");
    setConfirmPassword("");
    setHumanAnswer("");
  }


  async function resetAfterFailure() {
    clearSensitiveFields();

    await loadHumanChallenge();
  }


  /*
   * ---------------------------------------------------------
   * REGISTRATION
   * ---------------------------------------------------------
   */

  async function handleRegistration(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");


    /*
     * Missing ordinary fields:
     * preserve password and CAPTCHA because this is
     * not yet considered a security-sensitive failure.
     */

    if (
      !organisationName.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );
      return;
    }


    /*
     * Invalid email:
     * clear sensitive fields and issue a new challenge.
     */

    if (!emailStatus.valid) {
      setErrorMessage(
        emailStatus.message ||
          "Please provide a valid company email address."
      );

      await resetAfterFailure();

      return;
    }


    /*
     * Password policy failure.
     */

    if (!passwordPolicyPassed) {
      setErrorMessage(
        "The password does not meet the TrustGRC AI 360 security requirements."
      );

      await resetAfterFailure();

      return;
    }


    /*
     * Password mismatch.
     */

    if (!passwordsMatch) {
      setErrorMessage(
        "The passwords do not match."
      );

      await resetAfterFailure();

      return;
    }


    /*
     * Human verification must exist.
     */

    if (!challenge) {
      setErrorMessage(
        "Human verification is not available. Please request a new challenge."
      );
      return;
    }


    if (!humanAnswer.trim()) {
      setErrorMessage(
        "Please complete the human verification challenge."
      );
      return;
    }


    /*
     * Terms.
     */

    if (!acceptTerms) {
      setErrorMessage(
        "Please accept the Terms of Service and Privacy Notice."
      );
      return;
    }


    if (!API_URL) {
      setErrorMessage(
        "NEXT_PUBLIC_API_URL is not configured."
      );

      await resetAfterFailure();

      return;
    }


    try {
      setIsSubmitting(true);

      const response =
        await fetch(
          `${API_URL}/api/v1/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              organisation_name:
                organisationName.trim(),

              first_name:
                firstName.trim(),

              last_name:
                lastName.trim(),

              email: email
                .trim()
                .toLowerCase(),

              password,

              challenge_id:
                challenge.challenge_id,

              human_answer:
                humanAnswer.trim(),
            }),
          }
        );


      let data:
        | RegistrationResponse
        | ApiError = {};


      try {
        data =
          (await response.json()) as
            | RegistrationResponse
            | ApiError;
      } catch {
        data = {};
      }


      if (!response.ok) {
        const detail =
          "detail" in data &&
          data.detail
            ? data.detail
            : "Unable to create the account.";

        const normalizedDetail =
          detail.toLowerCase();


        /*
         * Duplicate email.
         */

        if (
          normalizedDetail.includes(
            "already exists"
          ) &&
          normalizedDetail.includes(
            "email"
          )
        ) {
          throw new Error(
            "An account already exists for this email address. Please sign in or use password recovery."
          );
        }


        /*
         * Existing organisation/domain.
         */

        if (
          normalizedDetail.includes(
            "organisation already"
          ) ||
          normalizedDetail.includes(
            "organization already"
          ) ||
          normalizedDetail.includes(
            "email domain"
          )
        ) {
          throw new Error(
            "An organisation using this email domain already exists in TrustGRC AI 360. Please sign in or request access from your organisation administrator."
          );
        }


        /*
         * Human verification / CAPTCHA errors.
         */

        if (
          normalizedDetail.includes(
            "human verification"
          ) ||
          normalizedDetail.includes(
            "challenge"
          )
        ) {
          throw new Error(
            detail
          );
        }


        /*
         * Password policy and other backend errors.
         */

        throw new Error(
          detail
        );
      }


      /*
       * Successful registration.
       */

      setSuccessMessage(
        "Organisation account created successfully. Please sign in with your new account."
      );


      /*
       * Remove any previous authenticated user/session.
       * This prevents another organisation's stored
       * session from automatically bypassing login.
       */

      clearAuthentication();


      setOrganisationName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setHumanAnswer("");
      setAcceptTerms(false);
      setChallenge(null);


      setTimeout(() => {
        router.replace("/login");
      }, 2200);

    } catch (error) {
      let message =
        "Unable to create the account.";


      if (
        error instanceof TypeError
      ) {
        message =
          "The TrustGRC registration service is temporarily unavailable. Please try again.";
      } else if (
        error instanceof Error
      ) {
        message =
          error.message;
      }


      setErrorMessage(
        message
      );


      /*
       * Any backend registration failure:
       * clear passwords and fetch a fresh
       * human-verification challenge.
       */

      await resetAfterFailure();

    } finally {
      setIsSubmitting(false);
    }
  }


  const challengeUsesOptions =
    Boolean(
      challenge &&
        challenge.options.length > 0
    );


  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 1.05fr) minmax(460px, 0.95fr)",
        backgroundColor:
          "#f8fafc",
      }}
    >
      {/* =====================================================
          LEFT SECURITY PANEL
          ===================================================== */}

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent:
            "center",
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
            letterSpacing:
              "0.08em",
          }}
        >
          TRUSTGRC AI 360
        </p>


        <h1
          style={{
            maxWidth: "650px",
            marginTop: "22px",
            marginBottom:
              "18px",
            fontSize: "46px",
            lineHeight: 1.15,
          }}
        >
          Establish a secure
          foundation for trustworthy
          AI governance
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
          Register your organisation
          using a verified work email
          to access AI governance,
          regulatory intelligence,
          risk assessment and
          compliance capabilities.
        </p>


        <div
          style={{
            marginTop: "36px",
            display: "grid",
            gap: "14px",
            maxWidth: "520px",
          }}
        >
          <SecurityPoint
            text="Business email validation"
          />

          <SecurityPoint
            text="Human verification"
          />

          <SecurityPoint
            text="Email ownership verification"
          />

          <SecurityPoint
            text="Organisation-domain verification"
          />

          <SecurityPoint
            text="MFA-ready authentication"
          />
        </div>
      </section>


      {/* =====================================================
          REGISTRATION FORM
          ===================================================== */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          padding: "40px",
        }}
      >
        <form
          onSubmit={
            handleRegistration
          }
          autoComplete="off"
          style={{
            width: "100%",
            maxWidth: "560px",
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
              marginBottom:
                "8px",
              fontSize: "30px",
              color: "#0f172a",
            }}
          >
            Create organisation
            account
          </h2>


          <p
            style={{
              marginTop: 0,
              marginBottom:
                "24px",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Use your
            organisation&apos;s
            official email address.
          </p>


          {errorMessage && (
            <MessageBox
              tone="error"
              message={
                errorMessage
              }
            />
          )}


          {successMessage && (
            <MessageBox
              tone="success"
              message={
                successMessage
              }
            />
          )}


          {/* ORGANISATION */}

          <label
            style={labelStyle}
          >
            Organisation / Company
            name

            <input
              type="text"
              required
              value={
                organisationName
              }
              onChange={(event) =>
                setOrganisationName(
                  event.target
                    .value
                )
              }
              placeholder="Example Healthcare Ltd"
              style={
                inputStyle
              }
            />
          </label>


          {/* FIRST / LAST NAME */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "14px",
              marginTop: "18px",
            }}
          >
            <label
              style={labelStyle}
            >
              First name

              <input
                type="text"
                required
                autoComplete="off"
                value={
                  firstName
                }
                onChange={(event) =>
                  setFirstName(
                    event.target
                      .value
                  )
                }
                placeholder="First name"
                style={
                  inputStyle
                }
              />
            </label>


            <label
              style={labelStyle}
            >
              Last name

              <input
                type="text"
                required
                autoComplete="off"
                value={
                  lastName
                }
                onChange={(event) =>
                  setLastName(
                    event.target
                      .value
                  )
                }
                placeholder="Last name"
                style={
                  inputStyle
                }
              />
            </label>
          </div>


          {/* EMAIL */}

          <label
            style={{
              ...labelStyle,
              marginTop: "18px",
            }}
          >
            Work email address

            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="name@company.com"
              style={{
                ...inputStyle,

                borderColor:
                  email &&
                  emailStatus.valid
                    ? "#86efac"
                    : email &&
                        !emailStatus.valid
                      ? "#fca5a5"
                      : "#cbd5e1",
              }}
            />


            {emailStatus.message && (
              <span
                style={{
                  marginTop: "-2px",
                  color:
                    emailStatus.valid
                      ? "#15803d"
                      : "#b91c1c",
                  fontSize:
                    "12px",
                  fontWeight:
                    500,
                  lineHeight: 1.5,
                }}
              >
                {emailStatus.valid
                  ? "✓ "
                  : ""}

                {
                  emailStatus.message
                }
              </span>
            )}
          </label>


          {/* PASSWORD */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "14px",
              marginTop: "18px",
            }}
          >
            <label
              style={labelStyle}
            >
              Password

              <input
                type="password"
                required
                autoComplete=
                  "new-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                placeholder="Create a strong password"
                style={
                  inputStyle
                }
              />
            </label>


            <label
              style={labelStyle}
            >
              Confirm password

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
                    event.target
                      .value
                  )
                }
                placeholder="Repeat password"
                style={{
                  ...inputStyle,

                  borderColor:
                    confirmPassword
                      ? passwordsMatch
                        ? "#86efac"
                        : "#fca5a5"
                      : "#cbd5e1",
                }}
              />
            </label>
          </div>


          {/* PASSWORD REQUIREMENTS */}

          {password && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px",
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
                  gap: "6px",
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


              {confirmPassword && (
                <PasswordRule
                  label="Passwords match"
                  valid={
                    passwordsMatch
                  }
                />
              )}
            </div>
          )}


          {/* HUMAN VERIFICATION */}

          <div
            style={{
              marginTop: "22px",
              padding: "16px",
              border:
                "1px solid #c7d2fe",
              borderRadius:
                "11px",
              backgroundColor:
                "#f8faff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap: "14px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "12px",
                    fontWeight:
                      800,
                    color:
                      "#4338ca",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.05em",
                  }}
                >
                  Human Verification
                </div>


                <p
                  style={{
                    margin:
                      "7px 0 0",
                    color:
                      "#334155",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.6,
                    fontWeight:
                      600,
                  }}
                >
                  {challengeLoading
                    ? "Loading verification challenge..."
                    : challenge
                        ?.question ??
                      "Verification challenge unavailable."}
                </p>


                {challenge && (
                  <div
                    style={{
                      marginTop:
                        "6px",
                      color:
                        "#64748b",
                      fontSize:
                        "10px",
                    }}
                  >
                    Challenge type:{" "}

                    {formatChallengeType(
                      challenge.challenge_type
                    )}

                    {" • "}

                    expires in{" "}

                    {Math.round(
                      challenge.expires_in_seconds /
                        60
                    )}{" "}

                    minutes
                  </div>
                )}
              </div>


              <button
                type="button"
                onClick={() =>
                  void loadHumanChallenge()
                }
                disabled={
                  challengeLoading
                }
                style={{
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "8px",
                  padding:
                    "7px 10px",
                  backgroundColor:
                    "#ffffff",
                  color:
                    "#475569",
                  fontSize:
                    "11px",
                  fontWeight:
                    700,
                  cursor:
                    challengeLoading
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    challengeLoading
                      ? 0.6
                      : 1,
                  whiteSpace:
                    "nowrap",
                }}
              >
                {challengeLoading
                  ? "Loading..."
                  : "New challenge"}
              </button>
            </div>


            {challengeError && (
              <div
                style={{
                  marginTop:
                    "12px",
                  padding:
                    "10px 12px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid #fecaca",
                  backgroundColor:
                    "#fef2f2",
                  color:
                    "#991b1b",
                  fontSize:
                    "12px",
                  lineHeight:
                    1.5,
                }}
              >
                {
                  challengeError
                }
              </div>
            )}


            {/* CLICKABLE CAPTCHA OPTIONS */}

            {challengeUsesOptions &&
              challenge && (
                <div
                  style={{
                    marginTop:
                      "14px",
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "9px",
                  }}
                >
                  {challenge.options.map(
                    (option) => {
                      const selected =
                        humanAnswer ===
                        option;

                      return (
                        <button
                          key={
                            option
                          }
                          type="button"
                          onClick={() =>
                            setHumanAnswer(
                              option
                            )
                          }
                          style={{
                            padding:
                              "11px 12px",
                            borderRadius:
                              "9px",

                            border:
                              selected
                                ? "1px solid #4f46e5"
                                : "1px solid #cbd5e1",

                            backgroundColor:
                              selected
                                ? "#eef2ff"
                                : "#ffffff",

                            color:
                              selected
                                ? "#3730a3"
                                : "#334155",

                            fontSize:
                              challenge.challenge_type ===
                              "shape_pattern"
                                ? "22px"
                                : "12px",

                            fontWeight:
                              700,

                            cursor:
                              "pointer",
                          }}
                        >
                          {selected
                            ? "✓ "
                            : ""}

                          {option}
                        </button>
                      );
                    }
                  )}
                </div>
              )}


            {/* TEXT CAPTCHA ANSWER */}

            {!challengeUsesOptions &&
              challenge && (
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={
                    humanAnswer
                  }
                  onChange={(event) =>
                    setHumanAnswer(
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter your answer"
                  style={{
                    ...inputStyle,
                    marginTop:
                      "13px",
                  }}
                />
              )}
          </div>


          {/* TERMS */}

          <label
            style={{
              display: "flex",
              alignItems:
                "flex-start",
              gap: "9px",
              marginTop: "18px",
              color: "#475569",
              fontSize: "13px",
              lineHeight: 1.55,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={
                acceptTerms
              }
              onChange={(event) =>
                setAcceptTerms(
                  event.target
                    .checked
                )
              }
              style={{
                marginTop: "3px",
                width: "15px",
                height: "15px",
                accentColor:
                  "#2563eb",
              }}
            />


            <span>
              I agree to the
              TrustGRC AI 360 Terms
              of Service and Privacy
              Notice.
            </span>
          </label>


          {/* CREATE ACCOUNT */}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              challengeLoading ||
              challenge === null
            }
            style={{
              width: "100%",
              marginTop: "24px",
              padding:
                "12px 18px",
              border: "none",
              borderRadius:
                "9px",

              backgroundColor:
                isSubmitting ||
                challengeLoading ||
                challenge === null
                  ? "#94a3b8"
                  : "#2563eb",

              color: "#ffffff",

              cursor:
                isSubmitting ||
                challengeLoading ||
                challenge === null
                  ? "not-allowed"
                  : "pointer",

              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create organisation account"}
          </button>


          {/* SIGN IN */}

          <div
            style={{
              marginTop: "20px",
              paddingTop:
                "18px",
              borderTop:
                "1px solid #e2e8f0",
              textAlign:
                "center",
              color: "#64748b",
              fontSize:
                "13px",
            }}
          >
            Already have an
            account?{" "}

            <Link
              href="/login"
              style={{
                color:
                  "#2563eb",
                fontWeight:
                  700,
                textDecoration:
                  "none",
              }}
            >
              Sign in
            </Link>
          </div>
        </form>
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
        display: "flex",
        alignItems: "center",
        gap: "7px",
        color: valid
          ? "#15803d"
          : "#64748b",
        fontSize: "11px",
        lineHeight: 1.45,
      }}
    >
      <span
        style={{
          width: "16px",
          height: "16px",
          flexShrink: 0,
          display: "grid",
          placeItems:
            "center",
          borderRadius:
            "50%",
          border: valid
            ? "1px solid #86efac"
            : "1px solid #cbd5e1",
          backgroundColor:
            valid
              ? "#f0fdf4"
              : "#ffffff",
          color: valid
            ? "#15803d"
            : "#94a3b8",
          fontSize: "9px",
          fontWeight: 800,
        }}
      >
        {valid ? "✓" : "•"}
      </span>

      {label}
    </div>
  );
}


function formatChallengeType(
  type: ChallengeType
) {
  switch (type) {
    case "arithmetic":
      return "Arithmetic";

    case "number_pattern":
      return "Number Pattern";

    case "letter_pattern":
      return "Letter Pattern";

    case "shape_pattern":
      return "Shape Pattern";

    case "odd_one_out":
      return "Odd One Out";

    default:
      return "Human Verification";
  }
}


function SecurityPoint({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        color: "#dbeafe",
        fontSize: "14px",
      }}
    >
      <span
        style={{
          width: "24px",
          height: "24px",
          borderRadius:
            "50%",
          display: "grid",
          placeItems:
            "center",
          backgroundColor:
            "rgba(255,255,255,0.12)",
          fontWeight: 800,
        }}
      >
        ✓
      </span>

      {text}
    </div>
  );
}


function MessageBox({
  message,
  tone,
}: {
  message: string;
  tone:
    | "error"
    | "success";
}) {
  const error =
    tone === "error";

  return (
    <div
      style={{
        marginBottom:
          "18px",
        padding:
          "12px 14px",

        border: error
          ? "1px solid #fecaca"
          : "1px solid #bbf7d0",

        borderRadius:
          "8px",

        backgroundColor:
          error
            ? "#fef2f2"
            : "#f0fdf4",

        color: error
          ? "#991b1b"
          : "#166534",

        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}


const labelStyle:
  React.CSSProperties = {
    display: "flex",
    flexDirection:
      "column",
    gap: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
  };


const inputStyle:
  React.CSSProperties = {
    width: "100%",
    boxSizing:
      "border-box",
    padding:
      "11px 12px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor:
      "#ffffff",
    color: "#0f172a",
    fontSize: "15px",
    outline: "none",
  };