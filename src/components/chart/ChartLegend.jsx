import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized } from '../../lib/formatters';

export default function ChartLegend({ selectedSeries }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      {selectedSeries.map((series) => {
        const { rawColor } = getSeriesAppearance(series.id);
        return (
          <div
            key={series.id}
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white/88 px-3.5 py-2.5"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: rawColor }} />
            <div>
              <strong className="text-sm font-semibold">{series.label}</strong>
              <span className="ml-1.5 text-xs text-muted">
                {formatAnnualized(series.annualizedReturnPct)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
