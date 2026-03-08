import { useMemo, useCallback } from 'react';
import { formatDate } from '../../lib/formatters';

export default function TimeRangeSlider({ dates, startIdx, onChange }) {
  const maxIdx = dates.length - 1;

  // Show label for current start date
  const label = useMemo(() => {
    if (!dates.length) return '';
    return formatDate(dates[startIdx]);
  }, [dates, startIdx]);

  const endLabel = useMemo(() => {
    if (!dates.length) return '';
    return formatDate(dates[maxIdx]);
  }, [dates, maxIdx]);

  const handleChange = useCallback(
    (e) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  // Compute year tick marks
  const yearTicks = useMemo(() => {
    const ticks = [];
    let lastYear = null;
    for (let i = 0; i <= maxIdx; i++) {
      const year = dates[i]?.slice(0, 4);
      if (year && year !== lastYear) {
        lastYear = year;
        ticks.push({ idx: i, year });
      }
    }
    return ticks;
  }, [dates, maxIdx]);

  if (dates.length < 10) return null;

  // Find the latest possible start: leave at least 6 months of data
  const maxStart = Math.max(0, maxIdx - 126);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-medium">Start: <span className="text-ink">{label}</span></span>
        <span>End: {endLabel}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={maxStart}
          value={startIdx}
          onChange={handleChange}
          className="slider-range w-full cursor-pointer"
          aria-label="Comparison start date"
        />
        {/* Year tick marks */}
        <div className="pointer-events-none relative h-3 -mt-1">
          {yearTicks.filter((t) => t.idx <= maxStart).map((t) => (
            <span
              key={t.year}
              className="absolute -translate-x-1/2 text-[0.6rem] text-muted/60"
              style={{ left: `${(t.idx / maxStart) * 100}%` }}
            >
              {t.year}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
