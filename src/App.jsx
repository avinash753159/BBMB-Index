import { useState } from 'react';
import { useDataLoader } from './hooks/useDataLoader';
import { useModel } from './hooks/useModel';

export default function App() {
  const { data, error, loading } = useDataLoader();
  const model = useModel(data);
  const [activeView, setActiveView] = useState('AVI');
  const [selectedSeriesIds, setSelectedSeriesIds] = useState(['AVI', 'PABRAI', 'SPY']);
  const [activePresetId, setActivePresetId] = useState('avi-pabrai-spy');

  if (loading) {
    return (
      <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7">
        <div className="rounded-[1.75rem] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
          <p className="text-muted">Loading comparison lab...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7">
        <div className="rounded-[1.75rem] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Load failure</span>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">The comparison lab could not load.</h3>
          <p className="mt-2 text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!model) return null;

  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7 pb-14">
      <h1 className="text-4xl font-semibold tracking-tighter">Boba Bonh Mi Bros</h1>
      <p className="mt-4 text-muted">
        Model loaded: {model.comparisonSeries.length} series, {model.dates.length} dates
      </p>
      <p className="mt-2 text-muted">
        Window: {model.windowStart} to {model.windowEnd}
      </p>
    </div>
  );
}
