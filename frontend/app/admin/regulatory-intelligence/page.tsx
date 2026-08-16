"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  getAccessToken,
  getStoredUser,
  isPlatformRole,
} from "../../../lib/auth";


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


type RegulatoryChange = {
  id: number;
  source_id: number;

  old_hash: string | null;
  new_hash: string;

  change_type: string;

  review_status: string;
  review_decision: string | null;
  review_notes: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;

  impact_status: string;
  impact_level: string | null;
  impact_summary: string | null;

  summary: string | null;

  detected_at: string;
  published_at: string | null;
};


type ApiError = {
  detail?: string;
};


export default function RegulatoryIntelligencePage() {
  const [
    sources,
    setSources,
  ] = useState<RegulatorySource[]>([]);

  const [
    changes,
    setChanges,
  ] = useState<RegulatoryChange[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  useEffect(() => {
    async function loadData() {
      const user =
        getStoredUser();

      const token =
        getAccessToken();

      if (
        !user ||
        !token ||
        !isPlatformRole(
          user.role
        )
      ) {
        setErrorMessage(
          "Platform administrator access is required."
        );

        setIsLoading(false);
        return;
      }

      if (!API_URL) {
        setErrorMessage(
          "NEXT_PUBLIC_API_URL is not configured."
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const headers = {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        };


        const [
          sourcesResponse,
          changesResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/v1/regulatory-intelligence/sources`,
            {
              headers,
            }
          ),

          fetch(
            `${API_URL}/api/v1/regulatory-intelligence/changes`,
            {
              headers,
            }
          ),
        ]);


        const sourcesData =
          (await sourcesResponse.json()) as
            | RegulatorySource[]
            | ApiError;

        const changesData =
          (await changesResponse.json()) as
            | RegulatoryChange[]
            | ApiError;


        if (!sourcesResponse.ok) {
          throw new Error(
            "detail" in sourcesData &&
              sourcesData.detail
              ? sourcesData.detail
              : "Unable to load regulatory sources."
          );
        }


        if (!changesResponse.ok) {
          throw new Error(
            "detail" in changesData &&
              changesData.detail
              ? changesData.detail
              : "Unable to load regulatory changes."
          );
        }


        setSources(
          sourcesData as RegulatorySource[]
        );

        setChanges(
          changesData as RegulatoryChange[]
        );
      } catch (error) {
        console.error(
          "Regulatory Intelligence load error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Regulatory Intelligence."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();

  }, []);


  const pendingReviewCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.review_status
            === "pending_review"
        ).length,
      [changes]
    );


  const impactRequiredCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.impact_status
            === "analysis_required"
        ).length,
      [changes]
    );


  const publishedCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.published_at
            !== null
        ).length,
      [changes]
    );


  const dismissedCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.review_decision
            === "dismissed"
        ).length,
      [changes]
    );


  const sourceMap =
    useMemo(() => {
      const map =
        new Map<
          number,
          RegulatorySource
        >();

      for (
        const source
        of sources
      ) {
        map.set(
          source.id,
          source
        );
      }

      return map;
    }, [sources]);


  const reviewQueue =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.published_at
              === null
        ),
      [changes]
    );


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
              "32px",
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
                  "36px",
                lineHeight:
                  1.2,
              }}
            >
              Regulatory Intelligence
            </h1>

            <p
              style={{
                margin:
                  0,
                color:
                  "#64748b",
                fontSize:
                  "16px",
                lineHeight:
                  1.6,
              }}
            >
              Monitor authoritative regulatory
              sources, review detected changes,
              analyse impact and publish verified
              regulatory intelligence.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            style={{
              padding:
                "10px 16px",
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
            }}
          >
            ← Admin Dashboard
          </Link>
        </div>


        {errorMessage && (
          <div
            style={{
              marginBottom:
                "24px",
              padding:
                "14px 16px",
              border:
                "1px solid #fecaca",
              borderRadius:
                "10px",
              backgroundColor:
                "#fef2f2",
              color:
                "#991b1b",
            }}
          >
            {errorMessage}
          </div>
        )}


        {isLoading ? (
          <div
            style={{
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
            Loading Regulatory Intelligence...
          </div>
        ) : (
          <>
            {/* OVERVIEW CARDS */}

            <section
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap:
                  "18px",
                marginBottom:
                  "32px",
              }}
            >
              <MetricCard
                title="Pending Review"
                value={
                  pendingReviewCount
                }
                description={
                  "Detected changes awaiting human review."
                }
              />

              <MetricCard
                title="Impact Required"
                value={
                  impactRequiredCount
                }
                description={
                  "Confirmed changes awaiting impact analysis."
                }
              />

              <MetricCard
                title="Published"
                value={
                  publishedCount
                }
                description={
                  "Verified regulatory intelligence published."
                }
              />

              <MetricCard
                title="Dismissed"
                value={
                  dismissedCount
                }
                description={
                  "Detected changes determined to be non-substantive."
                }
              />
            </section>


            {/* SOURCE OVERVIEW */}

            <section
              style={{
                marginBottom:
                  "32px",
              }}
            >
              <div
                style={{
                  marginBottom:
                    "14px",
                }}
              >
                <h2
                  style={{
                    margin:
                      0,
                    fontSize:
                      "22px",
                  }}
                >
                  Regulatory Sources
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "#64748b",
                    fontSize:
                      "14px",
                  }}
                >
                  Authoritative sources currently
                  registered for monitoring.
                </p>
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap:
                    "16px",
                }}
              >
                {sources.map(
                  (source) => (
                    <div
                      key={
                        source.id
                      }
                      style={{
                        padding:
                          "18px",
                        border:
                          "1px solid #e2e8f0",
                        borderRadius:
                          "12px",
                        backgroundColor:
                          "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "12px",
                        }}
                      >
                        <div>
                          <strong>
                            {
                              source.regulation_name
                            }
                          </strong>

                          <div
                            style={{
                              marginTop:
                                "4px",
                              color:
                                "#64748b",
                              fontSize:
                                "13px",
                            }}
                          >
                            {
                              source.jurisdiction_name
                            }
                          </div>
                        </div>

                        <StatusBadge
                          text={
                            source.monitoring_enabled
                              ? "Monitoring"
                              : "Disabled"
                          }
                          tone={
                            source.monitoring_enabled
                              ? "success"
                              : "neutral"
                          }
                        />
                      </div>

                      <div
                        style={{
                          marginTop:
                            "14px",
                          color:
                            "#64748b",
                          fontSize:
                            "12px",
                          lineHeight:
                            1.6,
                        }}
                      >
                        Authority:{" "}
                        {
                          source.authority
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            "4px",
                          color:
                            "#64748b",
                          fontSize:
                            "12px",
                        }}
                      >
                        Last checked:{" "}
                        {
                          formatDate(
                            source.last_checked_at
                          )
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>


            {/* REVIEW QUEUE */}

            <section>
              <div
                style={{
                  marginBottom:
                    "14px",
                }}
              >
                <h2
                  style={{
                    margin:
                      0,
                    fontSize:
                      "22px",
                  }}
                >
                  Change Review Queue
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "#64748b",
                    fontSize:
                      "14px",
                  }}
                >
                  Review detected regulatory changes
                  before they become published
                  intelligence.
                </p>
              </div>


              <div
                style={{
                  overflowX:
                    "auto",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius:
                    "12px",
                  backgroundColor:
                    "#ffffff",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <TableHeader>
                        Regulation
                      </TableHeader>

                      <TableHeader>
                        Jurisdiction
                      </TableHeader>

                      <TableHeader>
                        Detected
                      </TableHeader>

                      <TableHeader>
                        Review
                      </TableHeader>

                      <TableHeader>
                        Impact
                      </TableHeader>

                      <TableHeader>
                        Action
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {reviewQueue.length
                      === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            6
                          }
                          style={{
                            padding:
                              "24px",
                            color:
                              "#64748b",
                            textAlign:
                              "center",
                          }}
                        >
                          No regulatory changes
                          currently require review.
                        </td>
                      </tr>
                    ) : (
                      reviewQueue.map(
                        (change) => {
                          const source =
                            sourceMap.get(
                              change.source_id
                            );

                          return (
                            <tr
                              key={
                                change.id
                              }
                              style={{
                                borderTop:
                                  "1px solid #e2e8f0",
                              }}
                            >
                              <TableCell>
                                {
                                  source?.regulation_name
                                  ?? `Source ${change.source_id}`
                                }
                              </TableCell>

                              <TableCell>
                                {
                                  source?.jurisdiction_name
                                  ?? "Unknown"
                                }
                              </TableCell>

                              <TableCell>
                                {
                                  formatDate(
                                    change.detected_at
                                  )
                                }
                              </TableCell>

                              <TableCell>
                                <StatusBadge
                                  text={
                                    formatStatus(
                                      change.review_status
                                    )
                                  }
                                  tone={
                                    getReviewTone(
                                      change.review_status
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                <StatusBadge
                                  text={
                                    formatStatus(
                                      change.impact_status
                                    )
                                  }
                                  tone={
                                    getImpactTone(
                                      change.impact_status
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                <Link
                                  href={
                                    `/admin/regulatory-intelligence/changes/${change.id}`
                                  }
                                  style={{
                                    color:
                                      "#2563eb",
                                    fontWeight:
                                      700,
                                    textDecoration:
                                      "none",
                                    fontSize:
                                      "13px",
                                  }}
                                >
                                  Review →
                                </Link>
                              </TableCell>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}


function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
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
      <div
        style={{
          color:
            "#64748b",
          fontSize:
            "13px",
          fontWeight:
            700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:
            "6px",
          fontSize:
            "32px",
          fontWeight:
            800,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop:
            "8px",
          color:
            "#64748b",
          fontSize:
            "12px",
          lineHeight:
            1.5,
        }}
      >
        {description}
      </div>
    </div>
  );
}


function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        padding:
          "13px 14px",
        textAlign:
          "left",
        color:
          "#475569",
        fontSize:
          "12px",
        fontWeight:
          800,
        backgroundColor:
          "#f8fafc",
      }}
    >
      {children}
    </th>
  );
}


function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding:
          "14px",
        color:
          "#334155",
        fontSize:
          "13px",
        verticalAlign:
          "middle",
      }}
    >
      {children}
    </td>
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
    | "danger"
    | "neutral";
}) {
  const styles = {
    success: {
      background:
        "#f0fdf4",
      color:
        "#166534",
      border:
        "#bbf7d0",
    },

    warning: {
      background:
        "#fffbeb",
      color:
        "#92400e",
      border:
        "#fde68a",
    },

    danger: {
      background:
        "#fef2f2",
      color:
        "#991b1b",
      border:
        "#fecaca",
    },

    neutral: {
      background:
        "#f1f5f9",
      color:
        "#475569",
      border:
        "#e2e8f0",
    },
  }[tone];

  return (
    <span
      style={{
        display:
          "inline-block",
        padding:
          "4px 8px",
        borderRadius:
          "999px",
        border:
          `1px solid ${styles.border}`,
        backgroundColor:
          styles.background,
        color:
          styles.color,
        fontSize:
          "11px",
        fontWeight:
          700,
      }}
    >
      {text}
    </span>
  );
}


function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}


function formatStatus(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function getReviewTone(
  value: string
):
  | "success"
  | "warning"
  | "danger"
  | "neutral" {
  if (
    value
    === "reviewed"
  ) {
    return "success";
  }

  if (
    value
    === "pending_review"
    || value
    === "in_review"
  ) {
    return "warning";
  }

  return "neutral";
}


function getImpactTone(
  value: string
):
  | "success"
  | "warning"
  | "danger"
  | "neutral" {
  if (
    value
    === "analysed"
  ) {
    return "success";
  }

  if (
    value
    === "analysis_required"
    || value
    === "analysing"
  ) {
    return "warning";
  }

  if (
    value
    === "not_applicable"
  ) {
    return "neutral";
  }

  return "neutral";
}