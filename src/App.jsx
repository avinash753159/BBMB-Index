import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useDataLoader } from './hooks/useDataLoader';
import { useModel } from './hooks/useModel';
import { annualizeReturn, latestNonNull } from './lib/series';
import PageShell from './components/layout/PageShell';
import Hero from './components/layout/Hero';
import FocusTabs from './components/focus/FocusTabs';
const TimeRangeSlider = lazy(() => import('./components/ui/TimeRangeSlider'));
const MarketCapSlider = lazy(() => import('./components/ui/MarketCapSlider'));
const AnnualizedStrip = lazy(() => import('./components/metrics/AnnualizedStrip'));
const PerformanceChart = lazy(() => import('./components/chart/PerformanceChart'));
const YearlyBarChart = lazy(() => import('./components/chart/YearlyBarChart'));
const DetailRouter = lazy(() => import('./components/detail/DetailRouter'));
const FilteredHoldingsTable = lazy(() => import('./components/detail/FilteredHoldingsTable'));
const TopHoldingsCards = lazy(() => import('./components/detail/TopHoldingsCards'));

const MAX_DISPLAY = 5;

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
  const [selectedSeriesIds, setSelectedSeriesIds] = useState(['SPY']);
  const [initialized, setInitialized] = useState(false);
  const [rangeStartIdx, setRangeStartIdx] = useState(0);
  const [capMax, setCapMax] = useState(5e12);

  // Initialize state once model loads
  useEffect(() => {
    if (model && !initialized) {
      const firstView = model.views.some((v) => v.id === 'AVI') ? 'AVI' : model.views[0]?.id ?? 'AVI';
      setActiveView(firstView);
      setSelectedSeriesIds(sanitizeSelection(['SPY', 'LI_LU', 'BUFFETT'], model));
      // Default to ~5 years back from end
      const fiveYearsBack = model.dates.length > 0
        ? model.dates.findIndex((d) => d >= '2021-03-05')
        : 0;
      setRangeStartIdx(fiveYearsBack >= 0 ? fiveYearsBack : 0);
      setInitialized(true);
    }
  }, [model, initialized]);

  const windowedDates = useMemo(() => {
    if (!model) return [];
    return model.dates.slice(rangeStartIdx);
  }, [model, rangeStartIdx]);

  const { filteredSeriesIds, holdingsMatchCounts } = useMemo(() => {
    if (!model) return { filteredSeriesIds: new Set(), holdingsMatchCounts: {} };
    const matchCounts = {};
    const passIds = new Set();

    for (const s of model.comparisonSeries) {
      if (s.kind !== 'superinvestor') {
        passIds.add(s.id);
        continue;
      }
      const holdings = s.holdings ?? [];
      // Show investor if they have ANY holding with market cap <= threshold
      const matching = holdings.filter(h => {
        if (!h.marketCap) return false;
        return h.marketCap <= capMax;
      });
      matchCounts[s.id] = { matched: matching.length, total: holdings.length };
      if (matching.length > 0 || capMax >= 5e12) passIds.add(s.id);
    }

    return { filteredSeriesIds: passIds, holdingsMatchCounts: matchCounts };
  }, [model, capMax]);

  const allToggleSeries = useMemo(() => {
    if (!model) return [];
    const startIdx = rangeStartIdx;
    const trimmedDates = model.dates.slice(startIdx);
    const wEnd = trimmedDates[trimmedDates.length - 1];

    const chartSeries = model.comparisonSeries.map((s) => {
      const trimmed = s.returnPctSeries.slice(startIdx);
      const baseIdx = trimmed.findIndex((v) => v != null);
      let windowedAnnualized = s.annualizedReturnPct;
      if (baseIdx !== -1) {
        const baseVal = 1 + trimmed[baseIdx];
        const renormalized = trimmed.map((v) => v == null ? null : ((1 + v) / baseVal) - 1);
        const totalReturn = latestNonNull(renormalized);
        const firstDataDate = trimmedDates[baseIdx];
        windowedAnnualized = annualizeReturn(totalReturn, firstDataDate, wEnd);
      }
      return {
        id: s.id,
        label: s.shortLabel ?? s.label,
        kind: s.kind,
        category: s.category,
        dimmed: !filteredSeriesIds.has(s.id),
        matchCount: holdingsMatchCounts[s.id] ?? null,
        annualizedReturnPct: windowedAnnualized,
      };
    });
    const pendingIds = new Set(chartSeries.map((s) => s.id));
    const pendingViews = model.views
      .filter((v) => v.kind === 'pending' && !pendingIds.has(v.id))
      .map((v) => ({ id: v.id, label: v.label, kind: 'pending', category: 'bros', dimmed: false, matchCount: null, annualizedReturnPct: null }));
    const all = [...chartSeries, ...pendingViews];
    all.sort((a, b) => {
      const aRet = a.annualizedReturnPct ?? -Infinity;
      const bRet = b.annualizedReturnPct ?? -Infinity;
      return bRet - aRet;
    });
    return all;
  }, [model, filteredSeriesIds, holdingsMatchCounts, rangeStartIdx]);

  // Build effective ids: user selections first, then auto-fill remaining slots with top superinvestors
  const effectiveIds = useMemo(() => {
    // Always include SPY + whatever the user explicitly selected
    const picked = new Set(['SPY', ...selectedSeriesIds]);
    // Fill remaining slots with top superinvestors
    const remaining = MAX_DISPLAY - picked.size;
    if (remaining > 0) {
      const topSuper = allToggleSeries
        .filter((s) => s.category === 'superinvestors' && !s.dimmed && !picked.has(s.id))
        .slice(0, remaining)
        .map((s) => s.id);
      topSuper.forEach((id) => picked.add(id));
    }
    return [...picked];
  }, [allToggleSeries, selectedSeriesIds]);

  // Re-derive display series from effective ids
  const displaySeries = useMemo(() => {
    if (!model) return [];
    const startIdx = rangeStartIdx;
    const trimmedDates = model.dates.slice(startIdx);
    const wEnd = trimmedDates[trimmedDates.length - 1];

    const series = effectiveIds
      .map((id) => model.seriesById[id])
      .filter(Boolean)
      .map((s) => {
        const trimmed = s.returnPctSeries.slice(startIdx);
        const baseIdx = trimmed.findIndex((v) => v != null);
        if (baseIdx === -1) return { ...s, returnPctSeries: trimmed, totalReturnPct: null, annualizedReturnPct: null };
        const baseVal = 1 + trimmed[baseIdx];
        const renormalized = trimmed.map((v) => v == null ? null : ((1 + v) / baseVal) - 1);
        const totalReturnPct = latestNonNull(renormalized);
        const firstDataDate = trimmedDates[baseIdx];
        const annualized = annualizeReturn(totalReturnPct, firstDataDate, wEnd);
        return { ...s, returnPctSeries: renormalized, totalReturnPct, annualizedReturnPct: annualized };
      });

    series.sort((a, b) => {
      if (a.kind === 'benchmark') return -1;
      if (b.kind === 'benchmark') return 1;
      return (b.annualizedReturnPct ?? -Infinity) - (a.annualizedReturnPct ?? -Infinity);
    });
    return series.slice(0, MAX_DISPLAY);
  }, [model, effectiveIds, rangeStartIdx]);

  const activeViewObj = useMemo(() => {
    if (!model) return null;
    return model.views.find((v) => v.id === activeView) ?? model.views[0] ?? null;
  }, [model, activeView]);

  // Aggregate holdings from all selected superinvestors under cap ceiling
  const capFilteredHoldings = useMemo(() => {
    if (!model || capMax >= 5e12) return [];
    const rows = [];
    for (const id of selectedSeriesIds) {
      const s = model.seriesById[id];
      if (!s || s.kind !== 'superinvestor') continue;
      for (const h of s.holdings ?? []) {
        if (h.marketCap && h.marketCap <= capMax) {
          rows.push({ ...h, investor: s.shortLabel ?? s.label, investorId: s.id });
        }
      }
    }
    // Sort by market cap ascending (smallest first)
    rows.sort((a, b) => (a.marketCap ?? Infinity) - (b.marketCap ?? Infinity));
    return rows;
  }, [model, selectedSeriesIds, capMax]);

  const handleToggle = useCallback(
    (id) => {
      setSelectedSeriesIds((prev) => {
        const next = prev.includes(id)
          ? prev.length === 1 ? prev : prev.filter((sid) => sid !== id)
          : sanitizeSelection([...prev, id], model);
        return next;
      });
    },
    [model]
  );

  const handleSetSeries = useCallback(
    (seriesIds) => {
      setSelectedSeriesIds(sanitizeSelection(seriesIds, model));
    },
    [model]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="rounded-[var(--radius-xl)] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
          <p className="text-muted">Loading boba and banh mi...</p>
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
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Hero />
      <FocusTabs
        views={model.views}
        allSeries={allToggleSeries}
        selectedSeriesIds={selectedSeriesIds}
        onToggle={handleToggle}
        onSetSeries={handleSetSeries}
        activeView={activeView}
        onViewChange={setActiveView}
        maxDisplay={MAX_DISPLAY}
      />
      <main id="dashboard-main" className="space-y-6">
        <Suspense fallback={null}>
          <TimeRangeSlider
            dates={model.dates}
            startIdx={rangeStartIdx}
            onChange={setRangeStartIdx}
          />
          <MarketCapSlider capMax={capMax} onChange={setCapMax} />
          <AnnualizedStrip selectedSeries={displaySeries} />
          <PerformanceChart
            selectedSeries={displaySeries}
            dates={windowedDates}
            windowStart={windowedDates[0] ?? model.windowStart}
            windowEnd={model.windowEnd}
          />
          <TopHoldingsCards displaySeries={displaySeries} seriesById={model.seriesById} />
          <YearlyBarChart
            selectedSeries={displaySeries}
            dates={windowedDates}
            onActivateView={(id) => {
              setActiveView(id);
              if (!selectedSeriesIds.includes(id)) {
                handleToggle(id);
              }
            }}
          />
          {capFilteredHoldings.length > 0 && (
            <FilteredHoldingsTable holdings={capFilteredHoldings} capMax={capMax} />
          )}
          {activeViewObj && selectedSeriesIds.includes(activeViewObj.id) && (
            <DetailRouter view={activeViewObj} model={model} onSetSeries={handleSetSeries} capMax={capMax} />
          )}
        </Suspense>
      </main>
    </PageShell>
  );
}
