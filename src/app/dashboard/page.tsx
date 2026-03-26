import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  const resumes = await prisma.resumeAnalysis.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const safeResumes = resumes.map((resume) => ({
    id: resume.id,
    title: resume.title,
    matchPercentage: resume.matchPercentage,
    missingKeywords: resume.missingKeywords,
    createdAt: resume.createdAt.toISOString(),
    optimizedResumeText: resume.optimizedResumeText,
    extractedKeywords: resume.extractedKeywords,
  }));

  return (
    <main className="page-shell">
      <DashboardClient
        userName={user.name || user.email}
        userEmail={user.email}
        initialResumes={safeResumes}
      />
    </main>
  );
}
