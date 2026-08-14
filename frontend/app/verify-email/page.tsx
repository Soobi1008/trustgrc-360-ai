"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";


type VerifyEmailResponse = {
  status: string;
  message: string;
};


type ResendVerificationResponse = {
  status: string;
  message: string;
};


type ApiError = {
  detail?: unknown;
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

        return "Invalid verification request.";
      })
      .join(" ");
  }

  if (
    detail &&
    typeof detail === "object"
  ) {
    return (
      "The verification link is invalid "
      + "or could not be processed."
    );
  }

  return (
    "Unable to verify the email address."
  );
}


export default function VerifyEmailPage() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const verificationStarted =
    useRef(false);


  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    "Verifying your work email address..."
  );


  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);


  const [
    isComplete,
    setIsComplete,
  ] = useState(false);


  const [
    pendingEmail,
    setPendingEmail,
  ] = useState("");


  const [
    isResending,
    setIsResending,
  ] = useState(false);


  const [
    resendMessage,
    setResendMessage,
  ] = useState("");


  const [
    resendError,
    setResendError,
  ] = useState("");


  // =========================================================
  // LOAD PENDING EMAIL
  // =========================================================

  useEffect(() => {
    try {
      const storedEmail =
        window.sessionStorage.getItem(
          "trustgrc_pending_verification_email"
        );

      if (storedEmail) {
        setPendingEmail(
          storedEmail
        );
      }
    } catch {
      // sessionStorage may be unavailable
      // in some browser environments.
    }
  }, []);


  // =========================================================
  // VERIFY EMAIL TOKEN
  // =========================================================

  useEffect(() => {
    // Prevent duplicate token submission.
    if (
      verificationStarted.current
    ) {
      return;
    }

    verificationStarted.current =
      true;


    const token =
      searchParams.get("token");


    if (!token) {
      setStatusMessage(
        "The verification link is invalid because no token was provided."
      );

      setIsComplete(true);

      return;
    }


    if (!API_URL) {
      setStatusMessage(
        "The TrustGRC API is not configured."
      );

      setIsComplete(true);

      return;
    }


    async function verifyEmail() {
      try {
        const response =
          await fetch(
            `${API_URL}/api/v1/auth/verify-email`,
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
                }),
            }
          );


        let data:
          | VerifyEmailResponse
          | ApiError = {};


        try {
          data =
            (await response.json()) as
              | VerifyEmailResponse
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
              : (
                  "Unable to verify "
                  + "the email address."
                )
          );
        }


        const result =
          data as VerifyEmailResponse;


        setStatusMessage(
          result.message
        );


        setIsSuccess(true);

        setIsComplete(true);


        try {
          window.sessionStorage.removeItem(
            "trustgrc_pending_verification_email"
          );
        } catch {
          // Ignore storage errors.
        }


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
          "Email verification error:",
          error
        );


        setStatusMessage(
          error instanceof Error
            ? error.message
            : (
                "Unable to verify "
                + "the email address."
              )
        );


        setIsComplete(true);
      }
    }


    void verifyEmail();

  }, [
    router,
    searchParams,
  ]);


  // =========================================================
  // RESEND VERIFICATION EMAIL
  // =========================================================

  async function handleResendVerification() {
    if (!pendingEmail) {
      setResendError(
        "We could not determine which email address to resend the verification message to."
      );

      return;
    }


    if (!API_URL) {
      setResendError(
        "The TrustGRC API is not configured."
      );

      return;
    }


    try {
      setIsResending(true);

      setResendMessage("");

      setResendError("");


      const response =
        await fetch(
          `${API_URL}/api/v1/auth/resend-verification`,
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
                email:
                  pendingEmail,
              }),
          }
        );


      let data:
        | ResendVerificationResponse
        | ApiError = {};


      try {
        data =
          (await response.json()) as
            | ResendVerificationResponse
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
            : (
                "Unable to resend "
                + "the verification email."
              )
        );
      }


      setResendMessage(
        "A new verification email has been sent. Please check your inbox and Spam or Junk folder."
      );

    } catch (error) {
      setResendError(
        error instanceof Error
          ? error.message
          : (
              "Unable to resend "
              + "the verification email."
            )
      );

    } finally {
      setIsResending(false);
    }
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <main
      style={{
        minHeight:
          "100vh",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          "32px",

        backgroundColor:
          "#f8fafc",

        color:
          "#0f172a",
      }}
    >
      <section
        style={{
          width:
            "100%",

          maxWidth:
            "520px",

          padding:
            "36px",

          border:
            "1px solid #e2e8f0",

          borderRadius:
            "18px",

          backgroundColor:
            "#ffffff",

          boxShadow:
            "0 18px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <p
          style={{
            margin:
              0,

            color:
              "#2563eb",

            fontSize:
              "13px",

            fontWeight:
              800,

            letterSpacing:
              "0.08em",
          }}
        >
          TRUSTGRC AI 360
        </p>


        <h1
          style={{
            margin:
              "14px 0 12px",

            fontSize:
              "30px",

            lineHeight:
              1.2,
          }}
        >
          {isSuccess
            ? "Email verified"
            : "Verify your work email"}
        </h1>


        <p
          style={{
            margin:
              0,

            color:
              "#64748b",

            lineHeight:
              1.6,
          }}
        >
          {statusMessage}
        </p>


        {isComplete && (
          <div
            style={{
              marginTop:
                "24px",

              padding:
                "16px",

              borderRadius:
                "10px",

              backgroundColor:
                isSuccess
                  ? "#f0fdf4"
                  : "#fef2f2",

              border:
                isSuccess
                  ? "1px solid #bbf7d0"
                  : "1px solid #fecaca",

              color:
                isSuccess
                  ? "#166534"
                  : "#991b1b",

              fontWeight:
                600,
            }}
          >
            {isSuccess
              ? (
                  "✓ Email verification "
                  + "completed successfully."
                )
              : (
                  "Email verification "
                  + "could not be completed."
                )}
          </div>
        )}


        {isSuccess && (
          <>
            <p
              style={{
                margin:
                  "18px 0 0",

                color:
                  "#64748b",

                fontSize:
                  "14px",

                lineHeight:
                  1.6,
              }}
            >
              You will be redirected
              securely to the sign-in
              page in a few seconds.
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
        )}


        {!isSuccess &&
          isComplete && (
            <>
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
                The verification link
                may have expired,
                already been used,
                or may be invalid.
              </p>


              {pendingEmail && (
                <div
                  style={{
                    margin:
                      "18px 0 0",

                    padding:
                      "13px 14px",

                    border:
                      "1px solid #dbeafe",

                    borderRadius:
                      "9px",

                    backgroundColor:
                      "#eff6ff",

                    color:
                      "#1e40af",

                    fontWeight:
                      700,

                    fontSize:
                      "13px",

                    wordBreak:
                      "break-word",
                  }}
                >
                  {pendingEmail}
                </div>
              )}


              <div
                style={{
                  marginTop:
                    "18px",

                  padding:
                    "14px 16px",

                  border:
                    "1px solid #fde68a",

                  borderRadius:
                    "10px",

                  backgroundColor:
                    "#fffbeb",

                  color:
                    "#92400e",

                  fontSize:
                    "13px",

                  lineHeight:
                    1.6,
                }}
              >
                <strong>
                  Didn&apos;t receive
                  a usable verification
                  email?
                </strong>

                <div
                  style={{
                    marginTop:
                      "4px",
                  }}
                >
                  Please check your{" "}
                  <strong>
                    Spam or Junk folder
                  </strong>.
                  If necessary, request
                  a new verification email
                  below.
                </div>
              </div>


              {resendMessage && (
                <div
                  style={{
                    marginTop:
                      "18px",

                    padding:
                      "12px 14px",

                    border:
                      "1px solid #bbf7d0",

                    borderRadius:
                      "8px",

                    backgroundColor:
                      "#f0fdf4",

                    color:
                      "#166534",

                    fontSize:
                      "13px",

                    lineHeight:
                      1.5,
                  }}
                >
                  {resendMessage}
                </div>
              )}


              {resendError && (
                <div
                  style={{
                    marginTop:
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

                    fontSize:
                      "13px",

                    lineHeight:
                      1.5,
                  }}
                >
                  {resendError}
                </div>
              )}


              <button
                type="button"

                onClick={() =>
                  void handleResendVerification()
                }

                disabled={
                  isResending ||
                  !pendingEmail
                }

                style={{
                  width:
                    "100%",

                  marginTop:
                    "22px",

                  padding:
                    "12px 18px",

                  border:
                    "1px solid #2563eb",

                  borderRadius:
                    "9px",

                  backgroundColor:
                    "#ffffff",

                  color:
                    "#2563eb",

                  cursor:
                    isResending ||
                    !pendingEmail
                      ? "not-allowed"
                      : "pointer",

                  fontWeight:
                    700,

                  opacity:
                    isResending ||
                    !pendingEmail
                      ? 0.6
                      : 1,
                }}
              >
                {isResending
                  ? "Sending..."
                  : "Resend verification email"}
              </button>
            </>
          )}
      </section>
    </main>
  );
}