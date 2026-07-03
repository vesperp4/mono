interface EmptyStateProps {
  title: string;
  message: string;
}

// Quiet placeholder panel for CMS-driven sections with no content yet.
export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-zinc-300 px-8 py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-3">{title}</p>
      <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">{message}</p>
    </div>
  );
}
