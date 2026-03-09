function yearsBetween(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return (end - start) / (365.2425 * 24 * 60 * 60 * 1000);
}

export function annualizeReturn(totalReturnPct, startDate, endDate) {
  if (totalReturnPct === null || totalReturnPct === undefined || Number.isNaN(totalReturnPct)) return null;
  const years = yearsBetween(startDate, endDate);
  if (years === null || years <= 0) return null;
  const gross = 1 + totalReturnPct;
  if (gross <= 0) return null;
  return (gross ** (1 / years)) - 1;
}

export function latestNonNull(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null && values[index] !== undefined) return values[index];
  }
  return null;
}

export function interpolateSeriesValue(rows, date) {
  if (!rows?.length) return null;
  if (date <= rows[0].date) return rows[0].nav;

  for (let index = 0; index < rows.length - 1; index += 1) {
    const current = rows[index];
    const next = rows[index + 1];
    if (date === current.date) return current.nav;
    if (date < next.date) {
      const start = Date.parse(`${current.date}T00:00:00Z`);
      const end = Date.parse(`${next.date}T00:00:00Z`);
      const point = Date.parse(`${date}T00:00:00Z`);
      const ratio = end === start ? 0 : (point - start) / (end - start);
      return current.nav + ((next.nav - current.nav) * ratio);
    }
  }

  return rows[rows.length - 1].nav;
}
