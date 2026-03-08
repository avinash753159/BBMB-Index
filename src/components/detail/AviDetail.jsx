import DataTable from './DataTable';
import TickerLogo from '../ui/TickerLogo';
import { formatPercent, formatDate } from '../../lib/formatters';

export default function AviDetail({ view }) {
  const payload = view.payload;

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable
          title="Tracked open positions"
          kicker="Open book"
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
                <div>{formatPercent(row.currentWeightPct, false)}</div>
              ),
            },
            {
              label: 'Return',
              render: (row) => (
                <div className="font-mono font-medium">
                  {formatPercent(row.totalReturnPct)}
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
              render: (row) => (
                <div className="flex items-center gap-2">
                  <TickerLogo ticker={row.ticker} />
                  <span className="font-mono font-medium">{row.ticker}</span>
                </div>
              ),
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
                <div className="font-mono font-medium">
                  {formatPercent(row.returnPct)}
                </div>
              ),
            },
          ]}
          rows={payload.realizedPositions ?? []}
          emptyMessage="No realized positions recorded yet."
        />
      </div>

    </section>
  );
}
