// Read-only GROQ queries against the mainsite Sanity project (public dataset,
// no token). Uses plain fetch instead of @sanity/client to keep the bundle
// lean — same pattern as apps/tv/web/lib/schedule.ts.
//
// The project id is public, not a secret (same as tv/web) — created 2026-07-03
// at sanity.io/manage, org Vesper P4, separate from the TV project.

import type { PortableTextBlock } from "@portabletext/react";

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "3osgfq6s";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const API_VERSION = "v2024-01-01";

export interface CmsImage {
  url: string;
  alt: string;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  author: string;
  excerpt: string;
  coverImage: CmsImage | null;
}

// Inline images in the Portable Text body, with the CDN URL resolved by the
// GROQ projection (no @sanity/image-url needed).
export interface PostBodyImage {
  _type: "image";
  _key: string;
  url: string | null;
  alt: string | null;
}

export type PostBody = (PortableTextBlock | PostBodyImage)[];

export interface Post extends PostSummary {
  body: PostBody | null;
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  order: number;
  photo: CmsImage | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
}

export interface CmsEvent {
  _id: string;
  title: string;
  start: string;
  end: string | null;
  location: string;
  description: string;
  rsvpUrl: string | null;
  image: CmsImage | null;
}

async function groq<T>(query: string, params?: Record<string, string>): Promise<T | null> {
  if (!PROJECT_ID) return null; // project not created yet — render empty states
  const search = new URLSearchParams({ query });
  for (const [key, value] of Object.entries(params ?? {})) {
    search.set(`$${key}`, JSON.stringify(value));
  }
  const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?${search.toString()}`;
  try {
    // Build-time fetch — the site is fully static-prerendered and rebuilt via
    // webhook on publish; revalidate covers self-hosted/ISR setups.
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const body = (await res.json()) as { result: T };
    return body.result;
  } catch {
    return null;
  }
}

const POST_SUMMARY_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  author,
  excerpt,
  "coverImage": coverImage{ "url": asset->url, alt }
}`;

const EVENT_PROJECTION = `{
  _id,
  title,
  start,
  end,
  location,
  description,
  rsvpUrl,
  "image": image{ "url": asset->url, alt }
}`;

const TEAM_MEMBER_PROJECTION = `{
  _id,
  name,
  role,
  order,
  "photo": photo{ "url": asset->url, alt },
  linkedinUrl,
  githubUrl
}`;

/** Published posts (publishedAt in the past), newest first. */
export async function getPosts(): Promise<PostSummary[]> {
  const posts = await groq<PostSummary[]>(
    `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc) ${POST_SUMMARY_PROJECTION}`,
  );
  return posts ?? [];
}

/** A single published post including its Portable Text body. */
export async function getPost(slug: string): Promise<Post | null> {
  return groq<Post | null>(
    `*[_type == "post" && slug.current == $slug && publishedAt <= now()][0]{
      ...${POST_SUMMARY_PROJECTION},
      body[]{ ..., _type == "image" => { "url": asset->url, alt } }
    }`,
    { slug },
  );
}

/** Slugs of all published posts — for generateStaticParams. */
export async function getPostSlugs(): Promise<string[]> {
  const slugs = await groq<string[]>(
    `*[_type == "post" && defined(slug.current) && publishedAt <= now()].slug.current`,
  );
  return slugs ?? [];
}

/** Events that have not ended yet, soonest first. */
export async function getUpcomingEvents(): Promise<CmsEvent[]> {
  const events = await groq<CmsEvent[]>(
    `*[_type == "event" && coalesce(end, start) >= now()] | order(start asc) ${EVENT_PROJECTION}`,
  );
  return events ?? [];
}

/** Team roster members, in manual roster order (lowest `order` first). */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const members = await groq<TeamMember[]>(
    `*[_type == "teamMember"] | order(order asc) ${TEAM_MEMBER_PROJECTION}`,
  );
  return members ?? [];
}

/** Events that already ended, most recent first (capped at 24). */
export async function getPastEvents(): Promise<CmsEvent[]> {
  const events = await groq<CmsEvent[]>(
    `*[_type == "event" && coalesce(end, start) < now()] | order(start desc)[0...24] ${EVENT_PROJECTION}`,
  );
  return events ?? [];
}
