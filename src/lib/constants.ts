import { z } from "zod";

export const APP_NAME = "AI Resume Screener";
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MINUTES = 10;

export const ATS_TEMPLATE_HINT = [
  "Use clean ATS-friendly formatting:",
  "- Simple section headings",
  "- No tables, icons, or graphics",
  "- Short bullet points with action verbs",
  "- Role-aligned keywords from the job description",
].join("\n");

export const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "you",
  "your",
  "are",
  "not",
  "have",
  "has",
  "will",
  "can",
  "all",
  "job",
  "role",
  "years",
  "year",
  "required",
  "preferred",
  "experience",
  "skills",
  "ability",
  "using",
  "use",
  "work",
  "our",
  "their",
]);

export const verifyEmailCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(VERIFICATION_CODE_LENGTH),
});
