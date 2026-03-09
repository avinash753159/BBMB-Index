import { useMemo } from 'react';
import { formatDate } from '../lib/formatters';
import { annualizeReturn, latestNonNull, interpolateSeriesValue } from '../lib/series';

// Expand short holding keys: t->ticker, w->weight, r->returnPct, m->marketCap
function expandHolding(h) {
  const row = { ticker: h.t ?? h.ticker, weight: h.w ?? h.weight };
  const ret = h.r ?? h.returnPct;
  const cap = h.m ?? h.marketCap;
  if (ret != null) row.returnPct = ret;
  if (cap != null) row.marketCap = cap;
  return row;
}

function unpackSeries(chart) {
  const raw = chart?.portfolioReturnPctSeries ?? [];
  const startIdx = chart?.chartStartIdx ?? 0;
  // Undo delta encoding, then decode scaled integers (×10000) back to floats
  const values = [raw[0]];
  for (let i = 1; i < raw.length; i++) values.push(values[i - 1] + raw[i]);
  const series = values.map(v => v === null ? null : v / 1e4);
  if (startIdx > 0) return [...new Array(startIdx).fill(null), ...series];
  return series;
}

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
        category: 'superinvestors',
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
  const dates = rawData.dates ?? pabrai?.chart?.dates ?? avi?.chart?.dates ?? rawData.group?.chart?.dates ?? [];
  const windowStart = rawData.metadata.windowStart;
  const windowEnd = rawData.metadata.windowEnd;

  const pifSeries = buildPifSeries(pabraiNav, dates, windowStart, windowEnd);
  // Use the standalone SPY member if available, otherwise fall back to Pabrai's benchmark
  const spyMember = rawData.members.find((m) => m.id === 'SPY' && m.strategyType === 'benchmark');
  const spyReturnPctSeries = unpackSeries(spyMember?.chart) || (pabrai?.chart?.benchmarkReturnPctSeries ?? []);
  const spyTotalReturnPct = spyMember?.stats?.portfolioReturnPct ?? latestNonNull(spyReturnPctSeries);
  const spyAnnualizedReturnPct = spyMember?.stats?.annualizedPortfolioReturnPct ?? annualizeReturn(spyTotalReturnPct, windowStart, windowEnd);

  const tickerMembers = rawData.members
    .filter((m) => m.strategyType === 'single_ticker')
    .map((m) => ({
      id: m.id,
      label: m.label,
      shortLabel: m.label,
      kind: 'ticker',
      category: 'superinvestors',
      returnPctSeries: unpackSeries(m.chart),
      totalReturnPct: m.stats?.portfolioReturnPct ?? null,
      annualizedReturnPct: m.stats?.annualizedPortfolioReturnPct ?? null,
      description: m.description ?? `${m.ticker} stock.`,
      note: `${m.ticker} price return over the five-year window.`,
    }));

  const superinvestorMembers = rawData.members
    .filter((m) => m.strategyType === 'superinvestor')
    .map((m) => ({
      id: m.id,
      label: m.label,
      shortLabel: m.shortLabel ?? m.label,
      kind: 'superinvestor',
      category: 'superinvestors',
      managerId: m.managerId ?? null,
      holdings: (m.holdings ?? []).map(expandHolding),
      returnPctSeries: unpackSeries(m.chart),
      totalReturnPct: m.stats?.portfolioReturnPct ?? null,
      annualizedReturnPct: m.stats?.annualizedPortfolioReturnPct ?? null,
      description: m.description ?? `${m.label} backtested portfolio.`,
      note: `Static-weight backtest from 13F filings. ${m.stats?.holdingCount ?? 0} holdings.`,
    }));

  const allMarketCaps = superinvestorMembers
    .flatMap(sm => (sm.holdings || []).map(h => h.marketCap).filter(Boolean));
  const marketCapRange = allMarketCaps.length
    ? { min: Math.min(...allMarketCaps), max: Math.max(...allMarketCaps) }
    : { min: 0, max: 5e12 };

  const comparisonSeries = [
    avi && {
      id: 'AVI',
      label: 'AVI',
      shortLabel: 'AVI',
      kind: 'portfolio',
      category: 'bros',
      returnPctSeries: unpackSeries(avi.chart),
      totalReturnPct: avi.stats?.portfolioReturnPct ?? null,
      annualizedReturnPct: avi.stats?.annualizedPortfolioReturnPct ?? null,
      trackedOpenPositions: avi.trackedOpenPositions ?? [],
      description: 'Modeled AVI book from open positions plus sized realized exits.',
      note: `${avi.stats?.trackedNames ?? 0} open names, ${avi.stats?.modeledRealizedNames ?? 0} sized exits.`,
    },
    pabrai && {
      id: 'PABRAI',
      label: 'Pabrai (ave)',
      shortLabel: 'Pabrai (ave)',
      kind: 'composite',
      category: 'superinvestors',
      returnPctSeries: unpackSeries(pabrai.chart),
      totalReturnPct: pabrai.stats?.portfolioReturnPct ?? null,
      annualizedReturnPct: pabrai.stats?.annualizedPortfolioReturnPct ?? null,
      latestCheckpoint: pabrai.stats?.latestCheckpoint ?? null,
      description: 'Equal-weight composite of PIF2, PIF3, and PIF4.',
      note: pabrai.stats?.latestCheckpoint ? `Flat after ${formatDate(pabrai.stats.latestCheckpoint)} until newer PDFs land.` : 'Composite built from extracted NAV checkpoints.',
    },
    ...pifSeries,
    ...tickerMembers,
    ...superinvestorMembers,
    {
      id: 'SPY',
      label: 'SPY',
      shortLabel: 'SPY',
      kind: 'benchmark',
      category: 'compare',
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
      label: 'Pabrai (ave)',
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
    ...tickerMembers.map((tm) => ({
      id: tm.id,
      label: tm.label,
      kind: 'ticker',
      compareDefaults: [tm.id, 'SPY'],
      summary: tm.description,
      payload: rawData.members.find((m) => m.id === tm.id),
    })),
    ...superinvestorMembers.map((sm) => ({
      id: sm.id,
      label: sm.label,
      kind: 'superinvestor',
      compareDefaults: [sm.id, 'SPY'],
      summary: sm.description,
      payload: rawData.members.find((m) => m.id === sm.id),
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

  return {
    metadata: rawData.metadata,
    avi,
    pabrai,
    pendingMembers,
    dates,
    windowStart,
    windowEnd,
    comparisonSeries,
    seriesById,
    views,
    marketCapRange,
    watchlistTickers: pabraiNav?.watchlistTickers ?? [],
  };
}

export function useModel(data) {
  return useMemo(() => {
    if (!data) return null;
    return buildModel(data.dashboardData, data.pabraiNav);
  }, [data]);
}
