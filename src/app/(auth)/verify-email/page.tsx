import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { APP_NAME } from "@/lib/constants";
import { getAuthSession } from "@/lib/session";
import { VerifyEmailClient } from "./verify-email-client";

export const metadata: Metadata = {
  title: `Verify Email | ${APP_NAME}`,
  description: "Verify your email using the one-time code sent to your inbox",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const session = await getAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const { email } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Verify your email</h1>
        <p className="muted">
          Enter the 6-digit verification code sent to your email to activate your account.
        </p>
        <VerifyEmailClient defaultEmail={email} />
        <p className="muted tiny">
          Already verified? <Link href="/signin">Sign in</Link>.
        </p>
      </section>
    </main>
  );
}
