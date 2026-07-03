import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getPastEvents, getUpcomingEvents, type CmsEvent } from "@/lib/cms";
import { formatDateTime, formatEventRange } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Events — VESPER P4",
  description:
    "Workshops, talks, and gatherings from VESPER P4 — the student association uniting cybersecurity, AI, engineering, and national security at PUPR.",
};

function UpcomingEventCard({ event }: { event: CmsEvent }) {
  return (
    <article className="group border border-zinc-200 hover:border-zinc-900 transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12">
        {event.image && (
          <div className="relative aspect-[16/9] md:aspect-auto md:col-span-4 overflow-hidden bg-zinc-100">
            <Image
              src={`${event.image.url}?w=1200&auto=format`}
              alt={event.image.alt}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className={`p-8 md:p-10 ${event.image ? "md:col-span-8" : "md:col-span-12"}`}>
          <p className="text-xs font-mono text-zinc-500 mb-4">
            <time dateTime={event.start}>{formatEventRange(event.start, event.end)}</time>
          </p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
            {event.title}
          </h3>
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-5">
            {event.location}
          </p>
          <p className="text-sm md:text-base text-zinc-500 leading-relaxed max-w-2xl mb-8">
            {event.description}
          </p>
          {event.rsvpUrl && (
            <a
              href={event.rsvpUrl}
              className="inline-block px-8 py-3.5 bg-zinc-900 text-white text-xs font-semibold tracking-widest uppercase hover:bg-zinc-700 transition-all duration-300 hover:scale-[1.02]"
            >
              RSVP
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

  return (
    <main>
      <Navbar />
      <PageHeader
        eyebrow="Calendar"
        title="Events."
        description="Workshops, talks, and gatherings across the four pillars — open to the PUPR community."
      />

      {/* Upcoming */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-10">
            Upcoming
          </p>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing scheduled yet"
              message="New events are announced here first. Check back soon."
            />
          ) : (
            <div className="space-y-8">
              {upcoming.map((event) => (
                <UpcomingEventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past — compact */}
      <section className="bg-white pb-32 md:pb-48">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-6">
            Past events
          </p>
          {past.length === 0 ? (
            <p className="text-sm text-zinc-400 py-6 border-t border-zinc-100">
              No past events yet.
            </p>
          ) : (
            <div className="border-t border-zinc-100">
              {past.map((event) => (
                <div
                  key={event._id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 border-b border-zinc-100 py-5"
                >
                  <time
                    dateTime={event.start}
                    className="md:col-span-4 text-xs font-mono text-zinc-400 md:pt-1"
                  >
                    {formatDateTime(event.start)}
                  </time>
                  <p className="md:col-span-5 text-base font-medium text-zinc-900">{event.title}</p>
                  <p className="md:col-span-3 text-sm text-zinc-400">{event.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
