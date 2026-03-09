const percentSigned = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'always',
});

const percentPlain = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatPercent(value, signed = true) {
  if (value === null || value === undefined || Number.isNaN(value)) return '\u2014';
  return signed ? percentSigned.format(value) : percentPlain.format(value);
}

export function formatAnnualized(value, signed = true) {
  const formatted = formatPercent(value, signed);
  return formatted === '\u2014' ? formatted : `${formatted}/yr`;
}

export function formatMarketCap(value) {
  if (value == null) return '\u2014';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

export function formatDate(value) {
  if (!value) return '\u2014';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}
