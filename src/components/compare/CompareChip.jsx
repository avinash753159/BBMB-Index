import Chip from '../ui/Chip';
import { formatAnnualized } from '../../lib/formatters';
import SeriesAvatar from '../ui/SeriesAvatar';

export default function CompareChip({ series, selected, onToggle }) {
  return (
    <Chip selected={selected} onClick={() => onToggle(series.id)}>
      <SeriesAvatar id={series.id} size="sm" />
      <span className="grid gap-0.5">
        <strong className="text-sm font-semibold">{series.shortLabel ?? series.label}</strong>
        <span className="text-xs opacity-70">{formatAnnualized(series.annualizedReturnPct)}</span>
      </span>
    </Chip>
  );
}
