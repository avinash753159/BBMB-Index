import { formatPercent } from '../../lib/formatters';
import SeriesAvatar from '../ui/SeriesAvatar';

export default function ValueReadout({ selectedSeries, hoveredIndex }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {selectedSeries.map((series) => {
        const value =
          hoveredIndex !== null
            ? series.returnPctSeries[hoveredIndex]
            : series.totalReturnPct;
        return (
          <div
            key={series.id}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-bg/60 px-2.5 py-1 text-sm"
          >
            <SeriesAvatar id={series.id} size="xs" />
            <span className="font-medium text-muted">{series.shortLabel}</span>
            <span className="font-mono font-semibold">{formatPercent(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
