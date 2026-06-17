"use client";

import { useEffect, useState } from "react";

type State = "loading" | "success" | "error";

// Membership email-verification landing page. The link in the verification
// email points here with a `?token=...`; we POST it to the API to activate the
// member. Token is read from the URL on the client (no Suspense needed).
export default function ConfirmPage() {
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // The work lives in a nested async function so no setState is called
    // synchronously in the effect body (which React/eslint discourages).
    async function confirm() {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setState("error");
        setMessage("Missing confirmation token.");
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      try {
        const res = await fetch(`${apiBase}/api/v1/members/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) {
          setState("success");
          return;
        }
        const data = await res.json().catch(() => null);
        setState("error");
        setMessage(
          data?.error?.message ??
            "This confirmation link is invalid or has expired."
        );
      } catch {
        setState("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    void confirm();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-zinc-800 p-12 text-center">
        {state === "loading" && (
          <p className="text-sm tracking-widest uppercase text-zinc-500">
            Confirming…
          </p>
        )}

        {state === "success" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">
              Membership Confirmed
            </h1>
            <p className="text-sm text-zinc-500 mb-8">
              Your PUPR affiliation is verified and your membership is active.
              Welcome to VESPER P4.
            </p>
            <a
              href="/signin"
              className="inline-block bg-white text-black text-xs font-semibold tracking-widest uppercase px-8 py-4 hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </a>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">
              Confirmation Failed
            </h1>
            <p className="text-sm text-zinc-500 mb-8">{message}</p>
            <a
              href="/signup"
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
