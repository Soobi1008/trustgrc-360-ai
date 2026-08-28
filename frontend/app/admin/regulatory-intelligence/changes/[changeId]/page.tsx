"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  regulation_id:
    | number
    | null;
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

  published_by_user_id: number | null;
  published_by_name: string | null;
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
  published_by_user_id: number;
  published_by_name: string;
  published_at: string;
  message: string;
};


type ApiError = {
  detail?:
    | string
    | Array<{
        loc?: Array<string | number>;
        msg?: string;
        type?: string;
      }>;
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

  type AnalysisOrigin =
  | "human"
  | "ai_assisted"
  | "system_generated";


  type RegulatoryChangeAnalysis = {
    id: number;

    regulatory_change_id: number;

    analysis_version: number;

    analysis_status: string;

    analysis_origin: string;

    analysis_method:
      | string
      | null;

    overall_impact_level:
      | string
      | null;

    executive_summary:
      | string
      | null;

    generated_by_model:
      | string
      | null;

    generated_at:
      | string
      | null;

    validated_by_user_id:
      | number
      | null;

    validated_at:
      | string
      | null;

    validation_notes:
      | string
      | null;

    supersedes_analysis_id:
      | number
      | null;

    created_at: string;

    updated_at: string;
  };


  type RegulatoryChangeAnalysisListResponse = {
    change_id: number;

    analyses:
      RegulatoryChangeAnalysis[];

    count: number;
  };


  type RegulatoryKnowledgeRegulation = {
    id: number;

    name: string;

    short_name:
      | string
      | null;

    regulation_type?: string;

    summary?:
      | string
      | null;

    regulatory_authority?:
      | string
      | null;

    official_source_url?:
      | string
      | null;

    status?: string;
  };


  type RegulatoryKnowledgeArticle = {
    id: number;

    regulation_id: number;

    article_number: string;

    title:
      | string
      | null;

    official_text?:
      | string
      | null;

    summary?:
      | string
      | null;

    source_url?:
      | string
      | null;

    version?: string;

    effective_from?:
      | string
      | null;

    effective_to?:
      | string
      | null;

    last_verified_at?:
      | string
      | null;
  };


  type RegulatoryKnowledgeObligation = {
    id: number;

    article_id: number;

    obligation_code: string;

    obligation_text: string;

    obligation_type?: string;

    applies_to?:
      | string
      | null;

    applicability_condition?:
      | string
      | null;

    mandatory?: boolean;

    risk_level?: string;
  };


  type RegulatoryKnowledgeControl = {
    id: number;

    obligation_id: number;

    control_code: string;

    control_name: string;

    control_description:
      | string
      | null;

    evidence_required:
      | string
      | null;

    test_method:
      | string
      | null;
  };


  type RegulatoryProvisionImpact = {
    id: number;

    analysis_id: number;

    regulation_id:
      | number
      | null;

    regulation_article_id:
      | number
      | null;

    regulation_obligation_id:
      | number
      | null;

    provision_reference: string;

    provision_title:
      | string
      | null;

    change_type: string;

    previous_requirement:
      | string
      | null;

    current_requirement:
      | string
      | null;

    change_explanation:
      | string
      | null;

    legal_interpretation:
      | string
      | null;

    operational_impact:
      | string
      | null;

    compliance_governance_impact:
      | string
      | null;

    evidence_documentation:
      | string
      | null;

    recommended_action:
      | string
      | null;

    impact_level:
      | string
      | null;

    source_snapshot_id:
      | number
      | null;

    source_url:
      | string
      | null;

    review_status: string;

    review_notes:
      | string
      | null;

    reviewed_by_user_id:
      | number
      | null;

    reviewed_at:
      | string
      | null;

    created_at: string;

    updated_at: string;
  };


  type RegulatoryProvisionReviewHistory = {
    id: number;

    provision_impact_id:
      number;

    review_status:
      string;

    review_notes:
      string;

    reviewed_by_user_id:
      | number
      | null;

    reviewed_at:
      string;

    created_at:
      string;
  };


  type RegulatoryProvisionImpactDetail = {
    impact:
      RegulatoryProvisionImpact;

    review_history:
      RegulatoryProvisionReviewHistory[];

    regulation:
      | RegulatoryKnowledgeRegulation
      | null;

    article:
      | RegulatoryKnowledgeArticle
      | null;

    obligation:
      | RegulatoryKnowledgeObligation
      | null;

    controls:
      RegulatoryKnowledgeControl[];

    source_snapshot:
      | RegulatorySnapshot
      | null;
  };


  type RegulatoryChangeAnalysisDetail = {
    analysis:
      RegulatoryChangeAnalysis;

    change:
      RegulatoryChange;

    source:
      RegulatorySource;

    regulation:
      | RegulatoryKnowledgeRegulation
      | null;

    provision_impacts:
      RegulatoryProvisionImpactDetail[];

    provision_count: number;

    validated_provision_count: number;

    affected_control_count: number;
  };


  type RegulatoryChangeAnalysisCreateResponse = {
    analysis:
      RegulatoryChangeAnalysis;

    message: string;
  };


  type RegulatoryChangeAnalysisValidationResponse = {
    id: number;

    analysis_status: string;

    validated_by_user_id: number;

    validated_at: string;

    validation_notes: string;

    message: string;
  };


  type KnowledgePackControl = {
    id: number;

    control_code: string;

    control_name: string;

    control_description:
      | string
      | null;

    evidence_required:
      | string
      | null;

    test_method:
      | string
      | null;
  };


  type KnowledgePackObligation = {
    id: number;

    obligation_code: string;

    obligation_text: string;

    obligation_type: string;

    applies_to:
      | string
      | null;

    applicability_condition:
      | string
      | null;

    mandatory: boolean;

    risk_level: string;

    controls:
      KnowledgePackControl[];
  };


  type KnowledgePackArticle = {
    id: number;

    article_number: string;

    title:
      | string
      | null;

    summary:
      | string
      | null;

    source_url:
      | string
      | null;

    version: string;

    effective_from:
      | string
      | null;

    effective_to:
      | string
      | null;

    obligations:
      KnowledgePackObligation[];
  };


  type RegulationKnowledgePack = {
    regulation: {
      id: number;

      name: string;

      short_name:
        | string
        | null;

      regulation_type: string;

      summary:
        | string
        | null;

      regulatory_authority:
        | string
        | null;

      official_source_url:
        | string
        | null;

      status: string;

      extraterritorial: boolean;

      mandatory: boolean;
    };

    article_count: number;

    articles:
      KnowledgePackArticle[];
  };

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
    analyses,
    setAnalyses,
  ] = useState<
    RegulatoryChangeAnalysis[]
  >([]);

  const [
    selectedAnalysisId,
    setSelectedAnalysisId,
  ] = useState<
    number | null
  >(null);

  const [
    analysisDetail,
    setAnalysisDetail,
  ] = useState<
    RegulatoryChangeAnalysisDetail | null
  >(null);

  const [
    knowledgePack,
    setKnowledgePack,
  ] = useState<
    RegulationKnowledgePack | null
  >(null);


    const [
    isLoadingAnalysis,
    setIsLoadingAnalysis,
  ] = useState(false);

  const [
    isSavingAnalysis,
    setIsSavingAnalysis,
  ] = useState(false);

  const [
    isSavingProvision,
    setIsSavingProvision,
  ] = useState(false);

  const [
    editingProvisionImpactId,
    setEditingProvisionImpactId,
  ] = useState<
    number | null
  >(null);

  const [
    reviewingProvisionImpactId,
    setReviewingProvisionImpactId,
  ] = useState<
    number | null
  >(null);

  const [
    provisionReviewNotes,
    setProvisionReviewNotes,
  ] = useState<
    Record<number, string>
  >({});

  const [
    expandedReviewHistories,
    setExpandedReviewHistories,
  ] = useState<
    Record<number, boolean>
  >({});

  const [
    isReviewingProvision,
    setIsReviewingProvision,
  ] = useState(false);

  const provisionImpactSectionRef =
    useRef<HTMLDivElement | null>(
      null
  );

  const structuredAnalysisSectionRef =
    useRef<HTMLDivElement | null>(
      null
  );

  const publicationSectionRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    isValidatingAnalysis,
    setIsValidatingAnalysis,
  ] = useState(false);

  const [
    analysisOrigin,
    setAnalysisOrigin,
  ] = useState<AnalysisOrigin>(
    "human"
  );

  const [
    analysisMethod,
    setAnalysisMethod,
  ] = useState(
    "Human regulatory impact assessment"
  );

  const [
    analysisImpactLevel,
    setAnalysisImpactLevel,
  ] = useState<ImpactLevel>(
    "moderate"
  );

  const [
    executiveSummary,
    setExecutiveSummary,
  ] = useState("");

  const [
    generatedByModel,
    setGeneratedByModel,
  ] = useState("");

  const [
    validationNotes,
    setValidationNotes,
  ] = useState("");

  const [
    selectedArticleId,
    setSelectedArticleId,
  ] = useState<
    number | null
  >(null);

  const [
    selectedObligationId,
    setSelectedObligationId,
  ] = useState<
    number | null
  >(null);

  const [
    provisionChangeType,
    setProvisionChangeType,
  ] = useState<ChangeType>(
    "obligation_change"
  );

  const [
    previousRequirement,
    setPreviousRequirement,
  ] = useState("");

  const [
    currentRequirement,
    setCurrentRequirement,
  ] = useState("");

  const [
    changeExplanation,
    setChangeExplanation,
  ] = useState("");

  const [
    legalInterpretation,
    setLegalInterpretation,
  ] = useState("");

  const [
    operationalImpact,
    setOperationalImpact,
  ] = useState("");

  const [
    complianceGovernanceImpact,
    setComplianceGovernanceImpact,
  ] = useState("");

  const [
    evidenceDocumentation,
    setEvidenceDocumentation,
  ] = useState("");

  const [
    recommendedAction,
    setRecommendedAction,
  ] = useState("");

  const [
    provisionImpactLevel,
    setProvisionImpactLevel,
  ] = useState<ImpactLevel>(
    "moderate"
  );

  const [
    sourceSnapshotId,
    setSourceSnapshotId,
  ] = useState<
    number | null
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
    reviewErrorMessage,
    setReviewErrorMessage,
  ] = useState("");

  const [
    reviewSuccessMessage,
    setReviewSuccessMessage,
  ] = useState("");


  const [
    structuredErrorMessage,
    setStructuredErrorMessage,
  ] = useState("");

  const [
    structuredSuccessMessage,
    setStructuredSuccessMessage,
  ] = useState("");


  const [
    impactErrorMessage,
    setImpactErrorMessage,
  ] = useState("");

  const [
    impactSuccessMessage,
    setImpactSuccessMessage,
  ] = useState("");


  const [
    publicationErrorMessage,
    setPublicationErrorMessage,
  ] = useState("");

  const [
    publicationSuccessMessage,
    setPublicationSuccessMessage,
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
    isEditingReview,
    setIsEditingReview,
  ] = useState(false);

  const [
    shouldScrollToStructuredAnalysis,
    setShouldScrollToStructuredAnalysis,
  ] = useState(false);

  const [
    shouldScrollToPublication,
    setShouldScrollToPublication,
  ] = useState(false);

  const [
    shouldScrollAfterVersionSelection,
    setShouldScrollAfterVersionSelection,
  ] = useState(false);

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

    const loadAnalyses =
    useCallback(
      async (
        token: string,
        preferredAnalysisId?: number | null
      ) => {
        const response =
          await fetch(
            `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses`,
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

          return {
            analyses: [],
            selectedId: null,
          };
        }

        const data =
          (
            await response.json()
          ) as
            | RegulatoryChangeAnalysisListResponse
            | ApiError;

        if (
          !response.ok
        ) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError,
              "Unable to load structured analyses."
            )
          );
        }

        const result =
          data as
            RegulatoryChangeAnalysisListResponse;

        setAnalyses(
          result.analyses
        );

        const preferred =
          preferredAnalysisId
          ?? null;

        const validPreferred =
          preferred
          && result.analyses.some(
            (
              item
            ) =>
              item.id
              === preferred
          )
            ? preferred
            : null;

        const nextId =
          validPreferred
          ?? result.analyses[0]?.id
          ?? null;

        setSelectedAnalysisId(
          nextId
        );

        return {
          analyses:
            result.analyses,

          selectedId:
            nextId,
        };
      },
      [
        changeId,
        router,
      ]
    );
    
    const loadKnowledgePack =
    useCallback(
      async (
        token: string,
        regulationId: number
      ) => {
        const response =
          await fetch(
            `${API_URL}/api/v1/regulations/${regulationId}/knowledge-pack`,
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

        const data =
          (
            await response.json()
          ) as
            | RegulationKnowledgePack
            | ApiError;

        if (
          !response.ok
        ) {
          throw new Error(
            getApiErrorMessage(
              data as ApiError,
              "Unable to load regulatory knowledge pack."
            )
          );
        }

        const result =
          data as
            RegulationKnowledgePack;

        setKnowledgePack(
          result
        );

        setSelectedArticleId(
          (
            current
          ) => {
            if (
              current
              && result.articles.some(
                (
                  article
                ) =>
                  article.id
                  === current
              )
            ) {
              return current;
            }

            return (
              result.articles[0]?.id
              ?? null
            );
          }
        );
      },
      [
        router,
      ]
    );
  
    const loadAnalysisDetail =
    useCallback(
      async (
        token: string,
        analysisId: number
      ) => {
        try {
          setIsLoadingAnalysis(
            true
          );

          const response =
            await fetch(
              `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses/${analysisId}`,
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

          const data =
            (
              await response.json()
            ) as
              | RegulatoryChangeAnalysisDetail
              | ApiError;

          if (
              !response.ok
            ) {
              throw new Error(
                getApiErrorMessage(
                  data as ApiError,
                  "Unable to load structured analysis."
                )
              );
          }

          const detail =
            data as
              RegulatoryChangeAnalysisDetail;

          setAnalysisDetail(
            detail
          );

          setAnalysisOrigin(
            detail.analysis
              .analysis_origin as
              AnalysisOrigin
          );

          setAnalysisMethod(
            detail.analysis
              .analysis_method
              ?? ""
          );

          setAnalysisImpactLevel(
            (
              detail.analysis
                .overall_impact_level
              ?? "moderate"
            ) as ImpactLevel
          );

          setExecutiveSummary(
            detail.analysis
              .executive_summary
              ?? ""
          );

          setGeneratedByModel(
            detail.analysis
              .generated_by_model
              ?? ""
          );

          setValidationNotes(
            detail.analysis
              .validation_notes
              ?? ""
          );

          if (
            detail.regulation
          ) {
            await loadKnowledgePack(
              token,
              detail.regulation.id
            );
          } else {
            setKnowledgePack(
              null
            );
          }

        } finally {
          setIsLoadingAnalysis(
            false
          );
        }
      },
      [
        changeId,
        loadKnowledgePack,
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
                getApiErrorMessage(
                  data as ApiError,
                  "Unable to load regulatory change evidence."
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

          
          setSourceSnapshotId(
            result.change
              .new_snapshot_id
            ?? null
          );

            if (
              result.source
                .regulation_id
            ) {
            const analysisResult =
              await loadAnalyses(
                token
              );

            if (
              analysisResult.selectedId
            ) {
              await loadAnalysisDetail(
                token,
                analysisResult.selectedId
              );
            } else {
              setAnalysisDetail(
                null
              );

              setKnowledgePack(
                null
              );
            }
          } else {
            setAnalyses(
              []
            );

            setSelectedAnalysisId(
              null
            );

            setAnalysisDetail(
              null
            );

            setKnowledgePack(
              null
            );
          }

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
        loadAnalyses,
        loadAnalysisDetail,
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

    useEffect(
    () => {
      if (
        !knowledgePack
        || !selectedArticleId
      ) {
        setSelectedObligationId(
          null
        );

        return;
      }

      const article =
        knowledgePack.articles
          .find(
            (
              item
            ) =>
              item.id
              === selectedArticleId
          );

      setSelectedObligationId(
        (
          current
        ) => {
          if (
            current
            && article?.obligations
              .some(
                (
                  item
                ) =>
                  item.id
                  === current
              )
          ) {
            return current;
          }

          return (
            article?.obligations[0]
              ?.id
            ?? null
          );
        }
      );
    },
    [
      knowledgePack,
      selectedArticleId,
    ]
  );


  const isMappedSource =
    useMemo(
      () =>
        Boolean(
          evidence?.source
            .regulation_id
        ),
      [
        evidence,
      ]
    );
  
  
  useEffect(
  () => {
    if (
      !shouldScrollToStructuredAnalysis
      || isLoading
      || !evidence
      || evidence.change
        .review_decision
        !== "confirmed"
      || !evidence.source
        .regulation_id
    ) {
      return;
    }

    const frameId =
      requestAnimationFrame(
        () => {
          structuredAnalysisSectionRef
            .current
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start",
            });

          setShouldScrollToStructuredAnalysis(
            false
          );
        }
      );

        return () => {
          cancelAnimationFrame(
            frameId
          );
        };
      },
      [
        shouldScrollToStructuredAnalysis,
        isLoading,
        evidence,
      ]
    );


  useEffect(
    () => {
      if (
        !shouldScrollToPublication
          || isLoading
          || !evidence
          || evidence.change
            .review_decision
            !== "confirmed"
        ) {
          return;
        }

        const frameId =
           requestAnimationFrame(
             () => {
               publicationSectionRef
                 .current
                 ?.scrollIntoView({
                   behavior:
                     "smooth",

                   block:
                     "start",
                 });

               setShouldScrollToPublication(
                 false
               );
             }
           );

         return () => {
           cancelAnimationFrame(
             frameId
           );
         };
      },
       [
         shouldScrollToPublication,
         isLoading,
         evidence,
       ]
    );
  
  
  useEffect(
    () => {
      if (
        !shouldScrollAfterVersionSelection
        || isLoadingAnalysis
        || !analysisDetail
        || selectedAnalysisId
          === null
        || analysisDetail.analysis.id
          !== selectedAnalysisId
      ) {
        return;
      }

      const frameId =
        requestAnimationFrame(
          () => {
            structuredAnalysisSectionRef
              .current
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start",
              });

            setShouldScrollAfterVersionSelection(
              false
            );
          }
        );

      return () => {
        cancelAnimationFrame(
          frameId
        );
      };
    },
    [
      shouldScrollAfterVersionSelection,
      isLoadingAnalysis,
      analysisDetail,
      selectedAnalysisId,
    ]
  );
    

  const selectedAnalysis =
    useMemo(
      () =>
        analyses.find(
          (
            item
          ) =>
            item.id
            === selectedAnalysisId
        )
        ?? null,
      [
        analyses,
        selectedAnalysisId,
      ]
    );


  const latestValidatedAnalysis =
    useMemo(
      () =>
        analyses.find(
          (
            item
          ) =>
            item.analysis_status
            === "validated"
            || item.analysis_status
            === "published"
        )
        ?? null,
      [
        analyses,
      ]
    );


  const selectedArticle =
    knowledgePack?.articles.find(
      (article) =>
        article.id === selectedArticleId
    ) ?? null;

  const selectedObligation =
    selectedArticle?.obligations.find(
      (obligation) =>
        obligation.id === selectedObligationId
    ) ?? null;

  const selectedObligationControls =
    selectedObligation?.controls ?? [];


  const isAnalysisEditable =
    useMemo(
      () =>
        Boolean(
          analysisDetail
          && !evidence?.change
            .published_at
          && ![
            "validated",
            "published",
            "superseded",
          ].includes(
            analysisDetail.analysis
              .analysis_status
          )
        ),
      [
        analysisDetail,
        evidence,
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


  const canEditReview =
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
            .impact_status
            !== "analysed"
        ),
      [
        evidence,
      ]
    );


    const latestAnalysis =
      useMemo(
        () => {
          if (
            analyses.length
            === 0
          ) {
            return null;
          }

          return analyses.reduce(
            (
              latest,
              analysis
            ) =>
              analysis.analysis_version
              > latest.analysis_version
                ? analysis
                : latest
          );
        },
        [
          analyses,
        ]
      );


    const canCreateNewAnalysisVersion =
      useMemo(
        () =>
          Boolean(
            latestAnalysis
            && selectedAnalysis
            && analysisDetail
            && !evidence?.change
              .published_at
            && selectedAnalysis.id
              === latestAnalysis.id
            && (
              latestAnalysis
                .analysis_status
                === "validated"
              || latestAnalysis
                .analysis_status
                === "published"
            )
            && analysisDetail
              .provision_count > 0
            && analysisDetail
              .validated_provision_count
              === analysisDetail
                .provision_count
          ),
        [
          latestAnalysis,
          selectedAnalysis,
          analysisDetail,
          evidence,
        ]
      );
  
  
  const hasValidAnalysisValidationNotes =
    useMemo(
      () =>
        validationNotes
          .trim()
          .length >= 10,
      [
        validationNotes,
      ]
    );


  const canPublish =
  useMemo(
    () =>
      Boolean(
        evidence
        && selectedAnalysis
        && analysisDetail
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
        && selectedAnalysis
          .analysis_status
          === "validated"
        && analysisDetail
          .provision_count > 0
        && analysisDetail
          .validated_provision_count
          === analysisDetail
            .provision_count
        && !evidence.change
          .published_at
      ),
    [
      evidence,
      selectedAnalysis,
      analysisDetail,
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

    setReviewErrorMessage(
      ""
    );

    setReviewSuccessMessage(
      ""
    );


    if (
      cleanedNotes.length
      < 10
    ) {
      setReviewErrorMessage(
        "Review notes must contain "
        + "at least 10 characters."
      );

      return;
    }


    try {
      setIsSubmitting(
        true
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
          getApiErrorMessage(
            data as ApiError,
              "Unable to save regulatory review."
          )
        );
        }   


      if (
        reviewDecision
        === "confirmed"
      ) {
        setReviewSuccessMessage(
          "Regulatory change confirmed. "
          + "Impact analysis is now required."
        );

      } else if (
        reviewDecision
        === "dismissed"
      ) {
        setReviewSuccessMessage(
          "Regulatory change dismissed "
          + "successfully."
        );

      } else {
        setReviewSuccessMessage(
          "Regulatory change marked as "
          + "requiring more information."
        );
      }


      setShouldScrollToStructuredAnalysis(
        reviewDecision === "confirmed"
      );
      
      await loadEvidence();

      setIsEditingReview(
        false
      );

    } catch (error) {
      console.error(
        "Review submission error:",
        error
      );

      setReviewErrorMessage(
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
      setImpactErrorMessage(
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
      setImpactErrorMessage(
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

      setImpactErrorMessage(
        ""
      );

      setImpactSuccessMessage(
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
            getApiErrorMessage(
              data as ApiError,
              "Unable to save regulatory impact analysis."
            )
          );
        }


      setImpactSuccessMessage(
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

      setImpactErrorMessage(
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

  async function selectAnalysisVersion(
    analysisId: number
  ) {
    const token =
      getToken();

    if (!token) {
      return;
    }

    try {
      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      setSelectedAnalysisId(
        analysisId
      );

      setShouldScrollAfterVersionSelection(
        true
      );

      await loadAnalysisDetail(
        token,
        analysisId
      );

      

    } catch (error) {
      console.error(
        "Analysis version selection error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : (
              "Unable to load the selected "
              + "analysis version."
            )
      );
    }
  }


  async function saveStructuredAnalysis(
    createNewVersion = false
  ) {
    if (!evidence) {
      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    if (!isMappedSource) {
      setStructuredErrorMessage(
        "Structured analysis is unavailable "
        + "because this regulatory source is "
        + "not mapped to a canonical regulation."
      );

      return;
    }

    if (
      evidence.change.review_status
        !== "reviewed"
      || evidence.change.review_decision
        !== "confirmed"
    ) {
      setStructuredErrorMessage(
        "Structured analysis requires a "
        + "completed and confirmed regulatory "
        + "review."
      );

      return;
    }


    if (
      createNewVersion
      && (
        !selectedAnalysis
        || !analysisDetail
        || !canCreateNewAnalysisVersion
      )
    ) {
      setStructuredErrorMessage(
        "A new analysis version can only "
        + "be created after the current "
        + "version has been fully completed "
        + "and validated."
      );

      return;
    }


    const cleanedMethod =
      analysisMethod.trim();

    const cleanedSummary =
      executiveSummary.trim();

    const cleanedModel =
      generatedByModel.trim();

    setStructuredErrorMessage(
      ""
    );

    setStructuredSuccessMessage(
      ""
    );

    if (
      cleanedSummary.length > 0
      && cleanedSummary.length < 10
    ) {
      setStructuredErrorMessage(
        "Executive summary must contain "
        + "at least 10 characters when provided."
      );

      return;
    }

    if (
      analysisOrigin !== "human"
      && !cleanedModel
    ) {
      setStructuredErrorMessage(
        "Generated-by model is required "
        + "for AI-assisted or system-generated "
        + "analysis."
      );

      return;
    }

    try {
      setIsSavingAnalysis(
        true
      );

      /*setStructuredErrorMessage(
        ""
      );

      setStructuredSuccessMessage(
        ""
      );*/

      const isCreating =
        createNewVersion
        || !selectedAnalysisId;

      const supersedesAnalysisId =
        createNewVersion
          ? selectedAnalysisId
          : null;

      const url =
        isCreating
          ? (
            `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses`
          )
          : (
            `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses/${selectedAnalysisId}`
          );

      const body =
        isCreating
          ? {
              analysis_origin:
                analysisOrigin,

              analysis_method:
                cleanedMethod || null,

              overall_impact_level:
                analysisImpactLevel,

              executive_summary:
                cleanedSummary || null,

              generated_by_model:
                analysisOrigin === "human"
                  ? null
                  : cleanedModel,

              supersedes_analysis_id:
                supersedesAnalysisId,
            }
          : {
              analysis_method:
                cleanedMethod || null,

              overall_impact_level:
                analysisImpactLevel,

              executive_summary:
                cleanedSummary || null,
            };

      const response =
        await fetch(
          url,
          {
            method:
              isCreating
                ? "POST"
                : "PATCH",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      if (
        response.status === 401
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
          | RegulatoryChangeAnalysisCreateResponse
          | RegulatoryChangeAnalysis
          | ApiError;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data as ApiError,
            isCreating
              ? "Unable to create structured regulatory analysis."
              : "Unable to update structured regulatory analysis."
          )
        );
      }

      const savedAnalysis =
        isCreating
          ? (
              data as
                RegulatoryChangeAnalysisCreateResponse
            ).analysis
          : (
              data as
                RegulatoryChangeAnalysis
            );

      const result =
        await loadAnalyses(
          token,
          savedAnalysis.id
        );

      if (
        result.selectedId
      ) {
        await loadAnalysisDetail(
          token,
          result.selectedId
        );
      }

      setStructuredSuccessMessage(
        isCreating
          ? (
            `Structured regulatory analysis version `
            + `${savedAnalysis.analysis_version} `
            + `created successfully.`
          )
          : (
            `Structured regulatory analysis version `
            + `${savedAnalysis.analysis_version} `
            + `updated successfully.`
          )
      );


      requestAnimationFrame(
          () => {
            requestAnimationFrame(
              () => {
                structuredAnalysisSectionRef
                  .current
                  ?.scrollIntoView({
                    behavior:
                      "smooth",

                    block:
                      "start",
                  });
              }
            );
          }
        );
      


    } catch (error) {
      console.error(
        "Structured analysis save error:",
        error
      );

      setStructuredErrorMessage(
        error instanceof Error
          ? error.message
          : (
              "Unable to save structured "
              + "regulatory analysis."
            )
      );

    } finally {
      setIsSavingAnalysis(
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
        + "Once published, the regulatory review, "
        + "and impact analysis and structured regulatory analysis "
        + "will become read-only."
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
          getApiErrorMessage(
            data as ApiError,
            "Unable to publish regulatory intelligence."
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


  async function handleCreateProvisionImpact() {
    if (
      !selectedAnalysisId
      || !knowledgePack
      || !selectedArticle
    ) {
      setStructuredErrorMessage(
        "Select an analysis and regulatory "
        + "Article before creating a "
        + "provision impact."
      );

      return;
    }


    if (
      !isAnalysisEditable
    ) {
      setStructuredErrorMessage(
        "The selected structured analysis "
        + "is read-only and cannot be modified."
      );

      return;
    }


    const cleanedExplanation =
      changeExplanation.trim();


    setStructuredErrorMessage(
      ""
    );


    setStructuredSuccessMessage(
      ""
    );


    if (
      cleanedExplanation.length
      < 10
    ) {
      setStructuredErrorMessage(
        "Change explanation must contain "
        + "at least 10 characters."
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


    try {
      setIsSavingProvision(
        true
      );

      /*setStructuredErrorMessage(
        ""
      );

      setStructuredSuccessMessage(
        ""
      );*/


      const response =
        await fetch(
          `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses/${selectedAnalysisId}/provision-impacts`,
          {
            method:
              "POST",

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
                regulation_id:
                  knowledgePack
                    .regulation.id,

                regulation_article_id:
                  selectedArticle.id,

                regulation_obligation_id:
                  selectedObligation?.id
                  ?? null,

                provision_reference:
                  selectedArticle
                    .article_number,

                provision_title:
                  selectedArticle.title
                  ?? null,

                change_type:
                  provisionChangeType,

                previous_requirement:
                  previousRequirement.trim()
                  || null,

                current_requirement:
                  currentRequirement.trim()
                  || null,

                change_explanation:
                  cleanedExplanation,

                legal_interpretation:
                  legalInterpretation.trim()
                  || null,

                operational_impact:
                  operationalImpact.trim()
                  || null,

                compliance_governance_impact:
                  complianceGovernanceImpact.trim()
                  || null,

                evidence_documentation:
                  evidenceDocumentation.trim()
                  || null,

                recommended_action:
                  recommendedAction.trim()
                  || null,

                impact_level:
                  provisionImpactLevel,

                source_snapshot_id:
                  sourceSnapshotId,

                source_url:
                  selectedArticle.source_url
                  ?? null,
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
          | {
              impact:
                RegulatoryProvisionImpact;

              controls:
                RegulatoryKnowledgeControl[];

              message:
                string;
            }
          | ApiError;


      if (
        !response.ok
      ) {
        throw new Error(
          getApiErrorMessage(
            data as ApiError,
            "Unable to create regulatory "
            + "provision impact."
          )
        );
      }


      const created =
        data as {
          impact:
            RegulatoryProvisionImpact;

          controls:
            RegulatoryKnowledgeControl[];

          message:
            string;
        };


      setStructuredSuccessMessage(
        created.message
        || (
          "Regulatory provision impact "
          + "created successfully."
        )
      );


      setPreviousRequirement(
        ""
      );

      setCurrentRequirement(
        ""
      );

      setChangeExplanation(
        ""
      );

      setLegalInterpretation(
        ""
      );

      setOperationalImpact(
        ""
      );

      setComplianceGovernanceImpact(
        ""
      );

      setEvidenceDocumentation(
        ""
      );

      setRecommendedAction(
        ""
      );


      await loadAnalyses(
        token,
        selectedAnalysisId
      );


      await loadAnalysisDetail(
        token,
        selectedAnalysisId
      );

      requestAnimationFrame(
        () => {
          requestAnimationFrame(
            () => {
              provisionImpactSectionRef.current
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
            }
          );
        }
      );


    } catch (error) {
      console.error(
        "Provision impact creation error:",
        error
      );

      setStructuredErrorMessage(
        error instanceof Error
          ? error.message
          : (
              "Unable to create regulatory "
              + "provision impact."
            )
      );

    } finally {
      setIsSavingProvision(
        false
      );
    }
  }


  async function handleUpdateProvisionImpact() {
   if (
     !selectedAnalysisId
     || !editingProvisionImpactId
   ) {
     setStructuredErrorMessage(
       "Select a provision impact "
       + "before updating it."
     );

     return;
   }


   if (
     !isAnalysisEditable
   ) {
      setStructuredErrorMessage(
       "The selected structured analysis "
       + "is read-only and cannot be modified."
     );

     return;
   }

    const cleanedExplanation =
     changeExplanation.trim();

    setStructuredErrorMessage(
      ""
    );

    setStructuredSuccessMessage(
      ""
    );


   if (
     cleanedExplanation.length
     < 10
   ) {
     setStructuredErrorMessage(
       "Change explanation must contain "
       + "at least 10 characters."
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


   try {
     setIsSavingProvision(
       true
     );


     const response =
       await fetch(
         `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses/${selectedAnalysisId}/provision-impacts/${editingProvisionImpactId}`,
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
               change_type:
                 provisionChangeType,

               previous_requirement:
                 previousRequirement.trim()
                 || null,

               current_requirement:
                 currentRequirement.trim()
                 || null,

               change_explanation:
                 cleanedExplanation,

               legal_interpretation:
                 legalInterpretation.trim()
                 || null,

               operational_impact:
                 operationalImpact.trim()
                 || null,

               recommended_action:
                 recommendedAction.trim()
                 || null,

               impact_level:
                 provisionImpactLevel,

               source_snapshot_id:
                 sourceSnapshotId,
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
         | RegulatoryProvisionImpact
         | ApiError;


     if (
       !response.ok
     ) {
       throw new Error(
         getApiErrorMessage(
           data as ApiError,
           "Unable to update regulatory "
           + "provision impact."
         )
       );
     }


     setStructuredSuccessMessage(
       "Regulatory provision impact "
       + "updated successfully."
     );


     setEditingProvisionImpactId(
       null
     );


     setPreviousRequirement(
       ""
     );

     setCurrentRequirement(
       ""
     );

     setChangeExplanation(
       ""
     );

     setLegalInterpretation(
       ""
     );

     setOperationalImpact(
       ""
     );

     setComplianceGovernanceImpact(
       ""
     );

     setEvidenceDocumentation(
       ""
     );

     setRecommendedAction(
       ""
     );


     await loadAnalyses(
       token,
       selectedAnalysisId
     );


     await loadAnalysisDetail(
       token,
       selectedAnalysisId
     );


     requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            provisionImpactSectionRef.current
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          }
        );
      }
    );


   } catch (error) {
     console.error(
       "Provision impact update error:",
       error
     );

     setStructuredErrorMessage(
       error instanceof Error
         ? error.message
         : (
             "Unable to update regulatory "
             + "provision impact."
           )
     );

   } finally {
     setIsSavingProvision(
       false
     );
   }
 }


async function handleReviewProvisionImpact(
  impactId: number,
  reviewStatus:
    | "validated"
    | "rejected"
) {
  if (
    !selectedAnalysisId
    || !analysisDetail
  ) {
    setStructuredErrorMessage(
      "Select a structured analysis "
      + "before reviewing a provision."
    );

    return;
  }


  if (
    !isAnalysisEditable
  ) {
    setStructuredErrorMessage(
      "This structured analysis is "
      + "read-only and its provision "
      + "impacts cannot be reviewed."
    );

    return;
  }


  const cleanedNotes =
  (
    provisionReviewNotes[
      impactId
    ]
    ?? ""
  ).trim();


  if (
    cleanedNotes.length
    < 10
  ) {
    setStructuredErrorMessage(
      "Provision review notes must "
      + "contain at least 10 characters."
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


  try {
    setIsReviewingProvision(
      true
    );

    setReviewingProvisionImpactId(
      impactId
    );

    setStructuredErrorMessage(
      ""
    );

    setStructuredSuccessMessage(
      ""
    );


    const response =
      await fetch(
        `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses/${selectedAnalysisId}/provisions/${impactId}/review`,
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
              review_status:
                reviewStatus,

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
        | RegulatoryProvisionImpact
        | ApiError;


    if (
      !response.ok
    ) {
      throw new Error(
        getApiErrorMessage(
          data as ApiError,
          reviewStatus
            === "validated"
            ? (
                "Unable to validate "
                + "regulatory provision impact."
              )
            : (
                "Unable to reject "
                + "regulatory provision impact."
              )
        )
      );
    }


    setStructuredSuccessMessage(
      reviewStatus
        === "validated"
        ? (
            "Regulatory provision impact "
            + "validated successfully."
          )
        : (
            "Regulatory provision impact "
            + "rejected successfully."
          )
    );


    setProvisionReviewNotes(
      (
        previous
      ) => ({
        ...previous,

        [impactId]:
          "",
      })
    );


    await loadAnalyses(
      token,
      selectedAnalysisId
    );


    await loadAnalysisDetail(
      token,
      selectedAnalysisId
    );

  } catch (error) {
    console.error(
      "Provision impact review error:",
      error
    );

    setStructuredErrorMessage(
      error instanceof Error
        ? error.message
        : (
            "Unable to review regulatory "
            + "provision impact."
          )
    );

  } finally {
    setIsReviewingProvision(
      false
    );

    setReviewingProvisionImpactId(
      null
    );
  }
}

 
function beginEditProvisionImpact(
    detail: RegulatoryProvisionImpactDetail
  ) {
    const impact =
      detail.impact;

    if (
      !isAnalysisEditable
    ) {
      setStructuredErrorMessage(
        "This structured analysis is read-only "
        + "and its provision impacts cannot be edited."
      );

      return;
    }


    setEditingProvisionImpactId(
      impact.id
    );


    setSelectedArticleId(
      impact.regulation_article_id
      ?? null
    );

    setSelectedObligationId(
      impact.regulation_obligation_id
      ?? null
    );


    setProvisionChangeType(
      impact.change_type as
        ChangeType
    );

    setProvisionImpactLevel(
      (
        impact.impact_level
        ?? "moderate"
      ) as ImpactLevel
    );


    setPreviousRequirement(
      impact.previous_requirement
      ?? ""
    );

    setCurrentRequirement(
      impact.current_requirement
      ?? ""
    );

    setChangeExplanation(
      impact.change_explanation
      ?? ""
    );

    setLegalInterpretation(
      impact.legal_interpretation
      ?? ""
    );

    setOperationalImpact(
      impact.operational_impact
      ?? ""
    );

    setComplianceGovernanceImpact(
      impact.compliance_governance_impact
      ?? ""
    );

    setEvidenceDocumentation(
      impact.evidence_documentation
      ?? ""
    );

    setRecommendedAction(
      impact.recommended_action
      ?? ""
    );


    setSourceSnapshotId(
      impact.source_snapshot_id
      ?? sourceSnapshotId
    );


    setStructuredErrorMessage(
      ""
    );

    setStructuredSuccessMessage(
      "Provision impact loaded for editing."
    );


    /*window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }*/
    requestAnimationFrame(
    () => {
       provisionImpactSectionRef.current
         ?.scrollIntoView({
           behavior:
             "smooth",

             block:
             "start",
         });
     }
     );
  }


  function cancelEditProvisionImpact() {
    setEditingProvisionImpactId(
      null
    );

    setStructuredErrorMessage(
      ""
    );

    setStructuredSuccessMessage(
      ""
    );

    setPreviousRequirement(
      ""
    );

    setCurrentRequirement(
      ""
    );

    setChangeExplanation(
      ""
    );

    setLegalInterpretation(
      ""
    );

    setOperationalImpact(
      ""
    );

    setComplianceGovernanceImpact(
      ""
    );

    setEvidenceDocumentation(
      ""
    );

    setRecommendedAction(
      ""
    );
  }


  async function handleValidateStructuredAnalysis() {
    if (
      !selectedAnalysisId
      || !analysisDetail
    ) {
      setStructuredErrorMessage(
        "Select a structured analysis "
        + "before validation."
      );

      return;
    }


    if (
      !isAnalysisEditable
    ) {
      setStructuredErrorMessage(
        "The selected structured analysis "
        + "is already locked and cannot "
        + "be validated again."
      );

      return;
    }


    if (
      analysisDetail.provision_count
      < 1
    ) {
      setStructuredErrorMessage(
        "At least one Article / provision "
        + "impact is required before "
        + "validation."
      );

      return;
    }


    if (
      analysisDetail
        .validated_provision_count
      !== analysisDetail
        .provision_count
    ) {
      setStructuredErrorMessage(
        "All provision impacts must be "
        + "validated before the structured "
        + "analysis can be validated."
      );

      return;
    }


    const cleanedNotes =
      validationNotes.trim();


    if (
      cleanedNotes.length
      < 10
    ) {
      setStructuredErrorMessage(
        "Validation notes must contain "
        + "at least 10 characters."
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


    try {
      setIsValidatingAnalysis(
        true
      );

      setStructuredErrorMessage(
        ""
      );

      setStructuredSuccessMessage(
        ""
      );


      const response =
        await fetch(
          `${API_URL}/api/v1/regulatory-intelligence/changes/${changeId}/analyses/${selectedAnalysisId}/validate`,
          {
            method:
              "POST",

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
                validation_notes:
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
          | RegulatoryChangeAnalysisValidationResponse
          | ApiError;


      if (
        !response.ok
      ) {
        throw new Error(
          getApiErrorMessage(
            data as ApiError,
            "Unable to validate structured "
            + "regulatory analysis."
          )
        );
      }


      const validated =
        data as
          RegulatoryChangeAnalysisValidationResponse;


      setStructuredSuccessMessage(
        validated.message
        || (
          "Structured regulatory analysis "
          + "validated successfully."
        )
      );

      setShouldScrollToPublication(
        true
      );


      await loadEvidence();

    } catch (error) {
      console.error(
        "Structured analysis validation error:",
        error
      );

      setStructuredErrorMessage(
        error instanceof Error
          ? error.message
          : (
              "Unable to validate structured "
              + "regulatory analysis."
            )
      );

    } finally {
      setIsValidatingAnalysis(
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
            reviewErrorMessage
            && (
              <MessageBox
                tone="danger"
              >
                {reviewErrorMessage}
              </MessageBox>
            )
          }


          {
            reviewSuccessMessage
            && (
              <MessageBox
                tone="success"
              >
                {reviewSuccessMessage}
              </MessageBox>
            )
          }


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
                  (
                    !canReview
                    || (
                      evidence?.change
                        .review_status
                        === "reviewed"
                      && !isEditingReview
                    )
                  )
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
                  (
                    !canReview
                    || (
                      evidence?.change
                        .review_status
                        === "reviewed"
                      && !isEditingReview
                    )
                  )
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
                (
                  !canReview
                  || (
                    evidence?.change
                      .review_status
                      === "reviewed"
                    && !isEditingReview
                  )
                )
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


            {
              canEditReview
              && !isEditingReview
              && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingReview(
                      true
                    );

                    setReviewErrorMessage(
                      ""
                    );

                    setReviewSuccessMessage(
                      ""
                    );
                  }}
                  style={
                    secondaryButtonStyle
                  }
                >
                  Edit Review
                </button>
              )
            }


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
                || (
                  evidence?.change
                    .review_status
                    === "reviewed"
                  && !isEditingReview
                )
              }
              style={{
                ...primaryButtonStyle,

                backgroundColor:
                (
                  !canReview
                  ||isSubmitting
                  || (
                    evidence?.change
                      .review_status
                      === "reviewed"
                    && !isEditingReview
                  )
                )
                  ? "#94a3b8"
                  : "#2563eb",

              cursor:
                (
                  !canReview
                  ||isSubmitting
                  || (
                    evidence?.change
                      .review_status
                      === "reviewed"
                    && !isEditingReview
                  )
                )
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {
                isSubmitting
                  ? "Saving Review..."
                  : isEditingReview
                  ? "Save Review Changes"
                  : canReview
                    ? "Save Regulatory Review"
                    : "Regulatory Review Locked"
              }
            </button>
          </div>
        </SectionCard>


        {/* STRUCTURED REGULATORY ANALYSIS */}

        {
          change.review_decision
          === "confirmed"
          && isMappedSource
          && (
            <div
              ref={
                structuredAnalysisSectionRef
              }
            >
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
                    Structured Regulatory Analysis
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
                    Create and maintain versioned
                    regulatory analysis linked to
                    the canonical Regulatory
                    Library.
                  </p>
                </div>

                {
                  selectedAnalysis
                  ? (
                    <StatusBadge
                      text={
                        formatStatus(
                          selectedAnalysis
                            .analysis_status
                        )
                      }
                      tone={
                        [
                          "validated",
                          "published",
                        ].includes(
                          selectedAnalysis
                            .analysis_status
                        )
                          ? "success"
                          : "warning"
                      }
                    />
                  )
                  : (
                    <StatusBadge
                      text="No Analysis"
                      tone="neutral"
                    />
                  )
                }
              </div>


              {
                structuredErrorMessage
                && (
                  <MessageBox
                    tone="danger"
                  >
                    {structuredErrorMessage}
                  </MessageBox>
                )
              }


              {
                structuredSuccessMessage
                && (
                  <MessageBox
                    tone="success"
                  >
                    {structuredSuccessMessage}
                  </MessageBox>
                )
              }


              {
                analyses.length === 0
                ? (
                  <MessageBox
                    tone="warning"
                  >
                    No structured regulatory
                    analysis exists yet for this
                    regulatory change. Create
                    version 1 to begin the
                    Article / provision-level
                    assessment.
                  </MessageBox>
                )
                : (
                  <div
                    style={{
                      marginBottom:
                        "20px",

                      padding:
                        "16px",

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
                        display:
                          "grid",

                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(240px, 1fr))",

                        gap:
                          "16px",
                      }}
                    >
                      <div>
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Analysis Version
                        </label>

                        <select
                          value={
                            selectedAnalysisId
                            ?? ""
                          }
                          onChange={
                            (event) => {
                              const analysisId =
                                Number(
                                  event.target.value
                                );

                              if (
                                Number.isInteger(
                                  analysisId
                                )
                                && analysisId > 0
                              ) {
                                void selectAnalysisVersion(
                                  analysisId
                                );
                              }
                            }
                          }
                          disabled={
                            isLoadingAnalysis
                            || isSavingAnalysis
                          }
                          style={
                            inputStyle
                          }
                        >
                          {
                            analyses.map(
                              (
                                analysis
                              ) => (
                                <option
                                  key={
                                    analysis.id
                                  }
                                  value={
                                    analysis.id
                                  }
                                >
                                  {
                                    `Version ${analysis.analysis_version}`
                                    + ` · ${formatStatus(
                                      analysis.analysis_status
                                    )}`
                                  }
                                </option>
                              )
                            )
                          }
                        </select>
                      </div>


                      <div>
                        <InfoItem
                          label="Selected Version"
                          value={
                            selectedAnalysis
                              ? (
                                  `Version `
                                  + `${selectedAnalysis.analysis_version}`
                                )
                              : "Not available"
                          }
                        />

                        <InfoItem
                          label="Created"
                          value={
                            selectedAnalysis
                              ? formatDate(
                                  selectedAnalysis
                                    .created_at
                                )
                              : "Not available"
                          }
                        />
                      </div>


                      <div>
                        <InfoItem
                          label="Analysis Origin"
                          value={
                            selectedAnalysis
                              ? formatStatus(
                                  selectedAnalysis
                                    .analysis_origin
                                )
                              : "Not available"
                          }
                        />

                        <InfoItem
                          label="Status"
                          value={
                            selectedAnalysis
                              ? formatStatus(
                                  selectedAnalysis
                                    .analysis_status
                                )
                              : "Not available"
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              }


              {
                selectedAnalysis
                && !isAnalysisEditable
                && (
                  <MessageBox
                    tone="warning"
                  >
                    This analysis version is
                    read-only because its current
                    status is{" "}
                    <strong>
                      {
                        formatStatus(
                          selectedAnalysis
                            .analysis_status
                        )
                      }
                    </strong>
                    . Create a new version if
                    further regulatory analysis
                    is required.
                  </MessageBox>
                )
              }


              {
                latestValidatedAnalysis
                && (
                  <MessageBox
                    tone="success"
                  >
                    The latest validated regulatory
                    analysis is{" "}
                    <strong>
                      Version{" "}
                      {
                        latestValidatedAnalysis
                          .analysis_version
                      }
                    </strong>
                    .
                  </MessageBox>
                )
              }


              {
                isLoadingAnalysis
                && (
                  <MessageBox
                    tone="warning"
                  >
                    Loading structured regulatory
                    analysis...
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
                    Analysis Origin
                  </label>

                  <select
                    value={
                      analysisOrigin
                    }
                    onChange={
                      (event) =>
                        setAnalysisOrigin(
                          event.target
                            .value as
                            AnalysisOrigin
                        )
                    }
                    disabled={
                      Boolean(
                        selectedAnalysisId
                      )
                      || isSavingAnalysis
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option
                      value="human"
                    >
                      Human
                    </option>

                    <option
                      value="ai_assisted"
                    >
                      AI Assisted
                    </option>

                    <option
                      value="system_generated"
                    >
                      System Generated
                    </option>
                  </select>
                </div>


                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    Overall Impact Level
                  </label>

                  <select
                    value={
                      analysisImpactLevel
                    }
                    onChange={
                      (event) =>
                        setAnalysisImpactLevel(
                          event.target
                            .value as
                            ImpactLevel
                        )
                    }
                    disabled={
                      (
                        selectedAnalysisId
                        !== null
                        && !isAnalysisEditable
                      )
                      || isSavingAnalysis
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
                  Analysis Method
                </label>

                <input
                  type="text"
                  value={
                    analysisMethod
                  }
                  onChange={
                    (event) =>
                      setAnalysisMethod(
                        event.target.value
                      )
                  }
                  disabled={
                    (
                      selectedAnalysisId
                      !== null
                      && !isAnalysisEditable
                    )
                    || isSavingAnalysis
                  }
                  placeholder={
                    "Describe the regulatory "
                    + "analysis method..."
                  }
                  style={
                    inputStyle
                  }
                />
              </div>


              {
                analysisOrigin
                !== "human"
                && (
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
                      Generated By Model
                    </label>

                    <input
                      type="text"
                      value={
                        generatedByModel
                      }
                      onChange={
                        (event) =>
                          setGeneratedByModel(
                            event.target.value
                          )
                      }
                      disabled={
                        Boolean(
                          selectedAnalysisId
                        )
                        || isSavingAnalysis
                      }
                      placeholder={
                        "Model name and version..."
                      }
                      style={
                        inputStyle
                      }
                    />
                  </div>
                )
              }


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
                  Executive Summary
                </label>

                <textarea
                  value={
                    executiveSummary
                  }
                  onChange={
                    (event) =>
                      setExecutiveSummary(
                        event.target.value
                      )
                  }
                  disabled={
                    (
                      selectedAnalysisId
                      !== null
                      && !isAnalysisEditable
                    )
                    || isSavingAnalysis
                  }
                  placeholder={
                    "Summarise the regulatory "
                    + "change, legal significance "
                    + "and expected organisational "
                    + "impact..."
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


              {
                selectedAnalysisId
                && knowledgePack
                && (
                  <div
                    style={{
                      marginTop:
                        "24px",

                      paddingTop:
                        "22px",

                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          "18px",
                      }}
                    >
                      <h3
                        style={{
                          margin:
                            "0 0 6px",

                          fontSize:
                            "18px",
                        }}
                      >
                        Affected Regulatory Provision
                      </h3>

                      <p
                        style={{
                          margin:
                            0,

                          color:
                            "#64748b",

                          fontSize:
                            "13px",

                          lineHeight:
                            1.6,
                        }}
                      >
                        Map this regulatory change
                        to the canonical Article,
                        obligation and associated
                        TrustGRC controls.
                      </p>
                    </div>


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
                          Canonical Regulation
                        </label>

                        <input
                          type="text"
                          value={
                            knowledgePack.regulation
                              .short_name
                            ?? knowledgePack.regulation
                              .name
                          }
                          disabled
                          style={{
                            ...inputStyle,

                            backgroundColor:
                              "#f8fafc",
                          }}
                        />
                      </div>


                      <div>
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Article / Provision
                        </label>

                        <select
                          value={
                            selectedArticleId
                            ?? ""
                          }
                          onChange={
                            (event) => {
                              const articleId =
                                Number(
                                  event.target.value
                                );

                              setSelectedArticleId(
                                Number.isInteger(
                                  articleId
                                )
                                  && articleId > 0
                                  ? articleId
                                  : null
                              );
                            }
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          style={
                            inputStyle
                          }
                        >
                          {
                            knowledgePack.articles.map(
                              (
                                article
                              ) => (
                                <option
                                  key={
                                    article.id
                                  }
                                  value={
                                    article.id
                                  }
                                >
                                  {
                                    article.article_number
                                    + (
                                      article.title
                                        ? ` — ${article.title}`
                                        : ""
                                    )
                                  }
                                </option>
                              )
                            )
                          }
                        </select>
                      </div>
                    </div>


                    {
                      selectedArticle
                      && (
                        <div
                          style={{
                            marginTop:
                              "14px",

                            padding:
                              "14px",

                            border:
                              "1px solid #e2e8f0",

                            borderRadius:
                              "9px",

                            backgroundColor:
                              "#f8fafc",
                          }}
                        >
                          <InfoItem
                            label="Article / Provision"
                            value={
                              selectedArticle
                                .article_number
                            }
                          />

                          <InfoItem
                            label="Title"
                            value={
                              selectedArticle.title
                              ?? "Not available"
                            }
                          />

                          <InfoItem
                            label="Version"
                            value={
                              selectedArticle.version
                              ?? "Not available"
                            }
                          />

                          {
                            selectedArticle.summary
                            && (
                              <InfoItem
                                label="Canonical Summary"
                                value={
                                  selectedArticle.summary
                                }
                              />
                            )
                          }
                        </div>
                      )
                    }


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
                        Regulatory Obligation
                      </label>

                      <select
                        value={
                          selectedObligationId
                          ?? ""
                        }
                        onChange={
                          (event) => {
                            const obligationId =
                              Number(
                                event.target.value
                              );

                            setSelectedObligationId(
                              Number.isInteger(
                                obligationId
                              )
                                && obligationId > 0
                                ? obligationId
                                : null
                            );
                          }
                        }
                        disabled={
                          !isAnalysisEditable
                          || isSavingProvision
                          || !selectedArticle
                        }
                        style={
                          inputStyle
                        }
                      >
                        {
                          selectedArticle
                          && selectedArticle
                            .obligations.length
                            > 0
                            ? selectedArticle
                                .obligations.map(
                                  (
                                    obligation
                                  ) => (
                                    <option
                                      key={
                                        obligation.id
                                      }
                                      value={
                                        obligation.id
                                      }
                                    >
                                      {
                                        obligation
                                          .obligation_code
                                      }
                                    </option>
                                  )
                                )
                            : (
                              <option
                                value=""
                              >
                                No mapped obligations
                              </option>
                            )
                        }
                      </select>
                    </div>


                    {
                      selectedObligation
                      && (
                        <div
                          style={{
                            marginTop:
                              "14px",

                            padding:
                              "14px",

                            border:
                              "1px solid #e2e8f0",

                            borderRadius:
                              "9px",

                            backgroundColor:
                              "#f8fafc",
                          }}
                        >
                          <InfoItem
                            label="Obligation Code"
                            value={
                              selectedObligation
                                .obligation_code
                            }
                          />

                          <InfoItem
                            label="Requirement"
                            value={
                              selectedObligation
                                .obligation_text
                            }
                          />

                          <InfoItem
                            label="Obligation Type"
                            value={
                              selectedObligation
                                .obligation_type
                              ?? "Not available"
                            }
                          />

                          <InfoItem
                            label="Risk Level"
                            value={
                              selectedObligation
                                .risk_level
                              ?? "Not available"
                            }
                          />

                          <InfoItem
                            label="Mandatory"
                            value={
                              selectedObligation
                                .mandatory
                                ? "Yes"
                                : "No"
                            }
                          />
                        </div>
                      )
                    }


                    <div
                      style={{
                        marginTop:
                          "18px",
                      }}
                    >
                      <div
                        style={
                          labelStyle
                        }
                      >
                        Associated Controls
                      </div>

                      {
                        selectedObligationControls
                          .length === 0
                          ? (
                            <div
                              style={{
                                padding:
                                  "14px",

                                border:
                                  "1px solid #e2e8f0",

                                borderRadius:
                                  "9px",

                                backgroundColor:
                                  "#f8fafc",

                                color:
                                  "#64748b",

                                fontSize:
                                  "13px",
                              }}
                            >
                              No controls are mapped
                              to the selected
                              obligation.
                            </div>
                          )
                          : (
                            <div
                              style={{
                                display:
                                  "grid",

                                gap:
                                  "10px",
                              }}
                            >
                              {
                                selectedObligationControls.map(
                                  (
                                    control
                                  ) => (
                                    <div
                                      key={
                                        control.id
                                      }
                                      style={{
                                        padding:
                                          "14px",

                                        border:
                                          "1px solid #e2e8f0",

                                        borderRadius:
                                          "9px",

                                        backgroundColor:
                                          "#f8fafc",
                                      }}
                                    >
                                      <div
                                        style={{
                                          color:
                                            "#0f172a",

                                          fontSize:
                                            "13px",

                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        {
                                          control.control_code
                                          + " — "
                                          + control.control_name
                                        }
                                      </div>

                                      {
                                        control.control_description
                                        && (
                                          <div
                                            style={{
                                              marginTop:
                                                "6px",

                                              color:
                                                "#475569",

                                              fontSize:
                                                "13px",

                                              lineHeight:
                                                1.6,
                                            }}
                                          >
                                            {
                                              control
                                                .control_description
                                            }
                                          </div>
                                        )
                                      }

                                      {
                                        control.evidence_required
                                        && (
                                          <div
                                            style={{
                                              marginTop:
                                                "8px",
                                            }}
                                          >
                                            <InfoItem
                                              label="Evidence Required"
                                              value={
                                                control
                                                  .evidence_required
                                              }
                                            />
                                          </div>
                                        )
                                      }
                                    </div>
                                  )
                                )
                              }
                            </div>
                          )
                      }
                    </div>
                    

                    <div
                      ref={provisionImpactSectionRef}
                      style={{
                        marginTop:
                          "22px",

                        paddingTop:
                          "20px",

                        borderTop:
                          "1px solid #e2e8f0",
                      }}
                    >
                      <h3
                        style={{
                          margin:
                            "0 0 16px",

                          fontSize:
                            "17px",
                        }}
                      >
                        Provision Impact Assessment
                      </h3>


                      <div
                        style={{
                          display:
                            "grid",

                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",

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
                            Change Type
                          </label>

                          <select
                            value={
                              provisionChangeType
                            }
                            onChange={
                              (event) =>
                                setProvisionChangeType(
                                  event.target
                                    .value as
                                    ChangeType
                                )
                            }
                            disabled={
                              !isAnalysisEditable
                              || isSavingProvision
                            }
                            style={
                              inputStyle
                            }
                          >
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
                              provisionImpactLevel
                            }
                            onChange={
                              (event) =>
                                setProvisionImpactLevel(
                                  event.target
                                    .value as
                                    ImpactLevel
                                )
                            }
                            disabled={
                              !isAnalysisEditable
                              || isSavingProvision
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
                          Previous Requirement
                        </label>

                        <textarea
                          value={
                            previousRequirement
                          }
                          onChange={
                            (event) =>
                              setPreviousRequirement(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            "Document the previous "
                            + "requirement where known..."
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
                            "18px",
                        }}
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Current Requirement
                        </label>

                        <textarea
                          value={
                            currentRequirement
                          }
                          onChange={
                            (event) =>
                              setCurrentRequirement(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            selectedObligation
                              ? selectedObligation
                                  .obligation_text
                              : (
                                  "Document the current "
                                  + "regulatory requirement..."
                                )
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
                            "18px",
                        }}
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Change Explanation *
                        </label>

                        <textarea
                          value={
                            changeExplanation
                          }
                          onChange={
                            (event) =>
                              setChangeExplanation(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            5
                          }
                          placeholder={
                            "Explain what changed "
                            + "and why the selected "
                            + "provision is affected..."
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
                            "18px",
                        }}
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Legal Interpretation
                        </label>

                        <textarea
                          value={
                            legalInterpretation
                          }
                          onChange={
                            (event) =>
                              setLegalInterpretation(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            "Document the legal or "
                            + "regulatory interpretation..."
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
                            "18px",
                        }}
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Operational Impact
                        </label>

                        <textarea
                          value={
                            operationalImpact
                          }
                          onChange={
                            (event) =>
                              setOperationalImpact(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            "Describe the operational "
                            + "impact on governance, "
                            + "controls, systems or "
                            + "processes..."
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


                      <div>
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Compliance / Governance Impact
                        </label>

                        <textarea
                          value={
                            complianceGovernanceImpact
                          }
                          onChange={
                            (event) =>
                              setComplianceGovernanceImpact(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            "Describe the compliance, governance, "
                            + "policy, accountability or oversight "
                            + "impact..."
                          }
                          style={
                            inputStyle
                          }
                        />
                      </div>

                      <div>
                        <label
                          style={
                            labelStyle
                          }
                        >
                          Evidence / Documentation
                        </label>

                        <textarea
                          value={
                            evidenceDocumentation
                          }
                          onChange={
                            (event) =>
                              setEvidenceDocumentation(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            "Describe the evidence, records, "
                            + "documentation or audit artefacts "
                            + "that should be retained..."
                          }
                          style={
                            inputStyle
                          }
                        />
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
                          Recommended Action
                        </label>

                        <textarea
                          value={
                            recommendedAction
                          }
                          onChange={
                            (event) =>
                              setRecommendedAction(
                                event.target.value
                              )
                          }
                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                          }
                          rows={
                            4
                          }
                          placeholder={
                            "Document the recommended "
                            + "compliance or governance "
                            + "action..."
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
                          "10px",
                        }}
                        >
                        {
                          editingProvisionImpactId
                          && (
                            <button
                              type="button"
                              onClick={
                                cancelEditProvisionImpact
                              }
                              disabled={
                                isSavingProvision
                              }
                              style={{
                                ...secondaryButtonStyle,

                                /*marginRight:
                                  "10px",*/

                                opacity:
                                  isSavingProvision
                                    ? 0.6
                                    : 1,

                                cursor:
                                  isSavingProvision
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              Cancel Edit
                            </button>
                          )
                        }


                        <button
                          type="button"
                          onClick={
                            () => {
                              if (
                                editingProvisionImpactId
                              ) {
                                void handleUpdateProvisionImpact();
                              } else {
                                void handleCreateProvisionImpact();
                              }
                            }
                          }

                          disabled={
                            !isAnalysisEditable
                            || isSavingProvision
                            || !selectedArticle
                          }
                          style={{
                            ...primaryButtonStyle,

                            backgroundColor:
                              (
                                !isAnalysisEditable
                                || isSavingProvision
                                || !selectedArticle
                              )
                                ? "#94a3b8"
                                : "#2563eb",

                            cursor:
                              (
                                !isAnalysisEditable
                                || isSavingProvision
                                || !selectedArticle
                              )
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {
                            isSavingProvision
                              ? (
                                  editingProvisionImpactId
                                    ? "Updating Provision Impact..."
                                    : "Saving Provision Impact..."
                                )
                              : editingProvisionImpactId
                                ? "Update Provision Impact"
                                : "Add Provision Impact"
                          }
                        </button>
                      </div>
                    </div>  


                  </div>
                )
              }

              {
                analysisDetail
                && (
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
                      label="Provision Impacts"
                      value={
                        String(
                          analysisDetail
                            .provision_count
                        )
                      }
                    />

                    <InfoItem
                      label="Validated Provisions"
                      value={
                        String(
                          analysisDetail
                            .validated_provision_count
                        )
                      }
                    />

                    <InfoItem
                      label="Affected Controls"
                      value={
                        String(
                          analysisDetail
                            .affected_control_count
                        )
                      }
                    />

                    <InfoItem
                      label="Supersedes"
                      value={
                        analysisDetail
                          .analysis
                          .supersedes_analysis_id
                          ? (
                              `Analysis #`
                              + `${analysisDetail
                                .analysis
                                .supersedes_analysis_id}`
                            )
                          : "None"
                      }
                    />
                  </div>
                )
              }

              {
                analysisDetail
                && analysisDetail
                  .provision_impacts
                  .length > 0
                && (
                  <div
                    style={{
                      marginTop:
                        "24px",

                      paddingTop:
                        "22px",

                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
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

                        marginBottom:
                          "16px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin:
                              "0 0 5px",

                            fontSize:
                              "18px",
                          }}
                        >
                          Saved Provision Impacts
                        </h3>

                        <p
                          style={{
                            margin:
                              0,

                            color:
                              "#64748b",

                            fontSize:
                              "13px",

                            lineHeight:
                              1.6,
                          }}
                        >
                          Review the persisted
                          Article-level impact
                          assessments before
                          validating this structured
                          analysis.
                        </p>
                      </div>

                      <StatusBadge
                        text={
                          `${analysisDetail.provision_count} `
                          + (
                            analysisDetail.provision_count
                            === 1
                              ? "Provision"
                              : "Provisions"
                          )
                        }
                        tone="neutral"
                      />
                    </div>


                    <div
                      style={{
                        display:
                          "grid",

                        gap:
                          "16px",
                      }}
                    >
                      {
                        analysisDetail
                          .provision_impacts
                          .map(
                            (
                              detail
                            ) => {
                              const impact =
                                detail.impact;
                              
                              const reviewHistory =
                                detail.review_history;

                              const isReviewHistoryExpanded =
                                expandedReviewHistories[
                                  impact.id
                                ] ?? false;

                              const hiddenReviewCount =
                                Math.max(
                                  reviewHistory.length - 3,
                                  0
                                );

                              const visibleReviewHistory =
                                reviewHistory.length <= 3
                                || isReviewHistoryExpanded
                                  ? reviewHistory
                                  : reviewHistory.slice(
                                      -3
                                    );

                              const visibleReviewStartIndex =
                                reviewHistory.length
                                - visibleReviewHistory.length;

                              const provisionReviewNote =
                                (
                                  provisionReviewNotes[
                                    impact.id
                                  ]
                                  ?? ""
                                ).trim();

                              const hasValidProvisionReviewNote =
                                provisionReviewNote.length >= 10;

                              return (
                                <div
                                  key={
                                    impact.id
                                  }
                                  style={{
                                    padding:
                                      "18px",

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
                                      display:
                                        "flex",

                                      justifyContent:
                                        "space-between",

                                      alignItems:
                                        "flex-start",

                                      gap:
                                        "12px",

                                      flexWrap:
                                        "wrap",

                                      marginBottom:
                                        "16px",
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          color:
                                            "#0f172a",

                                          fontSize:
                                            "15px",

                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        {
                                          detail.article
                                            ? (
                                                detail.article
                                                  .article_number
                                                + (
                                                  detail.article
                                                    .title
                                                    ? (
                                                        " — "
                                                        + detail.article
                                                          .title
                                                      )
                                                    : ""
                                                )
                                              )
                                            : impact
                                                .provision_reference
                                        }
                                      </div>

                                      {
                                        detail.obligation
                                        && (
                                          <div
                                            style={{
                                              marginTop:
                                                "5px",

                                              color:
                                                "#64748b",

                                              fontSize:
                                                "12px",
                                            }}
                                          >
                                            {
                                              detail.obligation
                                                .obligation_code
                                            }
                                          </div>
                                        )
                                      }
                                    </div>


                                    <div
                                      style={{
                                        display:
                                          "flex",

                                        alignItems:
                                          "center",

                                        gap:
                                          "10px",

                                        flexWrap:
                                          "wrap",
                                      }}
                                    >
                                      <StatusBadge
                                        text={
                                          formatStatus(
                                            impact.review_status
                                          )
                                        }
                                        tone={
                                          impact.review_status
                                          === "validated"
                                            ? "success"
                                            : impact.review_status
                                              === "rejected"
                                              ? "neutral"
                                              : "warning"
                                        }
                                      />


                                      {
                                        isAnalysisEditable
                                        && (
                                          <button
                                            type="button"
                                            onClick={
                                              () => {
                                                beginEditProvisionImpact(
                                                  detail
                                                );
                                              }
                                            }
                                            disabled={
                                              isSavingProvision
                                            }
                                            style={{
                                              ...secondaryButtonStyle,

                                              padding:
                                                "7px 12px",

                                              fontSize:
                                                "12px",

                                              opacity:
                                                isSavingProvision
                                                  ? 0.6
                                                  : 1,

                                              cursor:
                                                isSavingProvision
                                                  ? "not-allowed"
                                                  : "pointer",
                                            }}
                                          >
                                            Edit
                                          </button>
                                        )
                                      }
                                    </div>
                                  </div>


                                  <div
                                    style={{
                                      display:
                                        "grid",

                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(180px, 1fr))",

                                      gap:
                                        "14px",
                                    }}
                                  >
                                    <InfoItem
                                      label="Change Type"
                                      value={
                                        formatStatus(
                                          impact.change_type
                                        )
                                      }
                                    />

                                    <InfoItem
                                      label="Impact Level"
                                      value={
                                        impact.impact_level
                                          ? formatStatus(
                                              impact.impact_level
                                            )
                                          : "Not available"
                                      }
                                    />

                                    <InfoItem
                                      label="Provision Reference"
                                      value={
                                        impact
                                          .provision_reference
                                      }
                                    />

                                    <InfoItem
                                      label="Review Status"
                                      value={
                                        formatStatus(
                                          impact.review_status
                                        )
                                      }
                                    />
                                  </div>


                                  {
                                    impact.previous_requirement
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "14px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Previous Requirement"
                                          value={
                                            impact
                                              .previous_requirement
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    impact.current_requirement
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Current Requirement"
                                          value={
                                            impact
                                              .current_requirement
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    impact.change_explanation
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Change Explanation"
                                          value={
                                            impact
                                              .change_explanation
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    impact.legal_interpretation
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Legal Interpretation"
                                          value={
                                            impact
                                              .legal_interpretation
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    impact.operational_impact
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Operational Impact"
                                          value={
                                            impact
                                              .operational_impact
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    impact.compliance_governance_impact
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Compliance / Governance Impact"
                                          value={
                                            impact
                                              .compliance_governance_impact
                                          }
                                        />
                                      </div>
                                    )
                                  }

                                  {
                                    impact.evidence_documentation
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Evidence / Documentation"
                                          value={
                                            impact
                                              .evidence_documentation
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    impact.recommended_action
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "10px",
                                        }}
                                      >
                                        <InfoItem
                                          label="Recommended Action"
                                          value={
                                            impact
                                              .recommended_action
                                          }
                                        />
                                      </div>
                                    )
                                  }


                                  {
                                    detail.controls.length > 0
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "16px",

                                          paddingTop:
                                            "14px",

                                          borderTop:
                                            "1px solid #e2e8f0",
                                        }}
                                      >
                                        <div
                                          style={
                                            smallLabelStyle
                                          }
                                        >
                                          Affected Controls
                                        </div>

                                        <div
                                          style={{
                                            marginTop:
                                              "8px",

                                            display:
                                              "grid",

                                            gap:
                                              "8px",
                                          }}
                                        >
                                          {
                                            detail.controls.map(
                                              (
                                                control
                                              ) => (
                                                <div
                                                  key={
                                                    control.id
                                                  }
                                                  style={{
                                                    padding:
                                                      "10px 12px",

                                                    border:
                                                      "1px solid #e2e8f0",

                                                    borderRadius:
                                                      "8px",

                                                    backgroundColor:
                                                      "#ffffff",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      color:
                                                        "#0f172a",

                                                      fontSize:
                                                        "12px",

                                                      fontWeight:
                                                        800,
                                                    }}
                                                  >
                                                    {
                                                      control
                                                        .control_code
                                                      + " — "
                                                      + control
                                                        .control_name
                                                    }
                                                  </div>

                                                  {
                                                    control
                                                      .control_description
                                                    && (
                                                      <div
                                                        style={{
                                                          marginTop:
                                                            "5px",

                                                          color:
                                                            "#64748b",

                                                          fontSize:
                                                            "12px",

                                                          lineHeight:
                                                            1.5,
                                                        }}
                                                      >
                                                        {
                                                          control
                                                            .control_description
                                                        }
                                                      </div>
                                                    )
                                                  }
                                                </div>
                                              )
                                            )
                                          }
                                        </div>
                                      </div>
                                    )
                                  }


                                  {
                                    isAnalysisEditable
                                    && impact.review_status === "pending_review"
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "18px",

                                          paddingTop:
                                            "16px",

                                          borderTop:
                                            "1px solid #e2e8f0",
                                        }}
                                      >
                                        <div
                                          style={{
                                            marginBottom:
                                              "12px",
                                          }}
                                        >
                                          <div
                                            style={{
                                              color:
                                                "#0f172a",

                                              fontSize:
                                                "13px",

                                              fontWeight:
                                                800,
                                            }}
                                          >
                                            Provision Human Review
                                          </div>

                                          <div
                                            style={{
                                              marginTop:
                                                "4px",

                                              color:
                                                "#64748b",

                                              fontSize:
                                                "12px",

                                              lineHeight:
                                                1.5,
                                            }}
                                          >
                                            Record the reviewer assessment
                                            before validating or rejecting
                                            this provision impact.
                                          </div>
                                        </div>


                                        <div>
                                          <label
                                            style={
                                              labelStyle
                                            }
                                          >
                                            Provision Review Notes
                                          </label>

                                          <textarea
                                            value={
                                              provisionReviewNotes[
                                                impact.id
                                              ]
                                              ?? ""
                                            }
                                            onChange={
                                              (
                                                event
                                              ) => {
                                                const value =
                                                  event.target.value;

                                                setProvisionReviewNotes(
                                                  (
                                                    previous
                                                  ) => ({
                                                    ...previous,

                                                    [impact.id]:
                                                      value,
                                                  })
                                                );
                                              }
                                            }
                                            placeholder={
                                              "Enter the human review rationale "
                                              + "for this provision impact..."
                                            }
                                            disabled={
                                              isReviewingProvision
                                            }
                                            style={{
                                              ...inputStyle,

                                              minHeight:
                                                "100px",

                                              resize:
                                                "vertical",
                                            }}
                                          />

                                          <div
                                            style={{
                                              marginTop:
                                                "6px",

                                              color:
                                                hasValidProvisionReviewNote
                                                  ? "#166534"
                                                  : "#64748b",

                                              fontSize:
                                                "12px",
                                            }}
                                          >
                                            {
                                              hasValidProvisionReviewNote
                                                ? "Review notes requirement satisfied."
                                                : "Minimum 10 characters required."
                                            }
                                          </div>
                                        </div>


                                        <div
                                          style={{
                                            display:
                                              "flex",

                                            justifyContent:
                                              "flex-end",

                                            gap:
                                              "10px",

                                            flexWrap:
                                              "wrap",

                                            marginTop:
                                              "12px",
                                          }}
                                        >
                                          <button
                                            type="button"
                                            onClick={
                                              () => {
                                                void handleReviewProvisionImpact(
                                                  impact.id,
                                                  "rejected"
                                                );
                                              }
                                            }
                                            disabled={
                                              isReviewingProvision
                                              || !hasValidProvisionReviewNote
                                            }
                                            style={{
                                              ...secondaryButtonStyle,

                                              opacity:
                                                (
                                                  isReviewingProvision
                                                  || !hasValidProvisionReviewNote
                                                )
                                                  ? 0.6
                                                  : 1,

                                              cursor:
                                                (
                                                  isReviewingProvision
                                                  || !hasValidProvisionReviewNote
                                                )
                                                  ? "not-allowed"
                                                  : "pointer",
                                            }}
                                          >
                                            {
                                              isReviewingProvision
                                              && reviewingProvisionImpactId
                                                === impact.id
                                                ? "Reviewing..."
                                                : "Reject Provision"
                                            }
                                          </button>


                                          <button
                                            type="button"
                                            onClick={
                                              () => {
                                                void handleReviewProvisionImpact(
                                                  impact.id,
                                                  "validated"
                                                );
                                              }
                                            }
                                            disabled={
                                              isReviewingProvision
                                              || !hasValidProvisionReviewNote
                                            }
                                            style={{
                                              ...primaryButtonStyle,

                                              backgroundColor:
                                                (
                                                  isReviewingProvision
                                                  || !hasValidProvisionReviewNote
                                                )
                                                  ? "#94a3b8"
                                                  : "#16a34a",

                                              opacity:
                                                (
                                                  isReviewingProvision
                                                  || !hasValidProvisionReviewNote
                                                )
                                                  ? 0.6
                                                  : 1,

                                              cursor:
                                                (
                                                  isReviewingProvision
                                                  || !hasValidProvisionReviewNote
                                                )
                                                  ? "not-allowed"
                                                  : "pointer",
                                            }}
                                          >
                                            {
                                              isReviewingProvision
                                              && reviewingProvisionImpactId
                                                === impact.id
                                                ? "Reviewing..."
                                                : "Validate Provision"
                                            }
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  }


                                      <div
                                        style={{
                                          color:
                                            "#0f172a",

                                          fontSize:
                                            "13px",

                                          fontWeight:
                                            800,

                                          marginBottom:
                                            "12px",
                                        }}
                                      >
                                        Human Review History
                                      </div>


                                      {
                                        detail.review_history
                                          .length > 0
                                          ? (
                                            <>
                                              <div
                                                style={{
                                                  display:
                                                    "grid",

                                                  gap:
                                                    "12px",
                                                }}
                                              >
                                                {
                                                  visibleReviewHistory
                                                    .map(
                                                      (
                                                        review,
                                                        index
                                                      ) => (
                                                        <div
                                                          key={
                                                            review.id
                                                          }
                                                          style={{
                                                            padding:
                                                              "14px",

                                                            border:
                                                              "1px solid #dbe3ef",

                                                            borderRadius:
                                                              "10px",

                                                            backgroundColor:
                                                              "#ffffff",
                                                          }}
                                                        >
                                                          <div
                                                            style={{
                                                              marginBottom:
                                                                "10px",

                                                              color:
                                                                "#0f172a",

                                                              fontSize:
                                                                "12px",

                                                              fontWeight:
                                                                800,
                                                            }}
                                                          >
                                                            {
                                                              `Review #${
                                                                visibleReviewStartIndex
                                                                + index
                                                                + 1
                                                              }`
                                                            }
                                                          </div>


                                                          <div
                                                            style={{
                                                              display:
                                                                "grid",

                                                              gridTemplateColumns:
                                                                "repeat(auto-fit, minmax(180px, 1fr))",

                                                              gap:
                                                                "14px",
                                                            }}
                                                          >
                                                            <InfoItem
                                                              label=
                                                                "Review Status"
                                                              value={
                                                                formatStatus(
                                                                  review
                                                                    .review_status
                                                                )
                                                              }
                                                            />

                                                            <InfoItem
                                                              label=
                                                                "Reviewed By"
                                                              value={
                                                                review
                                                                  .reviewed_by_user_id
                                                                  ? (
                                                                      `User #`
                                                                      + `${review.reviewed_by_user_id}`
                                                                    )
                                                                  : "Not available"
                                                              }
                                                            />

                                                            <InfoItem
                                                              label=
                                                                "Reviewed At"
                                                              value={
                                                                formatDate(
                                                                  review
                                                                    .reviewed_at
                                                                )
                                                              }
                                                            />
                                                          </div>

                                                          <div
                                                            style={{
                                                              marginTop:
                                                                "10px",
                                                            }}
                                                          >
                                                            <InfoItem
                                                              label=
                                                                "Review Notes"
                                                              value={
                                                                review
                                                                  .review_notes
                                                              }
                                                            />
                                                          </div>
                                                        </div>
                                                      )
                                                    )
                                                }
                                                </div>

                                                  {
                                                    hiddenReviewCount > 0
                                                    && (
                                                      <div
                                                        style={{
                                                          marginTop:
                                                            "10px",

                                                          display:
                                                            "flex",

                                                          justifyContent:
                                                            "flex-start",
                                                        }}
                                                      >
                                                        <button
                                                          type="button"
                                                          onClick={
                                                            () => {
                                                              setExpandedReviewHistories(
                                                                (
                                                                  previous
                                                                ) => ({
                                                                  ...previous,

                                                                  [impact.id]:
                                                                    !isReviewHistoryExpanded,
                                                                })
                                                              );
                                                            }
                                                          }
                                                          style={{
                                                            ...secondaryButtonStyle,

                                                            padding:
                                                              "7px 12px",

                                                            fontSize:
                                                              "12px",
                                                          }}
                                                        >
                                                          {
                                                            isReviewHistoryExpanded
                                                              ? "Hide earlier reviews"
                                                              : (
                                                                  `Show earlier reviews `
                                                                  + `(${hiddenReviewCount})`
                                                                )
                                                          }
                                                        </button>
                                                      </div>
                                                    )
                                                  }
                                                </>
                                              )
                                            : (
                                              <div>
                                                <div
                                                  style={{
                                                    display:
                                                      "grid",

                                                    gridTemplateColumns:
                                                      "repeat(auto-fit, minmax(180px, 1fr))",

                                                    gap:
                                                      "14px",
                                                  }}
                                                >
                                                  <InfoItem
                                                    label=
                                                      "Review Status"
                                                    value={
                                                      formatStatus(
                                                        impact
                                                          .review_status
                                                      )
                                                    }
                                                  />

                                                  <InfoItem
                                                    label=
                                                      "Reviewed By"
                                                    value={
                                                      impact
                                                        .reviewed_by_user_id
                                                        ? (
                                                            `User #`
                                                            + `${impact.reviewed_by_user_id}`
                                                          )
                                                        : "Not available"
                                                    }
                                                  />

                                                  <InfoItem
                                                    label=
                                                      "Reviewed At"
                                                    value={
                                                      impact
                                                        .reviewed_at
                                                        ? formatDate(
                                                            impact
                                                              .reviewed_at
                                                          )
                                                        : "Not available"
                                                    }
                                                  />
                                                </div>

                                                {
                                                  impact.review_notes
                                                  && (
                                                    <div
                                                      style={{
                                                        marginTop:
                                                          "10px",
                                                      }}
                                                    >
                                                      <InfoItem
                                                        label=
                                                          "Review Notes"
                                                        value={
                                                          impact
                                                            .review_notes
                                                        }
                                                      />
                                                    </div>
                                                  )
                                                }
                                              </div>
                                            )
                                      }

                                  
                                  {
                                    impact.source_url
                                    && (
                                      <div
                                        style={{
                                          marginTop:
                                            "14px",
                                        }}
                                      >
                                        <a
                                          href={
                                            impact.source_url
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            color:
                                              "#2563eb",

                                            fontSize:
                                              "12px",

                                            fontWeight:
                                              700,

                                            textDecoration:
                                              "none",
                                          }}
                                        >
                                          Open Provision Source ↗
                                        </a>
                                      </div>
                                    )
                                  }
                                </div>
                              );
                            }
                          )
                      }
                    </div>
                  </div>
                )
              }


              {
                analysisDetail
                && analysisDetail.provision_count > 0
                && (
                  <div
                    style={{
                      marginTop:
                        "24px",

                      paddingTop:
                        "22px",

                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          "16px",
                      }}
                    >
                      <h3
                        style={{
                          margin:
                            "0 0 6px",

                          fontSize:
                            "18px",
                        }}
                      >
                        Structured Analysis Validation
                      </h3>

                      <p
                        style={{
                          margin:
                            0,

                          color:
                            "#64748b",

                          fontSize:
                            "13px",

                          lineHeight:
                            1.6,
                        }}
                      >
                        Validate the completed
                        provision-level assessment
                        before publication.
                      </p>
                    </div>


                    {
                      isAnalysisEditable
                        ? (
                          <>
                            <div>
                              <label
                                style={
                                  labelStyle
                                }
                              >
                                Validation Notes
                              </label>

                              <textarea
                                value={
                                  validationNotes
                                }
                                onChange={
                                  (event) =>
                                    setValidationNotes(
                                      event.target.value
                                    )
                                }
                                disabled={
                                  isValidatingAnalysis
                                }
                                rows={
                                  5
                                }
                                placeholder={
                                  "Document the basis "
                                  + "for validating this "
                                  + "structured regulatory "
                                  + "analysis..."
                                }
                                style={{
                                  ...inputStyle,

                                  resize:
                                    "vertical",

                                  lineHeight:
                                    1.6,
                                }}
                              />
                            
                              <div
                                  style={{
                                    marginTop:
                                      "6px",

                                    color:
                                      hasValidAnalysisValidationNotes
                                        ? "#166534"
                                        : "#64748b",

                                    fontSize:
                                      "12px",
                                  }}
                                >
                                  {
                                    hasValidAnalysisValidationNotes
                                      ? "Validation notes requirement satisfied."
                                      : "Minimum 10 characters required."
                                  }
                                </div>
                            </div>


                            <div
                              style={{
                                marginTop:
                                  "18px",

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
                                    void handleValidateStructuredAnalysis();
                                  }
                                }
                                disabled={
                                  isValidatingAnalysis
                                  || !hasValidAnalysisValidationNotes
                                  || analysisDetail.provision_count < 1
                                  || analysisDetail
                                    .validated_provision_count
                                    !== analysisDetail
                                      .provision_count
                                }
                                style={{
                                  ...primaryButtonStyle,

                                  backgroundColor:
                                    (
                                      isValidatingAnalysis
                                      || !hasValidAnalysisValidationNotes
                                      || analysisDetail.provision_count < 1
                                      || analysisDetail
                                        .validated_provision_count
                                        !== analysisDetail
                                          .provision_count
                                    )
                                      ? "#94a3b8"
                                      : "#16a34a",
                                  
                                  opacity:
                                    (
                                      isValidatingAnalysis
                                      || !hasValidAnalysisValidationNotes
                                      || analysisDetail.provision_count < 1
                                      || analysisDetail
                                         .validated_provision_count
                                         !== analysisDetail
                                           .provision_count
                                    )
                                      ? 0.6
                                      : 1,    

                                  cursor:
                                    (
                                      isValidatingAnalysis
                                      || !hasValidAnalysisValidationNotes
                                      || analysisDetail.provision_count < 1
                                      || analysisDetail
                                        .validated_provision_count
                                        !== analysisDetail
                                          .provision_count
                                    )
                                      ? "not-allowed"
                                      : "pointer",
                                    }}
                              >
                                {
                                  isValidatingAnalysis
                                    ? "Validating Analysis..."
                                    : "Validate Structured Analysis"
                                }
                              </button>
                            </div>
                          </>
                        )
                        : (
                            <div
                              style={{
                                display:
                                  "grid",

                                gap:
                                  "14px",
                              }}
                            >
                              <MessageBox
                                tone="success"
                              >
                                This structured regulatory
                                analysis is no longer editable.
                                Current status:{" "}
                                <strong>
                                  {
                                    formatStatus(
                                      analysisDetail
                                        .analysis
                                        .analysis_status
                                    )
                                  }
                                </strong>
                                .
                              </MessageBox>

                              <div
                                style={{
                                  padding:
                                    "16px",

                                  border:
                                    "1px solid #dbe3ef",

                                  borderRadius:
                                    "10px",

                                  backgroundColor:
                                    "#ffffff",
                                }}
                              >
                                <div
                                  style={{
                                    marginBottom:
                                      "12px",

                                    color:
                                      "#0f172a",

                                    fontSize:
                                      "13px",

                                    fontWeight:
                                      800,
                                  }}
                                >
                                  Structured Analysis Validation Record
                                </div>

                                <div
                                  style={{
                                    display:
                                      "grid",

                                    gridTemplateColumns:
                                      "repeat(auto-fit, minmax(180px, 1fr))",

                                    gap:
                                      "14px",
                                  }}
                                >
                                  <InfoItem
                                    label=
                                      "Validation Status"
                                    value={
                                      formatStatus(
                                        analysisDetail
                                          .analysis
                                          .analysis_status
                                      )
                                    }
                                  />

                                  <InfoItem
                                    label=
                                      "Validated By"
                                    value={
                                      analysisDetail
                                        .analysis
                                        .validated_by_user_id
                                        ? (
                                            `User #`
                                            + `${analysisDetail.analysis.validated_by_user_id}`
                                          )
                                        : "Not available"
                                    }
                                  />

                                  <InfoItem
                                    label=
                                      "Validated At"
                                    value={
                                      analysisDetail
                                        .analysis
                                        .validated_at
                                        ? formatDate(
                                            analysisDetail
                                              .analysis
                                              .validated_at
                                          )
                                        : "Not available"
                                    }
                                  />
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "12px",
                                  }}
                                >
                                  <InfoItem
                                    label=
                                      "Validation Notes"
                                    value={
                                      analysisDetail
                                        .analysis
                                        .validation_notes
                                        ?? "Not available"
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )
                    }
                  </div>
                )
              }

              <div
                style={{
                  marginTop:
                    "22px",

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
                {
                  selectedAnalysis
                  && (
                    <button
                      type="button"
                      onClick={
                        () => {
                          void saveStructuredAnalysis(
                            true
                          );
                        }
                      }
                      disabled={
                        isSavingAnalysis
                        || !canCreateNewAnalysisVersion
                      }
                      style={{
                        ...secondaryButtonStyle,

                        cursor:
                          (
                            isSavingAnalysis
                            || !canCreateNewAnalysisVersion
                          )
                            ? "not-allowed"
                            : "pointer",

                        opacity:
                          (
                            isSavingAnalysis
                            || !canCreateNewAnalysisVersion
                          )
                            ? 0.6
                            : 1,
                      }}
                    >
                      {
                        isSavingAnalysis
                          ? "Creating Version..."
                          : "Create New Version"
                      }
                    </button>
                  )
                }


                <button
                  type="button"
                  onClick={
                    () => {
                      void saveStructuredAnalysis(
                        false
                      );
                    }
                  }
                  disabled={
                    isSavingAnalysis
                    || (
                      selectedAnalysisId
                      !== null
                      && !isAnalysisEditable
                    )
                    || Boolean(
                      change.published_at
                    )
                  }
                  style={{
                    ...primaryButtonStyle,

                    backgroundColor:
                      (
                        isSavingAnalysis
                        || (
                          selectedAnalysisId
                          !== null
                          && !isAnalysisEditable
                        )
                        || Boolean(
                          change.published_at
                        )
                      )
                        ? "#94a3b8"
                        : "#2563eb",

                    cursor:
                      (
                        isSavingAnalysis
                        || (
                          selectedAnalysisId
                          !== null
                          && !isAnalysisEditable
                        )
                        || Boolean(
                          change.published_at
                        )
                      )
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {
                    isSavingAnalysis
                      ? "Saving Analysis..."
                      : selectedAnalysisId
                        ? "Update Analysis"
                        : "Create Analysis Version 1"
                  }
                </button>
              </div>
            </SectionCard>
          </div>
        )
      }


        {/*=============================================
                  /* IMPACT ANALYSIS 
            ===========================================*/}

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
                impactErrorMessage
                && (
                  <MessageBox
                    tone="danger"
                  >
                    {impactErrorMessage}
                  </MessageBox>
                )
              }


              {
                impactSuccessMessage
                && (
                  <MessageBox
                    tone="success"
                  >
                    {impactSuccessMessage}
                  </MessageBox>
                )
              }


              {
                !impactErrorMessage
                && change.impact_status
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
            <div
              ref={
                publicationSectionRef
              }
            >
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
                      review, impact analysis and
                      structured analysis validation
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
                      {
                        change.published_by_name
                        ? (
                            <>
                              {" "}by{" "}
                              <strong>
                                {
                                  change.published_by_name
                                }
                              </strong>
                            </>
                          )
                        : null
                      }
                      . The regulatory review,
                      impact analysis and structured
                      regulatory analysis are now
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
                        {
                          change.review_status
                          !== "reviewed"
                            ? (
                                "Publication is not yet "
                                + "available. Complete the "
                                + "regulatory review first."
                              )
                            : change.review_decision
                              !== "confirmed"
                              ? (
                                  "Publication is not yet "
                                  + "available. Confirm the "
                                  + "regulatory change first."
                                )
                              : change.impact_status
                                !== "analysed"
                                ? (
                                    "Publication is not yet "
                                    + "available. Complete the "
                                    + "impact analysis first."
                                  )
                                : !change.impact_level
                                  ? (
                                      "Publication is not yet "
                                      + "available. Record the "
                                      + "impact level first."
                                    )
                                  : !selectedAnalysis
                                    ? (
                                        "Publication is not yet "
                                        + "available. Create a "
                                        + "structured regulatory "
                                        + "analysis first."
                                      )
                                    : selectedAnalysis
                                        .analysis_status
                                      !== "validated"
                                      ? (
                                          "Publication is not yet "
                                          + "available. The latest "
                                          + "structured regulatory "
                                          + "analysis version must "
                                          + "be validated before "
                                          + "publication."
                                        )
                                      : (
                                          "Publication is not yet "
                                          + "available. Complete "
                                          + "all required workflow "
                                          + "steps before "
                                          + "publication."
                                        )
                        }
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

                  <InfoItem
                    label="Structured Analysis Status"
                    value={
                      selectedAnalysis
                        ? (
                            `Version `
                            + `${selectedAnalysis.analysis_version}`
                            + " — "
                            + formatStatus(
                                selectedAnalysis
                                  .analysis_status
                              )
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
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <InfoItem
                        label="Published By"
                        value={
                          change.published_by_name
                          || ""
                        }
                      />

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
            </div>
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

function getApiErrorMessage(
  data: ApiError,
  fallbackMessage: string
) {
  if (
    typeof data.detail
    === "string"
    && data.detail
  ) {
    return data.detail;
  }

  if (
    Array.isArray(
      data.detail
    )
  ) {
    const messages =
      data.detail
        .map(
          (
            item
          ) =>
            item.msg
        )
        .filter(
          Boolean
        );

    if (
      messages.length
      > 0
    ) {
      return messages.join(
        " "
      );
    }
  }

  return fallbackMessage;
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