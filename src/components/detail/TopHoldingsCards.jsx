import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import SeriesAvatar from '../ui/SeriesAvatar';
import TickerLogo from '../ui/TickerLogo';

const SPY_TOP_HOLDINGS = [
  { ticker: 'NVDA', weight: 7.29, marketCap: 4.38e12 },
  { ticker: 'AAPL', weight: 6.11, marketCap: 3.676e12 },
  { ticker: 'MSFT', weight: 4.89, marketCap: 2.939e12 },
  { ticker: 'AMZN', weight: 3.71, marketCap: 2.229e12 },
  { ticker: 'META', weight: 2.58, marketCap: 1.552e12 },
  { ticker: 'AVGO', weight: 2.54, marketCap: 1.527e12 },
  { ticker: 'TSLA', weight: 2.44, marketCap: 1.467e12 },
  { ticker: 'BRK.B', weight: 1.76, marketCap: 1.057e12 },
  { ticker: 'WMT', weight: 1.68, marketCap: 1.008e12 },
  { ticker: 'LLY', weight: 1.46, marketCap: 882e9 },
  { ticker: 'JPM', weight: 1.27, marketCap: 764e9 },
  { ticker: 'XOM', weight: 1.08, marketCap: 651e9 },
  { ticker: 'V', weight: 0.98, marketCap: 592e9 },
  { ticker: 'JNJ', weight: 0.97, marketCap: 582e9 },
  { ticker: 'MU', weight: 0.80, marketCap: 480e9 },
  { ticker: 'COST', weight: 0.74, marketCap: 447e9 },
  { ticker: 'ORCL', weight: 0.74, marketCap: 446e9 },
  { ticker: 'MA', weight: 0.74, marketCap: 444e9 },
  { ticker: 'NFLX', weight: 0.67, marketCap: 404e9 },
  { ticker: 'CVX', weight: 0.65, marketCap: 394e9 },
  { ticker: 'ABBV', weight: 0.65, marketCap: 388e9 },
  { ticker: 'PLTR', weight: 0.60, marketCap: 361e9 },
  { ticker: 'PG', weight: 0.58, marketCap: 352e9 },
  { ticker: 'HD', weight: 0.56, marketCap: 338e9 },
  { ticker: 'BAC', weight: 0.56, marketCap: 341e9 },
  { ticker: 'KO', weight: 0.55, marketCap: 333e9 },
  { ticker: 'CAT', weight: 0.54, marketCap: 325e9 },
  { ticker: 'AMD', weight: 0.52, marketCap: 315e9 },
  { ticker: 'GE', weight: 0.52, marketCap: 316e9 },
  { ticker: 'CSCO', weight: 0.51, marketCap: 309e9 },
  { ticker: 'MRK', weight: 0.48, marketCap: 286e9 },
  { ticker: 'RTX', weight: 0.46, marketCap: 275e9 },
  { ticker: 'PM', weight: 0.45, marketCap: 272e9 },
  { ticker: 'AMAT', weight: 0.45, marketCap: 271e9 },
  { ticker: 'LRCX', weight: 0.44, marketCap: 267e9 },
  { ticker: 'UNH', weight: 0.43, marketCap: 256e9 },
  { ticker: 'MS', weight: 0.41, marketCap: 246e9 },
  { ticker: 'TMUS', weight: 0.40, marketCap: 243e9 },
  { ticker: 'MCD', weight: 0.39, marketCap: 233e9 },
  { ticker: 'GS', weight: 0.39, marketCap: 235e9 },
  { ticker: 'IBM', weight: 0.38, marketCap: 231e9 },
  { ticker: 'WFC', weight: 0.38, marketCap: 233e9 },
  { ticker: 'INTC', weight: 0.38, marketCap: 229e9 },
  { ticker: 'PEP', weight: 0.36, marketCap: 219e9 },
  { ticker: 'GEV', weight: 0.36, marketCap: 218e9 },
  { ticker: 'VZ', weight: 0.36, marketCap: 217e9 },
  { ticker: 'AXP', weight: 0.34, marketCap: 207e9 },
  { ticker: 'AMGN', weight: 0.33, marketCap: 197e9 },
  { ticker: 'T', weight: 0.32, marketCap: 197e9 },
  { ticker: 'NEE', weight: 0.32, marketCap: 193e9 },
  { ticker: 'ABT', weight: 0.31, marketCap: 188e9 },
  { ticker: 'KLAC', weight: 0.31, marketCap: 186e9 },
  { ticker: 'C', weight: 0.31, marketCap: 185e9 },
  { ticker: 'GILD', weight: 0.30, marketCap: 180e9 },
  { ticker: 'CRM', weight: 0.30, marketCap: 181e9 },
  { ticker: 'DIS', weight: 0.29, marketCap: 176e9 },
  { ticker: 'TXN', weight: 0.29, marketCap: 174e9 },
  { ticker: 'TJX', weight: 0.29, marketCap: 173e9 },
  { ticker: 'TMO', weight: 0.29, marketCap: 173e9 },
  { ticker: 'ANET', weight: 0.28, marketCap: 168e9 },
  { ticker: 'ISRG', weight: 0.28, marketCap: 168e9 },
  { ticker: 'BA', weight: 0.27, marketCap: 165e9 },
  { ticker: 'SCHW', weight: 0.27, marketCap: 165e9 },
  { ticker: 'DE', weight: 0.26, marketCap: 156e9 },
  { ticker: 'PFE', weight: 0.25, marketCap: 151e9 },
  { ticker: 'UBER', weight: 0.25, marketCap: 152e9 },
  { ticker: 'ADI', weight: 0.25, marketCap: 149e9 },
  { ticker: 'HON', weight: 0.25, marketCap: 149e9 },
  { ticker: 'COP', weight: 0.25, marketCap: 149e9 },
  { ticker: 'LMT', weight: 0.25, marketCap: 149e9 },
];

function formatCap(cap) {
  if (!cap) return '—';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(0)}M`;
  return `$${cap.toLocaleString()}`;
}

function HoldingsCard({ id, label, holdings, sourceUrl, sourceName, capMax }) {
  const filtered = capMax < 5e12
    ? holdings.filter((h) => h.marketCap && h.marketCap <= capMax)
    : holdings;

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <SeriesAvatar id={id} size="sm" />
        {sourceUrl ? (
          <a
            href={sourceUrl}
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
          {filtered.slice(0, 10).map((h) => {
            const Row = sourceUrl ? 'a' : 'div';
            const rowProps = sourceUrl
              ? { href: sourceUrl, target: '_blank', rel: 'noopener noreferrer' }
              : {};
            return (
              <Row
                key={h.ticker}
                {...rowProps}
                className={`flex items-center justify-between text-xs ${sourceUrl ? 'rounded-md px-1 py-0.5 -mx-1 transition-colors hover:bg-ink/5 cursor-pointer' : ''}`}
              >
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
              </Row>
            );
          })}
        </div>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-[0.65rem] text-blue-600 hover:underline"
        >
          View source: {sourceName ?? 'Details'} &rarr;
        </a>
      )}
    </GlassCard>
  );
}

export default function TopHoldingsCards({ displaySeries, seriesById, capMax = 5e12 }) {
  const cards = [];

  const SOURCE_URLS = {
    NEIL_MEHTA: { url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001840735&type=13F&dateb=&owner=include&count=40', name: 'SEC EDGAR 13F' },
    PELOSI: { url: 'https://www.capitoltrades.com/trades?politician=P000197', name: 'Capitol Trades' },
  };

  for (const s of displaySeries) {
    if (s.kind === 'benchmark' && s.id === 'SPY') {
      cards.push({ id: 'SPY', label: 'SPY', holdings: SPY_TOP_HOLDINGS, sourceUrl: null, sourceName: null });
    } else if (s.kind === 'superinvestor') {
      const full = seriesById[s.id];
      if (!full?.holdings?.length) continue;
      const managerId = full.managerId;
      const customSource = SOURCE_URLS[s.id];
      cards.push({
        id: s.id,
        label: s.shortLabel ?? s.label,
        holdings: full.holdings.map((h) => ({ ...h, weight: h.weight != null ? h.weight * 100 : null })),
        sourceUrl: customSource?.url ?? (managerId ? `https://www.dataroma.com/m/holdings.php?m=${managerId}` : null),
        sourceName: customSource?.name ?? (managerId ? 'Dataroma' : null),
      });
    } else if (s.kind === 'portfolio' || s.kind === 'composite') {
      // Bros — use trackedOpenPositions from the raw payload
      const view = seriesById[s.id];
      const positions = view?.trackedOpenPositions ?? view?.payload?.trackedOpenPositions ?? [];
      if (!positions.length) continue;
      const holdings = positions
        .sort((a, b) => (b.currentWeightPct ?? 0) - (a.currentWeightPct ?? 0))
        .map((p) => ({ ticker: p.ticker, weight: p.currentWeightPct != null ? p.currentWeightPct * 100 : null, marketCap: p.marketCap ?? null }));
      cards.push({ id: s.id, label: s.shortLabel ?? s.label, holdings, sourceUrl: null, sourceName: null });
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
