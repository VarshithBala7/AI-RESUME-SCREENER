"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type Provider = "google" | "azure-ad" | "facebook";

const providers: Array<{ id: Provider; label: string }> = [
  { id: "google", label: "Continue with Google" },
  { id: "azure-ad", label: "Continue with Outlook" },
  { id: "facebook", label: "Continue with Facebook" },
];

export default function SocialLoginButtons() {
  const [pending, setPending] = useState<Provider | null>(null);

  return (
    <div className="social-grid">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className="social-btn"
          onClick={async () => {
            setPending(provider.id);
            await signIn(provider.id, { callbackUrl: "/dashboard" });
            setPending(null);
          }}
          disabled={pending !== null}
        >
          {pending === provider.id ? "Redirecting..." : provider.label}
        </button>
      ))}
    </div>
  );
}
