import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDataLoader } from './hooks/useDataLoader';
import { useModel } from './hooks/useModel';
import PageShell from './components/layout/PageShell';
import Hero from './components/layout/Hero';
import FocusTabs from './components/focus/FocusTabs';
import CompareLab from './components/compare/CompareLab';
import AnnualizedStrip from './components/metrics/AnnualizedStrip';
import PerformanceChart from './components/chart/PerformanceChart';
import DetailRouter from './components/detail/DetailRouter';

function sanitizeSelection(ids, model) {
  if (!model) return ['SPY'];
  const validIds = new Set(model.comparisonSeries.map((s) => s.id));
  const unique = [];
  ids.forEach((id) => {
    if (validIds.has(id) && !unique.includes(id)) unique.push(id);
  });
  return unique.length ? unique : ['SPY'];
}

export default function App() {
  const { data, error, loading } = useDataLoader();
  const model = useModel(data);

  const [activeView, setActiveView] = useState('AVI');
  const [selectedSeriesIds, setSelectedSeriesIds] = useState(['AVI', 'PABRAI', 'SPY']);
  const [activePresetId, setActivePresetId] = useState('avi-pabrai-spy');
  const [initialized, setInitialized] = useState(false);

  // Initialize state once model loads
  useEffect(() => {
    if (model && !initialized) {
      const firstView = model.views.some((v) => v.id === 'AVI') ? 'AVI' : model.views[0]?.id ?? 'AVI';
      setActiveView(firstView);
      setSelectedSeriesIds(sanitizeSelection(['AVI', 'PABRAI', 'SPY'], model));
      setInitialized(true);
    }
  }, [model, initialized]);

  const selectedSeries = useMemo(() => {
    if (!model) return [];
    return selectedSeriesIds.map((id) => model.seriesById[id]).filter(Boolean);
  }, [model, selectedSeriesIds]);

  const activeViewObj = useMemo(() => {
    if (!model) return null;
    return model.views.find((v) => v.id === activeView) ?? model.views[0] ?? null;
  }, [model, activeView]);

  const handleToggle = useCallback(
    (id) => {
      setSelectedSeriesIds((prev) => {
        const next = prev.includes(id)
          ? prev.length === 1 ? prev : prev.filter((sid) => sid !== id)
          : sanitizeSelection([...prev, id], model);
        return next;
      });
      setActivePresetId(null);
    },
    [model]
  );

  const handlePresetSelect = useCallback(
    (seriesIds, presetId) => {
      setSelectedSeriesIds(sanitizeSelection(seriesIds, model));
      setActivePresetId(presetId);
    },
    [model]
  );

  const handleSetSeries = useCallback(
    (seriesIds) => {
      setSelectedSeriesIds(sanitizeSelection(seriesIds, model));
      setActivePresetId(null);
    },
    [model]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
          <p className="text-muted">Loading comparison lab...</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Load failure</span>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">The comparison lab could not load.</h3>
          <p className="mt-2 text-muted">{error.message}</p>
        </div>
      </PageShell>
    );
  }

  if (!model) return null;

  return (
    <PageShell>
      <Hero metadata={model.metadata} selectedCount={selectedSeriesIds.length} />
      <FocusTabs views={model.views} activeView={activeView} onViewChange={setActiveView} />
      <CompareLab
        seriesById={model.seriesById}
        selectedSeriesIds={selectedSeriesIds}
        selectedSeries={selectedSeries}
        presets={model.presets}
        activePresetId={activePresetId}
        onToggle={handleToggle}
        onPresetSelect={handlePresetSelect}
      />
      <AnnualizedStrip selectedSeries={selectedSeries} />
      <PerformanceChart
        selectedSeries={selectedSeries}
        dates={model.dates}
        windowStart={model.windowStart}
        windowEnd={model.windowEnd}
      />
      <DetailRouter view={activeViewObj} model={model} onSetSeries={handleSetSeries} />
    </PageShell>
  );
}
