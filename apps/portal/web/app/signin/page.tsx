import Link from "next/link";

// Sign in — PLACEHOLDER. Authentication is decided but not yet built:
//   1. "Sign in with Microsoft" — multi-tenant OIDC restricted to PUPR's tenant
//      (PUPR is Microsoft 365), which yields a verified institutional identity.
//   2. Magic-link fallback — reuses the members verification-token machinery.
// Both resolve to the same `members` row and mint one server-side session.
// See the architecture notes in the vault before implementing.
export default function SigninPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
          VESPER P4 — Member Portal
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Sign In</h1>

        <div className="mt-10 flex flex-col gap-px">
          <button
            type="button"
            disabled
            className="bg-white/90 text-black text-xs font-semibold tracking-widest uppercase py-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign in with Microsoft
          </button>
          <button
            type="button"
            disabled
            className="border border-zinc-800 text-white text-xs font-semibold tracking-widest uppercase py-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Email me a sign-in link
          </button>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Sign in is coming soon. Not a member yet?{" "}
          <Link href="/signup" className="text-zinc-300 hover:text-white underline">
            Apply to join
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
