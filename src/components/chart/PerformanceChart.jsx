import { useRef, useMemo, useCallback } from 'react';
import { scaleLinear } from 'd3-scale';
import { line as d3Line } from 'd3-shape';
import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import ChartTooltip from './ChartTooltip';
import ValueReadout from './ValueReadout';
import ChartLegend from './ChartLegend';
import ChartNotes from './ChartNotes';
import { useChartInteraction } from '../../hooks/useChartInteraction';
import { formatDate, formatPercent } from '../../lib/formatters';
import { getSeriesAppearance } from '../../lib/constants';

const WIDTH = 1100;
const HEIGHT = 430;
const PAD = { top: 18, right: 34, bottom: 44, left: 78 };

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

    const gridTicks = yScale.ticks(4);
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
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
            Every selected line shares the same five-year frame.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Normalized return from {formatDate(windowStart)} through {formatDate(windowEnd)}.
            PIF lines stay flat after their latest PDF checkpoint.
          </p>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative mt-4 overflow-x-auto rounded-3xl bg-gradient-to-b from-white/90 to-amber-50/70 p-4"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full min-w-[900px]"
          role="img"
          aria-label="Five-year comparison chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={interaction.clearHover}
        >
          {/* Grid lines + Y labels */}
          {gridTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left} y1={yScale(tick)}
                x2={WIDTH - PAD.right} y2={yScale(tick)}
                stroke="rgba(74,61,46,0.08)" strokeWidth={1}
              />
              <text
                x={PAD.left - 10} y={yScale(tick) + 4}
                textAnchor="end" fill="#6b6158" fontSize={12}
                fontFamily="var(--font-mono)"
              >
                {formatPercent(tick)}
              </text>
            </g>
          ))}

          {/* Zero line */}
          <line
            x1={PAD.left} y1={zeroY}
            x2={WIDTH - PAD.right} y2={zeroY}
            stroke="rgba(23,23,23,0.18)" strokeWidth={1.2}
            strokeDasharray="4 6"
          />

          {/* Series lines */}
          {selectedSeries.map((series) => {
            const { rawColor } = getSeriesAppearance(series.id);
            const path = lineFn(series.returnPctSeries);
            const isHovered = interaction.hoveredSeriesId === series.id;
            const isDimmed = interaction.hoveredSeriesId && !isHovered;

            // Find last non-null index for endpoint dot
            let endX = null;
            let endY = null;
            for (let i = series.returnPctSeries.length - 1; i >= 0; i--) {
              if (series.returnPctSeries[i] != null) {
                endX = xScale(i);
                endY = yScale(series.returnPctSeries[i]);
                break;
              }
            }

            return (
              <g key={series.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={rawColor}
                  strokeWidth={isHovered ? 4 : 3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isDimmed ? 0.4 : 1}
                  style={{ transition: 'opacity 200ms, stroke-width 200ms' }}
                />
                {endX != null && (
                  <circle
                    cx={endX} cy={endY} r={4.8}
                    fill={rawColor}
                    stroke="rgba(255,255,255,0.88)" strokeWidth={2}
                    opacity={isDimmed ? 0.4 : 1}
                    style={{ transition: 'opacity 200ms' }}
                  />
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
                stroke="rgba(20,18,16,0.3)" strokeWidth={1}
                strokeDasharray="3 3" pointerEvents="none"
              />
              {/* Hover dots on each series at the hovered index */}
              {selectedSeries.map((series) => {
                const val = series.returnPctSeries[interaction.hoveredIndex];
                if (val == null) return null;
                const { rawColor } = getSeriesAppearance(series.id);
                return (
                  <circle
                    key={series.id}
                    cx={xScale(interaction.hoveredIndex)}
                    cy={yScale(val)}
                    r={4}
                    fill={rawColor}
                    stroke="#fff"
                    strokeWidth={2}
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
              textAnchor="middle" fill="#6b6158" fontSize={12}
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
          />
        )}
      </div>

      <ValueReadout
        selectedSeries={selectedSeries}
        hoveredIndex={interaction.hoveredIndex}
      />
      <ChartLegend selectedSeries={selectedSeries} />
      <ChartNotes selectedSeries={selectedSeries} />
    </GlassCard>
  );
}
