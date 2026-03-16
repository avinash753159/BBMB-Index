import AviDetail from './AviDetail';
import PabraiDetail from './PabraiDetail';
import FundDetail from './FundDetail';
import TickerDetail from './TickerDetail';
import SuperinvestorDetail from './SuperinvestorDetail';
import PendingDetail from './PendingDetail';

export default function DetailRouter({ view, model, onSetSeries, capMax }) {
  if (!view) return null;

  const inner = (() => {
    switch (view.kind) {
      case 'portfolio':
        return <AviDetail view={view} />;
      case 'composite':
        return <PabraiDetail view={view} model={model} onSetSeries={onSetSeries} />;
      case 'fund':
        return <FundDetail view={view} model={model} onSetSeries={onSetSeries} />;
      case 'ticker':
        return <TickerDetail view={view} onSetSeries={onSetSeries} />;
      case 'superinvestor':
        return <SuperinvestorDetail view={view} onSetSeries={onSetSeries} capMax={capMax} />;
      default:
        return <PendingDetail view={view} />;
    }
  })();

  return (
    <div key={view.id} className="animate-fade-in">
      {inner}
    </div>
  );
}
