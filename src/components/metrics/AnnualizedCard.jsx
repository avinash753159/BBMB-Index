import { motion } from 'framer-motion';
import Pill from '../ui/Pill';
import SeriesAvatar from '../ui/SeriesAvatar';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized, formatPercent } from '../../lib/formatters';

export default function AnnualizedCard({ series }) {
  const { kindLabel } = getSeriesAppearance(series.id);

  return (
    <motion.article
      layout
      layoutId={`annualized-${series.id}`}
      className="rounded-[var(--radius-xl)] border border-line bg-surface p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
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
    </motion.article>
  );
}
