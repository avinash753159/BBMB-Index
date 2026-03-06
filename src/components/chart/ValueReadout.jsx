import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent } from '../../lib/formatters';

export default function ValueReadout({ selectedSeries, hoveredIndex }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {selectedSeries.map((series) => {
        const { rawColor } = getSeriesAppearance(series.id);
        const value =
          hoveredIndex !== null
            ? series.returnPctSeries[hoveredIndex]
            : series.totalReturnPct;
        return (
          <div
            key={series.id}
            className="flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: rawColor }} />
            <span className="font-semibold">{series.shortLabel}</span>
            <span className="font-mono text-muted">{formatPercent(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
