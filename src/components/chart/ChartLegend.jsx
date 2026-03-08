import { formatAnnualized } from '../../lib/formatters';
import SeriesAvatar from '../ui/SeriesAvatar';

export default function ChartLegend({ selectedSeries }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      {selectedSeries.map((series) => (
        <div
          key={series.id}
          className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white/88 py-1.5 pl-1.5 pr-3.5"
        >
          <SeriesAvatar id={series.id} size="sm" />
          <div>
            <strong className="text-sm font-semibold">{series.label}</strong>
            <span className="ml-1.5 text-xs text-muted">
              {formatAnnualized(series.annualizedReturnPct)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
