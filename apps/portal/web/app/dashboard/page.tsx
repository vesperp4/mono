import Link from "next/link";

// Sign-in redirect target: both the API's OIDC callback and the magic-link
// landing page (/auth) navigate here once a session cookie is set. This is
// intentionally a stub — the real member dashboard (session context via
// GET /members/me, member data) is built out in issues #172/#173.
export default function DashboardPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-zinc-800 p-12 text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
          VESPER P4 — Member Portal
        </p>
        <h1 className="mt-4 text-2xl font-bold text-white mb-3">
          You&apos;re Signed In
        </h1>
        <p className="text-sm text-zinc-500 mb-8">
          The member dashboard is under construction — check back soon.
        </p>
        <Link
          href="/"
          className="inline-block border border-zinc-700 text-white text-xs font-semibold tracking-widest uppercase px-8 py-4 hover:border-zinc-500 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
