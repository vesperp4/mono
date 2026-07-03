"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/session";

// Shared top bar for every portal page. The auth side of the nav depends on
// the session: signed-out shows Sign In / Join, signed-in shows Dashboard /
// Profile / Sign Out. While /members/me is still in flight neither set is
// rendered — the links fade in once the state is known instead of flashing
// the wrong variant and swapping.
export default function SiteHeader() {
  const { member, loading, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    // Full navigation (not a router push) so the post-sign-out landing starts
    // from a clean slate — mirrors how sign-in lands on /dashboard.
    window.location.replace("/");
  };

  return (
    <header className="absolute top-0 inset-x-0 z-10">
      <nav
        aria-label="Primary"
        className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5"
      >
        <Link
          href="/"
          className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-colors"
        >
          VESPER P4
        </Link>

        <div
          className={`flex items-center gap-5 sm:gap-7 transition-opacity duration-300 ${
            loading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          aria-hidden={loading}
        >
          {member ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/profile">Profile</NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut || loading}
                className="text-[10px] font-semibold tracking-widest uppercase border border-zinc-800 px-4 py-2 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? "Signing Out…" : "Sign Out"}
              </button>
            </>
          ) : (
            <>
              <NavLink href="/signin">Sign In</NavLink>
              <NavLink href="/signup">Join</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
