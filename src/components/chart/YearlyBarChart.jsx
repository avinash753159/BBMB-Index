import { useMemo, useState } from 'react';
import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import SeriesAvatar from '../ui/SeriesAvatar';
import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent } from '../../lib/formatters';

const PORTFOLIO_TOGGLES = [
  { id: 'SPY', code: 'SPY', name: 'SPY' },
  { id: 'LI_LU', code: 'LL', name: 'Li Lu' },
  { id: 'BUFFETT', code: 'WB', name: 'Buffett' },
];

function computeYearlyReturns(series, dates) {
  const yearly = [];
  if (!dates.length || !series.returnPctSeries.length) return yearly;

  const startYear = parseInt(dates[0].slice(0, 4), 10);
  const endYear = parseInt(dates[dates.length - 1].slice(0, 4), 10);

  for (let year = startYear; year <= endYear; year++) {
    let yearStart = null;
    let yearEnd = null;
    for (let i = 0; i < dates.length; i++) {
      const y = parseInt(dates[i].slice(0, 4), 10);
      if (y === year && series.returnPctSeries[i] != null) {
        if (yearStart === null) yearStart = i;
        yearEnd = i;
      }
    }
    if (yearStart === null) continue;

    let prevCum = 0;
    if (year > startYear) {
      for (let i = yearStart - 1; i >= 0; i--) {
        if (series.returnPctSeries[i] != null) {
          prevCum = series.returnPctSeries[i];
          break;
        }
      }
    }
    const endCum = series.returnPctSeries[yearEnd];
    if (endCum == null) continue;

    const yearReturn = (1 + endCum) / (1 + prevCum) - 1;
    yearly.push({ year, returnPct: yearReturn });
  }

  return yearly;
}

export default function YearlyBarChart({ selectedSeries, dates, onActivateView }) {
  const toggleIds = new Set(PORTFOLIO_TOGGLES.map((t) => t.id));
  const availableToggles = PORTFOLIO_TOGGLES.filter((t) =>
    selectedSeries.some((s) => s.id === t.id)
  );
  const [activeToggleId, setActiveToggleId] = useState(null);

  const filteredSeries = useMemo(() => {
    if (!activeToggleId) {
      return selectedSeries.filter((s) => !toggleIds.has(s.id));
    }
    const nonToggle = selectedSeries.filter((s) => !toggleIds.has(s.id));
    const toggled = selectedSeries.find((s) => s.id === activeToggleId);
    return toggled ? [...nonToggle, toggled] : nonToggle;
  }, [selectedSeries, activeToggleId]);

  const yearlyData = useMemo(() => {
    return filteredSeries.map((series) => ({
      id: series.id,
      label: series.shortLabel ?? series.label,
      yearly: computeYearlyReturns(series, dates),
    }));
  }, [filteredSeries, dates]);

  const years = useMemo(() => {
    const allYears = new Set();
    yearlyData.forEach((s) => s.yearly.forEach((y) => allYears.add(y.year)));
    return [...allYears].sort();
  }, [yearlyData]);

  const maxAbs = useMemo(() => {
    let m = 0.05;
    yearlyData.forEach((s) => s.yearly.forEach((y) => {
      m = Math.max(m, Math.abs(y.returnPct));
    }));
    return m * 1.15;
  }, [yearlyData]);

  if (!years.length) return null;

  const seriesCount = yearlyData.length;
  const BAR_WIDTH = 18;
  const BAR_GAP = 3;
  const groupWidth = seriesCount * BAR_WIDTH + (seriesCount - 1) * BAR_GAP;
  const YEAR_GAP = 24;
  const AVATAR_SIZE = 14;
  const PAD = { left: 50, right: 20, top: 36, bottom: 40 };
  const chartWidth = PAD.left + years.length * (groupWidth + YEAR_GAP) - YEAR_GAP + PAD.right;
  const chartHeight = 280;
  const barAreaHeight = chartHeight - PAD.top - PAD.bottom;
  const zeroY = PAD.top + barAreaHeight / 2;

  function yForValue(v) {
    return zeroY - (v / maxAbs) * (barAreaHeight / 2);
  }

  return (
    <GlassCard className="p-6">
      <Eyebrow>Year-by-year</Eyebrow>

      <div className="mt-3 overflow-x-auto rounded-2xl bg-bg/60 p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="block h-auto w-full"
          style={{ minWidth: Math.max(chartWidth * 0.6, 400) }}
          role="img"
          aria-label="Year-by-year bar chart"
        >
          {/* Zero line */}
          <line
            x1={PAD.left} y1={zeroY}
            x2={chartWidth - PAD.right} y2={zeroY}
            stroke="rgba(30,41,59,0.12)" strokeWidth={1}
          />

          {/* 10% historical SPY average dotted line */}
          {0.10 <= maxAbs && (
            <g>
              <line
                x1={PAD.left} y1={yForValue(0.10)}
                x2={chartWidth - PAD.right} y2={yForValue(0.10)}
                stroke="#d4842a" strokeWidth={1}
                strokeDasharray="4 3" opacity={0.5}
              />
              <text
                x={chartWidth - PAD.right + 4} y={yForValue(0.10) + 3.5}
                fill="#d4842a" fontSize={8.5} fontWeight="600"
                fontFamily="var(--font-mono)" opacity={0.6}
              >
                10% avg
              </text>
            </g>
          )}

          {/* Y-axis grid lines */}
          {[-0.5, -0.25, 0.25, 0.5].filter((t) => Math.abs(t) <= maxAbs).map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left} y1={yForValue(tick)}
                x2={chartWidth - PAD.right} y2={yForValue(tick)}
                stroke="rgba(30,41,59,0.05)" strokeWidth={1}
              />
              <text
                x={PAD.left - 6} y={yForValue(tick) + 4}
                textAnchor="end" fill="#94a3b8" fontSize={10}
                fontFamily="var(--font-mono)"
              >
                {formatPercent(tick)}
              </text>
            </g>
          ))}

          {years.map((year, yi) => {
            const groupX = PAD.left + yi * (groupWidth + YEAR_GAP);
            return (
              <g key={year}>
                {/* Year label on x-axis */}
                <text
                  x={groupX + groupWidth / 2}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={12}
                  fontWeight="500"
                  fontFamily="var(--font-mono)"
                >
                  {year}
                </text>

                {yearlyData.map((series, si) => {
                  const entry = series.yearly.find((y) => y.year === year);
                  if (!entry) return null;
                  const { rawColor } = getSeriesAppearance(series.id);
                  const barX = groupX + si * (BAR_WIDTH + BAR_GAP);
                  const barH = Math.abs(yForValue(entry.returnPct) - zeroY);
                  const barY = entry.returnPct >= 0 ? yForValue(entry.returnPct) : zeroY;
                  const labelY = entry.returnPct >= 0 ? barY - 5 : barY + barH + 12;
                  const avatarY = entry.returnPct >= 0 ? labelY - AVATAR_SIZE - 2 : labelY + 4;

                  return (
                    <g key={series.id}>
                      <rect
                        x={barX}
                        y={barY}
                        width={BAR_WIDTH}
                        height={Math.max(barH, 2)}
                        rx={4}
                        fill={rawColor}
                        opacity={0.8}
                      />
                      {/* Value label above/below bar */}
                      <text
                        x={barX + BAR_WIDTH / 2}
                        y={labelY}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize={9}
                        fontWeight="500"
                        fontFamily="var(--font-mono)"
                      >
                        {formatPercent(entry.returnPct)}
                      </text>
                      {/* Avatar icon */}
                      <foreignObject
                        x={barX + (BAR_WIDTH - AVATAR_SIZE) / 2}
                        y={avatarY}
                        width={AVATAR_SIZE}
                        height={AVATAR_SIZE}
                      >
                        <div xmlns="http://www.w3.org/1999/xhtml">
                          <SeriesAvatar id={series.id} size="xs" />
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 13F portfolio toggle */}
      {availableToggles.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted/60">13F</span>
          <div className="flex gap-1.5">
            {availableToggles.map((t) => {
              const isActive = activeToggleId === t.id;
              const { rawColor } = getSeriesAppearance(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    const nextId = isActive ? null : t.id;
                    setActiveToggleId(nextId);
                    if (nextId && onActivateView) onActivateView(nextId);
                  }}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    borderColor: isActive ? rawColor : 'var(--color-line)',
                    background: isActive ? `${rawColor}14` : 'transparent',
                    color: isActive ? rawColor : 'var(--color-muted)',
                  }}
                >
                  <span className="font-mono font-semibold">{t.code}</span>
                  <span className="opacity-70">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-3">
        {yearlyData.map((series) => (
          <div key={series.id} className="flex items-center gap-1.5 text-xs text-muted">
            <SeriesAvatar id={series.id} size="xs" />
            <span className="font-medium">{series.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
