import Link from "next/link";
import { Player } from "@/components/Player";
import { getOnAirSlot } from "@/lib/schedule";

// The channel HLS URL is served by tv-engine (Eyevinn Channel Engine) behind
// the Cloudflare-proxied hostname. Set at build time via SWA/CI env.
const CHANNEL_HLS_URL =
  process.env.NEXT_PUBLIC_CHANNEL_HLS_URL ??
  "http://localhost:8000/channels/vesperp4/master.m3u8";

export const revalidate = 60;

export default async function WatchPage() {
  const onAir = await getOnAirSlot();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Vesper P4 TV</h1>
        <Link href="/schedule" className="text-sm underline underline-offset-4">
          Schedule
        </Link>
      </header>

      <Player src={CHANNEL_HLS_URL} />

      <section aria-label="Now playing">
        <h2 className="text-sm uppercase tracking-wide text-neutral-400">
          Now playing
        </h2>
        <p className="text-lg">{onAir?.title ?? "Off-schedule programming"}</p>
      </section>
    </main>
  );
}
