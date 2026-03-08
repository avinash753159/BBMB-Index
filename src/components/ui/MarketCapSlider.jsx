import { useMemo, useCallback } from 'react';

const MAX_CAP = 5e12;
const LOG_MAX = Math.log10(MAX_CAP);

function capToSlider(cap) {
  if (cap <= 0) return 0;
  return Math.log10(Math.max(cap, 1)) / LOG_MAX * 100;
}

function sliderToCap(pct) {
  if (pct <= 0) return 0;
  return Math.pow(10, (pct / 100) * LOG_MAX);
}

function formatCap(value) {
  if (value <= 0) return '$0';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

const TICK_VALUES = [1e9, 1e10, 1e11, 1e12];

export default function MarketCapSlider({ capMax, onChange }) {
  const sliderVal = capToSlider(capMax);

  const ticks = useMemo(
    () =>
      TICK_VALUES.map((v) => ({
        pct: capToSlider(v),
        label: formatCap(v),
      })),
    [],
  );

  const handleChange = useCallback(
    (e) => {
      const pct = Number(e.target.value);
      onChange(sliderToCap(pct));
    },
    [onChange],
  );

  const isMax = capMax >= MAX_CAP * 0.99;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-medium">
          Market Cap Ceiling: <span className="text-ink">{isMax ? 'No filter' : `≤ ${formatCap(capMax)}`}</span>
        </span>
      </div>
      <div className="relative h-6">
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={sliderVal}
          onChange={handleChange}
          className="slider-range absolute inset-0 w-full cursor-pointer"
          aria-label="Maximum market cap ceiling"
        />
      </div>
      <div className="relative h-3 -mt-2">
        {ticks.map((t) => (
          <span
            key={t.label}
            className="absolute -translate-x-1/2 text-[0.6rem] text-muted"
            style={{ left: `${t.pct}%` }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
