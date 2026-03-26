import { redirect } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const userSession = await getCurrentUser();
  if (!userSession) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: userSession.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      resumes: { select: { id: true } },
    },
  });

  return (
    <div className="container dashboard-shell">
      <Navbar />
      <section className="card panel">
        <h1>Profile</h1>
        <p>
          <strong>Name:</strong> {user?.name ?? "Not set"}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Verified:</strong> {user?.emailVerified ? "Yes" : "No"}
        </p>
        <p>
          <strong>Joined:</strong>{" "}
          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
        </p>
        <p>
          <strong>Resumes analyzed:</strong> {user?.resumes.length ?? 0}
        </p>
      </section>
    </div>
  );
}
