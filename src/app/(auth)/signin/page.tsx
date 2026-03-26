import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/signin-form";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { auth } from "@/lib/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Welcome Back</h1>
        <p className="muted">Sign in to continue to your personal dashboard.</p>
        <SignInForm />
        <div className="separator">or continue with</div>
        <SocialLoginButtons />
        <p className="muted tiny">
          New user? <Link href="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
