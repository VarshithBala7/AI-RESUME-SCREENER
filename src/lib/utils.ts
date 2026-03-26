export function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

export function uniqueWords(text: string): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "your",
    "from",
    "have",
    "will",
    "you",
    "are",
    "not",
    "but",
    "all",
    "our",
    "can",
    "their",
    "into",
    "using",
    "use",
    "job",
    "role",
    "work",
    "years",
    "year",
    "ability",
    "strong",
    "skills",
    "experience",
    "required",
    "preferred",
  ]);

  const words = normalizeText(text)
    .split(/[^a-z0-9+#.]+/g)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return Array.from(new Set(words));
}

export function extractKeywordCandidates(jobDescription: string): string[] {
  const phraseMatches = jobDescription
    .toLowerCase()
    .match(
      /\b(?:machine learning|data analysis|data science|project management|sql|python|javascript|typescript|react|node\.?js|aws|azure|docker|kubernetes|communication|leadership|problem solving|agile|scrum|rest api|ci\/cd|git|tableau|power bi|excel)\b/g,
    );

  const phraseKeywords = phraseMatches ? Array.from(new Set(phraseMatches)) : [];
  const words = uniqueWords(jobDescription);

  return Array.from(new Set([...phraseKeywords, ...words])).slice(0, 80);
}

export function calculateMatchPercentage(
  resumeText: string,
  requiredKeywords: string[],
): {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
} {
  const normalizedResume = normalizeText(resumeText);
  const matchedKeywords = requiredKeywords.filter((keyword) =>
    normalizedResume.includes(keyword.toLowerCase()),
  );
  const missingKeywords = requiredKeywords.filter(
    (keyword) => !normalizedResume.includes(keyword.toLowerCase()),
  );

  const matchPercentage =
    requiredKeywords.length === 0
      ? 0
      : Math.round((matchedKeywords.length / requiredKeywords.length) * 100);

  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
  };
}

export function splitIntoLines(text: string, maxLineLength = 95): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLineLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}
