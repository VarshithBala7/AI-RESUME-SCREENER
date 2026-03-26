import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Verify Email | AI Resume Screener",
  description: "Verify your email with the one-time code",
};

export default async function VerifyEmailPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Email verification required</h1>
        <p>Enter the verification code sent to your email.</p>
        <VerifyEmailForm />
        <p className="muted tiny">
          Didn&apos;t receive a code? <ResendCode />
        </p>
        <p className="muted tiny">
          Go back to <Link href="/signin">Sign in</Link>.
        </p>
      </section>
    </main>
  );
}

function VerifyEmailForm() {
  return (
    <form action="/api/auth/verify-code" method="post" className="form-grid">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" placeholder="you@example.com" required />

      <label htmlFor="code">Verification code</label>
      <input id="code" name="code" type="text" placeholder="123456" required minLength={6} maxLength={6} />

      <button type="submit" className="primary-button">
        Verify Email
      </button>
    </form>
  );
}

function ResendCode() {
  return (
    <form action="/api/auth/send-verification" method="post" className="inline-form">
      <input name="email" type="email" placeholder="you@example.com" required />
      <button type="submit" className="secondary-button">
        Resend Code
      </button>
    </form>
  );
}
