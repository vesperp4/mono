"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  | { status: "signed-out" }
  // Couldn't get a definitive answer from the API (network failure or 5xx —
  // e.g. a cold start or a transient DB blip). Session status is UNKNOWN; the
  // visitor must NOT be treated as signed out (that would eject a valid member
  // to /signin on every hiccup). Show a retry affordance instead.
  | { status: "error" };

/** Total /members/me attempts before settling on `error` (rides out cold starts). */
const MAX_ATTEMPTS = 3;

export interface SessionContextValue {
  /** The signed-in member, or null while loading / erroring / signed out. */
  member: Member | null;
  /** True until the first /members/me round-trip settles. */
  loading: boolean;
  /** True only when /members/me answered 401 — no valid session. */
  signedOut: boolean;
  /** True when /members/me could not be reached (network/5xx); status unknown. */
  error: boolean;
  /** Re-fetch /members/me (e.g. after a profile update, or to retry an error). */
  refresh: () => Promise<void>;
  /** POST /auth/signout, then mark the session signed out locally. */
  signOut: () => Promise<void>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  // Monotonic guard: every refresh/signOut takes a ticket, and only the newest
  // in-flight operation is allowed to publish its result. Without this a slow
  // refresh could land after a signOut (or a later refresh) and resurrect stale
  // state — e.g. show an authenticated UI just after signing out.
  const generation = useRef(0);

  // One /members/me attempt, classified. 401 is the ONLY signed-out signal;
  // network errors and non-401 failures are `error` (status unknown), never
  // signed-out.
  const attempt = useCallback(async (): Promise<SessionState> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/members/me`, {
        // The HttpOnly session cookie lives on the API origin — it only rides
        // along when credentials are included (cross-origin in prod).
        credentials: "include",
      });
      if (res.ok) {
        const member = (await res.json()) as Member;
        return { status: "signed-in", member };
      }
      if (res.status === 401) return { status: "signed-out" };
      return { status: "error" };
    } catch {
      return { status: "error" };
    }
  }, []);

  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    let result = await attempt();
    // Retry only transient failures, with backoff, to ride out API cold starts
    // and brief DB blips before surfacing an error.
    for (let i = 1; i < MAX_ATTEMPTS && result.status === "error"; i++) {
      if (ticket !== generation.current) return; // superseded mid-retry
      await delay(600 * i);
      result = await attempt();
    }
    if (ticket !== generation.current) return; // a newer op won
    setState(result);
  }, [attempt]);

  const signOut = useCallback(async () => {
    const ticket = ++generation.current;
    try {
      await fetch(`${API_BASE}/api/v1/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Cookie clearing failed server-side (network hiccup); still drop the
      // local session so the UI stops presenting authenticated state.
    }
    if (ticket !== generation.current) return; // a later refresh superseded us
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
      error: state.status === "error",
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
 * useSession, but redirects to /signin only once the session resolves as
 * genuinely signed out (a 401). On `error` it does NOT redirect — the API was
 * unreachable, so callers should render a retry affordance and leave the member
 * where they are. Callers render a loading state until `member` is non-null.
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
