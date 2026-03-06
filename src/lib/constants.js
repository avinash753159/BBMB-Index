export const SERIES_COLORS = {
  AVI: 'var(--color-series-avi)',
  PABRAI: 'var(--color-series-pabrai)',
  PIF2: 'var(--color-series-pif2)',
  PIF3: 'var(--color-series-pif3)',
  PIF4: 'var(--color-series-pif4)',
  SPY: 'var(--color-series-spy)',
};

export const SERIES_RAW_COLORS = {
  AVI: '#0f6d67',
  PABRAI: '#bc6a35',
  PIF2: '#507d3f',
  PIF3: '#9d5234',
  PIF4: '#5f7286',
  SPY: '#171717',
};

export const SERIES_KIND_LABELS = {
  AVI: 'Portfolio',
  PABRAI: 'Composite',
  PIF2: 'Fund',
  PIF3: 'Fund',
  PIF4: 'Fund',
  SPY: 'Benchmark',
};

export function getSeriesAppearance(id) {
  return {
    color: SERIES_COLORS[id] ?? SERIES_COLORS.SPY,
    rawColor: SERIES_RAW_COLORS[id] ?? SERIES_RAW_COLORS.SPY,
    kindLabel: SERIES_KIND_LABELS[id] ?? 'Series',
  };
}
