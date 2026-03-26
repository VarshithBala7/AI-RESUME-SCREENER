import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAtsResume } from "@/lib/ats-generator";
import { extractKeywords, scoreResumeAgainstJD } from "@/lib/keyword-engine";
import { extractResumeText } from "@/lib/resume-parser";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

const bodySchema = z.object({
  jobDescription: z.string().min(50, "Please provide a complete job description."),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("resumeFile");
  const jobDescription = formData.get("jobDescription");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large. Max 5MB allowed." }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse({ jobDescription });

  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  let resumeText = "";
  try {
    resumeText = await extractResumeText(file);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to parse resume file.",
      },
      { status: 400 }
    );
  }

  const extractedKeywords = extractKeywords(parsedBody.data.jobDescription);
  const scoreData = scoreResumeAgainstJD(resumeText, parsedBody.data.jobDescription);
  const atsResume = generateAtsResume({
    originalResume: resumeText,
    jobDescription: parsedBody.data.jobDescription,
    missingKeywords: scoreData.missingKeywords,
  });

  const resumeRecord = await prisma.resumeAnalysis.create({
    data: {
      userId: session.user.id,
      originalResume: resumeText,
      jobDescription: parsedBody.data.jobDescription,
      atsResume,
      matchPercentage: scoreData.matchPercentage,
      missingKeywords: scoreData.missingKeywords,
      extractedKeywords,
      title: `Resume ${new Date().toLocaleDateString()}`,
    },
  });

  return NextResponse.json({
    id: resumeRecord.id,
    matchPercentage: scoreData.matchPercentage,
    missingKeywords: scoreData.missingKeywords,
    extractedKeywords,
    atsResume,
  });
}
