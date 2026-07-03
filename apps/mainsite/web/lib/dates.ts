// Timezone-stable date formatting for CMS content. Everything renders in the
// chapter's timezone (America/Puerto_Rico) with a fixed locale so the same
// string is produced at build time, on the server, and on the client — no
// SSG/hydration mismatch.

const TIME_ZONE = "America/Puerto_Rico";
const LOCALE = "en-US";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

/** "July 2, 2026" — for blog posts. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** "Thu, Jul 2, 2026, 6:00 PM" — for single event timestamps. */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** Event window — collapses to "… 6:00 PM – 8:00 PM" when same-day. */
export function formatEventRange(start: string, end: string | null): string {
  const startText = dateTimeFormatter.format(new Date(start));
  if (!end) return startText;
  const sameDay = dateFormatter.format(new Date(start)) === dateFormatter.format(new Date(end));
  const endText = sameDay
    ? timeFormatter.format(new Date(end))
    : dateTimeFormatter.format(new Date(end));
  return `${startText} – ${endText}`;
}
