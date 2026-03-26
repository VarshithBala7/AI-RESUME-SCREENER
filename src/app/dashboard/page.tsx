import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const resumes = await prisma.resumeRecord.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const safeResumes = resumes.map((resume) => ({
    id: resume.id,
    title: resume.title,
    originalResumeText: resume.originalResumeText,
    atsResumeText: resume.atsResumeText,
    matchScore: resume.matchScore,
    missingKeywords: resume.missingKeywords as string[],
    matchedKeywords: resume.matchedKeywords as string[],
    createdAt: resume.createdAt.toISOString(),
  }));

  return (
    <main className="container">
      <DashboardClient
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        initialResumes={safeResumes}
      />
    </main>
  );
}
