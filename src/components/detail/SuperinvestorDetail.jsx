import Eyebrow from '../ui/Eyebrow';
import ActionButton from '../ui/ActionButton';
import MetricTile from '../metrics/MetricTile';
import DataTable from './DataTable';
import TickerLogo from '../ui/TickerLogo';
import { formatPercent, formatAnnualized, formatMarketCap } from '../../lib/formatters';

export default function SuperinvestorDetail({ view, onSetSeries, capMax }) {
  const payload = view.payload;
  const stats = payload?.stats ?? {};
  const allHoldings = payload?.holdings ?? [];
  const managerId = payload?.managerId;
  const dataromaUrl = managerId ? `https://www.dataroma.com/m/holdings.php?m=${managerId}` : null;

  const ceiling = capMax ?? 5e12;
  const filteredHoldings = allHoldings.filter(h => {
    if (!h.marketCap) return true;
    return h.marketCap <= ceiling;
  });
  const filterActive = filteredHoldings.length < allHoldings.length;

  return (
    <section className="grid gap-6">
      <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-prose space-y-2">
            <Eyebrow>{view.label} portfolio</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight">
              {dataromaUrl ? (
                <a href={dataromaUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                  {view.label}
                </a>
              ) : view.label}
              {' '}<span className="font-normal text-muted">— quarterly-rebalanced 13F backtest</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {view.summary}
              {dataromaUrl && (
                <>
                  {' '}
                  <a href={dataromaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View on Dataroma &rarr;
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onSetSeries([view.id, 'SPY'])}>{view.label} + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries([view.id, 'AVI', 'SPY'])}>{view.label} + AVI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries([view.id, 'BUFFETT', 'LI_LU', 'SPY'])}>All supers + SPY</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Annualized return" value={formatAnnualized(stats.annualizedPortfolioReturnPct)} />
          <MetricTile label="Total return" value={formatPercent(stats.portfolioReturnPct)} />
          <MetricTile label="vs SPY annualized" value={formatAnnualized(stats.annualizedReturnSpreadPct)} />
          <MetricTile label="Holdings" value={String(stats.holdingCount ?? 0)} />
        </div>
      </article>

      <DataTable
        title={`${view.label} top holdings${filterActive ? ` (${filteredHoldings.length} of ${allHoldings.length} match cap filter)` : ''}`}
        kicker="13F portfolio"
        columns={[
          {
            label: 'Ticker',
            render: (row) => (
              <div className="flex items-center gap-2">
                <TickerLogo ticker={row.ticker} />
                <span className="font-mono font-medium">{row.ticker}</span>
              </div>
            ),
          },
          {
            label: 'Weight',
            render: (row) => formatPercent(row.weight, 1, false),
          },
          {
            label: 'Mkt Cap',
            render: (row) => (
              <span className="font-mono text-muted">{formatMarketCap(row.marketCap)}</span>
            ),
          },
          {
            label: '5yr Return',
            render: (row) => (
              <span className="font-mono font-medium">
                {row.returnPct != null ? formatPercent(row.returnPct) : '\u2014'}
              </span>
            ),
          },
        ]}
        rows={filteredHoldings.slice(0, 10)}
        emptyMessage="No holdings data available."
      />
    </section>
  );
}
