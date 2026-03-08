import Eyebrow from '../ui/Eyebrow';
import ActionButton from '../ui/ActionButton';
import MetricTile from '../metrics/MetricTile';
import { formatPercent, formatAnnualized } from '../../lib/formatters';

export default function TickerDetail({ view, onSetSeries }) {
  const payload = view.payload;
  const stats = payload?.stats ?? {};

  return (
    <section className="grid gap-6">
      <article className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-prose space-y-2">
            <Eyebrow>{view.label} stock</Eyebrow>
            <h2 className="text-xl font-semibold tracking-tight">
              {payload?.ticker ?? view.label} price return over the five-year window.
            </h2>
            <p className="text-sm leading-relaxed text-muted">{view.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onSetSeries([view.id, 'SPY'])}>{view.label} + SPY</ActionButton>
            <ActionButton onClick={() => onSetSeries([view.id, 'AVI', 'SPY'])}>{view.label} + AVI + SPY</ActionButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Annualized return" value={formatAnnualized(stats.annualizedPortfolioReturnPct)} />
          <MetricTile label="Total return" value={formatPercent(stats.portfolioReturnPct)} />
          <MetricTile label="vs SPY annualized" value={formatAnnualized(stats.annualizedReturnSpreadPct)} />
          <MetricTile label="vs SPY total" value={formatPercent(stats.returnSpreadPct)} />
        </div>
      </article>
    </section>
  );
}
