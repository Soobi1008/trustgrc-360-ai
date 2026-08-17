"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
  getStoredUser,
  isPlatformRole,
} from "../../../../../lib/auth";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";


type RegulatorySource = {
  id: number;
  regulation_code: string;
  regulation_name: string;
  authority: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  official_url: string;
  source_type: string;
  legal_status: string;
  trust_tier: number;
  monitoring_enabled: boolean;
  content_hash: string | null;
  current_version: string | null;
  last_checked_at: string | null;
  last_changed_at: string | null;
};


type RegulatorySnapshot = {
  id: number;
  source_id: number;
  content_hash: string;
  normalized_content: string;
  snapshot_type: string;

  source_url: string | null;
  retrieval_status: string;
  content_type: string | null;

  authoritative_identifier:
    | string
    | null;

  authoritative_version:
    | string
    | null;

  retrieved_at: string | null;
  captured_at: string;
};


type RegulatoryChange = {
  id: number;
  source_id: number;

  old_hash: string | null;
  new_hash: string;

  previous_snapshot_id:
    | number
    | null;

  new_snapshot_id:
    | number
    | null;

  technical_severity:
    | string
    | null;

  difference_ratio:
    | number
    | null;

  evidence_status: string;

  change_type: string;
  summary: string | null;
  detected_at: string;

  review_status: string;
  review_decision: string | null;
  review_notes: string | null;

  reviewed_by_user_id:
    | number
    | null;

  reviewed_at: string | null;

  impact_status: string;
  impact_level: string | null;
  impact_summary: string | null;

  published_at: string | null;
};


type RegulatoryEvidence = {
  change: RegulatoryChange;
  source: RegulatorySource;

  previous_snapshot:
    | RegulatorySnapshot
    | null;

  new_snapshot:
    | RegulatorySnapshot
    | null;

  evidence_complete: boolean;
  evidence_warning: string | null;
};


type RegulatoryPublishResponse = {
  id: number;
  review_status: string;
  review_decision: string | null;
  impact_status: string;
  impact_level: string | null;
  published_at: string;
  message: string;
};


type ApiError = {
  detail?: string;
};


type ReviewDecision =
  | "confirmed"
  | "dismissed"
  | "needs_more_information";


type ChangeType =
  | "unclassified"
  | "editorial"
  | "guidance_change"
  | "scope_change"
  | "obligation_change"
  | "enforcement_change"
  | "effective_date_change"
  | "other";


type ImpactLevel =
  | "none"
  | "low"
  | "moderate"
  | "high"
  | "critical";


export default function RegulatoryChangeReviewPage() {
  const params =
    useParams<{
      changeId: string;
    }>();

  const router =
    useRouter();

  const changeId =
    Number(
      params.changeId
    );


  const [
    evidence,
    setEvidence,
  ] = useState<
    RegulatoryEvidence | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isSubmittingImpact,
    setIsSubmittingImpact,
  ] = useState(false);

  const [
    isPublishing,
    setIsPublishing,
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
    reviewDecision,
    setReviewDecision,
  ] = useState<ReviewDecision>(
    "confirmed"
  );

  const [
    changeType,
    setChangeType,
  ] = useState<ChangeType>(
    "unclassified"
  );

  const [
    reviewNotes,
    setReviewNotes,
  ] = useState("");


  const [
    impactLevel,
    setImpactLevel,
  ] = useState<ImpactLevel>(
    "moderate"
  );

  const [
    impactSummary,
    setImpactSummary,
  ] = useState("");


  const getToken =
    useCallback(
      () => {
        const user =
          getStoredUser();

        const token =
          getAccessToken();

        if (
          !user ||
          !token ||
          !user.is_active ||
          !isPlatformRole(
            user.role
          )
        ) {
          clearAuthentication();

          router.replace(
            "/login"
          );

          return null;
        }

        return token;
      },
      [
        router,
      ]
    );


  const loadEvidence =
    useCallback(
      async () => {
        const token =
          getToken();

        if (!token) {
          return;
        }

        if (!API_URL) {
          setErrorMessage(
            "NEXT_PUBLIC_API_URL is not configured."
          );

          setIsLoading(
            false
          );

          return;
        }

        if (
          !Number.isInteger(
            changeId
          )
          ||
          changeId <= 0
        ) {
          setErrorMessage(
            "Invalid regulatory change ID."
          );

          setIsLoading(
            false
          );

          return;
        }

        try {
          setIsLoading(
            true
          );

          setErrorMessage(
            ""
          );

          const response =
            await fetch(
              `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/evidence`,
              {
                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                cache:
                  "no-store",
              }
            );


          if (
            response.status
            === 401
          ) {
            clearAuthentication();

            router.replace(
              "/login"
            );

            return;
          }


          if (
            response.status
            === 403
          ) {
            setErrorMessage(
              "You do not have permission "
              + "to access this regulatory "
              + "change."
            );

            return;
          }


          const data =
            (
              await response.json()
            ) as
              | RegulatoryEvidence
              | ApiError;


          if (
            !response.ok
          ) {
            throw new Error(
              "detail" in data
              && data.detail
                ? data.detail
                : (
                  "Unable to load regulatory "
                  + "change evidence."
                )
            );
          }


          const result =
            data as RegulatoryEvidence;

          setEvidence(
            result
          );


          setChangeType(
            (
              result.change.change_type
              || "unclassified"
            ) as ChangeType
          );


          if (
            result.change
              .review_decision
          ) {
            setReviewDecision(
              result.change
                .review_decision as
                ReviewDecision
            );
          } else {
            setReviewDecision(
              "confirmed"
            );
          }


          setReviewNotes(
            result.change
              .review_notes
              ?? ""
          );


          if (
            result.change
              .impact_level
          ) {
            setImpactLevel(
              result.change
                .impact_level as
                ImpactLevel
            );
          } else {
            setImpactLevel(
              "moderate"
            );
          }


          setImpactSummary(
            result.change
              .impact_summary
              ?? ""
          );

        } catch (error) {
          console.error(
            "Evidence load error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : (
                "Unable to load "
                + "regulatory evidence."
              )
          );

        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        changeId,
        getToken,
        router,
      ]
    );


  useEffect(
    () => {
      void loadEvidence();
    },
    [
      loadEvidence,
    ]
  );


  const canReview =
    useMemo(
      () =>
        Boolean(
          evidence
          && !evidence.change
            .published_at
          && evidence.change
            .impact_status
            !== "analysed"
        ),
      [
        evidence,
      ]
    );


  const canEditImpact =
    useMemo(
      () =>
        Boolean(
          evidence
          && !evidence.change
            .published_at
          && evidence.change
            .review_status
            === "reviewed"
          && evidence.change
            .review_decision
            === "confirmed"
        ),
      [
        evidence,
      ]
    );


  const canPublish =
    useMemo(
      () =>
        Boolean(
          evidence
          && evidence.change
            .review_status
            === "reviewed"
          && evidence.change
            .review_decision
            === "confirmed"
          && evidence.change
            .impact_status
            === "analysed"
          && evidence.change
            .impact_level
          && !evidence.change
            .published_at
        ),
      [
        evidence,
      ]
    );


  async function submitReview() {
    if (
      !evidence
    ) {
      return;
    }

    const token =
      getToken();

    if (
      !token
    ) {
      return;
    }


    const cleanedNotes =
      reviewNotes.trim();


    if (
      cleanedNotes.length
      < 10
    ) {
      setErrorMessage(
        "Review notes must contain "
        + "at least 10 characters."
      );

      return;
    }


    try {
      setIsSubmitting(
        true
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );


      const response =
        await fetch(
          `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/review`,
          {
            method:
              "PATCH",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                review_decision:
                  reviewDecision,

                change_type:
                  changeType,

                review_notes:
                  cleanedNotes,
              }),
          }
        );


      if (
        response.status
        === 401
      ) {
        clearAuthentication();

        router.replace(
          "/login"
        );

        return;
      }


      const data =
        (
          await response.json()
        ) as
          | RegulatoryChange
          | ApiError;


      if (
        !response.ok
      ) {
        throw new Error(
          "detail" in data
          && data.detail
            ? data.detail
            : (
              "Unable to save "
              + "regulatory review."
            )
        );
      }


      if (
        reviewDecision
        === "confirmed"
      ) {
        setSuccessMessage(
          "Regulatory change confirmed. "
          + "Impact analysis is now required."
        );

      } else if (
        reviewDecision
        === "dismissed"
      ) {
        setSuccessMessage(
          "Regulatory change dismissed "
          + "successfully."
        );

      } else {
        setSuccessMessage(
          "Regulatory change marked as "
          + "requiring more information."
        );
      }


      await loadEvidence();

    } catch (error) {
      console.error(
        "Review submission error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : (
            "Unable to submit "
            + "regulatory review."
          )
      );

    } finally {
      setIsSubmitting(
        false
      );
    }
  }


  async function submitImpactAnalysis() {
    if (
      !evidence
    ) {
      return;
    }

    const token =
      getToken();

    if (
      !token
    ) {
      return;
    }


    const cleanedSummary =
      impactSummary.trim();


    if (
      cleanedSummary.length
      < 10
    ) {
      setErrorMessage(
        "Impact summary must contain "
        + "at least 10 characters."
      );

      return;
    }


    if (
      evidence.change
        .review_decision
      !== "confirmed"
    ) {
      setErrorMessage(
        "Impact analysis can only be "
        + "completed after the regulatory "
        + "change has been confirmed."
      );

      return;
    }


    try {
      setIsSubmittingImpact(
        true
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );


      const response =
        await fetch(
          `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/impact`,
          {
            method:
              "PATCH",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                impact_level:
                  impactLevel,

                impact_summary:
                  cleanedSummary,
              }),
          }
        );


      if (
        response.status
        === 401
      ) {
        clearAuthentication();

        router.replace(
          "/login"
        );

        return;
      }


      const data =
        (
          await response.json()
        ) as
          | RegulatoryChange
          | ApiError;


      if (
        !response.ok
      ) {
        throw new Error(
          "detail" in data
          && data.detail
            ? data.detail
            : (
              "Unable to save "
              + "regulatory impact analysis."
            )
        );
      }


      setSuccessMessage(
        "Impact analysis completed "
        + "successfully. This regulatory "
        + "change is now eligible for "
        + "publication."
      );


      await loadEvidence();

    } catch (error) {
      console.error(
        "Impact analysis submission error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : (
            "Unable to submit "
            + "impact analysis."
          )
      );

    } finally {
      setIsSubmittingImpact(
        false
      );
    }
  }


  async function publishRegulatoryIntelligence() {
    if (
      !evidence
    ) {
      return;
    }


    if (
      !canPublish
    ) {
      setErrorMessage(
        "This regulatory change is not "
        + "ready for publication."
      );

      return;
    }


    const token =
      getToken();

    if (
      !token
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        "Publish this regulatory intelligence?\n\n"
        + "Once published, the regulatory review "
        + "and impact analysis will become read-only."
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setIsPublishing(
        true
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );


      const response =
        await fetch(
          `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/publish`,
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      if (
        response.status
        === 401
      ) {
        clearAuthentication();

        router.replace(
          "/login"
        );

        return;
      }


      const data =
        (
          await response.json()
        ) as
          | RegulatoryPublishResponse
          | ApiError;


      if (
        !response.ok
      ) {
        throw new Error(
          "detail" in data
          && data.detail
            ? data.detail
            : (
              "Unable to publish "
              + "regulatory intelligence."
            )
        );
      }


      const published =
        data as RegulatoryPublishResponse;


      setSuccessMessage(
        published.message
        || (
          "Regulatory intelligence "
          + "published successfully."
        )
      );


      await loadEvidence();

    } catch (error) {
      console.error(
        "Regulatory publication error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : (
            "Unable to publish "
            + "regulatory intelligence."
          )
      );

    } finally {
      setIsPublishing(
        false
      );
    }
  }


  if (
    isLoading
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          padding:
            "40px",

          backgroundColor:
            "#f8fafc",
        }}
      >
        <div
          style={{
            maxWidth:
              "1200px",

            margin:
              "0 auto",

            padding:
              "24px",

            border:
              "1px solid #e2e8f0",

            borderRadius:
              "12px",

            backgroundColor:
              "#ffffff",
          }}
        >
          Loading regulatory evidence...
        </div>
      </main>
    );
  }


  if (
    errorMessage
    && !evidence
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          padding:
            "40px",

          backgroundColor:
            "#f8fafc",
        }}
      >
        <div
          style={{
            maxWidth:
              "900px",

            margin:
              "0 auto",
          }}
        >
          <MessageBox
            tone="danger"
          >
            {errorMessage}
          </MessageBox>

          <div
            style={{
              marginTop:
                "20px",
            }}
          >
            <Link
              href={
                "/admin/regulatory-intelligence"
              }
            >
              ← Regulatory Intelligence
            </Link>
          </div>
        </div>
      </main>
    );
  }


  if (
    !evidence
  ) {
    return null;
  }


  const {
    change,
    source,
    previous_snapshot,
    new_snapshot,
  } = evidence;


  return (
    <main
      style={{
        minHeight:
          "100vh",

        padding:
          "40px",

        backgroundColor:
          "#f8fafc",

        color:
          "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth:
            "1200px",

          margin:
            "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap:
              "24px",

            marginBottom:
              "28px",
          }}
        >
          <div>
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
                  "10px 0 8px",

                fontSize:
                  "34px",

                lineHeight:
                  1.2,
              }}
            >
              Regulatory Change Review
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
              Review authoritative evidence
              before validating regulatory
              intelligence.
            </p>
          </div>


          <Link
            href={
              "/admin/regulatory-intelligence"
            }
            style={
              secondaryLinkStyle
            }
          >
            ← Regulatory Intelligence
          </Link>
        </div>


        {
          errorMessage
          && (
            <MessageBox
              tone="danger"
            >
              {errorMessage}
            </MessageBox>
          )
        }


        {
          successMessage
          && (
            <MessageBox
              tone="success"
            >
              {successMessage}
            </MessageBox>
          )
        }


        {/* REGULATION SUMMARY */}

        <SectionCard>
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              gap:
                "20px",

              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin:
                    0,

                  fontSize:
                    "24px",
                }}
              >
                {
                  source
                    .regulation_name
                }
              </h2>

              <p
                style={{
                  margin:
                    "8px 0 0",

                  color:
                    "#64748b",
                }}
              >
                {
                  source.authority
                }

                {" · "}

                {
                  source
                    .jurisdiction_name
                }
              </p>
            </div>


            <div
              style={{
                display:
                  "flex",

                gap:
                  "8px",

                flexWrap:
                  "wrap",
              }}
            >
              <StatusBadge
                text={
                  formatStatus(
                    change.review_status
                  )
                }
                tone={
                  change.review_status
                  === "reviewed"
                    ? "success"
                    : "warning"
                }
              />

              <StatusBadge
                text={
                  formatStatus(
                    change.impact_status
                  )
                }
                tone={
                  change.impact_status
                  === "analysed"
                    ? "success"
                    : "neutral"
                }
              />

              {
                change.published_at
                && (
                  <StatusBadge
                    text="Published"
                    tone="success"
                  />
                )
              }
            </div>
          </div>


          <div
            style={{
              marginTop:
                "20px",

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",

              gap:
                "14px",
            }}
          >
            <InfoItem
              label="Change ID"
              value={
                String(
                  change.id
                )
              }
            />

            <InfoItem
              label="Detected"
              value={
                formatDate(
                  change.detected_at
                )
              }
            />

            <InfoItem
              label="Change Type"
              value={
                formatStatus(
                  change.change_type
                )
              }
            />

            <InfoItem
              label="Evidence Status"
              value={
                formatStatus(
                  change.evidence_status
                )
              }
            />
          </div>
        </SectionCard>


        {/* EVIDENCE INTEGRITY */}

        <SectionCard>
          <h2
            style={{
              margin:
                "0 0 14px",

              fontSize:
                "21px",
            }}
          >
            Evidence Integrity
          </h2>


          {
            evidence.evidence_complete
            ? (
              <MessageBox
                tone="success"
              >
                Full provenance evidence is
                available for this regulatory
                change.
              </MessageBox>
            )
            : (
              <MessageBox
                tone="warning"
              >
                <strong>
                  Historical / Partial Evidence
                </strong>

                <div
                  style={{
                    marginTop:
                      "6px",
                  }}
                >
                  {
                    evidence.evidence_warning
                    ?? (
                      "The evidence package "
                      + "is incomplete."
                    )
                  }
                </div>
              </MessageBox>
            )
          }


          <div
            style={{
              marginTop:
                "18px",

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                "14px",
            }}
          >
            <InfoItem
              label="Technical Severity"
              value={
                change.technical_severity
                  ? formatStatus(
                      change
                        .technical_severity
                    )
                  : "Not available"
              }
            />

            <InfoItem
              label="Difference Ratio"
              value={
                formatRatio(
                  change.difference_ratio
                )
              }
            />

            <InfoItem
              label="Previous Snapshot"
              value={
                change.previous_snapshot_id
                  ? `#${change.previous_snapshot_id}`
                  : "Unavailable"
              }
            />

            <InfoItem
              label="New Snapshot"
              value={
                change.new_snapshot_id
                  ? `#${change.new_snapshot_id}`
                  : "Unavailable"
              }
            />
          </div>
        </SectionCard>


        {/* AUTHORITATIVE SOURCE */}

        <SectionCard>
          <h2
            style={{
              margin:
                "0 0 16px",

              fontSize:
                "21px",
            }}
          >
            Authoritative Source
          </h2>


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                "14px",
            }}
          >
            <InfoItem
              label="Authority"
              value={
                source.authority
              }
            />

            <InfoItem
              label="Jurisdiction"
              value={
                source
                  .jurisdiction_name
              }
            />

            <InfoItem
              label="Source Type"
              value={
                formatStatus(
                  source.source_type
                )
              }
            />

            <InfoItem
              label="Trust Tier"
              value={
                String(
                  source.trust_tier
                )
              }
            />
          </div>


          <div
            style={{
              marginTop:
                "18px",
            }}
          >
            <a
              href={
                source.official_url
              }
              target="_blank"
              rel="noreferrer"
              style={{
                color:
                  "#2563eb",

                fontWeight:
                  700,

                textDecoration:
                  "none",
              }}
            >
              Open Official Regulatory Source ↗
            </a>
          </div>
        </SectionCard>


        {/* SNAPSHOT EVIDENCE */}

        <section
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(360px, 1fr))",

            gap:
              "18px",

            marginBottom:
              "20px",
          }}
        >
          <SnapshotCard
            title="Previous Snapshot"
            snapshot={
              previous_snapshot
            }
          />

          <SnapshotCard
            title="New Snapshot"
            snapshot={
              new_snapshot
            }
          />
        </section>


        {/* DETECTED CHANGE */}

        <SectionCard>
          <h2
            style={{
              margin:
                "0 0 14px",

              fontSize:
                "21px",
            }}
          >
            Detected Change
          </h2>


          <pre
            style={{
              margin:
                0,

              padding:
                "16px",

              maxHeight:
                "420px",

              overflow:
                "auto",

              whiteSpace:
                "pre-wrap",

              wordBreak:
                "break-word",

              border:
                "1px solid #e2e8f0",

              borderRadius:
                "10px",

              backgroundColor:
                "#f8fafc",

              color:
                "#334155",

              fontFamily:
                "inherit",

              fontSize:
                "13px",

              lineHeight:
                1.7,
            }}
          >
            {
              change.summary
              ?? (
                "No technical change "
                + "summary is available."
              )
            }
          </pre>
        </SectionCard>


        {/* HUMAN REVIEW */}

        <SectionCard>
          <h2
            style={{
              margin:
                "0 0 6px",

              fontSize:
                "21px",
            }}
          >
            Human Regulatory Review
          </h2>


          <p
            style={{
              margin:
                "0 0 20px",

              color:
                "#64748b",

              fontSize:
                "14px",

              lineHeight:
                1.6,
            }}
          >
            The technical detection above is
            not itself a legal determination.
            An authorised TrustGRC reviewer must
            validate the detected change before
            it can proceed to impact analysis
            and publication.
          </p>


          {
            change.impact_status
            === "analysed"
            && !change.published_at
            && (
              <MessageBox
                tone="warning"
              >
                Regulatory review is locked
                because impact analysis has
                already been completed.
                A controlled reopen workflow
                is required to change the
                original review decision.
              </MessageBox>
            )
          }


          {
            change.published_at
            && (
              <MessageBox
                tone="success"
              >
                This regulatory intelligence was
                published on{" "}
                <strong>
                  {
                    formatDate(
                      change.published_at
                    )
                  }
                </strong>
                .
              </MessageBox>
            )
          }


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",

              gap:
                "18px",
            }}
          >
            <div>
              <label
                style={
                  labelStyle
                }
              >
                Review Decision
              </label>

              <select
                value={
                  reviewDecision
                }
                onChange={
                  (event) =>
                    setReviewDecision(
                      event.target
                        .value as
                        ReviewDecision
                    )
                }
                disabled={
                  !canReview
                  || isSubmitting
                }
                style={
                  inputStyle
                }
              >
                <option
                  value="confirmed"
                >
                  Confirm Regulatory Change
                </option>

                <option
                  value="dismissed"
                >
                  Dismiss
                </option>

                <option
                  value="needs_more_information"
                >
                  Needs More Information
                </option>
              </select>
            </div>


            <div>
              <label
                style={
                  labelStyle
                }
              >
                Change Classification
              </label>

              <select
                value={
                  changeType
                }
                onChange={
                  (event) =>
                    setChangeType(
                      event.target
                        .value as
                        ChangeType
                    )
                }
                disabled={
                  !canReview
                  || isSubmitting
                }
                style={
                  inputStyle
                }
              >
                <option value="unclassified">
                  Unclassified
                </option>

                <option value="editorial">
                  Editorial
                </option>

                <option value="guidance_change">
                  Guidance Change
                </option>

                <option value="scope_change">
                  Scope Change
                </option>

                <option value="obligation_change">
                  Obligation Change
                </option>

                <option value="enforcement_change">
                  Enforcement Change
                </option>

                <option value="effective_date_change">
                  Effective Date Change
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>
          </div>


          <div
            style={{
              marginTop:
                "18px",
            }}
          >
            <label
              style={
                labelStyle
              }
            >
              Reviewer Notes
            </label>

            <textarea
              value={
                reviewNotes
              }
              onChange={
                (event) =>
                  setReviewNotes(
                    event.target.value
                  )
              }
              disabled={
                !canReview
                || isSubmitting
              }
              placeholder={
                "Document the basis for the "
                + "regulatory review decision..."
              }
              rows={
                7
              }
              style={{
                ...inputStyle,

                resize:
                  "vertical",

                lineHeight:
                  1.6,
              }}
            />
          </div>


          <div
            style={{
              marginTop:
                "20px",

              display:
                "flex",

              justifyContent:
                "space-between",

              gap:
                "12px",

              flexWrap:
                "wrap",
            }}
          >
            <Link
              href={
                "/admin/regulatory-intelligence"
              }
              style={
                secondaryLinkStyle
              }
            >
              Cancel
            </Link>


            <button
              type="button"
              onClick={
                () => {
                  void submitReview();
                }
              }
              disabled={
                !canReview
                || isSubmitting
              }
              style={{
                ...primaryButtonStyle,

                backgroundColor:
                  !canReview
                    ? "#94a3b8"
                    : "#2563eb",

                cursor:
                  !canReview
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {
                isSubmitting
                  ? "Saving Review..."
                  : canReview
                    ? "Save Regulatory Review"
                    : "Regulatory Review Locked"
              }
            </button>
          </div>
        </SectionCard>


        {/* IMPACT ANALYSIS */}

        {
          change.review_decision
          === "confirmed"
          && (
            <SectionCard>
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "flex-start",

                  gap:
                    "16px",

                  flexWrap:
                    "wrap",

                  marginBottom:
                    "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin:
                        "0 0 6px",

                      fontSize:
                        "21px",
                    }}
                  >
                    Impact Analysis
                  </h2>

                  <p
                    style={{
                      margin:
                        0,

                      color:
                        "#64748b",

                      fontSize:
                        "14px",

                      lineHeight:
                        1.6,
                    }}
                  >
                    Assess the organisational
                    impact of the confirmed
                    regulatory change before
                    publication.
                  </p>
                </div>


                <StatusBadge
                  text={
                    formatStatus(
                      change.impact_status
                    )
                  }
                  tone={
                    change.impact_status
                    === "analysed"
                      ? "success"
                      : "warning"
                  }
                />
              </div>


              {
                change.impact_status
                === "analysis_required"
                && (
                  <MessageBox
                    tone="warning"
                  >
                    Regulatory review has
                    confirmed this change.
                    Impact analysis must now
                    be completed before the
                    intelligence can be
                    published.
                  </MessageBox>
                )
              }


              {
                change.impact_status
                === "analysed"
                && !change.published_at
                && (
                  <MessageBox
                    tone="success"
                  >
                    Impact analysis has been
                    completed. Review the
                    assessment below before
                    publication.
                  </MessageBox>
                )
              }


              {
                change.published_at
                && (
                  <MessageBox
                    tone="success"
                  >
                    Impact analysis is locked
                    because this regulatory
                    intelligence has already
                    been published.
                  </MessageBox>
                )
              }


              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",

                  gap:
                    "18px",
                }}
              >
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Impact Level
                  </label>

                  <select
                    value={
                      impactLevel
                    }
                    onChange={
                      (event) =>
                        setImpactLevel(
                          event.target
                            .value as
                            ImpactLevel
                        )
                    }
                    disabled={
                      !canEditImpact
                      || isSubmittingImpact
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="none">
                      None
                    </option>

                    <option value="low">
                      Low
                    </option>

                    <option value="moderate">
                      Moderate
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="critical">
                      Critical
                    </option>
                  </select>
                </div>


                <div>
                  <InfoItem
                    label="Regulatory Classification"
                    value={
                      formatStatus(
                        change.change_type
                      )
                    }
                  />

                  <InfoItem
                    label="Review Decision"
                    value={
                      change.review_decision
                        ? formatStatus(
                            change
                              .review_decision
                          )
                        : "Not reviewed"
                    }
                  />
                </div>
              </div>


              <div
                style={{
                  marginTop:
                    "18px",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Impact Analysis Summary
                </label>

                <textarea
                  value={
                    impactSummary
                  }
                  onChange={
                    (event) =>
                      setImpactSummary(
                        event.target.value
                      )
                  }
                  disabled={
                    !canEditImpact
                    || isSubmittingImpact
                  }
                  placeholder={
                    "Document how this regulatory "
                    + "change may affect governance "
                    + "requirements, compliance "
                    + "controls, assessments, risks, "
                    + "policies, AI systems or "
                    + "organisational obligations..."
                  }
                  rows={
                    8
                  }
                  style={{
                    ...inputStyle,

                    resize:
                      "vertical",

                    lineHeight:
                      1.6,
                  }}
                />
              </div>


              <div
                style={{
                  marginTop:
                    "20px",

                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "12px",

                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={
                    () => {
                      void submitImpactAnalysis();
                    }
                  }
                  disabled={
                    !canEditImpact
                    || isSubmittingImpact
                  }
                  style={{
                    ...primaryButtonStyle,

                    backgroundColor:
                      !canEditImpact
                        ? "#94a3b8"
                        : "#2563eb",

                    cursor:
                      !canEditImpact
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {
                    isSubmittingImpact
                      ? "Saving Impact Analysis..."
                      : change.impact_status
                        === "analysed"
                        ? "Update Impact Analysis"
                        : "Save Impact Analysis"
                  }
                </button>
              </div>
            </SectionCard>
          )
        }


        {/* PUBLICATION */}

        {
          change.review_decision
          === "confirmed"
          && (
            <SectionCard>
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "flex-start",

                  gap:
                    "16px",

                  flexWrap:
                    "wrap",

                  marginBottom:
                    "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin:
                        "0 0 6px",

                      fontSize:
                        "21px",
                    }}
                  >
                    Publication
                  </h2>

                  <p
                    style={{
                      margin:
                        0,

                      color:
                        "#64748b",

                      fontSize:
                        "14px",

                      lineHeight:
                        1.6,
                    }}
                  >
                    Publish verified regulatory
                    intelligence after regulatory
                    review and impact analysis
                    have been completed.
                  </p>
                </div>


                {
                  change.published_at
                  ? (
                    <StatusBadge
                      text="Published"
                      tone="success"
                    />
                  )
                  : canPublish
                    ? (
                      <StatusBadge
                        text="Ready to Publish"
                        tone="success"
                      />
                    )
                    : (
                      <StatusBadge
                        text="Not Ready"
                        tone="warning"
                      />
                    )
                }
              </div>


              {
                change.published_at
                ? (
                  <MessageBox
                    tone="success"
                  >
                    This regulatory intelligence
                    was published on{" "}
                    <strong>
                      {
                        formatDate(
                          change.published_at
                        )
                      }
                    </strong>
                    . The regulatory review and
                    impact analysis are now
                    read-only.
                  </MessageBox>
                )
                : canPublish
                  ? (
                    <MessageBox
                      tone="warning"
                    >
                      Regulatory review and impact
                      analysis are complete.
                      Publishing will create the
                      verified TrustGRC regulatory
                      intelligence record and lock
                      the workflow against further
                      modification.
                    </MessageBox>
                  )
                  : (
                    <MessageBox
                      tone="warning"
                    >
                      Publication is not yet
                      available. Complete and
                      confirm the regulatory
                      review and impact analysis
                      first.
                    </MessageBox>
                  )
              }


              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",

                  gap:
                    "14px",

                  marginTop:
                    "18px",
                }}
              >
                <InfoItem
                  label="Review Status"
                  value={
                    formatStatus(
                      change.review_status
                    )
                  }
                />

                <InfoItem
                  label="Review Decision"
                  value={
                    change.review_decision
                      ? formatStatus(
                          change
                            .review_decision
                        )
                      : "Not reviewed"
                  }
                />

                <InfoItem
                  label="Impact Status"
                  value={
                    formatStatus(
                      change.impact_status
                    )
                  }
                />

                <InfoItem
                  label="Impact Level"
                  value={
                    change.impact_level
                      ? formatStatus(
                          change.impact_level
                        )
                      : "Not available"
                  }
                />
              </div>


              {
                change.published_at
                && (
                  <div
                    style={{
                      marginTop:
                        "14px",
                    }}
                  >
                    <InfoItem
                      label="Published At"
                      value={
                        formatDate(
                          change.published_at
                        )
                      }
                    />
                  </div>
                )
              }


              {
                !change.published_at
                && (
                  <div
                    style={{
                      marginTop:
                        "20px",

                      display:
                        "flex",

                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        () => {
                          void publishRegulatoryIntelligence();
                        }
                      }
                      disabled={
                        !canPublish
                        || isPublishing
                      }
                      style={{
                        ...primaryButtonStyle,

                        backgroundColor:
                          !canPublish
                            ? "#94a3b8"
                            : "#16a34a",

                        cursor:
                          !canPublish
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {
                        isPublishing
                          ? "Publishing..."
                          : "Publish Regulatory Intelligence"
                      }
                    </button>
                  </div>
                )
              }
            </SectionCard>
          )
        }


        {/* BOTTOM NAVIGATION */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap:
              "12px",

            flexWrap:
              "wrap",

            padding:
              "4px 0 24px",
          }}
        >
          <Link
            href={
              "/admin/regulatory-intelligence"
            }
            style={
              secondaryLinkStyle
            }
          >
            ← Back to Regulatory Intelligence
          </Link>


          <button
            type="button"
            onClick={
              () => {
                window.scrollTo({
                  top:
                    0,

                  behavior:
                    "smooth",
                });
              }
            }
            style={
              secondaryButtonStyle
            }
          >
            ↑ Back to top
          </button>
        </div>
      </div>
    </main>
  );
}


function SnapshotCard({
  title,
  snapshot,
}: {
  title: string;

  snapshot:
    | RegulatorySnapshot
    | null;
}) {
  return (
    <div
      style={{
        padding:
          "20px",

        border:
          "1px solid #e2e8f0",

        borderRadius:
          "12px",

        backgroundColor:
          "#ffffff",
      }}
    >
      <h2
        style={{
          margin:
            "0 0 16px",

          fontSize:
            "19px",
        }}
      >
        {title}
      </h2>


      {
        !snapshot
        ? (
          <div
            style={{
              padding:
                "14px",

              border:
                "1px solid #fde68a",

              borderRadius:
                "9px",

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
            Snapshot evidence is unavailable
            for this historical change.
          </div>
        )
        : (
          <>
            <InfoItem
              label="Snapshot ID"
              value={
                `#${snapshot.id}`
              }
            />

            <InfoItem
              label="Snapshot Type"
              value={
                formatStatus(
                  snapshot.snapshot_type
                )
              }
            />

            <InfoItem
              label="Retrieval Status"
              value={
                formatStatus(
                  snapshot.retrieval_status
                )
              }
            />

            <InfoItem
              label="Retrieved"
              value={
                formatDate(
                  snapshot.retrieved_at
                )
              }
            />

            <InfoItem
              label="Captured"
              value={
                formatDate(
                  snapshot.captured_at
                )
              }
            />

            <InfoItem
              label="Content Type"
              value={
                snapshot.content_type
                ?? "Not available"
              }
            />

            <InfoItem
              label="Authoritative Identifier"
              value={
                snapshot
                  .authoritative_identifier
                ?? "Not available"
              }
            />

            <InfoItem
              label="Authoritative Version"
              value={
                snapshot
                  .authoritative_version
                ?? "Not available"
              }
            />


            <div
              style={{
                marginTop:
                  "14px",
              }}
            >
              <div
                style={
                  smallLabelStyle
                }
              >
                SHA-256 Content Hash
              </div>

              <div
                style={{
                  marginTop:
                    "4px",

                  padding:
                    "10px",

                  borderRadius:
                    "8px",

                  backgroundColor:
                    "#f8fafc",

                  color:
                    "#334155",

                  fontFamily:
                    "monospace",

                  fontSize:
                    "11px",

                  overflowWrap:
                    "anywhere",
                }}
              >
                {
                  snapshot
                    .content_hash
                }
              </div>
            </div>


            {
              snapshot.source_url
              && (
                <div
                  style={{
                    marginTop:
                      "14px",
                  }}
                >
                  <a
                    href={
                      snapshot.source_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color:
                        "#2563eb",

                      fontWeight:
                        700,

                      fontSize:
                        "13px",

                      textDecoration:
                        "none",
                    }}
                  >
                    Open Retrieved Source ↗
                  </a>
                </div>
              )
            }


            <details
              style={{
                marginTop:
                  "18px",
              }}
            >
              <summary
                style={{
                  cursor:
                    "pointer",

                  color:
                    "#334155",

                  fontWeight:
                    700,

                  fontSize:
                    "13px",
                }}
              >
                View Captured Regulatory Text
              </summary>

              <pre
                style={{
                  marginTop:
                    "12px",

                  padding:
                    "14px",

                  maxHeight:
                    "320px",

                  overflow:
                    "auto",

                  whiteSpace:
                    "pre-wrap",

                  wordBreak:
                    "break-word",

                  border:
                    "1px solid #e2e8f0",

                  borderRadius:
                    "8px",

                  backgroundColor:
                    "#f8fafc",

                  fontFamily:
                    "inherit",

                  fontSize:
                    "12px",

                  lineHeight:
                    1.6,
                }}
              >
                {
                  snapshot
                    .normalized_content
                }
              </pre>
            </details>
          </>
        )
      }
    </div>
  );
}


function SectionCard({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom:
          "20px",

        padding:
          "22px",

        border:
          "1px solid #e2e8f0",

        borderRadius:
          "12px",

        backgroundColor:
          "#ffffff",
      }}
    >
      {children}
    </section>
  );
}


function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        marginBottom:
          "10px",
      }}
    >
      <div
        style={
          smallLabelStyle
        }
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "3px",

          color:
            "#334155",

          fontSize:
            "13px",

          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}


function MessageBox({
  children,
  tone,
}: {
  children:
    React.ReactNode;

  tone:
    | "success"
    | "warning"
    | "danger";
}) {
  const styleMap = {
    success: {
      border:
        "#bbf7d0",

      background:
        "#f0fdf4",

      color:
        "#166534",
    },

    warning: {
      border:
        "#fde68a",

      background:
        "#fffbeb",

      color:
        "#92400e",
    },

    danger: {
      border:
        "#fecaca",

      background:
        "#fef2f2",

      color:
        "#991b1b",
    },
  }[tone];


  return (
    <div
      style={{
        marginBottom:
          "18px",

        padding:
          "14px 16px",

        border:
          `1px solid ${styleMap.border}`,

        borderRadius:
          "10px",

        backgroundColor:
          styleMap.background,

        color:
          styleMap.color,

        fontSize:
          "13px",

        lineHeight:
          1.6,
      }}
    >
      {children}
    </div>
  );
}


function StatusBadge({
  text,
  tone,
}: {
  text: string;

  tone:
    | "success"
    | "warning"
    | "neutral";
}) {
  const styles = {
    success: {
      background:
        "#f0fdf4",

      border:
        "#bbf7d0",

      color:
        "#166534",
    },

    warning: {
      background:
        "#fffbeb",

      border:
        "#fde68a",

      color:
        "#92400e",
    },

    neutral: {
      background:
        "#f1f5f9",

      border:
        "#e2e8f0",

      color:
        "#475569",
    },
  }[tone];


  return (
    <span
      style={{
        display:
          "inline-block",

        padding:
          "5px 9px",

        border:
          `1px solid ${styles.border}`,

        borderRadius:
          "999px",

        backgroundColor:
          styles.background,

        color:
          styles.color,

        fontSize:
          "11px",

        fontWeight:
          800,
      }}
    >
      {text}
    </span>
  );
}


function formatStatus(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character
          .toUpperCase()
    );
}


function formatDate(
  value:
    | string
    | null
) {
  if (
    !value
  ) {
    return "Not available";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }


  return date
    .toLocaleString();
}


function formatRatio(
  value:
    | number
    | null
) {
  if (
    value === null
    || value === undefined
  ) {
    return "Not available";
  }


  return `${(
    value * 100
  ).toFixed(3)}%`;
}


const labelStyle:
  React.CSSProperties = {
    display:
      "block",

    marginBottom:
      "7px",

    color:
      "#334155",

    fontSize:
      "13px",

    fontWeight:
      800,
  };


const smallLabelStyle:
  React.CSSProperties = {
    color:
      "#64748b",

    fontSize:
      "11px",

    fontWeight:
      800,

    textTransform:
      "uppercase",

    letterSpacing:
      "0.04em",
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
      "14px",
  };


const primaryButtonStyle:
  React.CSSProperties = {
    padding:
      "11px 20px",

    border:
      0,

    borderRadius:
      "9px",

    color:
      "#ffffff",

    fontWeight:
      800,

    fontSize:
      "13px",
  };


const secondaryLinkStyle:
  React.CSSProperties = {
    display:
      "inline-block",

    padding:
      "11px 16px",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "9px",

    backgroundColor:
      "#ffffff",

    color:
      "#334155",

    fontSize:
      "13px",

    fontWeight:
      700,

    textDecoration:
      "none",
  };


const secondaryButtonStyle:
  React.CSSProperties = {
    padding:
      "11px 16px",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "9px",

    backgroundColor:
      "#ffffff",

    color:
      "#334155",

    cursor:
      "pointer",

    fontSize:
      "13px",

    fontWeight:
      700,
  };