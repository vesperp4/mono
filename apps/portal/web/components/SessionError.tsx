"use client";

// Shown on authenticated pages when GET /members/me couldn't be reached
// (network failure or 5xx) so the session status is unknown. Unlike a 401 we
// do NOT redirect to /signin — the member is very likely still signed in and a
// forced sign-out on a transient blip is worse than a retry prompt.
export default function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div role="alert" className="w-full max-w-sm text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
          Connection Problem
        </p>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          We couldn’t reach the server.
        </h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Your session is still valid — this is a temporary hiccup. Please try
          again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 text-[10px] font-semibold tracking-widest uppercase border border-zinc-800 px-5 py-2.5 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
