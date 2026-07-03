"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { useRequireSession, type Member } from "@/lib/session";

// Signed-in landing page — the redirect target for both the OIDC callback and
// the magic-link flow. Session-gated client-side: useRequireSession bounces to
// /signin once GET /members/me answers 401 (see lib/session.tsx for why this
// is not middleware).
export default function DashboardPage() {
  const { member, loading } = useRequireSession();

  if (loading || !member) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm tracking-widest uppercase text-zinc-500">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-28">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500">
            VESPER P4 — Member Portal
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Welcome back, {member.firstName}.
          </h1>

          <div className="mt-10 border border-zinc-800 p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">
                Membership
              </p>
              <p className="text-sm text-zinc-400">
                Joined {formatJoinDate(member)}
              </p>
            </div>
            <StatusBadge status={member.status} />
          </div>

          <div className="mt-px flex flex-col gap-px">
            <Link
              href="/profile"
              className="group border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
            >
              <QuickLinkBody
                title="Your Profile"
                description="View and update your contact info, concentration, and department."
              />
            </Link>

            <a
              href="https://vesperp4.com"
              className="group border border-zinc-800 p-6 hover:border-zinc-600 transition-colors"
            >
              <QuickLinkBody
                title="Main Site"
                description="News, events, and everything public at vesperp4.com."
                external
              />
            </a>

            <div className="border border-zinc-800 p-6 opacity-50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">
                  Chapter Resources
                </p>
                <span className="text-[9px] font-semibold tracking-widest uppercase border border-zinc-700 text-zinc-500 px-2 py-1 whitespace-nowrap">
                  Coming Soon
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                Guides, tools, and member-only material — under construction.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function QuickLinkBody({
  title,
  description,
  external,
}: {
  title: string;
  description: string;
  external?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-white">{title}</p>
        <span
          aria-hidden
          className="text-zinc-600 group-hover:text-white transition-colors"
        >
          {external ? "↗" : "→"}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
        {description}
      </p>
    </>
  );
}

function formatJoinDate(member: Member): string {
  const parsed = new Date(member.createdAt);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
