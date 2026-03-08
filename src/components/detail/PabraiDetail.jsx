import Eyebrow from '../ui/Eyebrow';
import ActionButton from '../ui/ActionButton';
import MetricTile from '../metrics/MetricTile';
import DataTable from './DataTable';
import { formatPercent, formatAnnualized, formatDate } from '../../lib/formatters';

export default function PabraiDetail({ view, model, onSetSeries }) {
  const payload = view.payload;
  const funds = model.comparisonSeries.filter((series) => series.kind === 'fund');

  return (
    <section className="grid gap-6">
      <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-prose space-y-2">
            <Eyebrow>Pabrai composite</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight">
              Equal-weight composite of PIF2, PIF3, and PIF4.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onSetSeries(['PABRAI', 'SPY'])}>PABRAI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries(['AVI', 'PABRAI', 'SPY'])}>AVI + PABRAI + SPY</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricTile label="Annualized return" value={formatAnnualized(payload.stats?.annualizedPortfolioReturnPct)} />
          <MetricTile label="Total return" value={formatPercent(payload.stats?.portfolioReturnPct)} />
          <MetricTile label="Latest checkpoint" value={formatDate(payload.stats?.latestCheckpoint)} />
        </div>
      </article>

      <DataTable
        title="Underlying funds"
        kicker="PDF NAV checkpoints"
        columns={[
          {
            label: 'Fund',
            render: (row) => <span className="font-mono font-medium">{row.label}</span>,
          },
          {
            label: 'Annualized',
            render: (row) => <span className="font-mono">{formatAnnualized(row.annualizedReturnPct)}</span>,
          },
          {
            label: 'Total return',
            render: (row) => <span className="font-mono">{formatPercent(row.totalReturnPct)}</span>,
          },
          {
            label: 'Checkpoint',
            render: (row) => formatDate(row.latestCheckpoint),
          },
        ]}
        rows={funds}
        emptyMessage="No PIF fund data loaded."
      />
    </section>
  );
}
