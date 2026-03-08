import Eyebrow from '../ui/Eyebrow';
import { formatAnnualized } from '../../lib/formatters';
import SeriesAvatar from '../ui/SeriesAvatar';

export default function SelectionPanel({ selectedSeries }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/88 p-5">
      <Eyebrow>Active stack</Eyebrow>
      <h3 className="mt-2 text-base font-semibold tracking-tight">
        {selectedSeries.length} line{selectedSeries.length === 1 ? '' : 's'} on the canvas
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Every selected line gets its own annualized card above the chart.
      </p>
      <div className="mt-3 grid gap-2.5">
        {selectedSeries.map((series) => (
          <div
            key={series.id}
            className="flex items-center justify-between gap-3.5 rounded-[14px] border border-line/60 bg-white/90 p-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <SeriesAvatar id={series.id} size="md" />
              <div className="grid min-w-0 gap-0.5">
                <strong className="text-sm font-semibold">{series.label}</strong>
                <span className="truncate text-xs text-muted">{series.note}</span>
              </div>
            </div>
            <span className="whitespace-nowrap font-mono text-sm font-semibold">
              {formatAnnualized(series.annualizedReturnPct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
