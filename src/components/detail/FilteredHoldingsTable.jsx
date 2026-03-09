import { useState, useMemo } from 'react';
import Eyebrow from '../ui/Eyebrow';
import TickerLogo from '../ui/TickerLogo';
import { formatPercent, formatMarketCap } from '../../lib/formatters';

const COLUMNS = [
  { key: 'ticker', label: 'Ticker', align: 'left' },
  { key: 'investor', label: 'Investor', align: 'left' },
  { key: 'weight', label: 'Weight', align: 'left' },
  { key: 'marketCap', label: 'Mkt Cap', align: 'left' },
  { key: 'returnPct', label: '5yr Return', align: 'left' },
];

function compareFn(key, dir) {
  return (a, b) => {
    let av = a[key];
    let bv = b[key];
    // Nulls always sort last
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    // String comparison for text fields
    if (typeof av === 'string') {
      const cmp = av.localeCompare(bv);
      return dir === 'asc' ? cmp : -cmp;
    }
    // Numeric comparison
    return dir === 'asc' ? av - bv : bv - av;
  };
}

export default function FilteredHoldingsTable({ holdings, capMax }) {
  const [sortKey, setSortKey] = useState('marketCap');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    return [...holdings].sort(compareFn(sortKey, sortDir));
  }, [holdings, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'ticker' || key === 'investor' ? 'asc' : 'desc');
    }
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5">
      <Eyebrow>Market cap filter</Eyebrow>
      <h3 className="mt-1.5 text-base font-semibold tracking-tight">
        {holdings.length} holdings under {formatMarketCap(capMax)}
      </h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle transition-colors hover:text-ink"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-ink">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h, i) => (
              <tr key={`${h.investorId}-${h.ticker}-${i}`} className="border-t border-line/60 transition-colors hover:bg-bg/50">
                <td className="py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <TickerLogo ticker={h.ticker} />
                    <span className="font-mono font-medium">{h.ticker}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-sm text-muted">{h.investor}</td>
                <td className="px-2 py-2.5 text-sm">{formatPercent(h.weight, false)}</td>
                <td className="px-2 py-2.5 text-sm">
                  <span className="font-mono text-muted">{formatMarketCap(h.marketCap)}</span>
                </td>
                <td className="px-2 py-2.5 text-sm">
                  <span className="font-mono font-medium">
                    {h.returnPct != null ? formatPercent(h.returnPct) : '\u2014'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
