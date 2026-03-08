import { formatPercent, formatDate, formatAnnualized } from '../../lib/formatters';
import { annualizeReturn } from '../../lib/series';
import SeriesAvatar from '../ui/SeriesAvatar';

export default function ChartTooltip({ hoveredIndex, date, selectedSeries, mousePosition, containerRect, windowStart }) {
  const entries = selectedSeries
    .map((s) => {
      const value = s.returnPctSeries[hoveredIndex];
      return {
        id: s.id,
        label: s.label,
        value,
        annualized: value != null ? annualizeReturn(value, windowStart, date) : null,
      };
    })
    .filter((e) => e.value != null)
    .sort((a, b) => b.value - a.value);

  if (!entries.length) return null;

  const left = Math.min(mousePosition.x + 16, (containerRect?.width ?? 800) - 240);
  const top = mousePosition.y - 20;

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-xl border border-line bg-surface px-3 py-2 shadow-elevated"
      style={{ left, top, minWidth: 200 }}
    >
      <p className="font-mono text-xs font-medium text-subtle">{formatDate(date)}</p>
      <div className="mt-1 grid gap-0.5">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <SeriesAvatar id={entry.id} size="xs" />
              <span className="text-muted">{entry.label}</span>
            </span>
            <span className="font-mono font-semibold">{formatAnnualized(entry.annualized)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
