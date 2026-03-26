"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type VerifyEmailClientProps = {
  defaultEmail?: string;
};

export function VerifyEmailClient({ defaultEmail }: VerifyEmailClientProps) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setVerifying(true);

    try {
      const verifyResponse = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const verifyPayload = (await verifyResponse.json()) as { message?: string; error?: string };
      if (!verifyResponse.ok) {
        setError(verifyPayload.error ?? verifyPayload.message ?? "Failed to verify code.");
        return;
      }

      if (!password) {
        setMessage("Email verified. You can now sign in.");
        setTimeout(() => router.push("/signin"), 800);
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!signInResult || signInResult.error) {
        setMessage("Email verified successfully. Please sign in manually.");
        setTimeout(() => router.push("/signin"), 900);
        return;
      }

      router.push(signInResult.url || "/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to verify code.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(payload.error ?? payload.message ?? "Could not resend verification code.");
        return;
      }
      setMessage("Verification code sent. Check your inbox.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to resend verification code.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="form-grid">
      <form onSubmit={verify} className="form-grid">
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="field">
          <span>6-digit verification code</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            minLength={6}
            maxLength={6}
            required
            placeholder="123456"
          />
        </label>

        <label className="field">
          <span>Password (optional, for auto sign-in)</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            placeholder="Enter your password"
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={verifying}>
          {verifying ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      <button className="btn btn-outline" type="button" onClick={resend} disabled={resending}>
        {resending ? "Sending..." : "Resend Code"}
      </button>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

export function VerifyEmailForm(props: VerifyEmailClientProps) {
  return <VerifyEmailClient {...props} />;
}
