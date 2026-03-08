import Eyebrow from '../ui/Eyebrow';
import ActionButton from '../ui/ActionButton';
import MetricTile from '../metrics/MetricTile';
import { formatPercent, formatAnnualized, formatDate } from '../../lib/formatters';

export default function FundDetail({ view, model, onSetSeries }) {
  const fund = view.payload;

  return (
    <section className="grid gap-6">
      {/* Main card */}
      <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-prose space-y-2">
            <Eyebrow>{fund.label} fund view</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight">
              {fund.label} on its own, with quick jumps back to AVI and SPY.
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              {fund.description} {fund.note}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onSetSeries([fund.id, 'SPY'])}>{fund.label} + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries([fund.id, 'AVI', 'SPY'])}>{fund.label} + AVI + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries([fund.id, 'PABRAI', 'SPY'])}>{fund.label} + PABRAI + SPY</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Annualized return" value={formatAnnualized(fund.annualizedReturnPct)} />
          <MetricTile label="Total return" value={formatPercent(fund.totalReturnPct)} />
          <MetricTile label="Latest checkpoint" value={formatDate(fund.latestCheckpoint)} />
          <MetricTile label="Watch ticker" value={model.watchlistTickers.join(', ') || '\u2014'} />
        </div>
      </article>

    </section>
  );
}
