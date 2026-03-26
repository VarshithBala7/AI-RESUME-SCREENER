import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();

    const resumes = await prisma.resumeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        title: true,
        matchScore: true,
        missingKeywords: true,
        createdAt: true,
        atsResumeText: true,
      },
    });

    return NextResponse.json(resumes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch analyses";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const title = String(body.title || `Resume ${new Date().toLocaleDateString()}`);
    const originalResumeText = String(body.originalResumeText || "");
    const jobDescription = String(body.jobDescription || "");
    const atsResumeText = String(body.atsResumeText || "");
    const matchScore = Number(body.matchScore || 0);
    const missingKeywords = Array.isArray(body.missingKeywords) ? body.missingKeywords : [];
    const matchedKeywords = Array.isArray(body.matchedKeywords) ? body.matchedKeywords : [];

    if (!originalResumeText || !jobDescription || !atsResumeText) {
      return NextResponse.json(
        { error: "originalResumeText, jobDescription and atsResumeText are required." },
        { status: 400 },
      );
    }

    const created = await prisma.resumeRecord.create({
      data: {
        userId,
        title,
        originalResumeText,
        jobDescription,
        atsResumeText,
        matchScore,
        missingKeywords,
        matchedKeywords,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save analysis";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
