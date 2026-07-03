"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Client-side session handling for the portal.
//
// Why client-side and not Next middleware: the `vp4_session` cookie is HttpOnly
// and scoped to the API's host (api.portal.vesperp4.com in prod), so requests
// to the static web host never carry it — server code on this app could never
// see, let alone validate, the session. On top of that the app is deployed as
// a prebuilt upload to Azure SWA Free (skip_app_build), which gives us no
// dependable server runtime for middleware anyway. The only authority on
// "signed in?" is the API itself, so we ask it once via GET /members/me and
// gate authenticated pages on the answer.

/** Member profile as returned by GET/PATCH /api/v1/members/me. */
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  institutionalEmail: string;
  personalEmail: string;
  concentration: string;
  department: string;
  status: string;
  newsletterOptIn: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type SessionState =
  | { status: "loading" }
  | { status: "signed-in"; member: Member }
  | { status: "signed-out" };

export interface SessionContextValue {
  /** The signed-in member, or null while loading / when signed out. */
  member: Member | null;
  /** True until the first /members/me round-trip settles. */
  loading: boolean;
  /** True once /members/me has answered 401 (or failed) — no valid session. */
  signedOut: boolean;
  /** Re-fetch /members/me (e.g. after a profile update). */
  refresh: () => Promise<void>;
  /** POST /auth/signout, then mark the session signed out locally. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/members/me`, {
        // The HttpOnly session cookie lives on the API origin — it only rides
        // along when credentials are included (cross-origin in prod).
        credentials: "include",
      });
      if (res.ok) {
        const member = (await res.json()) as Member;
        setState({ status: "signed-in", member });
        return;
      }
      // 401 (no/expired session) and anything unexpected both mean we cannot
      // treat the visitor as signed in.
      setState({ status: "signed-out" });
    } catch {
      setState({ status: "signed-out" });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Cookie clearing failed server-side (network hiccup); still drop the
      // local session so the UI stops presenting authenticated state.
    }
    setState({ status: "signed-out" });
  }, []);

  // One fetch on mount; pages/components share the result via context. The
  // work lives in a nested async function so no setState is called
  // synchronously in the effect body (house pattern — see /auth, /confirm).
  useEffect(() => {
    async function load() {
      await refresh();
    }
    void load();
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({
      member: state.status === "signed-in" ? state.member : null,
      loading: state.status === "loading",
      signedOut: state.status === "signed-out",
      refresh,
      signOut,
    }),
    [state, refresh, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx;
}

/**
 * Session hook for authenticated pages (/dashboard, /profile): identical to
 * useSession, but redirects to /signin once the session resolves as signed
 * out. Callers render a loading state until `member` is non-null.
 */
export function useRequireSession(): SessionContextValue {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.signedOut) {
      router.replace("/signin");
    }
  }, [session.signedOut, router]);

  return session;
}
