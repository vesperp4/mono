import Link from "next/link";

// Portal home — the entry point for members. Public marketing content lives on
// the separate mainsite (vesperp4.com); this surface is sign in / sign up only.
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
          VESPER P4
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Member Portal</h1>
        <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
          Sign in to your account, or apply to join the chapter. Membership is open to
          PUPR students, faculty, and mentors.
        </p>

        <div className="mt-10 flex flex-col gap-px">
          <Link
            href="/signin"
            className="bg-white text-black text-xs font-semibold tracking-widest uppercase py-5 hover:bg-zinc-200 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="border border-zinc-800 text-white text-xs font-semibold tracking-widest uppercase py-5 hover:border-zinc-600 transition-colors"
          >
            Join VESPER P4
          </Link>
        </div>

        <a
          href="https://vesperp4.com"
          className="mt-8 inline-block text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Back to vesperp4.com
        </a>
      </div>
    </main>
  );
}
