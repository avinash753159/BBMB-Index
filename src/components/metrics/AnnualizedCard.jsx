import { motion } from 'framer-motion';
import Pill from '../ui/Pill';
import AnimatedNumber from './AnimatedNumber';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized, formatPercent } from '../../lib/formatters';

export default function AnnualizedCard({ series }) {
  const { kindLabel } = getSeriesAppearance(series.id);
  return (
    <motion.article
      layout
      layoutId={`annualized-${series.id}`}
      className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/90 p-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.62)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <Pill kind={series.kind}>{kindLabel}</Pill>
      <strong className="mt-2.5 block font-mono text-3xl font-semibold leading-none lg:text-4xl">
        <AnimatedNumber value={series.annualizedReturnPct} format={formatAnnualized} />
      </strong>
      <span className="mt-2.5 block text-sm leading-snug text-muted">
        {series.label} total return {formatPercent(series.totalReturnPct)}.
      </span>
      <span className="mt-1 block text-sm leading-snug text-muted">{series.note}</span>
    </motion.article>
  );
}
