"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function AuthButton() {
  const { data, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-slate-500">Checking session...</span>;
  }

  if (!data?.user) {
    return (
      <Link className="button button-outline" href="/signin">
        Sign in
      </Link>
    );
  }

  return (
    <button
      className="button button-outline"
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      Sign out
    </button>
  );
}
