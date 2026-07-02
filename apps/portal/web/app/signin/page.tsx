"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// Sign in — both paths mint the same server-side session and are implemented
// in the portal API's auth module (apps/portal/api/src/auth/):
//   1. "Sign in with Microsoft" — full-page redirect through
//      /api/v1/auth/oidc/start; the API lands the browser back on /dashboard
//      on success or on /signin?error=... on failure.
//   2. Magic link — POST /api/v1/auth/magic-link emails a one-time link that
//      lands on /auth, which consumes the token.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function SigninPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
          VESPER P4 — Member Portal
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Sign In</h1>

        {/* useSearchParams must sit inside a Suspense boundary (App Router
            requirement); the rest of the page renders without waiting on it. */}
        <Suspense fallback={null}>
          <OidcErrorNotice />
        </Suspense>

        {/* A plain anchor on purpose: OIDC is a redirect-based, full-page
            navigation flow (302 to Microsoft and back) — it must not be a
            fetch. */}
        <a
          href={`${API_BASE}/api/v1/auth/oidc/start`}
          className="mt-10 block bg-white/90 text-black text-xs font-semibold tracking-widest uppercase py-5 hover:bg-white transition-colors"
        >
          Sign in with Microsoft
        </a>

        <p className="mt-8 mb-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-600">
          or
        </p>

        <MagicLinkForm />

        <p className="mt-6 text-xs text-zinc-600">
          Not a member yet?{" "}
          <Link href="/signup" className="text-zinc-300 hover:text-white underline">
            Apply to join
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

// Reads the `?error=...` the API's OIDC failure redirects append. Every code
// (`not_a_member`, `oidc_failed`, anything unexpected) maps to the same
// generic message so the page never leaks which specific check failed.
function OidcErrorNotice() {
  const searchParams = useSearchParams();
  if (!searchParams.get("error")) return null;
  return (
    <p className="mt-6 text-xs text-red-400 tracking-wide leading-relaxed">
      We couldn&apos;t sign you in with that Microsoft account. Make sure you
      used your PUPR account (@students.pupr.edu / @pupr.edu), or use an email
      sign-in link below.
    </p>
  );
}

type MagicLinkStatus = "idle" | "sending" | "sent" | "error";

function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<MagicLinkStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionalEmail: email.trim() }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  // Enumeration-safe by design: the API always answers 202 whether or not the
  // address belongs to a member, so this confirmation copy never varies.
  if (status === "sent") {
    return (
      <div className="border border-zinc-800 p-8">
        <h2 className="text-sm font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-sm text-zinc-500">
          If that address belongs to an active member, a sign-in link is on its
          way. It expires in about 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0 text-left">
      <div className="border border-zinc-800 bg-zinc-950 p-5 focus-within:border-zinc-600 transition-colors duration-300">
        <label
          htmlFor="signin-email"
          className="block text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-2"
        >
          Institutional Email
        </label>
        <input
          id="signin-email"
          name="institutionalEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@students.pupr.edu"
          className="w-full bg-transparent text-sm text-white placeholder-zinc-700 outline-none"
        />
      </div>

      {status === "error" && (
        <p className="pt-3 text-xs text-red-400 tracking-wide">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="pt-px">
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full border border-zinc-800 text-white text-xs font-semibold tracking-widest uppercase py-5 hover:border-zinc-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </div>
    </form>
  );
}
