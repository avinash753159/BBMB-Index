import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import SeriesAvatar from '../ui/SeriesAvatar';
import TickerLogo from '../ui/TickerLogo';

const SPY_TOP_HOLDINGS = [
  { ticker: 'AAPL', weight: 7.1, marketCap: 3.8e12 },
  { ticker: 'MSFT', weight: 6.4, marketCap: 3.2e12 },
  { ticker: 'NVDA', weight: 6.0, marketCap: 3.4e12 },
  { ticker: 'AMZN', weight: 3.8, marketCap: 2.3e12 },
  { ticker: 'META', weight: 2.6, marketCap: 1.7e12 },
];

function formatCap(cap) {
  if (!cap) return '—';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

function HoldingsCard({ id, label, holdings, dataromaUrl, capMax }) {
  const filtered = capMax < 5e12
    ? holdings.filter((h) => h.marketCap && h.marketCap <= capMax)
    : holdings;

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <SeriesAvatar id={id} size="sm" />
        {dataromaUrl ? (
          <a
            href={dataromaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-ink hover:text-blue-600 hover:underline"
          >
            {label}
          </a>
        ) : (
          <span className="text-sm font-semibold text-ink">{label}</span>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">
          No holdings under {formatCap(capMax)}
        </p>
      ) : (
        <div className="space-y-1.5">
          {filtered.slice(0, 5).map((h) => (
            <div key={h.ticker} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <TickerLogo ticker={h.ticker} size={16} />
                <span className="font-mono font-medium">{h.ticker}</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span>{formatCap(h.marketCap)}</span>
                <span className="w-12 text-right font-mono">
                  {h.weight != null ? `${h.weight.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {dataromaUrl && (
        <a
          href={dataromaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-[0.65rem] text-blue-600 hover:underline"
        >
          View all on Dataroma &rarr;
        </a>
      )}
    </GlassCard>
  );
}

export default function TopHoldingsCards({ displaySeries, seriesById, capMax = 5e12 }) {
  const cards = [];

  for (const s of displaySeries) {
    if (s.kind === 'benchmark' && s.id === 'SPY') {
      cards.push({ id: 'SPY', label: 'SPY', holdings: SPY_TOP_HOLDINGS, dataromaUrl: null });
    } else if (s.kind === 'superinvestor') {
      const full = seriesById[s.id];
      if (!full?.holdings?.length) continue;
      const managerId = full.managerId;
      cards.push({
        id: s.id,
        label: s.shortLabel ?? s.label,
        holdings: full.holdings.map((h) => ({ ...h, weight: h.weight != null ? h.weight * 100 : null })),
        dataromaUrl: managerId ? `https://www.dataroma.com/m/holdings.php?m=${managerId}` : null,
      });
    } else if (s.kind === 'portfolio' || s.kind === 'composite') {
      // Bros — use trackedOpenPositions from the raw payload
      const view = seriesById[s.id];
      const positions = view?.trackedOpenPositions ?? view?.payload?.trackedOpenPositions ?? [];
      if (!positions.length) continue;
      const holdings = positions
        .sort((a, b) => (b.currentWeightPct ?? 0) - (a.currentWeightPct ?? 0))
        .map((p) => ({ ticker: p.ticker, weight: p.currentWeightPct != null ? p.currentWeightPct * 100 : null, marketCap: p.marketCap ?? null }));
      cards.push({ id: s.id, label: s.shortLabel ?? s.label, holdings, dataromaUrl: null });
    }
    if (cards.length >= 5) break;
  }

  if (!cards.length) return null;

  return (
    <div className="space-y-4">
      <Eyebrow>Top Holdings</Eyebrow>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <HoldingsCard key={c.id} {...c} capMax={capMax} />
        ))}
      </div>
    </div>
  );
}
