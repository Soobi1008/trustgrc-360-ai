"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

type AISystem = {
  id: number;
  name: string;
  vendor?: string | null;
  model_type?: string | null;
};

type GeneratedRisk = {
  id: number;
  ai_system_id: number;
  title: string;
  category: string;
  description: string;
  reason_generated?: string | null;
  likelihood: string;
  impact: string;
  risk_score: number;
  recommended_control: string;
  regulation?: string | null;
  generation_source: string;
  review_status: string;
  created_at: string;
};

export default function GeneratedRisksPage() {
  const [aiSystems, setAiSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [risks, setRisks] = useState<GeneratedRisk[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(true);
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAISystems();
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      loadGeneratedRisks(selectedSystemId);
    } else {
      setRisks([]);
    }
  }, [selectedSystemId]);

  async function loadAISystems() {
    setLoadingSystems(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai-systems`
      );

      if (!response.ok) {
        throw new Error("Unable to load AI systems.");
      }

      const data: AISystem[] = await response.json();
      setAiSystems(data);

      if (data.length > 0) {
        setSelectedSystemId(String(data[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load AI systems."
      );
    } finally {
      setLoadingSystems(false);
    }
  }

  async function loadGeneratedRisks(aiSystemId: string) {
    setLoadingRisks(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai-systems/${aiSystemId}/generated-risks`
      );

      if (!response.ok) {
        throw new Error("Unable to load generated risks.");
      }

      const data: GeneratedRisk[] = await response.json();
      setRisks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load generated risks."
      );
    } finally {
      setLoadingRisks(false);
    }
  }

  async function generateRisks() {
    if (!selectedSystemId) {
      setError("Please select an AI system.");
      return;
    }

    setGenerating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai-systems/${selectedSystemId}/generate-risks`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          details || "Unable to generate risks."
        );
      }

      const data: GeneratedRisk[] = await response.json();
      setRisks(data);
      setMessage(
        `${data.length} risk recommendation${
          data.length === 1 ? "" : "s"
        } generated successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate risks."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function reviewRisk(
    riskId: number,
    reviewStatus: string
  ) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/generated-risks/${riskId}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            review_status: reviewStatus,
          }),
        }
      );

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          details || "Unable to update the risk."
        );
      }

      const updatedRisk: GeneratedRisk =
        await response.json();

      setRisks((currentRisks) =>
        currentRisks.map((risk) =>
          risk.id === updatedRisk.id ? updatedRisk : risk
        )
      );

      setMessage(
        `${updatedRisk.title} marked as ${reviewStatus}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the risk."
      );
    }
  }

  function statusClass(status: string) {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Needs Information":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  }

  function categoryClass(category: string) {
    if (category.includes("Compliance")) {
      return "bg-purple-100 text-purple-800";
    }

    if (category.includes("Privacy")) {
      return "bg-cyan-100 text-cyan-800";
    }

    if (category.includes("Governance")) {
      return "bg-indigo-100 text-indigo-800";
    }

    if (category.includes("Third-Party")) {
      return "bg-orange-100 text-orange-800";
    }

    return "bg-slate-100 text-slate-800";
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          TrustGRC AI 360 Intelligence Layer
        </h1>

        <p className="mt-2 text-gray-600">
          Generate explainable AI governance, compliance,
          privacy and cybersecurity risks.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="ai-system"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              AI System
            </label>

            <select
              id="ai-system"
              value={selectedSystemId}
              onChange={(event) =>
                setSelectedSystemId(event.target.value)
              }
              disabled={loadingSystems}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {loadingSystems && (
                <option>Loading AI systems...</option>
              )}

              {!loadingSystems &&
                aiSystems.length === 0 && (
                  <option value="">
                    No AI systems available
                  </option>
                )}

              {aiSystems.map((system) => (
                <option
                  key={system.id}
                  value={system.id}
                >
                  {system.name}
                  {system.vendor
                    ? ` — ${system.vendor}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={generateRisks}
            disabled={
              !selectedSystemId ||
              generating ||
              loadingSystems
            }
            className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Generating..."
              : "Generate Risks"}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Generated Risks"
          value={risks.length}
        />

        <SummaryCard
          label="Suggested"
          value={
            risks.filter(
              (risk) =>
                risk.review_status === "Suggested"
            ).length
          }
        />

        <SummaryCard
          label="Approved"
          value={
            risks.filter(
              (risk) =>
                risk.review_status === "Approved"
            ).length
          }
        />

        <SummaryCard
          label="Rejected"
          value={
            risks.filter(
              (risk) =>
                risk.review_status === "Rejected"
            ).length
          }
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-semibold">
            Generated Risk Recommendations
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            AI-generated suggestions require human review.
          </p>
        </div>

        {loadingRisks ? (
          <div className="p-8 text-center text-gray-500">
            Loading generated risks...
          </div>
        ) : risks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No generated risks are available for this AI
            system. Click Generate Risks to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">
                    Category
                  </th>
                  <th className="px-4 py-3">
                    Likelihood
                  </th>
                  <th className="px-4 py-3">
                    Impact
                  </th>
                  <th className="px-4 py-3">
                    Regulation
                  </th>
                  <th className="px-4 py-3">
                    Recommended Control
                  </th>
                  <th className="px-4 py-3">
                    Status
                  </th>
                  <th className="px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {risks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="align-top"
                  >
                    <td className="min-w-72 px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        {risk.title}
                      </div>

                      <div className="mt-1 text-gray-600">
                        {risk.description}
                      </div>

                      {risk.reason_generated && (
                        <div className="mt-2 text-xs text-gray-500">
                          Why generated:{" "}
                          {risk.reason_generated}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass(
                          risk.category
                        )}`}
                      >
                        {risk.category}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {risk.likelihood}
                    </td>

                    <td className="px-4 py-4">
                      {risk.impact}
                    </td>

                    <td className="min-w-40 px-4 py-4">
                      {risk.regulation || "—"}
                    </td>

                    <td className="min-w-64 px-4 py-4">
                      {risk.recommended_control}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          risk.review_status
                        )}`}
                      >
                        {risk.review_status}
                      </span>
                    </td>

                    <td className="min-w-52 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            reviewRisk(
                              risk.id,
                              "Approved"
                            )
                          }
                          className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            reviewRisk(
                              risk.id,
                              "Rejected"
                            )
                          }
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            reviewRisk(
                              risk.id,
                              "Needs Information"
                            )
                          }
                          className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Need Info
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}