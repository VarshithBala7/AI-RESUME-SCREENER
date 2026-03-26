import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();

    const resumes = await prisma.resumeAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        title: true,
        score: true,
        missingKeywords: true,
        createdAt: true,
      },
    });

    return NextResponse.json(resumes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch analyses";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
