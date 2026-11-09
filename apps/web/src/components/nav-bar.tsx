"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const linkClass =
  "rounded px-2 py-1 text-sm hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700";

export function NavBar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-5xl items-center gap-2 px-6 py-3"
      >
        <Link href="/" className="mr-4 font-semibold tracking-tight">
          ReproLoop
        </Link>
        {user && (
          <>
            <Link href="/report" className={linkClass}>
              Report a problem
            </Link>
            <Link href="/incidents" className={linkClass}>
              {user.role === "REPORTER" ? "My reports" : "Incidents"}
            </Link>
            <Link href="/projects" className={linkClass}>
              Projects
            </Link>
          </>
        )}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {loading ? null : user ? (
            <>
              <span className="text-neutral-600">
                {user.name} · {user.role.toLowerCase()}
              </span>
              <button type="button" onClick={handleLogout} className={linkClass}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Sign in
              </Link>
              <Link href="/register" className={linkClass}>
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}