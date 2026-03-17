import { useMemo, useState } from 'react';
import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import TickerLogo from '../ui/TickerLogo';

function formatPct(v) {
  if (v == null) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

export default function ReportedPriceFilter({ seriesById }) {
  const [threshold, setThreshold] = useState(-20);

  // Aggregate all superinvestor holdings that have pctChangeFromReported
  const allHoldings = useMemo(() => {
    const map = new Map(); // ticker -> { ticker, pctChange, investors, marketCap, reportedPrice, currentPrice }

    for (const s of Object.values(seriesById)) {
      if (s.kind !== 'superinvestor' || !s.holdings) continue;
      for (const h of s.holdings) {
        if (h.pctChangeFromReported == null) continue;
        const existing = map.get(h.ticker);
        if (existing) {
          existing.investors.push(s.shortLabel ?? s.label);
        } else {
          map.set(h.ticker, {
            ticker: h.ticker,
            pctChange: h.pctChangeFromReported,
            reportedPrice: h.reportedPrice ?? null,
            currentPrice: h.currentPrice ?? null,
            marketCap: h.marketCap ?? null,
            investors: [s.shortLabel ?? s.label],
          });
        }
      }
    }
    return [...map.values()].sort((a, b) => a.pctChange - b.pctChange);
  }, [seriesById]);

  // Filter by threshold
  const filtered = useMemo(() => {
    if (threshold < 0) {
      // Show stocks that dropped MORE than threshold (e.g. threshold=-20 → show stocks at -20% or worse)
      return allHoldings.filter((h) => h.pctChange <= threshold);
    } else {
      // Show stocks that gained MORE than threshold (e.g. threshold=+20 → show stocks at +20% or better)
      return allHoldings.filter((h) => h.pctChange >= threshold);
    }
  }, [allHoldings, threshold]);

  if (!allHoldings.length) return null;

  const minPct = Math.floor(Math.min(...allHoldings.map((h) => h.pctChange), -50));
  const maxPct = Math.ceil(Math.max(...allHoldings.map((h) => h.pctChange), 50));

  return (
    <div className="space-y-4">
      <Eyebrow>+/- Reported Price Filter</Eyebrow>
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Stocks across all superinvestors where price has moved{' '}
              <span className="font-semibold text-ink">
                {threshold < 0 ? `${threshold}% or more below` : `+${threshold}% or more above`}
              </span>{' '}
              their 13F reported price
            </p>
            <span className={`rounded-full px-3 py-1 text-sm font-mono font-semibold ${
              threshold < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
            }`}>
              {formatPct(threshold)}
            </span>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min={minPct}
              max={maxPct}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-ink cursor-pointer"
            />
            <div className="flex justify-between text-[0.6rem] text-muted font-mono">
              <span>{formatPct(minPct)}</span>
              <span>0%</span>
              <span>{formatPct(maxPct)}</span>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted">
            {filtered.length} stock{filtered.length !== 1 ? 's' : ''} match
            {filtered.length > 0 && (
              <span> — held by {new Set(filtered.flatMap((h) => h.investors)).size} investors</span>
            )}
          </p>

          {/* Ticker grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filtered.map((h) => (
                <a
                  key={h.ticker}
                  href={`https://www.dataroma.com/m/stock.php?sym=${h.ticker}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-all hover:border-ink hover:shadow-sm"
                >
                  <TickerLogo ticker={h.ticker} size={20} />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold text-ink">{h.ticker}</div>
                    <div className={`font-mono text-xs font-semibold ${
                      h.pctChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPct(h.pctChange)}
                    </div>
                  </div>
                  <div className="text-right">
                    {h.currentPrice != null && (
                      <div className="text-[0.65rem] text-muted">${h.currentPrice.toLocaleString()}</div>
                    )}
                    <div className="text-[0.6rem] text-muted/60">
                      {h.investors.length} inv
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              No stocks match this threshold. Try adjusting the slider.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
