"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Personal Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
  { href: "/help", label: "Help Center" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <h2>AI Resume Screener</h2>
      <nav className="nav-list">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx("nav-item", pathname === item.href && "active")}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        className="button secondary"
        type="button"
        onClick={() => signOut({ callbackUrl: "/signin" })}
      >
        Sign out
      </button>
    </aside>
  );
}
