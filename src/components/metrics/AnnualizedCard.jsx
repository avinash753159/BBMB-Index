import Pill from '../ui/Pill';
import SeriesAvatar from '../ui/SeriesAvatar';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized, formatPercent } from '../../lib/formatters';

export default function AnnualizedCard({ series }) {
  const { kindLabel } = getSeriesAppearance(series.id);

  return (
    <article
      className="animate-fade-in rounded-[var(--radius-xl)] border border-line bg-surface p-5"
    >
      <div className="flex items-center gap-2">
        <SeriesAvatar id={series.id} size="md" />
        <div>
          <Pill kind={series.kind}>{kindLabel}</Pill>
          <span className="ml-1.5 text-sm font-medium text-muted">{series.label}</span>
        </div>
      </div>
      <strong className="mt-3 block font-mono text-2xl font-semibold leading-none tracking-tight">
        {formatAnnualized(series.annualizedReturnPct)}
      </strong>
      <span className="mt-1.5 block text-sm text-muted">
        Total return {formatPercent(series.totalReturnPct)}
      </span>
      <span className="mt-0.5 block text-xs text-muted">{series.note}</span>
    </article>
  );
}
