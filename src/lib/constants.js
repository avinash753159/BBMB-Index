export const SERIES_COLORS = {
  AVI: 'var(--color-series-avi)',
  PABRAI: 'var(--color-series-pabrai)',
  PIF2: 'var(--color-series-pif2)',
  PIF3: 'var(--color-series-pif3)',
  PIF4: 'var(--color-series-pif4)',
  SPY: 'var(--color-series-spy)',
  JOEY: 'var(--color-series-joey)',
  PRAB: 'var(--color-series-prab)',
  WAGN: 'var(--color-series-wagn)',
  LI_LU: 'var(--color-series-li-lu)',
  BUFFETT: 'var(--color-series-buffett)',
  NORBERT: 'var(--color-series-norbert)',
};

export const SERIES_RAW_COLORS = {
  AVI: '#2d6a4f',
  PABRAI: '#c1292e',
  PIF2: '#8b7355',
  PIF3: '#6b7c5f',
  PIF4: '#7a6b5d',
  SPY: '#d4842a',
  JOEY: '#7c5cbf',
  PRAB: '#b5543a',
  WAGN: '#3a7db5',
  LI_LU: '#1a5276',
  BUFFETT: '#7d3c98',
  NORBERT: '#2e7d32',
  NEIL_MEHTA: '#8e6c3e',
  PELOSI: '#2e5090',
};

export const SERIES_KIND_LABELS = {
  AVI: 'Portfolio',
  PABRAI: 'Composite',
  PIF2: 'Fund',
  PIF3: 'Fund',
  PIF4: 'Fund',
  SPY: 'Benchmark',
  JOEY: 'Pending',
  PRAB: 'Pending',
  WAGN: 'Ticker',
  LI_LU: 'Superinvestor',
  BUFFETT: 'Superinvestor',
  NORBERT: 'Superinvestor',
  NEIL_MEHTA: 'Superinvestor',
  PELOSI: 'Superinvestor',
};

function hashColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 40 + (Math.abs(hash >> 8) % 30);
  const lum = 30 + (Math.abs(hash >> 16) % 25);
  return `hsl(${hue}, ${sat}%, ${lum}%)`;
}

export function getSeriesAppearance(id) {
  const color = SERIES_COLORS[id];
  const rawColor = SERIES_RAW_COLORS[id];
  if (color && rawColor) {
    return { color, rawColor, kindLabel: SERIES_KIND_LABELS[id] ?? 'Series' };
  }
  const generated = hashColor(id);
  return { color: generated, rawColor: generated, kindLabel: 'Superinvestor' };
}
