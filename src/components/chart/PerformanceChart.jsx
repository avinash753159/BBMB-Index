import { useRef, useMemo, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';
import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import ChartTooltip from './ChartTooltip';
import ValueReadout from './ValueReadout';
import { useChartInteraction } from '../../hooks/useChartInteraction';
import { formatDate, formatPercent, formatAnnualized } from '../../lib/formatters';
import { annualizeReturn } from '../../lib/series';
import { getSeriesAppearance } from '../../lib/constants';

const WIDTH = 1100;
const HEIGHT = 400;
const PAD = { top: 20, right: 160, bottom: 44, left: 70 };

export default function PerformanceChart({ selectedSeries, dates, windowStart, windowEnd }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const interaction = useChartInteraction();

  const { xScale, yScale, gridTicks, zeroY, xLabelIndexes } = useMemo(() => {
    const allVals = selectedSeries
      .flatMap((s) => s.returnPctSeries)
      .filter((v) => v != null);
    const rawMin = Math.min(...allVals, 0);
    const rawMax = Math.max(...allVals, 0);
    const span = Math.max(rawMax - rawMin, 0.12);
    const minV = rawMin - span * 0.12;
    const maxV = rawMax + span * 0.12;

    const xScale = scaleLinear()
      .domain([0, dates.length - 1])
      .range([PAD.left, WIDTH - PAD.right]);

    const yScale = scaleLinear()
      .domain([minV, maxV])
      .range([HEIGHT - PAD.bottom, PAD.top]);

    const gridTicks = yScale.ticks(5);
    const zeroY = yScale(0);

    const idxs = [
      0,
      Math.floor(dates.length / 4),
      Math.floor(dates.length / 2),
      Math.floor((dates.length * 3) / 4),
      dates.length - 1,
    ];
    const xLabelIndexes = [...new Set(idxs)];

    return { xScale, yScale, gridTicks, zeroY, xLabelIndexes };
  }, [selectedSeries, dates]);

  const lineFn = useMemo(
    () =>
      d3Line()
        .defined((d) => d != null)
        .x((d, i) => xScale(i))
        .y((d) => yScale(d)),
    [xScale, yScale]
  );

  const handleMouseMove = useCallback(
    (e) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaledX = (mouseX / rect.width) * WIDTH;
      const scaledY = (mouseY / rect.height) * HEIGHT;
      const index = Math.round(xScale.invert(scaledX));
      const clamped = Math.max(0, Math.min(dates.length - 1, index));
      interaction.setHoveredIndex(clamped);

      let nearestId = null;
      let nearestDist = Infinity;
      selectedSeries.forEach((s) => {
        const val = s.returnPctSeries[clamped];
        if (val == null) return;
        const sy = yScale(val);
        const dist = Math.abs(sy - scaledY);
        if (dist < nearestDist && dist < 40) {
          nearestDist = dist;
          nearestId = s.id;
        }
      });
      interaction.setHoveredSeriesId(nearestId);

      const wrapRect = wrapRef.current?.getBoundingClientRect();
      if (wrapRect) {
        interaction.mouseRef.current = {
          x: e.clientX - wrapRect.left,
          y: e.clientY - wrapRect.top,
        };
      }
    },
    [xScale, yScale, dates, selectedSeries, interaction]
  );

  return (
    <GlassCard className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Performance canvas</Eyebrow>
          <p className="mt-1 text-sm text-muted">
            {formatDate(windowStart)} &ndash; {formatDate(windowEnd)}
          </p>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative mt-4 overflow-x-auto rounded-2xl bg-bg/60 p-3"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full min-w-[800px]"
          role="img"
          aria-label="Five-year comparison chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={interaction.clearHover}
        >
          {/* Y-axis title */}
          <text
            x={12} y={PAD.top - 6}
            fill="#94a3b8" fontSize={9} fontWeight="600"
            fontFamily="var(--font-mono)"
            textAnchor="start"
            letterSpacing="0.05em"
          >
            ANNUALIZED RETURN
          </text>

          {/* Grid lines + Y labels (annualized) */}
          {gridTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left} y1={yScale(tick)}
                x2={WIDTH - PAD.right} y2={yScale(tick)}
                stroke="rgba(30,41,59,0.06)" strokeWidth={1}
              />
              <text
                x={PAD.left - 10} y={yScale(tick) + 4}
                textAnchor="end" fill="#94a3b8" fontSize={11}
                fontFamily="var(--font-mono)"
              >
                {formatAnnualized(annualizeReturn(tick, windowStart, windowEnd))}
              </text>
            </g>
          ))}

          {/* Zero line */}
          <line
            x1={PAD.left} y1={zeroY}
            x2={WIDTH - PAD.right} y2={zeroY}
            stroke="rgba(30,41,59,0.15)" strokeWidth={1}
          />

          {/* Series lines */}
          {selectedSeries.map((series) => {
            const { rawColor } = getSeriesAppearance(series.id);
            const path = lineFn(series.returnPctSeries);
            const isHovered = interaction.hoveredSeriesId === series.id;
            const isDimmed = interaction.hoveredSeriesId && !isHovered;

            // Find last non-null index for endpoint + direct label
            let endIdx = null;
            for (let i = series.returnPctSeries.length - 1; i >= 0; i--) {
              if (series.returnPctSeries[i] != null) {
                endIdx = i;
                break;
              }
            }
            const endX = endIdx !== null ? xScale(endIdx) : null;
            const endY = endIdx !== null ? yScale(series.returnPctSeries[endIdx]) : null;

            return (
              <g key={series.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={rawColor}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isDimmed ? 0.25 : 1}
                  style={{ transition: 'opacity 200ms, stroke-width 200ms' }}
                />
                {endX != null && (
                  <>
                    <circle
                      cx={endX} cy={endY} r={3.5}
                      fill={rawColor}
                      stroke="#fff" strokeWidth={1.5}
                      opacity={isDimmed ? 0.25 : 1}
                      style={{ transition: 'opacity 200ms' }}
                    />
                    {/* Direct label at line end */}
                    <text
                      x={endX + 8} y={endY}
                      fill={rawColor}
                      fontSize={11}
                      fontWeight="600"
                      fontFamily="var(--font-sans)"
                      opacity={isDimmed ? 0.25 : 1}
                      style={{ transition: 'opacity 200ms' }}
                    >
                      {series.shortLabel ?? series.label}
                    </text>
                    <text
                      x={endX + 8} y={endY + 13}
                      fill={rawColor}
                      fontSize={9.5}
                      fontWeight="500"
                      fontFamily="var(--font-mono)"
                      opacity={isDimmed ? 0.3 : 0.7}
                      style={{ transition: 'opacity 200ms' }}
                    >
                      {formatAnnualized(series.annualizedReturnPct)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Crosshair */}
          {interaction.hoveredIndex !== null && (
            <>
              <line
                x1={xScale(interaction.hoveredIndex)} y1={PAD.top}
                x2={xScale(interaction.hoveredIndex)} y2={HEIGHT - PAD.bottom}
                stroke="rgba(30,41,59,0.2)" strokeWidth={1}
                strokeDasharray="3 3" pointerEvents="none"
              />
              {selectedSeries.map((series) => {
                const val = series.returnPctSeries[interaction.hoveredIndex];
                if (val == null) return null;
                const { rawColor } = getSeriesAppearance(series.id);
                return (
                  <circle
                    key={series.id}
                    cx={xScale(interaction.hoveredIndex)}
                    cy={yScale(val)}
                    r={3.5}
                    fill={rawColor}
                    stroke="#fff"
                    strokeWidth={1.5}
                    pointerEvents="none"
                  />
                );
              })}
            </>
          )}

          {/* X-axis labels */}
          {xLabelIndexes.map((i) => (
            <text
              key={i}
              x={xScale(i)} y={HEIGHT - 12}
              textAnchor="middle" fill="#94a3b8" fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {formatDate(dates[i])}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {interaction.hoveredIndex !== null && (
          <ChartTooltip
            hoveredIndex={interaction.hoveredIndex}
            date={dates[interaction.hoveredIndex]}
            selectedSeries={selectedSeries}
            mousePosition={interaction.mouseRef.current}
            containerRect={wrapRef.current?.getBoundingClientRect()}
            windowStart={windowStart}
          />
        )}
      </div>

      <ValueReadout
        selectedSeries={selectedSeries}
        hoveredIndex={interaction.hoveredIndex}
      />
    </GlassCard>
  );
}
