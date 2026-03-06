import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const appDir = path.join(root, 'app');
const distDir = path.join(root, 'dist');

const windowStart = '2021-03-05';
const windowEnd = '2026-03-05';
const benchmarkSymbol = 'SPY';

const roughMembers = {
  AVI: { label: 'AVI', status: 'ready', roughSymbols: ['BABA', 'BRK.B', 'CHGG', 'DIDIY', 'OXY', 'SOC', 'BIMAS.IS', 'MU', 'PLTR'] },
  JOEY: { label: 'JOEY', status: 'pending', roughSymbols: ['CHGG', 'OXY'] },
  PRAB: { label: 'PRAB', status: 'pending', roughSymbols: ['FOUR', 'OXY'] },
};

const symbolMap = {
  'BRK.B': 'BRK-B',
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function toNumber(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\$/g, '').replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateFromTimestamp(timestamp) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function toYahooSymbol(symbol) {
  return symbolMap[symbol] ?? symbol;
}

async function fetchYahooSeries(symbol) {
  const yahooSymbol = encodeURIComponent(toYahooSymbol(symbol));
  const period1 = Math.floor(Date.parse(`${windowStart}T00:00:00Z`) / 1000);
  const period2 = Math.floor(Date.parse('2026-03-06T00:00:00Z') / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d&includeAdjustedClose=true&events=history`;
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${symbol}: ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No price history returned for ${symbol}`);
  }

  const timestamps = result.timestamp ?? [];
  const adjCloses = result.indicators?.adjclose?.[0]?.adjclose ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const series = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const close = adjCloses[index] ?? closes[index] ?? null;
    if (close === null || Number.isNaN(close)) continue;
    series.push({ date: formatDateFromTimestamp(timestamps[index]), close: Number(close) });
  }

  return {
    symbol,
    yahooSymbol: toYahooSymbol(symbol),
    currency: result.meta?.currency ?? 'USD',
    exchangeName: result.meta?.fullExchangeName ?? result.meta?.exchangeName ?? '',
    series,
  };
}

function alignSeries(series, dates) {
  const aligned = [];
  let pointer = 0;
  let lastValue = null;

  for (const date of dates) {
    while (pointer < series.length && series[pointer].date <= date) {
      lastValue = series[pointer].close;
      pointer += 1;
    }
    aligned.push(lastValue);
  }

  return aligned;
}

function effectiveDate(rawDate, dates) {
  for (const date of dates) {
    if (date >= rawDate) return date;
  }
  return dates[dates.length - 1];
}

function formatPercent(value, digits = 1, signed = true) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const number = (value * 100).toFixed(digits);
  if (!signed) return `${number}%`;
  return `${value >= 0 ? '+' : ''}${number}%`;
}

function yearsBetween(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return (end - start) / (365.2425 * 24 * 60 * 60 * 1000);
}

function annualizeReturn(totalReturnPct, startDate, endDate) {
  if (totalReturnPct === null || totalReturnPct === undefined || Number.isNaN(totalReturnPct)) return null;
  const years = yearsBetween(startDate, endDate);
  if (years === null || years <= 0) return null;
  const gross = 1 + totalReturnPct;
  if (gross <= 0) return null;
  return (gross ** (1 / years)) - 1;
}

function getValueAtDate(seriesMap, symbol, date) {
  const aligned = seriesMap[symbol]?.aligned;
  const dates = seriesMap[symbol]?.dates;
  if (!aligned || !dates) return null;
  const index = dates.indexOf(date);
  if (index === -1) return null;
  return aligned[index];
}

function usdPriceAt(seriesMap, symbol, date) {
  const record = seriesMap[symbol];
  if (!record) return null;
  const localPrice = getValueAtDate(seriesMap, symbol, date);
  if (localPrice === null) return null;
  if (record.currency === 'USD') return localPrice;
  if (record.currency === 'TRY') {
    const tryUsd = getValueAtDate(seriesMap, 'TRYUSD=X', date);
    return tryUsd === null ? null : localPrice * tryUsd;
  }
  return null;
}

function latestNonNull(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null && values[index] !== undefined) return values[index];
  }
  return null;
}

function sum(values) {
  return values.reduce((total, value) => total + (value ?? 0), 0);
}

function uniqueBy(array, keyFn) {
  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function averageNonNull(values) {
  const present = values.filter((value) => value !== null && value !== undefined);
  return present.length ? sum(present) / present.length : null;
}

function interpolateSeriesValue(rows, date) {
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

function buildPabraiMember(pabraiNavData, baseDates, spyPriceByDate, modelEndDate) {
  if (!pabraiNavData?.funds) return null;

  const fundNames = ['PIF2', 'PIF3', 'PIF4'].filter((name) => Array.isArray(pabraiNavData.funds[name]) && pabraiNavData.funds[name].length);
  if (!fundNames.length || !spyPriceByDate[windowStart]) return null;

  const benchmarkStart = spyPriceByDate[windowStart];
  const benchmarkEnd = spyPriceByDate[modelEndDate];
  const fundModels = fundNames.map((name) => {
    const rows = [...pabraiNavData.funds[name]].sort((left, right) => left.date.localeCompare(right.date));
    const startNav = interpolateSeriesValue(rows, windowStart);
    const endNav = interpolateSeriesValue(rows, modelEndDate);
    const latestCheckpoint = rows[rows.length - 1].date;
    const modelReturnPct = startNav && endNav ? (endNav / startNav) - 1 : null;
    const matchedSpyReturnPct = benchmarkStart && benchmarkEnd ? (benchmarkEnd / benchmarkStart) - 1 : null;
    const annualizedModelReturnPct = annualizeReturn(modelReturnPct, windowStart, modelEndDate);
    const annualizedMatchedSpyReturnPct = annualizeReturn(matchedSpyReturnPct, windowStart, modelEndDate);
    const spreadPct = modelReturnPct !== null && matchedSpyReturnPct !== null ? modelReturnPct - matchedSpyReturnPct : null;
    const annualizedSpreadPct = annualizedModelReturnPct !== null && annualizedMatchedSpyReturnPct !== null ? annualizedModelReturnPct - annualizedMatchedSpyReturnPct : null;

    return {
      ticker: name,
      positionType: 'fund',
      confidence: 'medium',
      startDate: windowStart,
      endDate: modelEndDate,
      modelReturnPct,
      annualizedModelReturnPct,
      matchedSpyReturnPct,
      annualizedMatchedSpyReturnPct,
      spreadPct,
      annualizedSpreadPct,
      spreadContributionPct: spreadPct !== null ? spreadPct / fundNames.length : null,
      latestCheckpoint,
      latestNav: rows[rows.length - 1].nav,
      startNav,
      rows,
      notes: `PDF NAV checkpoints extracted through ${latestCheckpoint}.`,
    };
  });

  const portfolioReturnPctSeries = baseDates.map((date) => averageNonNull(fundModels.map((fund) => {
    const nav = interpolateSeriesValue(fund.rows, date);
    return nav !== null && fund.startNav ? (nav / fund.startNav) - 1 : null;
  })));
  const benchmarkReturnPctSeries = baseDates.map((date) => {
    const spyPrice = spyPriceByDate[date];
    return spyPrice !== null && spyPrice !== undefined && benchmarkStart ? (spyPrice / benchmarkStart) - 1 : null;
  });

  const portfolioReturnPct = latestNonNull(portfolioReturnPctSeries);
  const benchmarkReturnPct = latestNonNull(benchmarkReturnPctSeries);
  const annualizedPortfolioReturnPct = annualizeReturn(portfolioReturnPct, windowStart, modelEndDate);
  const annualizedBenchmarkReturnPct = annualizeReturn(benchmarkReturnPct, windowStart, modelEndDate);
  const returnSpreadPct = portfolioReturnPct !== null && benchmarkReturnPct !== null ? portfolioReturnPct - benchmarkReturnPct : null;
  const annualizedReturnSpreadPct = annualizedPortfolioReturnPct !== null && annualizedBenchmarkReturnPct !== null ? annualizedPortfolioReturnPct - annualizedBenchmarkReturnPct : null;
  const latestCheckpoint = fundModels.reduce((latest, fund) => fund.latestCheckpoint > latest ? fund.latestCheckpoint : latest, fundModels[0]?.latestCheckpoint ?? windowStart);

  const topPositive = fundModels
    .filter((fund) => fund.spreadContributionPct !== null && fund.spreadContributionPct > 0)
    .sort((left, right) => right.spreadContributionPct - left.spreadContributionPct);
  const topNegative = fundModels
    .filter((fund) => fund.spreadContributionPct !== null && fund.spreadContributionPct < 0)
    .sort((left, right) => left.spreadContributionPct - right.spreadContributionPct);

  return {
    id: 'PABRAI',
    label: 'PABRAI',
    status: 'ready',
    strategyType: 'fund_composite',
    benchmarkSymbol,
    windowStart,
    windowEnd,
    strategyNote: 'Equal-weight composite of PIF2, PIF3, and PIF4 from PDF NAV checkpoints. Between checkpoints, the line is linearly interpolated. After December 31, 2025, the line stays flat until newer PDFs are added.',
    chart: {
      dates: baseDates,
      portfolioReturnPctSeries,
      benchmarkReturnPctSeries,
      portfolioLabel: 'Pabrai composite (equal-weight PIF2/PIF3/PIF4)',
      benchmarkLabel: 'SPY over the same 5-year window',
    },
    stats: {
      portfolioReturnPct,
      annualizedPortfolioReturnPct,
      benchmarkReturnPct,
      annualizedBenchmarkReturnPct,
      returnSpreadPct,
      annualizedReturnSpreadPct,
      fundCount: fundNames.length,
      latestCheckpoint,
      watchTickerCount: pabraiNavData.watchlistTickers?.length ?? 0,
    },
    componentFunds: fundModels.map((fund) => ({
      fund: fund.ticker,
      startDate: windowStart,
      latestCheckpoint: fund.latestCheckpoint,
      latestNav: fund.latestNav,
      returnPct: fund.modelReturnPct,
      annualizedReturnPct: fund.annualizedModelReturnPct,
      notes: fund.latestCheckpoint < modelEndDate ? 'Flat after the latest PDF checkpoint.' : 'Covers the full window.',
    })),
    watchlistTickers: pabraiNavData.watchlistTickers ?? [],
    sourcePdfs: pabraiNavData.sourcePdfs ?? [],
    attribution: {
      topPositive,
      topNegative,
    },
    warnings: [
      `Pabrai PDF data currently runs through ${latestCheckpoint}.`,
      'The Pabrai line is an equal-weight composite of PIF2, PIF3, and PIF4, not a direct replication of current holdings.',
      'Between PDF checkpoints, returns are linearly interpolated because the PDFs provide periodic NAVs rather than daily marks.',
      `User-supplied NYSE ticker watch: ${(pabraiNavData.watchlistTickers ?? []).join(', ')}.`,
    ],
  };
}

function buildOpenPositionModel(row, holdingsBySymbol, priceSeries, baseDates) {
  const snapshot = holdingsBySymbol[row.ticker] ?? null;
  const quantityUsed = snapshot?.quantity ?? row.estimated_shares ?? null;
  const quantitySource = snapshot?.quantity ? 'current_holdings_snapshot' : 'estimated_from_notes';
  const modelStartDate = row.buy_date <= windowStart ? windowStart : effectiveDate(row.buy_date, baseDates);
  const currentPriceUsd = usdPriceAt(priceSeries, row.ticker, baseDates[baseDates.length - 1]);
  const currentValueUsd = currentPriceUsd !== null && quantityUsed !== null ? currentPriceUsd * quantityUsed : snapshot?.current_value_usd ?? null;
  const buyPriceUsd = row.buy_currency === 'USD'
    ? row.buy_price
    : (row.amount_invested_usd && quantityUsed ? row.amount_invested_usd / quantityUsed : null);
  const buyCostUsd = snapshot?.quantity && row.buy_price
    ? (row.buy_currency === 'USD' ? snapshot.quantity * row.buy_price : row.amount_invested_usd)
    : row.amount_invested_usd ?? (buyPriceUsd && quantityUsed ? buyPriceUsd * quantityUsed : null);
  const currentQuantityMismatch = snapshot?.quantity && row.estimated_shares
    ? Math.abs(snapshot.quantity - row.estimated_shares) / row.estimated_shares
    : null;
  const startValueUsd = quantityUsed ? usdPriceAt(priceSeries, row.ticker, windowStart) * quantityUsed : null;
  const totalReturnPct = buyPriceUsd && currentPriceUsd ? (currentPriceUsd / buyPriceUsd) - 1 : null;
  const annualizedReturnPct = annualizeReturn(totalReturnPct, row.buy_date, baseDates[baseDates.length - 1]);

  return {
    ticker: row.ticker,
    type: 'open',
    buyDate: row.buy_date,
    buyDateStatus: row.buy_date_status,
    buyPriceUsd,
    buyCurrency: row.buy_currency,
    confidence: row.confidence,
    notes: row.notes,
    quantityUsed,
    quantitySource,
    currentSnapshotQuantity: snapshot?.quantity ?? null,
    currentSnapshotValueUsd: snapshot?.current_value_usd ?? null,
    currentPriceUsd,
    currentValueUsd,
    currentQuantityMismatch,
    buyCostUsd,
    modelStartDate,
    startValueUsd,
    totalReturnPct,
    annualizedReturnPct,
    accountName: snapshot?.account_name ?? null,
    accountType: snapshot?.account_type ?? null,
  };
}

function buildRealizedPositionModel(row, priceSeries, baseDates) {
  const buyPriceUsd = row.buy_currency === 'USD' ? row.buy_price : null;
  const quantityUsed = row.estimated_shares ?? (row.amount_invested_usd && buyPriceUsd ? row.amount_invested_usd / buyPriceUsd : null);
  const buyCostUsd = row.amount_invested_usd ?? (quantityUsed && buyPriceUsd ? quantityUsed * buyPriceUsd : null);
  const sellProceedsUsd = quantityUsed && row.sell_price ? quantityUsed * row.sell_price : null;
  const modelStartDate = row.buy_date <= windowStart ? windowStart : effectiveDate(row.buy_date, baseDates);
  const modelSellDate = row.sell_date ? effectiveDate(row.sell_date, baseDates) : null;
  const startValueUsd = quantityUsed ? usdPriceAt(priceSeries, row.ticker, windowStart) * quantityUsed : null;
  const totalReturnPct = buyPriceUsd && row.sell_price ? (row.sell_price / buyPriceUsd) - 1 : null;
  const annualizedReturnPct = annualizeReturn(totalReturnPct, row.buy_date, row.sell_date);
  const includedInMainModel = Boolean(quantityUsed && buyCostUsd && sellProceedsUsd && modelSellDate && row.sell_date >= windowStart);

  return {
    ticker: row.ticker,
    type: 'realized',
    buyDate: row.buy_date,
    sellDate: row.sell_date,
    buyDateStatus: row.buy_date_status,
    sellDateStatus: row.sell_date_status,
    buyPriceUsd,
    sellPriceUsd: row.sell_price,
    quantityUsed,
    buyCostUsd,
    sellProceedsUsd,
    modelStartDate,
    modelSellDate,
    startValueUsd,
    totalReturnPct,
    annualizedReturnPct,
    confidence: row.confidence,
    notes: row.notes,
    includedInMainModel,
  };
}

async function main() {
  await fs.mkdir(distDir, { recursive: true });

  const [positionsText, holdingsText, pabraiNavText] = await Promise.all([
    fs.readFile(path.join(dataDir, 'positions.csv'), 'utf8'),
    fs.readFile(path.join(dataDir, 'current_holdings_2026-03-05.csv'), 'utf8'),
    fs.readFile(path.join(dataDir, 'pabrai_nav.json'), 'utf8'),
  ]);

  const positions = parseCsv(positionsText).map((row) => ({
    ...row,
    buy_price: toNumber(row.buy_price),
    amount_invested_usd: toNumber(row.amount_invested_usd),
    fx_rate_usd_to_local: toNumber(row.fx_rate_usd_to_local),
    amount_invested_local: toNumber(row.amount_invested_local),
    estimated_shares: toNumber(row.estimated_shares),
    sell_price: toNumber(row.sell_price),
  }));

  const holdings = parseCsv(holdingsText).map((row) => ({
    ...row,
    quantity: toNumber(row.quantity),
    price_usd: toNumber(row.price_usd),
    current_value_usd: toNumber(row.current_value_usd),
  }));

  const pabraiNavData = JSON.parse(pabraiNavText);

  const trackedOpenPositions = positions.filter((row) => row.member === 'AVI' && row.position_status === 'open');
  const realizedPositions = positions.filter((row) => row.member === 'AVI' && row.position_status === 'sold');
  const holdingsBySymbol = Object.fromEntries(holdings.filter((row) => row.symbol !== 'CASH').map((row) => [row.symbol, row]));

  const symbolsToFetch = uniqueBy([
    benchmarkSymbol,
    'TRYUSD=X',
    ...new Set([
      ...positions.map((row) => row.ticker),
      ...holdings.filter((row) => row.symbol !== 'CASH').map((row) => row.symbol),
    ]),
  ], (value) => value);

  const rawSeriesEntries = [];
  for (const symbol of symbolsToFetch) {
    rawSeriesEntries.push(await fetchYahooSeries(symbol));
  }

  const benchmarkDates = rawSeriesEntries.find((entry) => entry.symbol === benchmarkSymbol)?.series.map((entry) => entry.date) ?? [];
  const baseDates = benchmarkDates.filter((date) => date >= windowStart && date <= windowEnd);
  const priceSeries = Object.fromEntries(
    rawSeriesEntries.map((entry) => [entry.symbol, {
      ...entry,
      dates: baseDates,
      aligned: alignSeries(entry.series, baseDates),
    }])
  );

  const trackedOpenModels = trackedOpenPositions.map((row) => buildOpenPositionModel(row, holdingsBySymbol, priceSeries, baseDates));
  const realizedModels = realizedPositions.map((row) => buildRealizedPositionModel(row, priceSeries, baseDates));
  const realizedPerformanceModels = realizedModels.filter((row) => row.includedInMainModel);

  const contributions = new Map();
  const withdrawals = new Map();
  let openingCapitalUsd = 0;

  for (const position of [...trackedOpenModels, ...realizedPerformanceModels]) {
    if (!position.quantityUsed) continue;
    if (position.buyDate <= windowStart) {
      openingCapitalUsd += position.startValueUsd ?? 0;
    } else {
      const contributionDate = effectiveDate(position.buyDate, baseDates);
      contributions.set(contributionDate, (contributions.get(contributionDate) ?? 0) + (position.buyCostUsd ?? 0));
    }

    if (position.type === 'realized' && position.sellDate && position.sellDate >= windowStart) {
      const withdrawalDate = effectiveDate(position.sellDate, baseDates);
      withdrawals.set(withdrawalDate, (withdrawals.get(withdrawalDate) ?? 0) + (position.sellProceedsUsd ?? 0));
    }
  }

  const spyPrices = priceSeries[benchmarkSymbol].aligned;
  const spyPriceByDate = Object.fromEntries(baseDates.map((date, index) => [date, spyPrices[index]]));
  const openingSpyPrice = spyPriceByDate[windowStart];
  const modelEndDate = baseDates[baseDates.length - 1];
  const pabraiMember = buildPabraiMember(pabraiNavData, baseDates, spyPriceByDate, modelEndDate);

  let benchmarkShares = openingSpyPrice ? openingCapitalUsd / openingSpyPrice : 0;
  let contributedCapitalUsd = openingCapitalUsd;
  let cumulativeWithdrawalsUsd = 0;
  const portfolioReturnPctSeries = [];
  const benchmarkReturnPctSeries = [];

  for (const date of baseDates) {
    if (date !== windowStart && contributions.has(date) && spyPriceByDate[date]) {
      const amount = contributions.get(date) ?? 0;
      contributedCapitalUsd += amount;
      benchmarkShares += amount / spyPriceByDate[date];
    }

    if (withdrawals.has(date) && spyPriceByDate[date]) {
      const amount = withdrawals.get(date) ?? 0;
      cumulativeWithdrawalsUsd += amount;
      benchmarkShares = Math.max(0, benchmarkShares - (amount / spyPriceByDate[date]));
    }

    const openValueUsd = sum(trackedOpenModels.map((position) => {
      if (!position.quantityUsed) return 0;
      if (date < position.modelStartDate) return 0;
      const priceUsd = usdPriceAt(priceSeries, position.ticker, date);
      return priceUsd === null ? 0 : priceUsd * position.quantityUsed;
    }));

    const realizedActiveValueUsd = sum(realizedPerformanceModels.map((position) => {
      if (!position.quantityUsed || !position.modelSellDate) return 0;
      if (date < position.modelStartDate) return 0;
      if (date >= position.modelSellDate) return 0;
      const priceUsd = usdPriceAt(priceSeries, position.ticker, date);
      return priceUsd === null ? 0 : priceUsd * position.quantityUsed;
    }));

    const portfolioWealthUsd = openValueUsd + realizedActiveValueUsd + cumulativeWithdrawalsUsd;
    const benchmarkWealthUsd = (benchmarkShares * (spyPriceByDate[date] ?? 0)) + cumulativeWithdrawalsUsd;

    portfolioReturnPctSeries.push(contributedCapitalUsd ? (portfolioWealthUsd / contributedCapitalUsd) - 1 : null);
    benchmarkReturnPctSeries.push(contributedCapitalUsd ? (benchmarkWealthUsd / contributedCapitalUsd) - 1 : null);
  }

  const totalContributedCapitalUsd = openingCapitalUsd + sum([...contributions.values()]);
  const portfolioReturnPct = latestNonNull(portfolioReturnPctSeries);
  const benchmarkReturnPct = latestNonNull(benchmarkReturnPctSeries);
  const annualizedPortfolioReturnPct = annualizeReturn(portfolioReturnPct, windowStart, modelEndDate);
  const annualizedBenchmarkReturnPct = annualizeReturn(benchmarkReturnPct, windowStart, modelEndDate);
  const returnSpreadPct = portfolioReturnPct !== null && benchmarkReturnPct !== null ? portfolioReturnPct - benchmarkReturnPct : null;
  const annualizedReturnSpreadPct = annualizedPortfolioReturnPct !== null && annualizedBenchmarkReturnPct !== null ? annualizedPortfolioReturnPct - annualizedBenchmarkReturnPct : null;

  const attributionRows = [
    ...trackedOpenModels.map((position) => {
      const baseCapitalUsd = position.buyDate <= windowStart ? position.startValueUsd : position.buyCostUsd;
      const actualEndWealthUsd = position.currentSnapshotValueUsd ?? position.currentValueUsd;
      const matchedSpyReturnPct = spyPriceByDate[position.modelStartDate] && spyPriceByDate[modelEndDate]
        ? (spyPriceByDate[modelEndDate] / spyPriceByDate[position.modelStartDate]) - 1
        : null;
      const matchedSpyWealthUsd = baseCapitalUsd !== null && matchedSpyReturnPct !== null
        ? baseCapitalUsd * (1 + matchedSpyReturnPct)
        : null;
      const modelReturnPct = baseCapitalUsd && actualEndWealthUsd !== null
        ? (actualEndWealthUsd / baseCapitalUsd) - 1
        : null;
      const spreadContributionPct = totalContributedCapitalUsd && actualEndWealthUsd !== null && matchedSpyWealthUsd !== null
        ? (actualEndWealthUsd - matchedSpyWealthUsd) / totalContributedCapitalUsd
        : null;
      const annualizedModelReturnPct = annualizeReturn(modelReturnPct, position.modelStartDate, modelEndDate);
      const annualizedMatchedSpyReturnPct = annualizeReturn(matchedSpyReturnPct, position.modelStartDate, modelEndDate);
      const annualizedSpreadPct = annualizedModelReturnPct !== null && annualizedMatchedSpyReturnPct !== null ? annualizedModelReturnPct - annualizedMatchedSpyReturnPct : null;

      return {
        ticker: position.ticker,
        positionType: 'open',
        confidence: position.confidence,
        startDate: position.modelStartDate,
        endDate: modelEndDate,
        modelReturnPct,
        annualizedModelReturnPct,
        matchedSpyReturnPct,
        annualizedMatchedSpyReturnPct,
        spreadPct: modelReturnPct !== null && matchedSpyReturnPct !== null ? modelReturnPct - matchedSpyReturnPct : null,
        annualizedSpreadPct,
        spreadContributionPct,
        notes: position.notes,
      };
    }),
    ...realizedPerformanceModels.map((position) => {
      const baseCapitalUsd = position.buyDate <= windowStart ? position.startValueUsd : position.buyCostUsd;
      const actualEndWealthUsd = position.sellProceedsUsd;
      const matchedSpyReturnPct = position.modelSellDate && spyPriceByDate[position.modelStartDate] && spyPriceByDate[position.modelSellDate]
        ? (spyPriceByDate[position.modelSellDate] / spyPriceByDate[position.modelStartDate]) - 1
        : null;
      const matchedSpyWealthUsd = baseCapitalUsd !== null && matchedSpyReturnPct !== null
        ? baseCapitalUsd * (1 + matchedSpyReturnPct)
        : null;
      const modelReturnPct = baseCapitalUsd && actualEndWealthUsd !== null
        ? (actualEndWealthUsd / baseCapitalUsd) - 1
        : null;
      const spreadContributionPct = totalContributedCapitalUsd && actualEndWealthUsd !== null && matchedSpyWealthUsd !== null
        ? (actualEndWealthUsd - matchedSpyWealthUsd) / totalContributedCapitalUsd
        : null;
      const annualizedModelReturnPct = annualizeReturn(modelReturnPct, position.modelStartDate, position.modelSellDate);
      const annualizedMatchedSpyReturnPct = annualizeReturn(matchedSpyReturnPct, position.modelStartDate, position.modelSellDate);
      const annualizedSpreadPct = annualizedModelReturnPct !== null && annualizedMatchedSpyReturnPct !== null ? annualizedModelReturnPct - annualizedMatchedSpyReturnPct : null;

      return {
        ticker: position.ticker,
        positionType: 'realized',
        confidence: position.confidence,
        startDate: position.modelStartDate,
        endDate: position.modelSellDate,
        modelReturnPct,
        annualizedModelReturnPct,
        matchedSpyReturnPct,
        annualizedMatchedSpyReturnPct,
        spreadPct: modelReturnPct !== null && matchedSpyReturnPct !== null ? modelReturnPct - matchedSpyReturnPct : null,
        annualizedSpreadPct,
        spreadContributionPct,
        notes: position.notes,
      };
    }),
  ]
    .filter((row) => row.spreadContributionPct !== null && row.spreadPct !== null)
    .sort((left, right) => (right.spreadContributionPct ?? -Infinity) - (left.spreadContributionPct ?? -Infinity));

  const topPositiveAttribution = attributionRows.filter((row) => row.spreadContributionPct > 0).slice(0, 5);
  const topNegativeAttribution = [...attributionRows]
    .filter((row) => row.spreadContributionPct < 0)
    .sort((left, right) => (left.spreadContributionPct ?? Infinity) - (right.spreadContributionPct ?? Infinity))
    .slice(0, 5);

  const realizedSummaries = realizedModels.map((row) => ({
    ticker: row.ticker,
    buyDate: row.buyDate,
    sellDate: row.sellDate,
    buyDateStatus: row.buyDateStatus,
    sellDateStatus: row.sellDateStatus,
    returnPct: row.totalReturnPct,
    annualizedReturnPct: row.annualizedReturnPct,
    confidence: row.confidence,
    sizeKnown: Boolean(row.quantityUsed && row.buyCostUsd),
    includedInMainModel: row.includedInMainModel,
    notes: row.notes,
  }));

  const trackedTickers = new Set(trackedOpenModels.map((row) => row.ticker));
  const totalVisibleSnapshotUsd = sum(holdings.map((row) => row.current_value_usd));
  const trackedOpenCurrentValueUsd = sum(trackedOpenModels.map((row) => row.currentSnapshotValueUsd ?? row.currentValueUsd));

  const currentTrackedHoldings = trackedOpenModels.map((row) => {
    const displayValueUsd = row.currentSnapshotValueUsd ?? row.currentValueUsd;
    return {
      ticker: row.ticker,
      quantityUsed: row.quantityUsed,
      quantitySource: row.quantitySource,
      currentWeightPct: trackedOpenCurrentValueUsd ? displayValueUsd / trackedOpenCurrentValueUsd : null,
      currentSnapshotQuantity: row.currentSnapshotQuantity,
      buyDate: row.buyDate,
      buyDateStatus: row.buyDateStatus,
      totalReturnPct: row.totalReturnPct,
      annualizedReturnPct: row.annualizedReturnPct,
      confidence: row.confidence,
      notes: row.notes,
      accountName: row.accountName,
      accountType: row.accountType,
    };
  });

  const currentUnclassifiedHoldings = holdings
    .filter((row) => row.symbol !== 'CASH' && !trackedTickers.has(row.symbol))
    .map((row) => ({
      symbol: row.symbol,
      accountName: row.account_name,
      accountType: row.account_type,
      quantity: row.quantity,
      visibleWeightPct: totalVisibleSnapshotUsd ? row.current_value_usd / totalVisibleSnapshotUsd : null,
      notes: row.notes,
    }));

  const cashHoldings = holdings
    .filter((row) => row.symbol === 'CASH')
    .map((row) => ({
      accountName: row.account_name,
      accountType: row.account_type,
      visibleWeightPct: totalVisibleSnapshotUsd ? row.current_value_usd / totalVisibleSnapshotUsd : null,
      notes: row.notes,
    }));

  const excludedSnapshotWeightPct = totalVisibleSnapshotUsd
    ? sum(holdings.filter((row) => row.symbol !== 'CASH' && !trackedTickers.has(row.symbol)).map((row) => row.current_value_usd)) / totalVisibleSnapshotUsd
    : null;
  const cashSnapshotWeightPct = totalVisibleSnapshotUsd
    ? sum(holdings.filter((row) => row.symbol === 'CASH').map((row) => row.current_value_usd)) / totalVisibleSnapshotUsd
    : null;

  const warnings = [];
  warnings.push(`5-year chart window is fixed to ${windowStart} through ${windowEnd}.`);
  warnings.push('The main AVI return line uses current open positions plus sized realized exits. Pre-window positions start from their March 5, 2021 market value, so the chart is a five-year return line rather than lifetime P&L.');
  warnings.push('MU sale proceeds are treated as external cash because the Morgan Stanley statement shows proceeds disbursement. PLTR sale proceeds are also treated as external for now unless you tell me they were recycled into later trades.');
  warnings.push('BIMAS.IS is modeled outside the Vanguard snapshot and converted from TRY to USD using daily TRYUSD data.');

  for (const position of trackedOpenModels) {
    if (position.currentQuantityMismatch !== null && position.currentQuantityMismatch > 0.1) {
      warnings.push(`${position.ticker} current quantity differs by ${formatPercent(position.currentQuantityMismatch, 1, false)} from the remembered amount.`);
    }
  }

  if (currentUnclassifiedHoldings.some((row) => row.symbol === 'PLTR')) {
    warnings.push('The current 104-share Roth PLTR holding is still excluded from the main line because its buy date and basis are not known yet.');
  }

  if (currentUnclassifiedHoldings.length) {
    warnings.push(`Current Vanguard holdings not yet included in the group basket: ${currentUnclassifiedHoldings.map((row) => row.symbol).join(', ')}.`);
  }

  const memberData = {
    id: 'AVI',
    label: 'AVI',
    status: 'ready',
    benchmarkSymbol,
    windowStart,
    windowEnd,
    chart: {
      dates: baseDates,
      portfolioReturnPctSeries,
      benchmarkReturnPctSeries,
      portfolioLabel: 'AVI modeled book',
      benchmarkLabel: 'SPY with matched buy/sell cash flows',
    },
    stats: {
      portfolioReturnPct,
      annualizedPortfolioReturnPct,
      benchmarkReturnPct,
      annualizedBenchmarkReturnPct,
      returnSpreadPct,
      annualizedReturnSpreadPct,
      trackedNames: trackedOpenModels.length,
      modeledRealizedNames: realizedPerformanceModels.length,
      realizedNamesWithoutSize: realizedSummaries.filter((row) => !row.sizeKnown).length,
      excludedSnapshotWeightPct,
      cashSnapshotWeightPct,
    },
    trackedOpenPositions: currentTrackedHoldings,
    realizedPositions: realizedSummaries,
    attribution: {
      topPositive: topPositiveAttribution,
      topNegative: topNegativeAttribution,
    },
    currentUnclassifiedHoldings,
    cashHoldings,
    warnings,
  };

  const externalMembers = [pabraiMember].filter(Boolean);

  const pendingMembers = Object.values(roughMembers)
    .filter((member) => member.label !== 'AVI')
    .map((member) => ({
      id: member.label,
      label: member.label,
      status: member.status,
      roughSymbols: member.roughSymbols,
      message: 'Need buy dates, entry prices, and sizes before performance can be plotted against SPY.',
    }));

  const groupData = {
    id: 'GROUP',
    label: 'Boba Bonh Mi Bros',
    status: 'partial',
    membersIncluded: ['AVI'],
    missingMembers: pendingMembers.map((member) => member.label),
    benchmarkSymbol,
    windowStart,
    windowEnd,
    chart: memberData.chart,
    stats: {
      modeledMembers: 1,
      totalMembers: 3,
      coveragePct: 1 / 3,
      portfolioReturnPct: memberData.stats.portfolioReturnPct,
      annualizedPortfolioReturnPct: memberData.stats.annualizedPortfolioReturnPct,
      benchmarkReturnPct: memberData.stats.benchmarkReturnPct,
      annualizedBenchmarkReturnPct: memberData.stats.annualizedBenchmarkReturnPct,
      returnSpreadPct: memberData.stats.returnSpreadPct,
      annualizedReturnSpreadPct: memberData.stats.annualizedReturnSpreadPct,
    },
    warnings: ['Group view currently equals AVI only because JOEY and PRAB do not have enough trade data yet.'],
  };

  const dashboardData = {
    metadata: {
      title: 'Boba Bonh Mi Bros',
      subtitle: 'Inverse boba index workbench',
      generatedAt: new Date().toISOString(),
      windowStart,
      windowEnd,
      asOf: '2026-03-05',
      benchmarkSymbol,
      benchmarkName: 'SPDR S&P 500 ETF Trust',
      sources: [
        'User-provided Vanguard holdings snapshot as of March 5, 2026, 4:15 p.m. ET',
        'User-provided remembered entries and exits for AVI',
        'Q4 2025 Morgan Stanley Micron statement pasted by the user',
        'Yahoo Finance chart API for 5-year daily price history and TRYUSD conversion',
        'Pabrai Funds PDFs supplied by the user, extracted into NAV checkpoints through December 31, 2025',
      ],
    },
    members: [memberData, ...externalMembers, ...pendingMembers],
    group: groupData,
  };

  await fs.writeFile(path.join(distDir, 'dashboard-data.json'), JSON.stringify(dashboardData, null, 2));

  await Promise.all([
    fs.copyFile(path.join(appDir, 'index.html'), path.join(distDir, 'index.html')),
    fs.copyFile(path.join(appDir, 'styles.css'), path.join(distDir, 'styles.css')),
    fs.copyFile(path.join(appDir, 'app.js'), path.join(distDir, 'app.js')),
    fs.copyFile(path.join(dataDir, 'pabrai_nav.json'), path.join(distDir, 'pabrai_nav.json')), 
  ]);

  console.log(`Built dashboard data for ${memberData.label}.`);
  console.log(`Modeled return: ${formatPercent(portfolioReturnPct)} vs matched SPY ${formatPercent(benchmarkReturnPct)} (spread ${formatPercent(returnSpreadPct)}).`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});


