// Minimal GROQ-over-HTTP helper for the TV Sanity project. Read-only; uses a
// token only if the dataset is private (SANITY_READ_TOKEN).
//
// The engine polls its managers every few seconds around the clock, so this
// helper must go through apicdn.sanity.io (separate, much larger quota than
// the uncached api.sanity.io endpoint) and a short in-process cache that
// keeps our request rate independent of the engine's poll interval. A slow
// or down Sanity must never wedge "what plays next": requests time out and
// fall back to the last known result.

const PROJECT_ID = process.env.SANITY_PROJECT_ID ?? "";
const DATASET = process.env.SANITY_DATASET ?? "production";
const TOKEN = process.env.SANITY_READ_TOKEN;
const API_VERSION = "v2024-01-01";

const CACHE_TTL_MS = Number(process.env.SANITY_CACHE_TTL_MS ?? 30_000);
const FETCH_TIMEOUT_MS = Number(process.env.SANITY_FETCH_TIMEOUT_MS ?? 5_000);

interface CacheEntry {
  fetchedAt: number;
  result: unknown;
}

const cache = new Map<string, CacheEntry>();

export async function groq<T>(query: string): Promise<T | null> {
  if (!PROJECT_ID) {
    console.warn("SANITY_PROJECT_ID not set — schedule queries disabled");
    return null;
  }

  const cached = cache.get(query);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.result as T;
  }

  const url = `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
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
    console.error(
      `Sanity query failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return stale<T>(cached);
  }
}

function stale<T>(cached: CacheEntry | undefined): T | null {
  return cached ? (cached.result as T) : null;
}
