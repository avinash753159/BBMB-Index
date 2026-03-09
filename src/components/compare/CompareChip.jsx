import Chip from '../ui/Chip';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized } from '../../lib/formatters';

export default function CompareChip({ series, selected, onToggle }) {
  const { color } = getSeriesAppearance(series.id);
  return (
    <Chip selected={selected} onClick={() => onToggle(series.id)}>
      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
      <span className="grid gap-0.5">
        <strong className="text-sm font-semibold">{series.shortLabel ?? series.label}</strong>
        <span className="text-xs opacity-70">{formatAnnualized(series.annualizedReturnPct)}</span>
      </span>
    </Chip>
  );
}
