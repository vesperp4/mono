"use client";

import ProfileForm from "@/components/ProfileForm";
import { useRequireSession } from "@/lib/session";

// Member profile — view + self-service edit backed by GET/PATCH /members/me.
// Session-gated client-side like /dashboard (see lib/session.tsx).
export default function ProfilePage() {
  const { member, loading, refresh } = useRequireSession();

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
      <ProfileForm member={member} onSaved={refresh} />
    </main>
  );
}
