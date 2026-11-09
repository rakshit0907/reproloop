"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

const buttonPrimary =
  "rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2";
const buttonSecondary =
  "rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 focus-visible:ring-offset-2";

export function HomeContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <p className="text-sm text-neutral-600">Loading…</p>;
  }

  if (user) {
    return (
      <div className="space-y-4">
        <p>
          Signed in as <strong>{user.name}</strong> ({user.email}) — role:{" "}
          <span className="font-mono text-sm">{user.role}</span>
        </p>
        <button type="button" onClick={logout} className={buttonSecondary}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Link href="/login" className={buttonPrimary}>
        Sign in
      </Link>
      <Link href="/register" className={buttonSecondary}>
        Create account
      </Link>
    </div>
  );
}