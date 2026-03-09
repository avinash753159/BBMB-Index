export default function ChartNotes({ selectedSeries }) {
  return (
    <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {selectedSeries.map((series) => (
        <article
          key={series.id}
          className="rounded-2xl border border-line/60 bg-amber-50/86 p-3.5"
        >
          <strong className="text-sm font-semibold">{series.label}</strong>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {series.description} {series.note}
          </p>
        </article>
      ))}
    </div>
  );
}
