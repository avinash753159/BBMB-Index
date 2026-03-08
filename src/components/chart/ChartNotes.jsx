export default function ChartNotes({ selectedSeries }) {
  return (
    <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
      {selectedSeries.map((series) => (
        <article
          key={series.id}
          className="rounded-xl border border-line bg-bg/60 p-3"
        >
          <strong className="text-xs font-semibold">{series.label}</strong>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {series.description} {series.note}
          </p>
        </article>
      ))}
    </div>
  );
}
