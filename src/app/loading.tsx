/** Shown instantly while a page loads its data: a shimmering outline of the page. */
export default function Loading() {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:pl-64" aria-busy="true" aria-label="Loading">
      <div className="fixed inset-y-0 left-0 hidden w-64 lg:block" style={{ background: "linear-gradient(180deg, var(--side-bg), var(--side-bg-2))" }} />
      <div className="h-14 lg:hidden" style={{ background: "var(--side-bg)" }} />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="skeleton mb-3 h-3 w-24" />
        <div className="skeleton mb-2 h-8 w-72 max-w-full" />
        <div className="skeleton mb-10 h-4 w-96 max-w-full" />
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
        <div className="skeleton h-72" />
      </div>
    </div>
  );
}
