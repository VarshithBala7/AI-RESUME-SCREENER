import type { AnalysisResult } from "@/lib/keyword-engine";

function section(title: string, body: string): string {
  return `${title.toUpperCase()}\n${body.trim()}\n`;
}

function bulletify(items: string[]): string {
  if (!items.length) {
    return "-";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function pickInputLines(resumeText: string, maxLines = 12): string[] {
  return resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, maxLines);
}

export function generateAtsResumeContent(input: {
  candidateName?: string;
  resumeText: string;
  jobDescription: string;
  analysis: AnalysisResult;
}): string {
  const { candidateName = "Candidate Name", resumeText, jobDescription, analysis } = input;
  const date = new Date().toLocaleDateString();
  const jdSummary = jobDescription
    .replace(/\s+/g, " ")
    .slice(0, 360)
    .trim();
  const existingHighlights = pickInputLines(resumeText).slice(0, 6);

  const summary = [
    `${candidateName} is applying for a role aligned with the provided job description.`,
    `This ATS-optimized resume targets ${analysis.jdKeywordCount} important terms identified from the job posting.`,
    `The profile has been rewritten to improve keyword alignment, scannability, and ATS readability.`,
  ].join(" ");

  const keywords = [
    ...analysis.matchingKeywords,
    ...analysis.missingKeywords.slice(0, 20),
  ];
  const uniqueKeywords = Array.from(new Set(keywords));

  const skillsBlock = uniqueKeywords.length
    ? uniqueKeywords.join(" | ")
    : "Communication | Problem Solving | Collaboration";

  const experienceBullets = [
    ...existingHighlights.slice(0, 3).map((line) => line.replace(/^[-*•]\s*/, "")),
    ...analysis.matchingKeywords.slice(0, 3).map((keyword) => `Applied ${keyword} in practical projects to meet business goals.`),
    ...analysis.missingKeywords
      .slice(0, 3)
      .map((keyword) => `Upskilling plan includes ${keyword} to fully align with role requirements.`),
  ].slice(0, 8);

  const projectBullets = [
    "Built and improved software features using structured problem solving and iterative development.",
    "Collaborated with peers and stakeholders to convert requirements into implementable deliverables.",
    "Documented technical decisions and maintained clear, ATS-friendly project narratives.",
    ...analysis.matchingKeywords.slice(0, 2).map((keyword) => `Demonstrated hands-on ability with ${keyword} in project scenarios.`),
  ];

  const educationBullets = [
    "Bachelor's Degree or equivalent (update with your actual institution and dates).",
    "Relevant coursework aligned with this target role.",
  ];

  const certificationsBullets = analysis.missingKeywords
    .slice(0, 4)
    .map((keyword) => `${keyword} - planned certification / structured training`);

  const sections = [
    `${candidateName}\nEmail: your-email@example.com | Phone: +1-000-000-0000 | Location: Your City\nDate: ${date}\n`,
    section("Professional Summary", summary),
    section("Core Skills", skillsBlock),
    section("Professional Experience", bulletify(experienceBullets)),
    section("Projects", bulletify(projectBullets)),
    section("Education", bulletify(educationBullets)),
    section("Certifications", bulletify(certificationsBullets)),
    section("Target Job Snapshot", jdSummary || "Add the key target role description here."),
    section(
      "ATS Optimization Notes",
      [
        `Current match score before rewrite: ${analysis.matchPercentage}%`,
        `Matched keywords: ${analysis.matchingKeywords.length}`,
        `Missing keywords addressed in this rewrite: ${analysis.missingKeywords.length}`,
      ].join("\n"),
    ),
  ];

  return sections.join("\n").trim();
}

