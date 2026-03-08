import SeriesAvatar from '../ui/SeriesAvatar';

export default function PendingDetail({ view }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
      <SeriesAvatar id={view.id} size="md" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{view.label}</span>
          <span className="rounded-md bg-thai-tea-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-thai-tea">Pending</span>
        </div>
        <p className="mt-0.5 text-sm text-muted">{view.summary}</p>
        {view.payload?.roughSymbols?.length > 0 && (
          <p className="mt-1 text-xs text-subtle">
            Tickers: {view.payload.roughSymbols.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
