// Read-only GROQ queries against the TV Sanity project (public dataset, no
// token). Uses plain fetch instead of @sanity/client to keep the bundle lean.

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const API_VERSION = "v2024-01-01";

export interface ScheduleSlot {
  _id: string;
  title: string;
  start: string;
  end: string;
  live: boolean;
}

async function groq<T>(query: string): Promise<T | null> {
  if (!PROJECT_ID) return null; // unconfigured local dev — render placeholders
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const body = (await res.json()) as { result: T };
  return body.result;
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
