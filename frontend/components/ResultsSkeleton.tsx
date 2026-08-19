/**
 * Placeholder shaped like Dashboard's real layout, shown while /analyze is
 * in flight. /analyze is a single blocking response — there is no server-sent
 * progress, so this does not fill in field-by-field; it swaps for the real
 * Dashboard in one shot when the response lands. It exists so the results
 * area doesn't jump from empty to fully laid out, and so its shape previews
 * what's coming rather than a generic spinner.
 */
function Bar({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-3 ${width} bg-[var(--border)] rounded animate-pulse`} />;
}

export default function ResultsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 sm:px-8 py-5 flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-[var(--border)] flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-2.5 w-24 bg-[var(--border)] rounded animate-pulse" />
            <div className="h-4 w-40 bg-[var(--border)] rounded animate-pulse" />
          </div>
        </div>
        <div className="px-6 sm:px-8 py-7 space-y-3">
          <Bar />
          <Bar />
          <Bar width="w-3/4" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] rounded border border-[var(--border)] p-6 space-y-3">
            <div className="h-2.5 w-16 bg-[var(--border)] rounded animate-pulse" />
            <div className="h-7 w-20 bg-[var(--border)] rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <div className="h-3.5 w-32 bg-[var(--border)] rounded animate-pulse" />
        </div>
        <div className="px-6 py-5 h-40 bg-[var(--border)]/40 rounded animate-pulse" />
      </div>

      <div className="bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <div className="h-3.5 w-40 bg-[var(--border)] rounded animate-pulse" />
        </div>
        <div className="px-6 py-5 space-y-3">
          <Bar width="w-5/6" />
          <Bar width="w-2/3" />
        </div>
      </div>
    </div>
  );
}
