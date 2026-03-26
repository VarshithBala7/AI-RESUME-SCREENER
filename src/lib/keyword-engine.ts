import { STOP_WORDS } from "@/lib/constants";

export type MatchResult = {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  totalKeywords: number;
};

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text: string): string[] => normalize(text).split(" ").filter(Boolean);

export const extractKeywords = (jobDescription: string): string[] => {
  const words = tokenize(jobDescription);
  const frequency = new Map<string, number>();

  for (const word of words) {
    if (word.length < 3) continue;
    if (STOP_WORDS.has(word)) continue;
    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([word]) => word);
};

const hasKeyword = (resumeNormalized: string, keyword: string): boolean => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  return pattern.test(resumeNormalized);
};

export const calculateMatch = (jobDescription: string, resumeText: string): MatchResult => {
  const jdKeywords = extractKeywords(jobDescription);
  const resumeNormalized = normalize(resumeText);

  if (jdKeywords.length === 0) {
    return {
      matchPercentage: 0,
      matchedKeywords: [],
      missingKeywords: [],
      totalKeywords: 0,
    };
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of jdKeywords) {
    if (hasKeyword(resumeNormalized, keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const matchPercentage = Math.round((matchedKeywords.length / jdKeywords.length) * 100);
  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
    totalKeywords: jdKeywords.length,
  };
};

