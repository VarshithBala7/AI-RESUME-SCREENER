import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export const getAuthSession = () => getServerSession(authOptions);

export async function requireUserId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
