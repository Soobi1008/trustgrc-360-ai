"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  clearAuthentication,
  getAccessToken,
  getStoredUser,
  isPlatformRole,
} from "../../../lib/auth";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "";


/* =========================================================
   TYPES
========================================================= */

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

  published_by_user_id: number | null;
  published_by_name: string | null;
  published_at: string | null;
};


type ApiError = {
  detail?: string;
};


/* =========================================================
   PAGE
========================================================= */

export default function RegulatoryIntelligencePage() {
  const router =
    useRouter();


  const [
    sources,
    setSources,
  ] = useState<
    RegulatorySource[]
  >([]);


  const [
    changes,
    setChanges,
  ] = useState<
    RegulatoryChange[]
  >([]);


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /* =======================================================
     LOAD REGULATORY INTELLIGENCE
  ======================================================= */

  useEffect(() => {
    let isMounted =
      true;


    async function loadData() {
      const user =
        getStoredUser();

      const token =
        getAccessToken();


      /* ===================================================
         FRONTEND AUTHENTICATION GATE
      =================================================== */

      if (
        !user
        ||
        !token
        ||
        !user.is_active
        ||
        !isPlatformRole(
          user.role
        )
      ) {
        clearAuthentication();

        router.replace(
          "/login"
        );

        return;
      }


      /* ===================================================
         API CONFIGURATION
      =================================================== */

      if (
        !API_URL
      ) {
        if (
          isMounted
        ) {
          setErrorMessage(
            "NEXT_PUBLIC_API_URL is not configured."
          );

          setIsLoading(
            false
          );
        }

        return;
      }


      try {
        if (
          isMounted
        ) {
          setIsLoading(
            true
          );

          setErrorMessage(
            ""
          );
        }


        const headers = {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        };


        /* ===============================================
           LOAD SOURCES + CHANGES
        =============================================== */

        const [
          sourcesResponse,
          changesResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/v1/regulatory-intelligence/sources`,
            {
              headers,

              cache:
                "no-store",
            }
          ),

          fetch(
            `${API_URL}/api/v1/regulatory-intelligence/changes`,
            {
              headers,

              cache:
                "no-store",
            }
          ),
        ]);


        /* ===============================================
           INVALID / EXPIRED CREDENTIALS
        =============================================== */

        if (
          sourcesResponse.status
          === 401
          ||
          changesResponse.status
          === 401
        ) {
          clearAuthentication();

          router.replace(
            "/login"
          );

          return;
        }


        /* ===============================================
           AUTHENTICATED BUT NOT AUTHORISED
        =============================================== */

        if (
          sourcesResponse.status
          === 403
          ||
          changesResponse.status
          === 403
        ) {
          if (
            isMounted
          ) {
            setErrorMessage(
              "You are authenticated, but you "
              + "do not have permission to access "
              + "Regulatory Intelligence."
            );
          }

          return;
        }


        /* ===============================================
           PARSE RESPONSES
        =============================================== */

        const sourcesData =
          (
            await sourcesResponse.json()
          ) as
            | RegulatorySource[]
            | ApiError;


        const changesData =
          (
            await changesResponse.json()
          ) as
            | RegulatoryChange[]
            | ApiError;


        /* ===============================================
           SOURCE API ERROR
        =============================================== */

        if (
          !sourcesResponse.ok
        ) {
          const message =
            (
              "detail" in sourcesData
              &&
              sourcesData.detail
            )
              ? sourcesData.detail
              : (
                "Unable to load "
                + "regulatory sources."
              );


          if (
            isMounted
          ) {
            setErrorMessage(
              message
            );
          }

          return;
        }


        /* ===============================================
           CHANGE API ERROR
        =============================================== */

        if (
          !changesResponse.ok
        ) {
          const message =
            (
              "detail" in changesData
              &&
              changesData.detail
            )
              ? changesData.detail
              : (
                "Unable to load "
                + "regulatory changes."
              );


          if (
            isMounted
          ) {
            setErrorMessage(
              message
            );
          }

          return;
        }


        /* ===============================================
           SUCCESS
        =============================================== */

        if (
          isMounted
        ) {
          setSources(
            sourcesData as
              RegulatorySource[]
          );

          setChanges(
            changesData as
              RegulatoryChange[]
          );

          setErrorMessage(
            ""
          );
        }

      } catch (error) {
        console.error(
          "Regulatory Intelligence load error:",
          error
        );


        if (
          isMounted
        ) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : (
                "Unable to load "
                + "Regulatory Intelligence."
              )
          );
        }

      } finally {
        if (
          isMounted
        ) {
          setIsLoading(
            false
          );
        }
      }
    }


    void loadData();


    return () => {
      isMounted =
        false;
    };

  }, [
    router,
  ]);


  /* =======================================================
     DASHBOARD METRICS
  ======================================================= */

  const pendingReviewCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.review_status
            === "pending_review"
        ).length,
      [
        changes,
      ]
    );


  const impactRequiredCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.impact_status
            === "analysis_required"
        ).length,
      [
        changes,
      ]
    );


  const publishedCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.published_at
            !== null
        ).length,
      [
        changes,
      ]
    );


  const dismissedCount =
    useMemo(
      () =>
        changes.filter(
          (change) =>
            change.review_decision
            === "dismissed"
        ).length,
      [
        changes,
      ]
    );


  /* =======================================================
     SOURCE LOOKUP
  ======================================================= */

  const sourceMap =
    useMemo(
      () => {
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
      },
      [
        sources,
      ]
    );


  /* =======================================================
     ACTIVE REVIEW QUEUE
  ======================================================= */

  const reviewQueue =
    useMemo(
      () =>
        changes
          .filter(
            (change) =>
              change.published_at
              === null
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                second.detected_at
              ).getTime()
              -
              new Date(
                first.detected_at
              ).getTime()
          ),
      [
        changes,
      ]
    );


  /* =======================================================
     PUBLISHED INTELLIGENCE
  ======================================================= */

  const publishedChanges =
    useMemo(
      () =>
        changes
          .filter(
            (change) =>
              change.published_at
              !== null
          )
          .sort(
            (
              first,
              second
            ) => {
              const firstDate =
                first.published_at
                  ? new Date(
                      first.published_at
                    ).getTime()
                  : 0;


              const secondDate =
                second.published_at
                  ? new Date(
                      second.published_at
                    ).getTime()
                  : 0;


              return (
                secondDate
                -
                firstDate
              );
            }
          ),
      [
        changes,
      ]
    );


  /* =======================================================
     PAGE
  ======================================================= */

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


        {/* ERROR */}

        {
          errorMessage
          && (
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

                lineHeight:
                  1.6,
              }}
            >
              {errorMessage}
            </div>
          )
        }


        {/* LOADING */}

        {
          isLoading
          ? (
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
          )
          : (
            <>
              {/* =========================================
                  OVERVIEW CARDS
              ========================================= */}

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
                    "Detected changes awaiting "
                    + "human review."
                  }
                />


                <MetricCard
                  title="Impact Required"
                  value={
                    impactRequiredCount
                  }
                  description={
                    "Confirmed changes awaiting "
                    + "impact analysis."
                  }
                />


                <MetricCard
                  title="Published"
                  value={
                    publishedCount
                  }
                  description={
                    "Verified regulatory "
                    + "intelligence published."
                  }
                  href={
                    "#published-regulatory-intelligence"
                  }
                  linkText={
                    "View published intelligence ↓"
                  }
                />


                <MetricCard
                  title="Dismissed"
                  value={
                    dismissedCount
                  }
                  description={
                    "Detected changes determined "
                    + "to be non-substantive."
                  }
                />
              </section>


              {/* =========================================
                  REGULATORY SOURCES
              ========================================= */}

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
                  {
                    sources.length
                    === 0
                    ? (
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

                          color:
                            "#64748b",

                          fontSize:
                            "13px",
                        }}
                      >
                        No regulatory sources
                        are currently available.
                      </div>
                    )
                    : (
                      sources.map(
                        (
                          source
                        ) => (
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

                                alignItems:
                                  "flex-start",

                                gap:
                                  "12px",
                              }}
                            >
                              <div>
                                <strong>
                                  {
                                    source
                                      .regulation_name
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
                                    source
                                      .jurisdiction_name
                                  }
                                </div>
                              </div>


                              <StatusBadge
                                text={
                                  source
                                    .monitoring_enabled
                                    ? "Monitoring"
                                    : "Disabled"
                                }
                                tone={
                                  source
                                    .monitoring_enabled
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
                                  source
                                    .last_checked_at
                                )
                              }
                            </div>
                          </div>
                        )
                      )
                    )
                  }
                </div>
              </section>


              {/* =========================================
                  CHANGE REVIEW QUEUE
              ========================================= */}

              <section
                style={{
                  marginBottom:
                    "40px",
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
                    Review detected regulatory
                    changes before they become
                    published intelligence.
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
                      {
                        reviewQueue.length
                        === 0
                        ? (
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
                        )
                        : (
                          reviewQueue.map(
                            (
                              change
                            ) => {
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
                                      source
                                        ?.regulation_name
                                      ?? (
                                        `Source ${change.source_id}`
                                      )
                                    }
                                  </TableCell>


                                  <TableCell>
                                    {
                                      source
                                        ?.jurisdiction_name
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
                                      style={
                                        actionLinkStyle
                                      }
                                    >
                                      {
                                        change.review_status
                                        === "pending_review"
                                          ? "Review →"
                                          : "Open →"
                                      }
                                    </Link>
                                  </TableCell>
                                </tr>
                              );
                            }
                          )
                        )
                      }
                    </tbody>
                  </table>
                </div>
              </section>


              {/* =========================================
                  PUBLISHED REGULATORY INTELLIGENCE
              ========================================= */}

              <section
                id={
                  "published-regulatory-intelligence"
                }
                style={{
                  scrollMarginTop:
                    "24px",

                  marginBottom:
                    "32px",
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

                    gap:
                      "16px",

                    flexWrap:
                      "wrap",

                    marginBottom:
                      "14px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin:
                          0,

                        fontSize:
                          "22px",
                      }}
                    >
                      Published Regulatory Intelligence
                    </h2>


                    <p
                      style={{
                        margin:
                          "6px 0 0",

                        color:
                          "#64748b",

                        fontSize:
                          "14px",

                        lineHeight:
                          1.6,
                      }}
                    >
                      Verified regulatory intelligence
                      that has completed human review,
                      impact analysis and publication.
                    </p>
                  </div>


                  <StatusBadge
                    text={
                      `${publishedChanges.length} Published`
                    }
                    tone="success"
                  />
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
                          Classification
                        </TableHeader>

                        <TableHeader>
                          Impact
                        </TableHeader>

                        <TableHeader>
                          Published By
                        </TableHeader>

                        <TableHeader>
                          Published
                        </TableHeader>

                        <TableHeader>
                          Action
                        </TableHeader>
                      </tr>
                    </thead>


                    <tbody>
                      {
                        publishedChanges.length
                        === 0
                        ? (
                          <tr>
                            <td
                              colSpan={
                                7
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
                              No regulatory intelligence
                              has been published yet.
                            </td>
                          </tr>
                        )
                        : (
                          publishedChanges.map(
                            (
                              change
                            ) => {
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
                                    <div
                                      style={{
                                        fontWeight:
                                          700,

                                        color:
                                          "#0f172a",
                                      }}
                                    >
                                      {
                                        source
                                          ?.regulation_name
                                        ?? (
                                          `Source ${change.source_id}`
                                        )
                                      }
                                    </div>


                                    <div
                                      style={{
                                        marginTop:
                                          "3px",

                                        color:
                                          "#64748b",

                                        fontSize:
                                          "11px",
                                      }}
                                    >
                                      Change #
                                      {
                                        change.id
                                      }
                                    </div>
                                  </TableCell>


                                  <TableCell>
                                    {
                                      source
                                        ?.jurisdiction_name
                                      ?? "Unknown"
                                    }
                                  </TableCell>


                                  <TableCell>
                                    <StatusBadge
                                      text={
                                        formatStatus(
                                          change.change_type
                                        )
                                      }
                                      tone="neutral"
                                    />
                                  </TableCell>


                                  <TableCell>
                                    <StatusBadge
                                      text={
                                        change.impact_level
                                          ? formatStatus(
                                              change.impact_level
                                            )
                                          : "Not Available"
                                      }
                                      tone={
                                        getPublishedImpactTone(
                                          change.impact_level
                                        )
                                      }
                                    />
                                  </TableCell>


                                  <TableCell>
                                    {
                                      change.published_by_name
                                      ?? "—"
                                    }
                                  </TableCell>


                                  <TableCell>
                                    {
                                      formatDate(
                                        change.published_at
                                      )
                                    }
                                  </TableCell>


                                  <TableCell>
                                    <Link
                                      href={
                                        `/admin/regulatory-intelligence/changes/${change.id}`
                                      }
                                      style={
                                        actionLinkStyle
                                      }
                                    >
                                      View →
                                    </Link>
                                  </TableCell>
                                </tr>
                              );
                            }
                          )
                        )
                      }
                    </tbody>
                  </table>
                </div>


                <div
                  style={{
                    marginTop:
                      "14px",

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
              </section>
            </>
          )
        }
      </div>
    </main>
  );
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  description,
  href,
  linkText,
}: {
  title: string;
  value: number;
  description: string;
  href?: string;
  linkText?: string;
}) {
  const card = (
    <div
      style={{
        height:
          "100%",

        boxSizing:
          "border-box",

        padding:
          "20px",

        border:
          "1px solid #e2e8f0",

        borderRadius:
          "12px",

        backgroundColor:
          "#ffffff",

        transition:
          "border-color 0.15s ease",
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

          color:
            "#0f172a",
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


      {
        href
        && linkText
        && (
          <div
            style={{
              marginTop:
                "12px",

              color:
                "#2563eb",

              fontSize:
                "12px",

              fontWeight:
                700,
            }}
          >
            {linkText}
          </div>
        )
      }
    </div>
  );


  if (
    href
  ) {
    return (
      <a
        href={
          href
        }
        style={{
          display:
            "block",

          color:
            "inherit",

          textDecoration:
            "none",
        }}
      >
        {card}
      </a>
    );
  }


  return card;
}


/* =========================================================
   TABLE HELPERS
========================================================= */

function TableHeader({
  children,
}: {
  children:
    React.ReactNode;
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

        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </th>
  );
}


function TableCell({
  children,
}: {
  children:
    React.ReactNode;
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


/* =========================================================
   STATUS BADGE
========================================================= */

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

        whiteSpace:
          "nowrap",
      }}
    >
      {text}
    </span>
  );
}


/* =========================================================
   FORMATTERS
========================================================= */

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


/* =========================================================
   REVIEW STATUS TONE
========================================================= */

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
    ||
    value
    === "in_review"
  ) {
    return "warning";
  }


  return "neutral";
}


/* =========================================================
   IMPACT STATUS TONE
========================================================= */

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
    ||
    value
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


/* =========================================================
   PUBLISHED IMPACT LEVEL TONE
========================================================= */

function getPublishedImpactTone(
  value:
    | string
    | null
):
  | "success"
  | "warning"
  | "danger"
  | "neutral" {
  if (
    value
    === "critical"
    ||
    value
    === "high"
  ) {
    return "danger";
  }


  if (
    value
    === "moderate"
  ) {
    return "warning";
  }


  if (
    value
    === "low"
  ) {
    return "success";
  }


  return "neutral";
}


/* =========================================================
   SHARED STYLES
========================================================= */

const actionLinkStyle:
  React.CSSProperties = {
    color:
      "#2563eb",

    fontWeight:
      700,

    textDecoration:
      "none",

    fontSize:
      "13px",

    whiteSpace:
      "nowrap",
  };


const secondaryButtonStyle:
  React.CSSProperties = {
    padding:
      "10px 14px",

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