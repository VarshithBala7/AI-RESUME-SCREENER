import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      resumes: { select: { id: true } },
    },
  });

  return (
    <div className="container">
      <Navbar />
      <h1>Profile</h1>
      <div className="card">
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
      </div>
    </div>
  );
}
