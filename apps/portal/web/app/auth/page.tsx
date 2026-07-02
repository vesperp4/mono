"use client";

import { useEffect, useState } from "react";

type State = "loading" | "error";

// Magic-link landing page. The sign-in email points here with a `?token=...`;
// we POST it to the API, which answers with the session cookie. Modeled on
// /confirm — token read from the URL on the client (no Suspense needed).
// There is no success state: a good token immediately navigates away.
export default function AuthPage() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    // The work lives in a nested async function so no setState is called
    // synchronously in the effect body (which React/eslint discourages).
    async function consume() {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setState("error");
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      try {
        const res = await fetch(`${apiBase}/api/v1/auth/magic-link/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The session cookie rides on this response — credentials must be
          // included so the browser stores it for the API origin.
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          // Full navigation, not a router push, so the fresh session cookie
          // is in play — mirrors how the API's OIDC path lands on /dashboard.
          window.location.replace("/dashboard");
          return;
        }
        // 410 (invalid/used/expired token) and anything else unexpected get
        // the same generic error state.
        setState("error");
      } catch {
        setState("error");
      }
    }

    void consume();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-zinc-800 p-12 text-center">
        {state === "loading" && (
          <p className="text-sm tracking-widest uppercase text-zinc-500">
            Signing you in…
          </p>
        )}

        {state === "error" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">
              Sign-In Failed
            </h1>
            <p className="text-sm text-zinc-500 mb-8">
              This sign-in link is invalid or has expired.
            </p>
            <a
              href="/signin"
              className="inline-block border border-zinc-700 text-white text-xs font-semibold tracking-widest uppercase px-8 py-4 hover:border-zinc-500 transition-colors"
            >
              Request a New Link
            </a>
          </>
        )}
      </div>
    </main>
  );
}
