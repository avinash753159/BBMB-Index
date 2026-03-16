import { useMemo, useState, useRef, useCallback } from 'react';
import * as d3Hierarchy from 'd3-hierarchy';
import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import SeriesAvatar from '../ui/SeriesAvatar';
import TickerLogo from '../ui/TickerLogo';
import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent, formatMarketCap } from '../../lib/formatters';

const PADDING_OUTER = 4;
const PADDING_TOP = 26;
const PADDING_INNER = 2;
const MIN_LABEL_W = 50;
const MIN_LABEL_H = 32;
const TOP_SUPER_COUNT = 5;

const SPY_TOP_HOLDINGS = [
  { ticker: 'NVDA', weight: 0.0729, marketCap: 4.38e12 },
  { ticker: 'AAPL', weight: 0.0611, marketCap: 3.676e12 },
  { ticker: 'MSFT', weight: 0.0489, marketCap: 2.939e12 },
  { ticker: 'AMZN', weight: 0.0371, marketCap: 2.229e12 },
  { ticker: 'META', weight: 0.0258, marketCap: 1.552e12 },
  { ticker: 'AVGO', weight: 0.0254, marketCap: 1.527e12 },
  { ticker: 'TSLA', weight: 0.0244, marketCap: 1.467e12 },
  { ticker: 'BRK.B', weight: 0.0176, marketCap: 1.057e12 },
  { ticker: 'WMT', weight: 0.0168, marketCap: 1.008e12 },
  { ticker: 'LLY', weight: 0.0146, marketCap: 882e9 },
  { ticker: 'JPM', weight: 0.0127, marketCap: 764e9 },
  { ticker: 'XOM', weight: 0.0108, marketCap: 651e9 },
  { ticker: 'V', weight: 0.0098, marketCap: 592e9 },
  { ticker: 'JNJ', weight: 0.0097, marketCap: 582e9 },
  { ticker: 'MU', weight: 0.0080, marketCap: 480e9 },
  { ticker: 'COST', weight: 0.0074, marketCap: 447e9 },
  { ticker: 'ORCL', weight: 0.0074, marketCap: 446e9 },
  { ticker: 'MA', weight: 0.0074, marketCap: 444e9 },
  { ticker: 'NFLX', weight: 0.0067, marketCap: 404e9 },
  { ticker: 'CVX', weight: 0.0065, marketCap: 394e9 },
];

const SOURCE_URLS = {
  NEIL_MEHTA: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001840735&type=13F&dateb=&owner=include&count=40',
  PELOSI: 'https://www.capitoltrades.com/trades?politician=P000197',
};

function getInvestorUrl(investorId, managerId) {
  if (SOURCE_URLS[investorId]) return SOURCE_URLS[investorId];
  if (managerId) return `https://www.dataroma.com/m/holdings.php?m=${managerId}`;
  return null;
}

function returnColor(returnPct) {
  if (returnPct == null) return 'rgb(55, 65, 75)';
  const t = Math.max(-1, Math.min(5, returnPct));
  if (t >= 0) {
    const intensity = Math.min(t / 2, 1);
    return `rgb(${Math.round(20 - intensity * 10)}, ${Math.round(40 + intensity * 80)}, ${Math.round(20 - intensity * 10)})`;
  } else {
    const intensity = Math.min(Math.abs(t), 1);
    return `rgb(${Math.round(40 + intensity * 100)}, ${Math.round(20 - intensity * 10)}, ${Math.round(20 - intensity * 10)})`;
  }
}

function returnBorderColor(returnPct) {
  if (returnPct == null) return 'rgba(120, 130, 140, 0.4)';
  const t = Math.max(-1, Math.min(5, returnPct));
  if (t >= 0) {
    const intensity = Math.min(t / 2, 1);
    return `rgba(100, ${Math.round(180 + intensity * 75)}, 100, 0.4)`;
  } else {
    const intensity = Math.min(Math.abs(t), 1);
    return `rgba(${Math.round(180 + intensity * 75)}, 80, 80, 0.4)`;
  }
}

function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
        on
          ? 'border-ink bg-ink text-white shadow-sm'
          : 'border-line bg-white text-ink hover:border-ink hover:shadow-sm'
      }`}
    >
      {children}
    </button>
  );
}

export default function HoldingsTreemap({ allSeries, seriesById, capMax = 5e12 }) {
  const [hovered, setHovered] = useState(null);
  const [localSelected, setLocalSelected] = useState(() => new Set(['SPY']));
  const [superExpanded, setSuperExpanded] = useState(false);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 1100, height: 520 });

  const measuredRef = useCallback((node) => {
    if (!node) return;
    containerRef.current = node;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) setDims({ width, height: Math.max(420, Math.min(640, width * 0.52)) });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Categorize allSeries for chips
  const { compareSeries, brosSeries, otherSeries, superSeries } = useMemo(() => ({
    compareSeries: allSeries.filter((s) => s.category === 'compare'),
    brosSeries: allSeries.filter((s) => s.category === 'bros' && s.kind !== 'pending'),
    otherSeries: allSeries.filter((s) => s.category === 'other' && s.kind !== 'pending'),
    superSeries: allSeries.filter((s) => s.category === 'superinvestors' && s.kind !== 'pending' && s.kind !== 'fund'),
  }), [allSeries]);

  const visibleSuper = superExpanded ? superSeries : superSeries.slice(0, TOP_SUPER_COUNT);
  const hiddenCount = superSeries.length - TOP_SUPER_COUNT;

  const toggle = useCallback((id) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Build treemap data from localSelected
  const treeData = useMemo(() => {
    const children = [];
    for (const id of localSelected) {
      const s = seriesById[id];
      if (!s) continue;

      let holdings = [];
      let managerId = null;

      if (s.kind === 'benchmark' && id === 'SPY') {
        holdings = SPY_TOP_HOLDINGS.map((h) => ({
          ticker: h.ticker, weight: h.weight, marketCap: h.marketCap, returnPct: null,
        }));
      } else if (s.kind === 'superinvestor') {
        managerId = s.managerId ?? null;
        holdings = (s.holdings ?? []).map((h) => ({
          ticker: h.ticker, weight: h.weight ?? 0, marketCap: h.marketCap ?? null, returnPct: h.returnPct ?? null,
        }));
      } else if (s.kind === 'portfolio' || s.kind === 'composite') {
        const positions = s.trackedOpenPositions ?? s.payload?.trackedOpenPositions ?? [];
        holdings = positions.map((p) => ({
          ticker: p.ticker, weight: p.currentWeightPct ?? 0, marketCap: p.marketCap ?? null, returnPct: p.totalReturnPct ?? null,
        }));
      }

      if (capMax < 5e12) {
        holdings = holdings.filter((h) => !h.marketCap || h.marketCap <= capMax);
      }
      if (!holdings.length) continue;

      const totalWeight = holdings.reduce((acc, h) => acc + h.weight, 0);
      const url = getInvestorUrl(s.id, managerId);

      children.push({
        name: s.shortLabel ?? s.label,
        id: s.id,
        url,
        children: holdings
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 20)
          .map((h) => ({
            name: h.ticker,
            investorId: s.id,
            investorLabel: s.shortLabel ?? s.label,
            stockUrl: `https://www.dataroma.com/m/stock.php?sym=${h.ticker}`,
            weight: totalWeight > 0 ? h.weight / totalWeight : 1 / holdings.length,
            rawWeight: h.weight,
            marketCap: h.marketCap,
            returnPct: h.returnPct,
          })),
      });
    }
    return { name: 'root', children };
  }, [localSelected, seriesById, capMax]);

  const layout = useMemo(() => {
    if (!treeData.children.length) return null;
    const root = d3Hierarchy
      .hierarchy(treeData)
      .sum((d) => d.weight ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    d3Hierarchy.treemap()
      .size([dims.width, dims.height])
      .paddingOuter(PADDING_OUTER)
      .paddingTop(PADDING_TOP)
      .paddingInner(PADDING_INNER)
      .round(true)(root);
    return root;
  }, [treeData, dims]);

  const investors = layout?.children ?? [];
  const leaves = layout?.leaves() ?? [];

  const renderChips = (series) =>
    series.map((item) => (
      <Chip key={item.id} on={localSelected.has(item.id)} onClick={() => toggle(item.id)}>
        <SeriesAvatar id={item.id} size="xs" />
        {item.label}
      </Chip>
    ));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Eyebrow>Holdings Treemap</Eyebrow>
        <div className="flex items-center gap-3 text-[0.65rem] text-muted">
          <span>Area = weight</span>
          <span className="flex items-center gap-1">
            Color =
            <span className="inline-block h-2.5 w-10 rounded-sm" style={{ background: 'linear-gradient(to right, rgb(140,10,10), rgb(40,40,20), rgb(10,120,10))' }} />
            return
          </span>
        </div>
      </div>

      {/* Toggle chips */}
      <nav className="space-y-1.5">
        {compareSeries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {renderChips(compareSeries)}
          </div>
        )}
        {brosSeries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {renderChips(brosSeries)}
          </div>
        )}
        {otherSeries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {renderChips(otherSeries)}
          </div>
        )}
        {superSeries.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {renderChips(visibleSuper)}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setSuperExpanded(!superExpanded)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-muted transition-all duration-150 hover:border-ink hover:text-ink"
              >
                {superExpanded ? 'Less' : `+${hiddenCount} more`}
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${superExpanded ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                >
                  <path d="M3 5l3 3 3-3" />
                </svg>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Treemap */}
      {investors.length > 0 ? (
        <GlassCard className="overflow-hidden p-0">
          <div ref={measuredRef} className="relative" style={{ height: dims.height }}>
            <svg width={dims.width} height={dims.height} className="block">
              {investors.map((inv) => {
                const { rawColor } = getSeriesAppearance(inv.data.id);
                return (
                  <g key={inv.data.id}>
                    <rect
                      x={inv.x0} y={inv.y0}
                      width={inv.x1 - inv.x0} height={inv.y1 - inv.y0}
                      fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1} rx={6}
                    />
                    {inv.data.url ? (
                      <a href={inv.data.url} target="_blank" rel="noopener noreferrer">
                        <text
                          x={inv.x0 + 8} y={inv.y0 + 17}
                          fill={rawColor} fontSize={12} fontWeight={700}
                          fontFamily="var(--font-geist-sans), system-ui, sans-serif"
                          className="select-none cursor-pointer" textDecoration="underline"
                        >
                          {inv.data.name}
                        </text>
                      </a>
                    ) : (
                      <text
                        x={inv.x0 + 8} y={inv.y0 + 17}
                        fill={rawColor} fontSize={12} fontWeight={700}
                        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
                        className="select-none"
                      >
                        {inv.data.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {leaves.map((leaf) => {
                const d = leaf.data;
                const w = leaf.x1 - leaf.x0;
                const h = leaf.y1 - leaf.y0;
                const isHovered = hovered === `${d.investorId}-${d.name}`;
                const bg = returnColor(d.returnPct);
                const border = returnBorderColor(d.returnPct);
                const hasLink = !!d.stockUrl;

                const tileContent = (
                  <g
                    onMouseEnter={() => setHovered(`${d.investorId}-${d.name}`)}
                    onMouseLeave={() => setHovered(null)}
                    className={hasLink ? 'cursor-pointer' : 'cursor-default'}
                  >
                    <rect
                      x={leaf.x0} y={leaf.y0} width={w} height={h}
                      fill={bg} stroke={isHovered ? 'rgba(255,255,255,0.6)' : border}
                      strokeWidth={isHovered ? 1.5 : 0.5} rx={3}
                      opacity={isHovered ? 1 : 0.9}
                    />
                    {w >= MIN_LABEL_W && h >= MIN_LABEL_H && (
                      <>
                        <text x={leaf.x0 + 6} y={leaf.y0 + 15}
                          fill="rgba(255,255,255,0.95)" fontSize={w > 80 ? 12 : 10}
                          fontWeight={600} fontFamily="var(--font-geist-mono), monospace"
                          className="select-none pointer-events-none"
                        >{d.name}</text>
                        {h >= 44 && d.marketCap && (
                          <text x={leaf.x0 + 6} y={leaf.y0 + 30}
                            fill="rgba(255,255,255,0.6)" fontSize={w > 80 ? 11 : 9}
                            fontWeight={500} fontFamily="var(--font-geist-sans), system-ui, sans-serif"
                            className="select-none pointer-events-none"
                          >{formatMarketCap(d.marketCap)}</text>
                        )}
                        {h >= 44 && !d.marketCap && d.rawWeight != null && (
                          <text x={leaf.x0 + 6} y={leaf.y0 + 30}
                            fill="rgba(255,255,255,0.5)" fontSize={w > 80 ? 10 : 9}
                            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
                            className="select-none pointer-events-none"
                          >{(d.rawWeight * 100).toFixed(1)}%</text>
                        )}
                        {h >= 58 && d.returnPct != null && (
                          <text x={leaf.x0 + 6} y={leaf.y0 + 44}
                            fill={d.returnPct >= 0 ? 'rgba(120,255,120,0.85)' : 'rgba(255,120,120,0.85)'}
                            fontSize={w > 80 ? 11 : 10} fontWeight={600}
                            fontFamily="var(--font-geist-mono), monospace"
                            className="select-none pointer-events-none"
                          >{formatPercent(d.returnPct)}</text>
                        )}
                      </>
                    )}
                    {w >= 24 && w < MIN_LABEL_W && h >= 16 && (
                      <text x={leaf.x0 + 3} y={leaf.y0 + 11}
                        fill="rgba(255,255,255,0.8)" fontSize={8} fontWeight={600}
                        fontFamily="var(--font-geist-mono), monospace"
                        className="select-none pointer-events-none"
                      >{d.name}</text>
                    )}
                  </g>
                );

                return hasLink ? (
                  <a key={`${d.investorId}-${d.name}`} href={d.stockUrl} target="_blank" rel="noopener noreferrer">
                    {tileContent}
                  </a>
                ) : (
                  <g key={`${d.investorId}-${d.name}`}>{tileContent}</g>
                );
              })}
            </svg>

            {hovered && (() => {
              const leaf = leaves.find((l) => `${l.data.investorId}-${l.data.name}` === hovered);
              if (!leaf) return null;
              const d = leaf.data;
              const cx = (leaf.x0 + leaf.x1) / 2;
              const cy = leaf.y0;
              const tooltipLeft = Math.min(Math.max(cx - 80, 8), dims.width - 176);
              const tooltipTop = cy > 80 ? cy - 72 : leaf.y1 + 8;
              return (
                <div
                  className="pointer-events-none absolute z-20 rounded-lg border border-line bg-[rgb(20,20,20)] px-3 py-2 shadow-lg"
                  style={{ left: tooltipLeft, top: tooltipTop, minWidth: 160 }}
                >
                  <div className="flex items-center gap-2">
                    <TickerLogo ticker={d.name} size={16} />
                    <span className="font-mono text-sm font-semibold text-white">{d.name}</span>
                    <span className="text-[0.6rem] text-muted">({d.investorLabel})</span>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted">
                    {d.rawWeight != null && <span>Weight: {(d.rawWeight * 100).toFixed(1)}%</span>}
                    {d.marketCap != null && <span>Cap: {formatMarketCap(d.marketCap)}</span>}
                  </div>
                  {d.returnPct != null && (
                    <div className="mt-0.5 font-mono text-xs font-semibold" style={{ color: d.returnPct >= 0 ? '#7f7' : '#f77' }}>
                      {formatPercent(d.returnPct)} return
                    </div>
                  )}
                  {d.stockUrl && (
                    <div className="mt-1 text-[0.6rem] text-blue-400">Click to view source</div>
                  )}
                </div>
              );
            })()}
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-8">
          <p className="text-center text-sm text-muted">Select investors above to compare holdings</p>
        </GlassCard>
      )}
    </div>
  );
}
