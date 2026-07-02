// Minimal GROQ-over-HTTP helper for the TV Sanity project. Read-only; uses a
// token only if the dataset is private (SANITY_READ_TOKEN).

const PROJECT_ID = process.env.SANITY_PROJECT_ID ?? "";
const DATASET = process.env.SANITY_DATASET ?? "production";
const TOKEN = process.env.SANITY_READ_TOKEN;
const API_VERSION = "v2024-01-01";

export async function groq<T>(query: string): Promise<T | null> {
  if (!PROJECT_ID) {
    console.warn("SANITY_PROJECT_ID not set — schedule queries disabled");
    return null;
  }
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
  });
  if (!res.ok) {
    console.error(`Sanity query failed: ${res.status} ${res.statusText}`);
    return null;
  }
  const body = (await res.json()) as { result: T };
  return body.result;
}
