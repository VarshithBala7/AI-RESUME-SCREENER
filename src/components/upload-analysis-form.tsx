"use client";

import { useMemo, useState } from "react";
import type { ResumeVersion } from "@prisma/client";

type AnalyzeResult = {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  atsResumeText: string;
  extractedResumeText: string;
};

type UploadAnalysisFormProps = {
  history: ResumeVersion[];
};

const ACCEPTED_TYPES = ".pdf,.docx,.txt";

export function UploadAnalysisForm({ history }: UploadAnalysisFormProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const historyPreview = useMemo(
    () => history.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [history],
  );

  const runAnalysis = async () => {
    if (!resumeFile) {
      setError("Please upload your current resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please add the job description.");
      return;
    }

    setLoading(true);
    setError("");
    setSavedId(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/analysis", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to analyze resume.");
      }

      setResult(json.data as AnalyzeResult);
    } catch (analysisError) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Could not analyze resume right now.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const saveVersion = async () => {
    if (!result) return;
    setSaveLoading(true);
    setError("");

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription,
          originalResumeText: result.extractedResumeText,
          atsResumeText: result.atsResumeText,
          matchPercentage: result.matchPercentage,
          missingKeywords: result.missingKeywords,
          matchedKeywords: result.matchedKeywords,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to save this resume version.");
      }

      setSavedId(json.data.id);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Could not save resume version.";
      setError(message);
    } finally {
      setSaveLoading(false);
    }
  };

  const downloadGenerated = async (format: "pdf" | "docx") => {
    if (!result) return;

    const response = await fetch(`/api/export/${format}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        atsResumeText: result.atsResumeText,
      }),
    });

    if (!response.ok) {
      const json = await response.json();
      setError(json.error ?? `Could not export ${format.toUpperCase()}.`);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ats-resume.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="layout-grid">
      <div className="card space-y-4">
        <h2>New Resume Screening</h2>
        <p className="muted">
          Upload your resume and paste the job description to get ATS matching, missing keywords,
          and an ATS-optimized resume.
        </p>

        <div className="space-y-2">
          <label htmlFor="resumeUpload">Upload Current Resume</label>
          <input
            id="resumeUpload"
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="jobDescription">Job Description</label>
          <textarea
            id="jobDescription"
            placeholder="Paste the complete job description here..."
            rows={10}
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {error ? <p className="error-text">{error}</p> : null}

        {result ? (
          <div className="result-box">
            <h3>Screening Result</h3>
            <p>
              <strong>Match Percentage:</strong> {result.matchPercentage}%
            </p>
            <p>
              <strong>Matched Keywords:</strong>{" "}
              {result.matchedKeywords.length > 0 ? result.matchedKeywords.join(", ") : "None"}
            </p>
            <p>
              <strong>Missing Keywords:</strong>{" "}
              {result.missingKeywords.length > 0 ? result.missingKeywords.join(", ") : "None"}
            </p>
            <div className="space-y-2">
              <strong>ATS Resume Preview:</strong>
              <pre className="resume-preview">{result.atsResumeText}</pre>
            </div>

            <div className="row-gap">
              <button className="btn" onClick={saveVersion} disabled={saveLoading}>
                {saveLoading ? "Saving..." : "Save to Dashboard"}
              </button>
              <button className="btn" onClick={() => downloadGenerated("pdf")}>
                Download PDF
              </button>
              <button className="btn" onClick={() => downloadGenerated("docx")}>
                Download Word (.docx)
              </button>
            </div>

            {savedId ? <p className="success-text">Saved successfully (ID: {savedId}).</p> : null}
          </div>
        ) : null}
      </div>

      <aside className="card space-y-3">
        <h3>Previous Resumes</h3>
        <p className="muted">
          Preview your recent versions with ATS score and quick keyword insights.
        </p>
        {historyPreview.length === 0 ? (
          <p className="muted">No previous resume versions yet.</p>
        ) : (
          <ul className="history-list">
            {historyPreview.map((item) => (
              <li key={item.id} className="history-item">
                <div>
                  <strong>{item.matchPercentage}% match</strong>
                  <p className="muted">
                    {new Date(item.createdAt).toLocaleString()} | Missing:{" "}
                    {item.missingKeywords.length}
                  </p>
                </div>
                <details>
                  <summary>Preview ATS Resume</summary>
                  <pre className="resume-preview compact">{item.atsResumeText}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
