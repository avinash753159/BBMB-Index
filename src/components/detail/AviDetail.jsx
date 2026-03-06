import Eyebrow from '../ui/Eyebrow';
import ActionButton from '../ui/ActionButton';
import MetricTile from '../metrics/MetricTile';
import DataTable from './DataTable';
import { formatPercent, formatAnnualized, formatDate } from '../../lib/formatters';

export default function AviDetail({ view, model, onSetSeries }) {
  const payload = view.payload;

  return (
    <section className="grid gap-6">
      {/* Intro card */}
      <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-prose space-y-2">
            <Eyebrow>AVI detail</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight">
              Current modeled book and what is still missing.
            </h2>
            <p className="text-sm leading-relaxed text-muted">{view.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onSetSeries(['AVI', 'SPY'])}>AVI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries(['AVI', 'PABRAI', 'SPY'])}>AVI + PABRAI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries(['AVI', 'PIF3', 'SPY'])}>AVI + PIF3 + SPY</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Annualized return" value={formatAnnualized(payload.stats?.annualizedPortfolioReturnPct)} />
          <MetricTile label="Tracked open names" value={String(payload.stats?.trackedNames ?? 0)} />
          <MetricTile label="Sized realized exits" value={String(payload.stats?.modeledRealizedNames ?? 0)} />
          <MetricTile label="Excluded snapshot weight" value={formatPercent(payload.stats?.excludedSnapshotWeightPct, false)} />
        </div>
      </article>

      {/* Tables grid: open + realized */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable
          title="Tracked open positions"
          kicker="Open book"
          columns={[
            {
              label: 'Ticker',
              render: (row) => <span className="font-mono">{row.ticker}</span>,
            },
            {
              label: 'Buy date',
              render: (row) => (
                <div>
                  <div>{formatDate(row.buyDate)}</div>
                  <div className="text-xs text-muted">{row.buyDateStatus}</div>
                </div>
              ),
            },
            {
              label: 'Weight',
              render: (row) => (
                <div>
                  <div>{formatPercent(row.currentWeightPct, false)}</div>
                  <div className="text-xs text-muted">tracked open book</div>
                </div>
              ),
            },
            {
              label: 'Return',
              render: (row) => (
                <div>
                  <div>{formatAnnualized(row.annualizedReturnPct)}</div>
                  <div className="text-xs text-muted">
                    Total {formatPercent(row.totalReturnPct)} | {row.accountType ?? 'external holding'}
                  </div>
                </div>
              ),
            },
          ]}
          rows={payload.trackedOpenPositions ?? []}
          emptyMessage="No open positions in the modeled AVI book."
        />

        <DataTable
          title="Known sold positions"
          kicker="Realized"
          columns={[
            {
              label: 'Ticker',
              render: (row) => <span className="font-mono">{row.ticker}</span>,
            },
            {
              label: 'Buy',
              render: (row) => (
                <div>
                  <div>{formatDate(row.buyDate)}</div>
                  <div className="text-xs text-muted">{row.buyDateStatus}</div>
                </div>
              ),
            },
            {
              label: 'Sell',
              render: (row) => (
                <div>
                  <div>{formatDate(row.sellDate)}</div>
                  <div className="text-xs text-muted">{row.sellDateStatus}</div>
                </div>
              ),
            },
            {
              label: 'Return',
              render: (row) => (
                <div>
                  <div>{formatAnnualized(row.annualizedReturnPct)}</div>
                  <div className="text-xs text-muted">
                    Total {formatPercent(row.returnPct)} | {row.confidence} confidence
                  </div>
                </div>
              ),
            },
          ]}
          rows={payload.realizedPositions ?? []}
          emptyMessage="No realized positions recorded yet."
        />
      </div>

      {/* Split: unclassified + warnings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable
          title="Current holdings outside the tracked basket"
          kicker="Needs classification"
          columns={[
            {
              label: 'Symbol',
              render: (row) => <span className="font-mono">{row.symbol}</span>,
            },
            {
              label: 'Account',
              render: (row) => (
                <div>
                  <div>{row.accountType}</div>
                  <div className="text-xs text-muted">{row.accountName}</div>
                </div>
              ),
            },
            {
              label: 'Visible weight',
              render: (row) => formatPercent(row.visibleWeightPct, false),
            },
          ]}
          rows={payload.currentUnclassifiedHoldings ?? []}
          emptyMessage="Everything in the Vanguard snapshot is classified."
        />

        <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card backdrop-blur-xl">
          <Eyebrow>Data quality</Eyebrow>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            Flags still worth keeping in view.
          </h3>
          <ul className="mt-4 space-y-2 pl-4 text-sm leading-relaxed text-muted list-disc">
            {(payload.warnings ?? []).map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
