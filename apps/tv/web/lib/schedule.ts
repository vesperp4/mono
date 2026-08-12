// Read-only GROQ queries against the TV Sanity project (public dataset, no
// token). Uses plain fetch instead of @sanity/client to keep the bundle lean.

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "uphuxt07";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const API_VERSION = "v2024-01-01";

const CACHE_TTL_MS = 30_000;
const FETCH_TIMEOUT_MS = 5_000;

export interface ScheduleSlot {
  _id: string;
  title: string;
  start: string;
  end: string;
  live: boolean;
}

interface CacheEntry {
  fetchedAt: number;
  result: unknown;
}

// Pages render dynamically, so this bounds Sanity requests to one per query per
// TTL instead of one per page view, and doubles as the stale fallback below.
const cache = new Map<string, CacheEntry>();

function stale<T>(entry: CacheEntry | undefined): T | null {
  return entry ? (entry.result as T) : null;
}

// Never throws: the schedule is decoration around the player, so a slow or
// failing Sanity must degrade to placeholder text, not take the page down with
// it. Mirrors the engine's helper (apps/tv/engine/src/sanity.ts).
async function groq<T>(query: string): Promise<T | null> {
  if (!PROJECT_ID) return null; // unconfigured local dev — render placeholders

  const cached = cache.get(query);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.result as T;
  }

  // apicdn, not api: shares the TV project's quota with the engine's 24/7
  // polling, and schedule display tolerates CDN staleness.
  const url = `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`Sanity query failed: ${res.status} ${res.statusText}`);
      return stale<T>(cached);
    }
    const body = (await res.json()) as { result: T };
    cache.set(query, { fetchedAt: Date.now(), result: body.result });
    return body.result;
  } catch (err) {
    console.error("Sanity query errored", err);
    return stale<T>(cached);
  }
}

export async function getOnAirSlot(): Promise<ScheduleSlot | null> {
  return groq<ScheduleSlot>(
    `*[_type == "scheduleSlot" && start <= now() && end > now()] | order(start desc)[0]{ _id, title, start, end, live }`,
  );
}

export async function getUpcomingSlots(): Promise<ScheduleSlot[]> {
  const slots = await groq<ScheduleSlot[]>(
    `*[_type == "scheduleSlot" && end > now()] | order(start asc)[0...50]{ _id, title, start, end, live }`,
  );
  return slots ?? [];
}
