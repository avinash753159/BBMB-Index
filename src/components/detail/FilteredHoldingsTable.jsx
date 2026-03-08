import Eyebrow from '../ui/Eyebrow';
import TickerLogo from '../ui/TickerLogo';
import { formatPercent, formatMarketCap } from '../../lib/formatters';

export default function FilteredHoldingsTable({ holdings, capMax }) {
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
              <th className="border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle">Ticker</th>
              <th className="border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle">Investor</th>
              <th className="border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle">Weight</th>
              <th className="border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle">Mkt Cap</th>
              <th className="border-b border-line pb-2 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle">5yr Return</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr key={`${h.investorId}-${h.ticker}-${i}`} className="border-t border-line/60 transition-colors hover:bg-bg/50">
                <td className="py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <TickerLogo ticker={h.ticker} />
                    <span className="font-mono font-medium">{h.ticker}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-sm text-muted">{h.investor}</td>
                <td className="px-2 py-2.5 text-sm">{formatPercent(h.weight, 1, false)}</td>
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
