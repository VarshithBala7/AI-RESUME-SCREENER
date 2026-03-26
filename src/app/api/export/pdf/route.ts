import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { resumeToPdfBytes } from "@/lib/exporters";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserOrThrow();
    const body = await request.json();
    const resumeId = String(body.resumeId || "");
    if (!resumeId) {
      return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
    }

    const resume = await prisma.resumeAnalysis.findFirst({
      where: {
        id: resumeId,
        userId: user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const pdfBytes = await resumeToPdfBytes({
      fullName: resume.fullName,
      email: resume.email,
      phone: resume.phone,
      location: resume.location,
      summary: resume.summary,
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      experience: resume.experience ? JSON.parse(resume.experience) : [],
      education: resume.education ? JSON.parse(resume.education) : [],
      certifications: resume.certifications ? JSON.parse(resume.certifications) : [],
      projects: resume.projects ? JSON.parse(resume.projects) : [],
    });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${resume.fullName.replace(/\s+/g, "_")}_ATS.pdf\"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to export PDF" },
      { status: 400 },
    );
  }
}
