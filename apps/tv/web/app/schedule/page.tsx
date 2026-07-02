import Link from "next/link";
import { getUpcomingSlots } from "@/lib/schedule";

export const revalidate = 300;

const formatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Puerto_Rico",
});

export default async function SchedulePage() {
  const slots = await getUpcomingSlots();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Link href="/" className="text-sm underline underline-offset-4">
          Watch
        </Link>
      </header>

      {slots.length === 0 ? (
        <p className="text-neutral-400">No upcoming programming scheduled.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-neutral-800">
          {slots.map((slot) => (
            <li key={slot._id} className="flex gap-4 py-3">
              <time
                dateTime={slot.start}
                className="w-40 shrink-0 text-sm text-neutral-400"
              >
                {formatter.format(new Date(slot.start))}
              </time>
              <div>
                <p className="font-medium">{slot.title}</p>
                {slot.live && (
                  <span className="text-xs font-semibold uppercase text-red-400">
                    Live
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
