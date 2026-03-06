import Eyebrow from '../ui/Eyebrow';
import Pill from '../ui/Pill';
import ActionButton from '../ui/ActionButton';
import MetricTile from '../metrics/MetricTile';
import DataTable from './DataTable';
import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent, formatAnnualized, formatDate } from '../../lib/formatters';

export default function PabraiDetail({ view, model, onSetSeries }) {
  const payload = view.payload;
  const funds = model.comparisonSeries.filter((series) => series.kind === 'fund');

  return (
    <section className="grid gap-6">
      {/* Intro card */}
      <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-prose space-y-2">
            <Eyebrow>Pabrai composite</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight">
              Composite view plus every underlying fund.
            </h2>
            <p className="text-sm leading-relaxed text-muted">{view.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onSetSeries(['PABRAI', 'SPY'])}>PABRAI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries(['AVI', 'PABRAI', 'SPY'])}>PABRAI + AVI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries(['PIF2', 'PIF3', 'PIF4', 'SPY'])}>PIF2 + PIF3 + PIF4 + SPY</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Annualized return" value={formatAnnualized(payload.stats?.annualizedPortfolioReturnPct)} />
          <MetricTile label="Latest checkpoint" value={formatDate(payload.stats?.latestCheckpoint)} />
          <MetricTile label="Funds in composite" value={String(payload.stats?.fundCount ?? 0)} />
          <MetricTile label="Watch ticker" value={model.watchlistTickers.join(', ') || '\u2014'} />
        </div>
      </article>

      {/* Fund grid: asymmetric 2-column */}
      <div className="grid gap-4 sm:grid-cols-2">
        {funds.map((fund) => {
          const { rawColor } = getSeriesAppearance(fund.id);
          return (
            <article
              key={fund.id}
              className="rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-card backdrop-blur-xl"
              style={{ borderTop: `2px solid ${rawColor}` }}
            >
              <Pill variant="default">Fund</Pill>
              <strong className="mt-2 block text-base font-semibold tracking-tight">
                {fund.label} {formatAnnualized(fund.annualizedReturnPct)}
              </strong>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Total return {formatPercent(fund.totalReturnPct)}. {fund.note}
              </p>
              <div className="mt-3">
                <ActionButton onClick={() => onSetSeries([fund.id, 'AVI', 'SPY'])}>
                  {fund.label} + AVI + SPY
                </ActionButton>
              </div>
            </article>
          );
        })}
      </div>

      {/* Split: underlying funds table + source files */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable
          title="Underlying funds"
          kicker="PDF-derived lines"
          columns={[
            {
              label: 'Fund',
              render: (row) => <span className="font-mono">{row.label}</span>,
            },
            {
              label: 'Annualized',
              render: (row) => formatAnnualized(row.annualizedReturnPct),
            },
            {
              label: 'Total',
              render: (row) => formatPercent(row.totalReturnPct),
            },
            {
              label: 'Checkpoint',
              render: (row) => (
                <div>
                  <div>{formatDate(row.latestCheckpoint)}</div>
                  <div className="text-xs text-muted">{row.note}</div>
                </div>
              ),
            },
          ]}
          rows={funds}
          emptyMessage="No PIF fund data loaded."
        />

        <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card backdrop-blur-xl">
          <Eyebrow>Source files</Eyebrow>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            PDFs and watchlist carried into the composite.
          </h3>
          <ul className="mt-4 space-y-2 pl-4 text-sm leading-relaxed text-muted list-disc">
            {model.sourcePdfs.map((source, i) => (
              <li key={i}>{source.split('\\').pop() || source}</li>
            ))}
            {model.watchlistTickers.length > 0 && (
              <li>Watchlist ticker: {model.watchlistTickers.join(', ')}</li>
            )}
            {(payload.warnings ?? []).map((warning, i) => (
              <li key={`w-${i}`}>{warning}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
