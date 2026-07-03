"use client";

import { SessionProvider } from "@/lib/session";

// Client-side providers wrapper. SessionProvider fetches /members/me once and
// shares the result app-wide (navbar auth states, /dashboard, /profile).
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
