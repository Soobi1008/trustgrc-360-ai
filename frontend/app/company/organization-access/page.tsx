"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
} from "../../../lib/auth";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";


type AccessRequest = {
  id: number;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
};


type AssignableRole =
  | "compliance_officer"
  | "ai_governance_officer"
  | "auditor"
  | "executive_viewer";


type ReviewFormState = {
  approvedRole: AssignableRole | "";
  reviewNotes: string;
};


type ReviewResponse = {
  id: number;
  status: "approved" | "rejected";
  message: string;
};


type InvitationStatus =
  | "pending_acceptance"
  | "expired"
  | "account_activated"
  | "delivery_unavailable";


type ApprovedInvitation = {
  id: number;
  email: string;
  full_name: string;
  approved_role: AssignableRole;
  reviewed_at: string | null;
  invitation_status: InvitationStatus;
  invitation_expires_at: string | null;
};


type DomainRequest = {
  id: number;
  domain: string;
  requester_email: string;
  requester_name: string;
  status: string;
  created_at: string;
};


type ApiError = {
  detail?: string | {
    msg?: string;
  }[];
};


const roleOptions: {
  value: AssignableRole;
  label: string;
  description: string;
}[] = [
  {
    value: "compliance_officer",
    label: "Compliance Officer",
    description:
      "Compliance assessments, regulatory obligations and governance activities.",
  },
  {
    value: "ai_governance_officer",
    label: "AI Governance Officer",
    description:
      "AI governance, AI inventory, risk and oversight responsibilities.",
  },
  {
    value: "auditor",
    label: "Auditor",
    description:
      "Audit and assurance access for governance and compliance review.",
  },
  {
    value: "executive_viewer",
    label: "Executive Viewer",
    description:
      "Read-focused executive access to governance and compliance information.",
  },
];


function getApiErrorMessage(
  data: ApiError | null,
  fallback: string
): string {
  if (!data) {
    return fallback;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    const messages = data.detail
      .map((item) => item.msg)
      .filter(
        (message): message is string =>
          Boolean(message)
      );

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return fallback;
}


function formatRequestDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}


export default function OrganizationAccessPage() {
  const router = useRouter();

  const [
    requests,
    setRequests,
  ] = useState<AccessRequest[]>([]);

  const [
    approvedInvitations,
    setApprovedInvitations,
  ] = useState<
    ApprovedInvitation[]
  >([]);

  const [
    domainRequests,
    setDomainRequests,
  ] = useState<
    DomainRequest[]
  >([]);

  const [
    domainReviewNotes,
    setDomainReviewNotes,
  ] = useState<
    Record<number, string>
  >({});

  const [
    reviewForms,
    setReviewForms,
  ] = useState<
    Record<number, ReviewFormState>
  >({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    processingRequestId,
    setProcessingRequestId,
  ] = useState<number | null>(null);

  const [
    processingDomainRequestId,
    setProcessingDomainRequestId,
  ] = useState<number | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const loadRequests =
    useCallback(async () => {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/v1/organization-access-requests`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
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
          setErrorMessage(
            "You do not have permission to review organisation access requests. This page is restricted to organisation administrators."
          );

          setRequests([]);

          return;
        }

        let data:
          | AccessRequest[]
          | ApiError
          | null = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError,
              "Unable to load organisation access requests."
            )
          );
        }

        const accessRequests =
          Array.isArray(data)
            ? data
            : [];

        setRequests(
          accessRequests
        );

        setReviewForms(
          (previous) => {
            const next = {
              ...previous,
            };

            for (
              const request
              of accessRequests
            ) {
              if (
                !next[request.id]
              ) {
                next[request.id] = {
                  approvedRole: "",
                  reviewNotes: "",
                };
              }
            }

            return next;
          }
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load organisation access requests."
        );
      } finally {
        setIsLoading(false);
      }
    }, [router]);


  const loadApprovedInvitations =
    useCallback(async () => {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/v1/organization-access-requests/approved`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
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
          setApprovedInvitations(
            []
          );
          return;
        }

        let data:
          | ApprovedInvitation[]
          | ApiError
          | null = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError,
              "Unable to load approved invitations."
            )
          );
        }

        setApprovedInvitations(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load approved invitations."
        );
      }
    }, [router]);


      const loadDomainRequests =
    useCallback(async () => {
      const token = getAccessToken();

      if (!token) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/v1/organization-domain-requests`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
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
          setDomainRequests([]);
          return;
        }

        let data:
          | DomainRequest[]
          | ApiError
          | null = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError,
              "Unable to load domain association requests."
            )
          );
        }

        setDomainRequests(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load domain association requests."
        );
      }
    }, [router]);


    useEffect(() => {
      void loadRequests();
      void loadApprovedInvitations();
      void loadDomainRequests();
    }, [
      loadRequests,
      loadApprovedInvitations,
      loadDomainRequests,
    ]);


  function updateReviewForm(
    requestId: number,
    updates:
      Partial<ReviewFormState>
  ) {
    setReviewForms(
      (previous) => ({
        ...previous,
        [requestId]: {
          approvedRole:
            previous[
              requestId
            ]?.approvedRole ??
            "",
          reviewNotes:
            previous[
              requestId
            ]?.reviewNotes ??
            "",
          ...updates,
        },
      })
    );
  }


  async function reviewRequest(
    requestId: number,
    decision:
      | "approved"
      | "rejected"
  ) {
    const token =
      getAccessToken();

    if (!token) {
      clearAuthentication();
      router.replace("/login");
      return;
    }

    const form =
      reviewForms[
        requestId
      ] ?? {
        approvedRole: "",
        reviewNotes: "",
      };

    if (
      decision === "approved" &&
      !form.approvedRole
    ) {
      setErrorMessage(
        "Please select a role before approving this access request."
      );

      setSuccessMessage("");

      return;
    }

    setProcessingRequestId(
      requestId
    );

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/organization-access-requests/${requestId}/review`,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision,
            approved_role:
              decision ===
              "approved"
                ? form.approvedRole
                : null,
            review_notes:
              form.reviewNotes
                .trim() ||
              null,
          }),
        }
      );

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      let data:
        | ReviewResponse
        | ApiError
        | null = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data as ApiError,
            decision ===
              "approved"
              ? "Unable to approve the access request."
              : "Unable to reject the access request."
          )
        );
      }

      const reviewResponse =
        data as ReviewResponse;

      setSuccessMessage(
        reviewResponse.message
      );

      setRequests(
        (previous) =>
          previous.filter(
            (request) =>
              request.id !==
              requestId
          )
      );

      setReviewForms(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            requestId
          ];

          return next;
        }
      );

      if (decision === "approved") {
        await loadApprovedInvitations();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to review the access request."
      );
    } finally {
      setProcessingRequestId(
        null
      );
    }
  }


  async function reviewDomainRequest(
    requestId: number,
    decision:
      | "approved"
      | "rejected"
  ) {
    const token =
      getAccessToken();

    if (!token) {
      clearAuthentication();
      router.replace("/login");
      return;
    }

    setProcessingDomainRequestId(
      requestId
    );

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/organization-domain-requests/${requestId}/review`,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision,
            review_notes:
              domainReviewNotes[
                requestId
              ]?.trim() ||
              null,
          }),
        }
      );

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      let data:
        | ReviewResponse
        | ApiError
        | null = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data as ApiError,
            decision === "approved"
              ? "Unable to approve the domain association request."
              : "Unable to reject the domain association request."
          )
        );
      }

      const reviewResponse =
        data as ReviewResponse;

      setSuccessMessage(
        reviewResponse.message
      );

      setDomainRequests(
        (previous) =>
          previous.filter(
            (request) =>
              request.id !==
              requestId
          )
      );

      setDomainReviewNotes(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            requestId
          ];

          return next;
        }
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to review the domain association request."
      );
    } finally {
      setProcessingDomainRequestId(
        null
      );
    }
  }


  async function resendInvitation(
    requestId: number
  ) {
    const token =
      getAccessToken();

    if (!token) {
      clearAuthentication();
      router.replace("/login");
      return;
    }

    setProcessingRequestId(
      requestId
    );

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/organization-access-requests/${requestId}/resend-invitation`,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        clearAuthentication();
        router.replace("/login");
        return;
      }

      let data:
        | ReviewResponse
        | ApiError
        | null = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data as ApiError,
            "Unable to resend the invitation."
          )
        );
      }

      const result =
        data as ReviewResponse;

      setSuccessMessage(
        result.message
      );

      await loadApprovedInvitations();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to resend the invitation."
      );
    } finally {
      setProcessingRequestId(
        null
      );
    }
  }


  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding:
          "32px 24px 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: "24px",
          marginBottom: "28px",
        }}
      >
        <div>
          <p
            style={{
              margin:
                "0 0 8px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing:
                "0.08em",
              textTransform:
                "uppercase",
              color: "#64748b",
            }}
          >
            Organisation
            administration
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              lineHeight: 1.2,
              color: "#0f172a",
            }}
          >
            Access requests
          </h1>

          <p
            style={{
              margin:
                "10px 0 0",
              maxWidth: "720px",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            Review requests from
            users who want to join
            your organisation. An
            approved user receives
            a secure onboarding
            invitation and the role
            selected below.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadRequests()
	          void loadApprovedInvitations();
            void loadDomainRequests();
          }}
          disabled={
            isLoading ||
            processingRequestId !==
              null ||
            processingDomainRequestId !==
              null
          }
          style={{
            border:
              "1px solid #cbd5e1",
            borderRadius: "8px",
            padding:
              "10px 16px",
            background: "#ffffff",
            color: "#0f172a",
            cursor:
              isLoading ||
              processingRequestId !== null ||
              processingDomainRequestId !== null
                ? "not-allowed"
                : "pointer",
            fontWeight: 600,
          }}
        >
          {isLoading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>


      {errorMessage && (
        <div
          role="alert"
          style={{
            marginBottom:
              "20px",
            padding:
              "14px 16px",
            border:
              "1px solid #fecaca",
            borderRadius: "8px",
            background:
              "#fef2f2",
            color: "#991b1b",
            lineHeight: 1.5,
          }}
        >
          {errorMessage}
        </div>
      )}


      {successMessage && (
        <div
          style={{
            marginBottom:
              "20px",
            padding:
              "14px 16px",
            border:
              "1px solid #bbf7d0",
            borderRadius: "8px",
            background:
              "#f0fdf4",
            color: "#166534",
            lineHeight: 1.5,
          }}
        >
          {successMessage}
        </div>
      )}


      {isLoading ? (
        <div
          style={{
            padding: "40px",
            border:
              "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#ffffff",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          Loading access
          requests...
        </div>
      ) : requests.length ===
        0 ? (
        <div
          style={{
            padding:
              "44px 24px",
            border:
              "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#ffffff",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 8px",
              fontSize: "20px",
              color: "#0f172a",
            }}
          >
            No pending access
            requests
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            New organisation access
            requests will appear
            here for administrator
            review.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {requests.map(
            (request) => {
              const form =
                reviewForms[
                  request.id
                ] ?? {
                  approvedRole:
                    "",
                  reviewNotes:
                    "",
                };

              const isProcessing =
                processingRequestId ===
                request.id;

              return (
                <article
                  key={
                    request.id
                  }
                  style={{
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "12px",
                    background:
                      "#ffffff",
                    padding:
                      "24px",
                    boxShadow:
                      "0 1px 2px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: "20px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin:
                            "0 0 6px",
                          fontSize:
                            "20px",
                          color:
                            "#0f172a",
                        }}
                      >
                        {
                          request.full_name
                        }
                      </h2>

                      <p
                        style={{
                          margin:
                            "0 0 5px",
                          color:
                            "#334155",
                        }}
                      >
                        {
                          request.email
                        }
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "13px",
                          color:
                            "#64748b",
                        }}
                      >
                        Requested{" "}
                        {formatRequestDate(
                          request.created_at
                        )}
                      </p>
                    </div>

                    <span
                      style={{
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        borderRadius:
                          "999px",
                        padding:
                          "6px 10px",
                        background:
                          "#fff7ed",
                        color:
                          "#9a3412",
                        fontSize:
                          "12px",
                        fontWeight:
                          700,
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {
                        request.status
                      }
                    </span>
                  </div>


                  <div
                    style={{
                      marginTop:
                        "24px",
                    }}
                  >
                    <label
                      htmlFor={`role-${request.id}`}
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "8px",
                        fontWeight:
                          700,
                        color:
                          "#0f172a",
                      }}
                    >
                      Assign role{" "}
                      <span
                        style={{
                          color:
                            "#dc2626",
                        }}
                      >
                        *
                      </span>
                    </label>

                    <select
                      id={`role-${request.id}`}
                      value={
                        form.approvedRole
                      }
                      disabled={
                        isProcessing
                      }
                      onChange={(
                        event
                      ) =>
                        updateReviewForm(
                          request.id,
                          {
                            approvedRole:
                              event
                                .target
                                .value as
                                | AssignableRole
                                | "",
                          }
                        )
                      }
                      style={{
                        width:
                          "100%",
                        maxWidth:
                          "460px",
                        padding:
                          "11px 12px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "8px",
                        background:
                          "#ffffff",
                        color:
                          "#0f172a",
                      }}
                    >
                      <option value="">
                        Select a role
                      </option>

                      {roleOptions.map(
                        (
                          role
                        ) => (
                          <option
                            key={
                              role.value
                            }
                            value={
                              role.value
                            }
                          >
                            {
                              role.label
                            }
                          </option>
                        )
                      )}
                    </select>

                    {form.approvedRole && (
                      <p
                        style={{
                          margin:
                            "8px 0 0",
                          maxWidth:
                            "700px",
                          fontSize:
                            "13px",
                          lineHeight:
                            1.5,
                          color:
                            "#64748b",
                        }}
                      >
                        {
                          roleOptions.find(
                            (
                              role
                            ) =>
                              role.value ===
                              form.approvedRole
                          )
                            ?.description
                        }
                      </p>
                    )}
                  </div>


                  <div
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    <label
                      htmlFor={`notes-${request.id}`}
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "8px",
                        fontWeight:
                          700,
                        color:
                          "#0f172a",
                      }}
                    >
                      Review notes
                    </label>

                    <textarea
                      id={`notes-${request.id}`}
                      value={
                        form.reviewNotes
                      }
                      disabled={
                        isProcessing
                      }
                      maxLength={
                        2000
                      }
                      rows={4}
                      placeholder="Optional internal review notes..."
                      onChange={(
                        event
                      ) =>
                        updateReviewForm(
                          request.id,
                          {
                            reviewNotes:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "11px 12px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius:
                          "8px",
                        resize:
                          "vertical",
                        fontFamily:
                          "inherit",
                        color:
                          "#0f172a",
                      }}
                    />

                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "12px",
                        color:
                          "#64748b",
                      }}
                    >
                      {
                        form
                          .reviewNotes
                          .length
                      }
                      /2000
                    </div>
                  </div>


                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap: "12px",
                      marginTop:
                        "24px",
                      paddingTop:
                        "20px",
                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <button
                      type="button"
                      disabled={
                        isProcessing
                      }
                      onClick={() =>
                        void reviewRequest(
                          request.id,
                          "approved"
                        )
                      }
                      style={{
                        border: 0,
                        borderRadius:
                          "8px",
                        padding:
                          "11px 16px",
                        background:
                          "#166534",
                        color:
                          "#ffffff",
                        fontWeight:
                          700,
                        cursor:
                          isProcessing
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          isProcessing
                            ? 0.7
                            : 1,
                      }}
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Approve & send invitation"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        isProcessing
                      }
                      onClick={() =>
                        void reviewRequest(
                          request.id,
                          "rejected"
                        )
                      }
                      style={{
                        border:
                          "1px solid #fecaca",
                        borderRadius:
                          "8px",
                        padding:
                          "11px 16px",
                        background:
                          "#ffffff",
                        color:
                          "#b91c1c",
                        fontWeight:
                          700,
                        cursor:
                          isProcessing
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          isProcessing
                            ? 0.7
                            : 1,
                      }}
                    >
                      Reject request
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}


      <section
        style={{
          marginTop: "36px",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "24px",
              color: "#0f172a",
            }}
          >
            Approved invitations
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Track approved users and
            the status of their secure
            onboarding invitations.
          </p>
        </div>


        {approvedInvitations.length ===
        0 ? (
          <div
            style={{
              padding: "32px 24px",
              border:
                "1px solid #e2e8f0",
              borderRadius: "12px",
              background: "#ffffff",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            No approved invitations
            found.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {approvedInvitations.map(
              (invitation) => {
                const roleLabel =
                  roleOptions.find(
                    (role) =>
                      role.value ===
                      invitation.approved_role
                  )?.label ??
                  invitation.approved_role;

                const statusLabel =
                  invitation.invitation_status ===
                  "pending_acceptance"
                    ? "Pending acceptance"
                    : invitation.invitation_status ===
                      "account_activated"
                    ? "Account activated"
                    : invitation.invitation_status ===
                      "expired"
                    ? "Expired"
                    : "Invitation unavailable";

                return (
                  <article
                    key={invitation.id}
                    style={{
                      padding: "20px 24px",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "12px",
                      background:
                        "#ffffff",
                      boxShadow:
                        "0 1px 2px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "20px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin:
                              "0 0 6px",
                            fontSize:
                              "18px",
                            color:
                              "#0f172a",
                          }}
                        >
                          {
                            invitation.full_name
                          }
                        </h3>

                        <p
                          style={{
                            margin:
                              "0 0 6px",
                            color:
                              "#334155",
                          }}
                        >
                          {
                            invitation.email
                          }
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize:
                              "13px",
                            color:
                              "#64748b",
                          }}
                        >
                          Role:{" "}
                          {roleLabel}
                        </p>
                      </div>

                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          padding:
                            "6px 10px",
                          borderRadius:
                            "999px",
                          background:
                            "#f1f5f9",
                          color:
                            "#334155",
                          fontSize:
                            "12px",
                          fontWeight: 700,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>


                    <div
                      style={{
                        marginTop:
                          "16px",
                        paddingTop:
                          "14px",
                        borderTop:
                          "1px solid #e2e8f0",
                        fontSize:
                          "13px",
                        color:
                          "#64748b",
                        lineHeight: 1.7,
                      }}
                    >
                      <div>
                        Approved:{" "}
                        {invitation.reviewed_at
                          ? formatRequestDate(
                              invitation.reviewed_at
                            )
                          : "Legacy approval — date unavailable"}
                      </div>

                      {invitation
                        .invitation_expires_at &&
                        invitation
                          .invitation_status !==
                          "account_activated" && (
                          <div>
                            Invitation
                            expires:{" "}
                            {formatRequestDate(
                              invitation.invitation_expires_at
                            )}
                          </div>
                        )}
                    </div>

                    
                    {(invitation.invitation_status ===
                      "expired" ||
                      invitation.invitation_status ===
                        "delivery_unavailable") && (
                      <div
                        style={{
                          marginTop: "16px",
                          paddingTop: "16px",
                          borderTop:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            processingRequestId ===
                            invitation.id
                          }
                          onClick={() =>
                            void resendInvitation(
                              invitation.id
                            )
                          }
                          style={{
                            border: 0,
                            borderRadius:
                              "8px",
                            padding:
                              "10px 15px",
                            background:
                              "#0f172a",
                            color:
                              "#ffffff",
                            fontWeight: 700,
                            cursor:
                              processingRequestId ===
                              invitation.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              processingRequestId ===
                              invitation.id
                                ? 0.7
                                : 1,
                          }}
                        >
                          {processingRequestId ===
                          invitation.id
                            ? "Sending..."
                            : invitation.invitation_status ===
                              "expired"
                            ? "Resend invitation"
                            : "Send invitation"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
            <section
        style={{
          marginTop: "36px",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "24px",
              color: "#0f172a",
            }}
          >
            Domain association requests
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Review requests to associate
            new business domains with your
            organisation.
          </p>
        </div>

        {domainRequests.length === 0 ? (
          <div
            style={{
              padding: "32px 24px",
              border:
                "1px solid #e2e8f0",
              borderRadius: "12px",
              background: "#ffffff",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            No pending domain association
            requests.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {domainRequests.map(
              (domainRequest) => (
                <article
                  key={domainRequest.id}
                  style={{
                    padding: "20px 24px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#ffffff",
                    boxShadow:
                      "0 1px 2px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin:
                            "0 0 6px",
                          fontSize: "18px",
                          color: "#0f172a",
                        }}
                      >
                        {domainRequest.domain}
                      </h3>

                      <p
                        style={{
                          margin:
                            "0 0 5px",
                          color: "#334155",
                        }}
                      >
                        {
                          domainRequest.requester_name
                        }
                      </p>

                      <p
                        style={{
                          margin:
                            "0 0 5px",
                          color: "#334155",
                        }}
                      >
                        {
                          domainRequest.requester_email
                        }
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#64748b",
                        }}
                      >
                        Requested{" "}
                        {formatRequestDate(
                          domainRequest.created_at
                        )}
                      </p>
                    </div>

                    <span
                      style={{
                        display:
                          "inline-flex",
                        alignItems: "center",
                        borderRadius:
                          "999px",
                        padding: "6px 10px",
                        background:
                          "#fff7ed",
                        color: "#9a3412",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {domainRequest.status}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                    }}
                  >
                    <label
                      htmlFor={`domain-notes-${domainRequest.id}`}
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      Review notes
                    </label>

                    <textarea
                      id={`domain-notes-${domainRequest.id}`}
                      value={
                        domainReviewNotes[
                          domainRequest.id
                        ] ?? ""
                      }
                      disabled={
                        processingDomainRequestId ===
                        domainRequest.id
                      }
                      maxLength={2000}
                      rows={3}
                      placeholder="Optional internal review notes..."
                      onChange={(event) =>
                        setDomainReviewNotes(
                          (previous) => ({
                            ...previous,
                            [domainRequest.id]:
                              event.target.value,
                          })
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border:
                          "1px solid #cbd5e1",
                        borderRadius: "8px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        color: "#0f172a",
                      }}
                    />

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {
                        (
                          domainReviewNotes[
                            domainRequest.id
                          ] ?? ""
                        ).length
                      }
                      /2000
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                      marginTop: "20px",
                      paddingTop: "20px",
                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <button
                      type="button"
                      disabled={
                        processingDomainRequestId ===
                        domainRequest.id
                      }
                      onClick={() =>
                        void reviewDomainRequest(
                          domainRequest.id,
                          "approved"
                        )
                      }
                      style={{
                        border: 0,
                        borderRadius: "8px",
                        padding: "11px 16px",
                        background: "#166534",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor:
                          processingDomainRequestId ===
                          domainRequest.id
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          processingDomainRequestId ===
                          domainRequest.id
                            ? 0.7
                            : 1,
                      }}
                    >
                      {processingDomainRequestId ===
                      domainRequest.id
                        ? "Processing..."
                        : "Approve domain"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        processingDomainRequestId ===
                        domainRequest.id
                      }
                      onClick={() =>
                        void reviewDomainRequest(
                          domainRequest.id,
                          "rejected"
                        )
                      }
                      style={{
                        border:
                          "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "11px 16px",
                        background: "#ffffff",
                        color: "#b91c1c",
                        fontWeight: 700,
                        cursor:
                          processingDomainRequestId ===
                          domainRequest.id
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          processingDomainRequestId ===
                          domainRequest.id
                            ? 0.7
                            : 1,
                      }}
                    >
                      Reject request
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}