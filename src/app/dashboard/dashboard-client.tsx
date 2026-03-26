"use client";

import { FormEvent, useMemo, useState } from "react";

type HistoryItem = {
  id: string;
  jobDescription: string;
  originalResumeText: string;
  atsResumeText: string;
  matchScore: number;
  missingKeywords: string[];
  createdAt: string;
};

type AnalysisResult = {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  atsResumeText: string;
  totalKeywords: number;
};

export default function DashboardClient({ history }: { history: HistoryItem[] }) {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [downloadBusy, setDownloadBusy] = useState<"" | "pdf" | "docx">("");

  const hasAnalysis = useMemo(() => Boolean(analysis?.atsResumeText), [analysis]);

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
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

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to analyze resume right now.");
      }

      setAnalysis(payload.analysis);
      setResumeText(payload.originalResumeText);
      setInfo("Analysis complete. ATS resume generated and saved to dashboard history.");
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
          fileName: `ats_resume_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Download failed.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const fallback = type === "pdf" ? "ats_resume.pdf" : "ats_resume.docx";
      const nameMatch = disposition?.match(/filename="(.+)"/);
      const fileName = nameMatch?.[1] || fallback;

      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
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
    <div className="page-section">
      <h1 className="section-title">New Resume</h1>
      <p className="muted-text">
        Upload your current resume and paste a job description. We compute match percentage,
        missing keywords, and generate an ATS-ready resume you can download.
      </p>

      <form className="panel form-grid" onSubmit={handleAnalyze}>
        <label className="label" htmlFor="resume">
          Upload Current Resume (PDF / DOCX / TXT)
        </label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
        />

        <label className="label" htmlFor="job-description">
          Job Description
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the full job description here..."
          className="textarea"
          rows={14}
        />

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {info && <p className="success-text">{info}</p>}

      {analysis && (
        <section className="panel results-grid">
          <h2 className="section-title">Analysis Result</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="label">Match Percentage</p>
              <p className="big-value">{analysis.matchScore}%</p>
            </div>
            <div className="stat-card">
              <p className="label">Matched Keywords</p>
              <p className="big-value">{analysis.matchedKeywords.length}</p>
            </div>
            <div className="stat-card">
              <p className="label">Missing Keywords</p>
              <p className="big-value">{analysis.missingKeywords.length}</p>
            </div>
          </div>

          <div className="keywords-grid">
            <div>
              <h3 className="label">Missing Keywords / Skills</h3>
              {analysis.missingKeywords.length ? (
                <ul className="chip-list">
                  {analysis.missingKeywords.map((keyword) => (
                    <li key={keyword} className="chip chip-danger">
                      {keyword}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">Great! No major missing keywords found.</p>
              )}
            </div>

            <div>
              <h3 className="label">Matched Keywords</h3>
              {analysis.matchedKeywords.length ? (
                <ul className="chip-list">
                  {analysis.matchedKeywords.map((keyword) => (
                    <li key={keyword} className="chip chip-success">
                      {keyword}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No keywords matched. Update your resume content.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="label">ATS Resume (Generated)</h3>
            <textarea
              className="textarea ats-output"
              value={analysis.atsResumeText}
              readOnly
              rows={22}
            />
          </div>

          {hasAnalysis && (
            <div className="button-row">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => download("docx")}
                disabled={downloadBusy !== ""}
              >
                {downloadBusy === "docx" ? "Preparing DOCX..." : "Download DOCX"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => download("pdf")}
                disabled={downloadBusy !== ""}
              >
                {downloadBusy === "pdf" ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          )}
        </section>
      )}

      {resumeText && (
        <section className="panel">
          <h2 className="section-title">Extracted Text From Uploaded Resume</h2>
          <textarea className="textarea" rows={14} value={resumeText} readOnly />
        </section>
      )}

      <section className="panel">
        <h2 className="section-title">Previous Resume Analyses</h2>
        {!history.length ? (
          <p className="muted-text">
            You don&apos;t have any previous resume analyses yet. Start by uploading a resume above.
          </p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <article key={item.id} className="history-card">
                <div className="history-header">
                  <p className="label">Match: {item.matchScore}%</p>
                  <p className="muted-text">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className="muted-text">
                  Missing keywords:{" "}
                  {item.missingKeywords.length ? item.missingKeywords.join(", ") : "None"}
                </p>
                <details>
                  <summary>Preview ATS Resume</summary>
                  <pre className="history-preview">{item.atsResumeText}</pre>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
