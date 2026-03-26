import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="muted">Sign up with email/password or use social providers.</p>
        <SignupForm />
        <p className="muted tiny">
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
