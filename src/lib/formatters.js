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

export function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
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
