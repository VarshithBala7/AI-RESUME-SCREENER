import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { generateAtsResume } from "@/lib/ats-generator";
import { authOptions } from "@/lib/auth";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { scoreResumeAgainstJD } from "@/lib/keyword-engine";
import { prisma } from "@/lib/prisma";
import { extractResumeText } from "@/lib/resume-parser";

const bodySchema = z.object({
  jobDescription: z.string().min(50, "Please provide a complete job description."),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("resume");
  const jobDescription = formData.get("jobDescription");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large. Max 5MB allowed." }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse({ jobDescription });
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  let resumeText = "";
  try {
    resumeText = (await extractResumeText(file)).trim();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to parse resume file.",
      },
      { status: 400 },
    );
  }

  if (!resumeText) {
    return NextResponse.json(
      { error: "Uploaded resume appears empty after text extraction." },
      { status: 400 },
    );
  }

  const match = scoreResumeAgainstJD(resumeText, parsedBody.data.jobDescription);
  const atsResumeText = generateAtsResume({
    resumeText,
    jobDescription: parsedBody.data.jobDescription,
    matchedKeywords: match.matchedKeywords,
    missingKeywords: match.missingKeywords,
    matchScore: match.matchScore,
  });

  const record = await prisma.resumeRecord.create({
    data: {
      userId: session.user.id,
      title: `Resume ${new Date().toLocaleDateString()}`,
      originalResumeText: resumeText,
      jobDescription: parsedBody.data.jobDescription,
      atsResumeText,
      matchScore: match.matchScore,
      matchedKeywords: match.matchedKeywords,
      missingKeywords: match.missingKeywords,
    },
  });

  return NextResponse.json({
    analysis: {
      matchScore: match.matchScore,
      matchedKeywords: match.matchedKeywords,
      missingKeywords: match.missingKeywords,
      totalKeywords: match.totalKeywords,
      atsResumeText,
    },
    originalResumeText: resumeText,
    recordId: record.id,
  });
}
