import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent, formatDate } from '../../lib/formatters';

export default function ChartTooltip({ hoveredIndex, date, selectedSeries, mousePosition, containerRect }) {
  const entries = selectedSeries
    .map((s) => ({
      id: s.id,
      label: s.label,
      value: s.returnPctSeries[hoveredIndex],
      color: getSeriesAppearance(s.id).rawColor,
    }))
    .filter((e) => e.value != null)
    .sort((a, b) => b.value - a.value);

  if (!entries.length) return null;

  const left = Math.min(mousePosition.x + 16, (containerRect?.width ?? 800) - 200);
  const top = mousePosition.y - 20;

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur-lg"
      style={{ left, top, minWidth: 160 }}
    >
      <p className="font-mono text-xs font-semibold text-muted">{formatDate(date)}</p>
      <div className="mt-1 grid gap-1">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              {entry.label}
            </span>
            <span className="font-mono font-semibold">{formatPercent(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
