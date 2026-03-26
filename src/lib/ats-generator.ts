import { ATS_TEMPLATE_HINT } from "@/lib/constants";

type GenerateArgs = {
  resumeText: string;
  jobDescription: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchScore: number;
};

const sanitize = (value: string) => value.replace(/\s+/g, " ").trim();

const topLines = (text: string, count = 5): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, count)
    .map((line) => line.replace(/^[-*•]\s*/, ""));

const bullets = (values: string[]) => values.map((value) => `- ${value}`).join("\n");

const section = (title: string, body: string) => `${title.toUpperCase()}\n${body.trim()}\n`;

export function generateAtsResume(args: GenerateArgs): string {
  const nameGuess = topLines(args.resumeText, 1)[0] || "Candidate Name";
  const resumeHighlights = topLines(args.resumeText, 6);
  const jdSnippet = sanitize(args.jobDescription).slice(0, 360);

  const skills = Array.from(
    new Set([
      ...args.matchedKeywords.slice(0, 20),
      ...args.missingKeywords.slice(0, 20),
    ]),
  );

  const experience = [
    ...resumeHighlights.slice(0, 3),
    ...args.matchedKeywords
      .slice(0, 3)
      .map((keyword) => `Delivered work that demonstrates ${keyword}.`),
    ...args.missingKeywords
      .slice(0, 3)
      .map((keyword) => `Upskilling plan includes ${keyword} to close role gaps.`),
  ].slice(0, 8);

  const projects = [
    "Built and improved software features with measurable outcomes.",
    "Collaborated with peers/stakeholders to convert requirements into deliverables.",
    "Documented technical implementation clearly for ATS readability.",
    ...args.matchedKeywords.slice(0, 2).map((keyword) => `Hands-on project exposure with ${keyword}.`),
  ];

  const summary = [
    "ATS-optimized resume aligned to the uploaded job description.",
    `Current alignment score: ${args.matchScore}%.`,
    "Resume rewritten using simple sections, keyword alignment, and scan-friendly formatting.",
  ].join(" ");

  const atsNotes = [
    `Matched keywords: ${args.matchedKeywords.length}`,
    `Missing keywords addressed: ${args.missingKeywords.length}`,
    `Target job snapshot: ${jdSnippet || "Add concise role summary here."}`,
  ].join("\n");

  return [
    `${nameGuess}\nEmail: your-email@example.com | Phone: +1-000-000-0000 | Location: Your City\n`,
    section("Professional Summary", summary),
    section("Core Skills", skills.length ? skills.join(" | ") : "Communication | Problem Solving | Collaboration"),
    section("Professional Experience", bullets(experience.length ? experience : ["Add role achievements with metrics."])),
    section("Projects", bullets(projects)),
    section("Education", bullets(["Bachelor's Degree (or equivalent) - add your institution and dates."])),
    section("Certifications", bullets(args.missingKeywords.slice(0, 4).map((item) => `${item} - planned certification`))),
    section("ATS Optimization Notes", atsNotes),
    section("Formatting Guidance", ATS_TEMPLATE_HINT),
  ]
    .join("\n")
    .trim();
}

