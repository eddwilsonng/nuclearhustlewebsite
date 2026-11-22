// Still placeholders while a dashboard page loads. No shimmer: design.md keeps
// motion for state changes only.
export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading</p>
      <div className="border-b border-rule px-5 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="h-7 w-48 bg-surface" />
          <div className="mt-2 h-4 w-72 max-w-full bg-surface" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        <div className="grid grid-cols-2 gap-px border-y border-rule md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-3 w-20 bg-surface" />
              <div className="mt-2 h-7 w-12 bg-surface" />
            </div>
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 border-b border-rule bg-surface/60" />
        ))}
      </div>
    </div>
  );
}
