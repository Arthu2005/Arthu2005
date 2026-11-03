export default function Loading() {
  return (
    <div className="container-x pt-40 pb-24" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando vagas…</span>
      <div className="skeleton h-4 w-32 rounded-full" />
      <div className="skeleton mt-6 h-14 w-full max-w-xl rounded-2xl" />
      <div className="skeleton mt-12 h-28 w-full rounded-[var(--radius-card)]" />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-72 rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}
