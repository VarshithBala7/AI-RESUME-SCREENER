"use client";

import { FormEvent, useMemo, useState } from "react";

type HistoryItem = {
  id: string;
  title: string;
  originalResumeText: string;
  atsResumeText: string;
  matchScore: number;
  missingKeywords: string[];
  matchedKeywords: string[];
  createdAt: string;
};

type AnalysisResult = {
  id: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  totalKeywords: number;
  atsResumeText: string;
  extractedResumeText: string;
};

type DashboardClientProps = {
  userName: string;
  userEmail: string;
  initialResumes: HistoryItem[];
};

export default function DashboardClient({
  userName,
  userEmail,
  initialResumes,
}: DashboardClientProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [downloadBusy, setDownloadBusy] = useState<"" | "pdf" | "docx">("");
  const [history, setHistory] = useState<HistoryItem[]>(initialResumes);

  const historyPreview = useMemo(() => history.slice(0, 15), [history]);

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    setError("");
    setAnalysis(null);

    if (!resumeFile) {
      setError("Please upload your current resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);

    setLoading(true);
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        analysis?: Omit<AnalysisResult, "id" | "extractedResumeText">;
        originalResumeText?: string;
        recordId?: string;
        error?: string;
      };

      if (!response.ok || !payload.analysis || !payload.recordId) {
        throw new Error(
          payload.error ?? "Unable to analyze resume right now.",
        );
      }

      const normalized: AnalysisResult = {
        id: payload.recordId,
        extractedResumeText: payload.originalResumeText ?? "",
        ...payload.analysis,
      };

      setAnalysis(normalized);
      setHistory((prev) => [
        {
          id: normalized.id,
          title: `Resume ${new Date().toLocaleDateString()}`,
          originalResumeText: normalized.extractedResumeText,
          atsResumeText: normalized.atsResumeText,
          matchScore: normalized.matchScore,
          missingKeywords: normalized.missingKeywords,
          matchedKeywords: normalized.matchedKeywords,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while analyzing your resume.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function download(type: "pdf" | "docx") {
    if (!analysis?.atsResumeText) return;
    setError("");
    setDownloadBusy(type);

    try {
      const endpoint = type === "pdf" ? "/api/export/pdf" : "/api/export/docx";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          atsResumeText: analysis.atsResumeText,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || "Download failed.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download =
        type === "pdf"
          ? `ats-resume-${analysis.id}.pdf`
          : `ats-resume-${analysis.id}.docx`;
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to export your ATS resume.";
      setError(message);
    } finally {
      setDownloadBusy("");
    }
  }

  return (
    <div className="container" style={{ paddingBlock: "1.5rem" }}>
      <h1>Welcome, {userName}</h1>
      <p className="muted">Signed in as {userEmail}</p>

      <section className="card" style={{ marginTop: "1rem", padding: "1rem" }}>
        <h2>New Resume</h2>
        <p className="muted">
          Upload your current resume and paste the target job description. The screener will return
          ATS match percentage, missing keywords, and an ATS-formatted version.
        </p>

        <form onSubmit={handleAnalyze} className="field" style={{ marginTop: "1rem", gap: "0.8rem" }}>
          <div className="field">
            <label htmlFor="resume">Upload Current Resume (PDF / DOCX / TXT)</label>
            <input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="field">
            <label htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </form>

        {error ? <p className="error-text">{error}</p> : null}
      </section>

      {analysis ? (
        <section className="card" style={{ marginTop: "1rem", padding: "1rem" }}>
          <h2>Analysis Result</h2>
          <p>
            <strong>Match Percentage:</strong> {analysis.matchScore}%
          </p>
          <p>
            <strong>Total Keywords:</strong> {analysis.totalKeywords}
          </p>
          <p>
            <strong>Matched Keywords:</strong>{" "}
            {analysis.matchedKeywords.length
              ? analysis.matchedKeywords.join(", ")
              : "None"}
          </p>
          <p>
            <strong>Missing Keywords:</strong>{" "}
            {analysis.missingKeywords.length
              ? analysis.missingKeywords.join(", ")
              : "None"}
          </p>
          <div className="field" style={{ marginTop: "0.8rem" }}>
            <label>ATS Resume Preview</label>
            <textarea value={analysis.atsResumeText} readOnly rows={18} />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => download("docx")}
              disabled={downloadBusy !== ""}
            >
              {downloadBusy === "docx" ? "Preparing DOCX..." : "Download DOCX"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => download("pdf")}
              disabled={downloadBusy !== ""}
            >
              {downloadBusy === "pdf" ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="card" style={{ marginTop: "1rem", padding: "1rem" }}>
        <h2>Previous Resume Analyses</h2>
        {historyPreview.length === 0 ? (
          <p className="muted">
            You do not have any previous resume analyses yet. Run your first screening above.
          </p>
        ) : (
          <ul style={{ margin: "0.8rem 0 0", paddingLeft: "1rem" }}>
            {historyPreview.map((item) => (
              <li key={item.id} style={{ marginBottom: "0.7rem" }}>
                <strong>{item.title}</strong> - {item.matchScore}% match -{" "}
                {new Date(item.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
