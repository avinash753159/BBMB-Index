import { useMemo } from 'react';
import { formatDate } from '../lib/formatters';
import { yearsBetween, annualizeReturn, latestNonNull, interpolateSeriesValue } from '../lib/series';

function buildPifSeries(pabraiNav, dates, windowStart, windowEnd) {
  if (!pabraiNav?.funds || !dates?.length) return [];

  return ['PIF2', 'PIF3', 'PIF4']
    .filter((name) => Array.isArray(pabraiNav.funds[name]) && pabraiNav.funds[name].length)
    .map((name) => {
      const rows = [...pabraiNav.funds[name]].sort((left, right) => left.date.localeCompare(right.date));
      const startNav = interpolateSeriesValue(rows, windowStart);
      const latestCheckpoint = rows[rows.length - 1].date;
      const returnPctSeries = dates.map((date) => {
        const nav = interpolateSeriesValue(rows, date);
        return nav !== null && startNav ? (nav / startNav) - 1 : null;
      });
      const totalReturnPct = latestNonNull(returnPctSeries);
      const annualizedReturnPct = annualizeReturn(totalReturnPct, windowStart, windowEnd);

      return {
        id: name,
        label: name,
        shortLabel: name,
        kind: 'fund',
        returnPctSeries,
        totalReturnPct,
        annualizedReturnPct,
        latestCheckpoint,
        description: `Single Pabrai fund line from extracted PDF NAV checkpoints through ${formatDate(latestCheckpoint)}.`,
        note: latestCheckpoint < windowEnd ? 'Flat after the latest PDF checkpoint.' : 'Covers the full five-year window.',
      };
    });
}

function buildModel(rawData, pabraiNav) {
  const avi = rawData.members.find((member) => member.id === 'AVI') ?? null;
  const pabrai = rawData.members.find((member) => member.id === 'PABRAI') ?? null;
  const pendingMembers = rawData.members.filter((member) => member.status === 'pending');
  const dates = pabrai?.chart?.dates ?? avi?.chart?.dates ?? rawData.group?.chart?.dates ?? [];
  const windowStart = rawData.metadata.windowStart;
  const windowEnd = rawData.metadata.windowEnd;

  const pifSeries = buildPifSeries(pabraiNav, dates, windowStart, windowEnd);
  const spyReturnPctSeries = pabrai?.chart?.benchmarkReturnPctSeries ?? [];
  const spyTotalReturnPct = latestNonNull(spyReturnPctSeries);
  const spyAnnualizedReturnPct = annualizeReturn(spyTotalReturnPct, windowStart, windowEnd);

  const comparisonSeries = [
    avi && {
      id: 'AVI',
      label: 'AVI',
      shortLabel: 'AVI',
      kind: 'portfolio',
      returnPctSeries: avi.chart?.portfolioReturnPctSeries ?? [],
      totalReturnPct: avi.stats?.portfolioReturnPct ?? null,
      annualizedReturnPct: avi.stats?.annualizedPortfolioReturnPct ?? null,
      description: 'Modeled AVI book from open positions plus sized realized exits.',
      note: `${avi.stats?.trackedNames ?? 0} open names, ${avi.stats?.modeledRealizedNames ?? 0} sized exits.`,
    },
    pabrai && {
      id: 'PABRAI',
      label: 'PABRAI composite',
      shortLabel: 'PABRAI',
      kind: 'composite',
      returnPctSeries: pabrai.chart?.portfolioReturnPctSeries ?? [],
      totalReturnPct: pabrai.stats?.portfolioReturnPct ?? null,
      annualizedReturnPct: pabrai.stats?.annualizedPortfolioReturnPct ?? null,
      latestCheckpoint: pabrai.stats?.latestCheckpoint ?? null,
      description: 'Equal-weight composite of PIF2, PIF3, and PIF4.',
      note: pabrai.stats?.latestCheckpoint ? `Flat after ${formatDate(pabrai.stats.latestCheckpoint)} until newer PDFs land.` : 'Composite built from extracted NAV checkpoints.',
    },
    ...pifSeries,
    {
      id: 'SPY',
      label: 'SPY',
      shortLabel: 'SPY',
      kind: 'benchmark',
      returnPctSeries: spyReturnPctSeries,
      totalReturnPct: spyTotalReturnPct,
      annualizedReturnPct: spyAnnualizedReturnPct,
      description: rawData.metadata.benchmarkName,
      note: 'Raw S&P 500 line across the fixed five-year window.',
    },
  ].filter(Boolean);

  const seriesById = Object.fromEntries(comparisonSeries.map((series) => [series.id, series]));

  const views = [
    avi && {
      id: 'AVI',
      label: 'AVI',
      kind: 'portfolio',
      compareDefaults: ['AVI', 'SPY'],
      summary: 'Tracked book built from current holdings, remembered entries, and sized realized exits.',
      payload: avi,
    },
    pabrai && {
      id: 'PABRAI',
      label: 'PABRAI',
      kind: 'composite',
      compareDefaults: ['PABRAI', 'SPY'],
      summary: 'Composite line built from the extracted PIF2, PIF3, and PIF4 NAV checkpoints.',
      payload: pabrai,
    },
    ...pifSeries.map((series) => ({
      id: series.id,
      label: series.id,
      kind: 'fund',
      compareDefaults: [series.id, 'AVI', 'SPY'],
      summary: `Single-fund view for ${series.id}.`,
      payload: series,
    })),
    ...pendingMembers.map((member) => ({
      id: member.id,
      label: member.label,
      kind: 'pending',
      compareDefaults: ['SPY'],
      summary: member.message,
      payload: member,
    })),
  ].filter(Boolean);

  const presets = [
    { id: 'avi-spy', label: 'AVI + SPY', seriesIds: ['AVI', 'SPY'] },
    { id: 'pabrai-spy', label: 'PABRAI + SPY', seriesIds: ['PABRAI', 'SPY'] },
    { id: 'avi-pabrai-spy', label: 'AVI + PABRAI + SPY', seriesIds: ['AVI', 'PABRAI', 'SPY'] },
    { id: 'avi-pif3-spy', label: 'AVI + PIF3 + SPY', seriesIds: ['AVI', 'PIF3', 'SPY'] },
    { id: 'pif-deck', label: 'PIF2 + PIF3 + PIF4 + SPY', seriesIds: ['PIF2', 'PIF3', 'PIF4', 'SPY'] },
  ];

  return {
    metadata: rawData.metadata,
    avi,
    pabrai,
    pabraiNav,
    pendingMembers,
    dates,
    windowStart,
    windowEnd,
    comparisonSeries,
    seriesById,
    views,
    presets,
    watchlistTickers: pabraiNav?.watchlistTickers ?? [],
    sourcePdfs: pabraiNav?.sourcePdfs ?? [],
  };
}

export function useModel(data) {
  return useMemo(() => {
    if (!data) return null;
    return buildModel(data.dashboardData, data.pabraiNav);
  }, [data]);
}
