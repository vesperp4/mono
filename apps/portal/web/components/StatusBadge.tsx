// Membership status pill. Statuses mirror the API's CHECK constraint
// (pending_verification | active | alumni | rejected), though /members/me can
// realistically only return active or alumni — the fallback handles the rest.

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  active: {
    label: "Active",
    classes: "border-emerald-500/40 text-emerald-400",
  },
  alumni: {
    label: "Alumni",
    classes: "border-sky-500/40 text-sky-400",
  },
  pending_verification: {
    label: "Pending Verification",
    classes: "border-zinc-700 text-zinc-400",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "border-zinc-700 text-zinc-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1 text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap ${style.classes}`}
    >
      <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
