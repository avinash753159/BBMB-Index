import Eyebrow from '../ui/Eyebrow';

export default function PendingDetail({ view }) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-line bg-surface-muted p-8">
      <Eyebrow>Pending member</Eyebrow>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">
        {view.label} still needs actual trade detail.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{view.summary}</p>
      {view.payload?.roughSymbols?.length > 0 && (
        <ul className="mt-3 grid gap-2 pl-4 text-sm text-muted list-disc">
          {view.payload.roughSymbols.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
