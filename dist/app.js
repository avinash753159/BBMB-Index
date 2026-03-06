const state = {
  rawData: null,
  pabraiNav: null,
  model: null,
  activeView: 'AVI',
  selectedSeriesIds: ['AVI', 'PABRAI', 'SPY'],
  activePresetId: 'avi-pabrai-spy',
};

const percentSigned = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'always',
});

const percentPlain = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

async function loadJson(path, optional = false) {
  const response = await fetch(path);
  if (!response.ok) {
    if (optional) return null;
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function loadData() {
  const [dashboardData, pabraiNav] = await Promise.all([
    loadJson('./dashboard-data.json'),
    loadJson('./pabrai_nav.json', true),
  ]);

  return { dashboardData, pabraiNav };
}

function formatPercent(value, signed = true) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return signed ? percentSigned.format(value) : percentPlain.format(value);
}

function formatAnnualized(value, signed = true) {
  const formatted = formatPercent(value, signed);
  return formatted === '—' ? formatted : `${formatted}/yr`;
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
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

function latestNonNull(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null && values[index] !== undefined) return values[index];
  }
  return null;
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

const seriesAppearance = {
  AVI: { color: 'var(--series-avi)', kindLabel: 'Portfolio' },
  PABRAI: { color: 'var(--series-pabrai)', kindLabel: 'Composite' },
  PIF2: { color: 'var(--series-pif2)', kindLabel: 'Fund' },
  PIF3: { color: 'var(--series-pif3)', kindLabel: 'Fund' },
  PIF4: { color: 'var(--series-pif4)', kindLabel: 'Fund' },
  SPY: { color: 'var(--series-spy)', kindLabel: 'Benchmark' },
};

function getSeriesAppearance(id) {
  return seriesAppearance[id] ?? { color: 'var(--series-spy)', kindLabel: 'Series' };
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

function sanitizeSelection(ids) {
  const validIds = new Set(state.model.comparisonSeries.map((series) => series.id));
  const uniqueIds = [];
  ids.forEach((id) => {
    if (validIds.has(id) && !uniqueIds.includes(id)) uniqueIds.push(id);
  });
  return uniqueIds.length ? uniqueIds : ['SPY'];
}

function getSeriesById(id) {
  return state.model.seriesById[id] ?? null;
}

function getSelectedSeries() {
  return state.selectedSeriesIds.map(getSeriesById).filter(Boolean);
}

function getActiveView() {
  return state.model.views.find((view) => view.id === state.activeView) ?? state.model.views[0] ?? null;
}

function setSelectedSeries(seriesIds, presetId = null) {
  state.selectedSeriesIds = sanitizeSelection(seriesIds);
  state.activePresetId = presetId;
  renderDashboard();
}

function toggleSeries(id) {
  if (state.selectedSeriesIds.includes(id)) {
    if (state.selectedSeriesIds.length === 1) return;
    state.selectedSeriesIds = state.selectedSeriesIds.filter((seriesId) => seriesId !== id);
  } else {
    state.selectedSeriesIds = sanitizeSelection([...state.selectedSeriesIds, id]);
  }
  state.activePresetId = null;
  renderDashboard();
}

function buildFocusTabs() {
  const tabs = document.querySelector('#focus-tabs');
  tabs.innerHTML = '';

  state.model.views.forEach((view) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `focus-tab ${state.activeView === view.id ? 'active' : ''}`;
    button.textContent = view.label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(state.activeView === view.id));
    button.addEventListener('click', () => {
      state.activeView = view.id;
      buildFocusTabs();
      renderDashboard();
    });
    tabs.appendChild(button);
  });
}

function renderCompareChip(series) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `compare-chip ${state.selectedSeriesIds.includes(series.id) ? 'selected' : ''}`;
  button.addEventListener('click', () => toggleSeries(series.id));

  const dot = el('span', 'dot');
  dot.style.background = getSeriesAppearance(series.id).color;
  const copy = el('span', 'chip-copy');
  copy.append(el('strong', '', series.shortLabel ?? series.label));
  copy.append(el('span', '', formatAnnualized(series.annualizedReturnPct)));
  button.append(dot, copy);
  return button;
}

function renderSelectionItem(series) {
  const item = el('div', 'selection-item');
  const main = el('div', 'selection-main');
  const dot = el('span', 'dot');
  dot.style.background = getSeriesAppearance(series.id).color;
  const copy = el('div', 'selection-copy');
  copy.append(el('strong', '', series.label));
  copy.append(el('span', '', series.note));
  main.append(dot, copy);
  item.append(main);
  item.append(el('span', 'selection-metric', formatAnnualized(series.annualizedReturnPct)));
  return item;
}

function renderCompareLab() {
  const selectedSeries = getSelectedSeries();
  const card = el('section', 'compare-lab');

  const stage = el('div', 'compare-stage');
  const head = el('div', 'compare-head');
  head.append(el('span', 'section-eyebrow', 'Compare lines'));
  head.append(el('h2', '', 'Pick any stack you want. AVI, PABRAI, each PIF fund, and SPY all live on the same five-year chart.'));
  head.append(el('p', '', 'The top strip now shows annualized returns only. The chart stays normalized to the same five-year window so you can toggle combinations without rebuilding the page.'));
  stage.append(head);

  const groups = el('div', 'compare-groups');
  const groupConfig = [
    { title: 'Portfolios and composite', ids: ['AVI', 'PABRAI'] },
    { title: 'Single PIF funds', ids: ['PIF2', 'PIF3', 'PIF4'] },
    { title: 'Benchmark', ids: ['SPY'] },
  ];

  groupConfig.forEach((config) => {
    const available = config.ids.map(getSeriesById).filter(Boolean);
    if (!available.length) return;
    const group = el('section', 'compare-group');
    group.append(el('h3', '', config.title));
    const row = el('div', 'compare-chip-row');
    available.forEach((series) => row.append(renderCompareChip(series)));
    group.append(row);
    groups.append(group);
  });

  stage.append(groups);
  card.append(stage);

  const side = el('aside', 'compare-side');
  const presetCard = el('section', 'callout-card');
  presetCard.append(el('span', 'preset-label', 'Presets'));
  presetCard.append(el('h3', '', 'Quick starting stacks'));
  presetCard.append(el('p', '', 'Use these to jump straight into the combinations you asked for, then fine-tune with the chips on the left.'));
  const presetList = el('div', 'preset-list');
  state.model.presets.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `preset-chip ${state.activePresetId === preset.id ? 'active' : ''}`;
    button.textContent = preset.label;
    button.addEventListener('click', () => setSelectedSeries(preset.seriesIds, preset.id));
    presetList.append(button);
  });
  presetCard.append(presetList);
  side.append(presetCard);
  const activeCard = el('section', 'callout-card');
  activeCard.append(el('span', 'preset-label', 'Active stack'));
  activeCard.append(el('h3', '', `${selectedSeries.length} line${selectedSeries.length === 1 ? '' : 's'} on the canvas`));
  activeCard.append(el('p', '', 'Every selected line gets its own annualized card above the chart. SPY stays available as a normal compare choice instead of a separate stat block.'));
  const list = el('div', 'selection-list');
  selectedSeries.forEach((series) => list.append(renderSelectionItem(series)));
  activeCard.append(list);
  side.append(activeCard);

  card.append(side);
  return card;
}

function renderAnnualizedStrip() {
  const selectedSeries = getSelectedSeries();
  const section = el('section', 'annualized-shell');
  const head = el('div', 'chart-head');
  const copy = el('div');
  copy.append(el('span', 'section-eyebrow', 'Annualized return'));
  copy.append(el('h2', '', 'Only the yearly compounding view stays at the top.'));
  copy.append(el('p', '', 'Total return still shows up inside each card, but the headline number is always annualized return.'));
  head.append(copy);
  section.append(head);

  const grid = el('div', 'annualized-grid');
  selectedSeries.forEach((series) => {
    const card = el('article', 'annualized-card');
    const pill = el('span', `data-pill ${series.kind}`, getSeriesAppearance(series.id).kindLabel);
    card.append(pill);
    card.append(el('strong', '', formatAnnualized(series.annualizedReturnPct)));
    card.append(el('span', 'submetric', `${series.label} total return ${formatPercent(series.totalReturnPct)}.`));
    card.append(el('span', 'submetric', series.note));
    grid.append(card);
  });

  section.append(grid);
  return section;
}

function makeLinePath(values, width, height, minValue, maxValue, padding) {
  const usableWidth = width - (padding.left + padding.right);
  const usableHeight = height - (padding.top + padding.bottom);
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0;
  let path = '';

  values.forEach((value, index) => {
    if (value === null || value === undefined) return;
    const x = padding.left + step * index;
    const scale = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
    const y = height - padding.bottom - (scale * usableHeight);
    path += `${path ? ' L ' : 'M '}${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return path;
}

function getLineEndpoint(values, width, height, minValue, maxValue, padding) {
  const usableWidth = width - (padding.left + padding.right);
  const usableHeight = height - (padding.top + padding.bottom);
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (value === null || value === undefined) continue;
    const x = padding.left + step * index;
    const scale = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
    const y = height - padding.bottom - (scale * usableHeight);
    return { x, y };
  }

  return null;
}

function renderChart(selectedSeries) {
  const dates = state.model.dates;
  const width = 1100;
  const height = 430;
  const padding = { top: 18, right: 34, bottom: 44, left: 78 };
  const allValues = selectedSeries.flatMap((series) => series.returnPctSeries).filter((value) => value !== null && value !== undefined);
  const rawMin = Math.min(...allValues, 0);
  const rawMax = Math.max(...allValues, 0);
  const span = Math.max(rawMax - rawMin, 0.12);
  const minValue = rawMin - (span * 0.12);
  const maxValue = rawMax + (span * 0.12);
  const ticks = 4;
  const grid = [];

  for (let index = 0; index <= ticks; index += 1) {
    const ratio = index / ticks;
    const value = maxValue - ((maxValue - minValue) * ratio);
    const y = padding.top + ((height - padding.top - padding.bottom) * ratio);
    grid.push({ value, y });
  }

  const zeroRatio = maxValue === minValue ? 0.5 : (maxValue - 0) / (maxValue - minValue);
  const zeroY = padding.top + ((height - padding.top - padding.bottom) * (1 - zeroRatio));
  const labelIndexes = [0, Math.floor(dates.length / 4), Math.floor(dates.length / 2), Math.floor((dates.length * 3) / 4), dates.length - 1];
  const xLabels = [...new Set(labelIndexes)].map((index) => ({ index, date: dates[index] }));
  const xStep = dates.length > 1 ? (width - padding.left - padding.right) / (dates.length - 1) : 0;

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Five-year comparison chart">
        ${grid.map((tick) => `
          <line class="chart-grid-line" x1="${padding.left}" y1="${tick.y}" x2="${width - padding.right}" y2="${tick.y}"></line>
          <text class="chart-axis-label" x="${padding.left - 10}" y="${tick.y + 4}" text-anchor="end">${formatPercent(tick.value)}</text>
        `).join('')}
        <line class="chart-zero-line" x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}"></line>
        ${selectedSeries.map((series) => {
          const color = getSeriesAppearance(series.id).color;
          const path = makeLinePath(series.returnPctSeries, width, height, minValue, maxValue, padding);
          const endpoint = getLineEndpoint(series.returnPctSeries, width, height, minValue, maxValue, padding);
          return `
            <path d="${path}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
            ${endpoint ? `<circle cx="${endpoint.x}" cy="${endpoint.y}" r="4.8" fill="${color}" stroke="rgba(255,255,255,0.88)" stroke-width="2"></circle>` : ''}
          `;
        }).join('')}
        ${xLabels.map((label) => `
          <text class="chart-axis-label" x="${padding.left + (xStep * label.index)}" y="${height - 12}" text-anchor="middle">${formatDate(label.date)}</text>
        `).join('')}
      </svg>
    </div>
  `;
}

function renderChartCard() {
  const selectedSeries = getSelectedSeries();
  const card = el('section', 'chart-shell');
  const head = el('div', 'chart-head');
  const copy = el('div', 'chart-copy');
  copy.append(el('span', 'section-eyebrow', 'Performance canvas'));
  copy.append(el('h2', '', 'Every selected line shares the same five-year frame.'));
  copy.append(el('p', '', `Normalized return from ${formatDate(state.model.windowStart)} through ${formatDate(state.model.windowEnd)}. PIF lines stay flat after their latest PDF checkpoint.`));
  head.append(copy);
  card.append(head);
  card.insertAdjacentHTML('beforeend', renderChart(selectedSeries));

  const legend = el('div', 'legend');
  selectedSeries.forEach((series) => {
    const legendChip = el('div', 'legend-chip');
    const dot = el('span', 'dot');
    dot.style.background = getSeriesAppearance(series.id).color;
    const copyWrap = document.createElement('div');
    copyWrap.append(el('strong', '', series.label));
    copyWrap.append(el('span', '', formatAnnualized(series.annualizedReturnPct)));
    legendChip.append(dot, copyWrap);
    legend.append(legendChip);
  });
  card.append(legend);

  const notes = el('div', 'chart-note-grid');
  selectedSeries.forEach((series) => {
    const note = el('article', 'chart-note');
    note.append(el('strong', '', series.label));
    note.append(el('p', 'muted-copy', `${series.description} ${series.note}`));
    notes.append(note);
  });
  card.append(notes);
  return card;
}

function renderTableCard(title, kicker, columns, rows, emptyMessage) {
  const card = el('section', 'table-card');
  const head = el('div', 'table-head');
  const copy = el('div');
  copy.append(el('span', 'table-kicker', kicker));
  copy.append(el('h3', '', title));
  head.append(copy);
  card.append(head);

  if (!rows.length) {
    card.append(el('p', 'table-empty', emptyMessage));
    return card;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((column) => headRow.append(el('th', '', column.label)));
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    columns.forEach((column) => {
      const td = document.createElement('td');
      const content = column.render(row);
      if (content instanceof Node) {
        td.append(content);
      } else {
        td.innerHTML = content;
      }
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  card.append(table);
  return card;
}
function renderActionButton(label, seriesIds) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'action-chip primary';
  button.textContent = label;
  button.addEventListener('click', () => setSelectedSeries(seriesIds));
  return button;
}

function renderAviDetail(view) {
  const payload = view.payload;
  const section = el('section', 'detail-grid');
  const intro = el('article', 'detail-card');
  const head = el('div', 'detail-head');
  const copy = el('div', 'detail-copy');
  copy.append(el('span', 'section-eyebrow', 'AVI detail'));
  copy.append(el('h2', '', 'Current modeled book and what is still missing.'));
  copy.append(el('p', '', view.summary));
  head.append(copy);
  const actions = el('div', 'detail-actions');
  actions.append(
    renderActionButton('AVI + SPY', ['AVI', 'SPY']),
    renderActionButton('AVI + PABRAI + SPY', ['AVI', 'PABRAI', 'SPY']),
    renderActionButton('AVI + PIF3 + SPY', ['AVI', 'PIF3', 'SPY'])
  );
  head.append(actions);
  intro.append(head);

  const metrics = el('div', 'metric-stack');
  [
    ['Annualized return', formatAnnualized(payload.stats?.annualizedPortfolioReturnPct)],
    ['Tracked open names', String(payload.stats?.trackedNames ?? 0)],
    ['Sized realized exits', String(payload.stats?.modeledRealizedNames ?? 0)],
    ['Excluded snapshot weight', formatPercent(payload.stats?.excludedSnapshotWeightPct, false)],
  ].forEach(([label, value]) => {
    const tile = el('div', 'metric-tile');
    tile.append(el('span', 'hero-label', label));
    tile.append(el('strong', '', value));
    metrics.append(tile);
  });
  intro.append(metrics);
  section.append(intro);

  const tables = el('div', 'table-grid');
  tables.append(
    renderTableCard(
      'Tracked open positions',
      'Open book',
      [
        { label: 'Ticker', render: (row) => `<span class="mono">${row.ticker}</span>` },
        { label: 'Buy date', render: (row) => `${formatDate(row.buyDate)}<br><span class="footnote">${row.buyDateStatus}</span>` },
        { label: 'Weight', render: (row) => `${formatPercent(row.currentWeightPct, false)}<br><span class="footnote">tracked open book</span>` },
        { label: 'Return', render: (row) => `${formatAnnualized(row.annualizedReturnPct)}<br><span class="footnote">Total ${formatPercent(row.totalReturnPct)} | ${row.accountType ?? 'external holding'}</span>` },
      ],
      payload.trackedOpenPositions ?? [],
      'No open positions in the modeled AVI book.'
    )
  );
  tables.append(
    renderTableCard(
      'Known sold positions',
      'Realized',
      [
        { label: 'Ticker', render: (row) => `<span class="mono">${row.ticker}</span>` },
        { label: 'Buy', render: (row) => `${formatDate(row.buyDate)}<br><span class="footnote">${row.buyDateStatus}</span>` },
        { label: 'Sell', render: (row) => `${formatDate(row.sellDate)}<br><span class="footnote">${row.sellDateStatus}</span>` },
        { label: 'Return', render: (row) => `${formatAnnualized(row.annualizedReturnPct)}<br><span class="footnote">Total ${formatPercent(row.returnPct)} | ${row.confidence} confidence</span>` },
      ],
      payload.realizedPositions ?? [],
      'No realized positions recorded yet.'
    )
  );
  section.append(tables);

  const split = el('div', 'detail-split');
  split.append(
    renderTableCard(
      'Current holdings outside the tracked basket',
      'Needs classification',
      [
        { label: 'Symbol', render: (row) => `<span class="mono">${row.symbol}</span>` },
        { label: 'Account', render: (row) => `${row.accountType}<br><span class="footnote">${row.accountName}</span>` },
        { label: 'Visible weight', render: (row) => formatPercent(row.visibleWeightPct, false) },
      ],
      payload.currentUnclassifiedHoldings ?? [],
      'Everything in the Vanguard snapshot is classified.'
    )
  );

  const warningCard = el('article', 'detail-card');
  warningCard.append(el('span', 'section-eyebrow', 'Data quality'));
  warningCard.append(el('h2', '', 'Flags still worth keeping in view.'));
  const warningList = el('ul', 'warning-list');
  (payload.warnings ?? []).forEach((warning) => warningList.append(el('li', '', warning)));
  warningCard.append(warningList);
  split.append(warningCard);
  section.append(split);
  return section;
}

function renderPabraiDetail(view) {
  const payload = view.payload;
  const section = el('section', 'detail-grid');
  const intro = el('article', 'detail-card');
  const head = el('div', 'detail-head');
  const copy = el('div', 'detail-copy');
  copy.append(el('span', 'section-eyebrow', 'Pabrai composite'));
  copy.append(el('h2', '', 'Composite view plus every underlying fund.'));
  copy.append(el('p', '', view.summary));
  head.append(copy);
  const actions = el('div', 'detail-actions');
  actions.append(
    renderActionButton('PABRAI + SPY', ['PABRAI', 'SPY']),
    renderActionButton('PABRAI + AVI + SPY', ['AVI', 'PABRAI', 'SPY']),
    renderActionButton('PIF2 + PIF3 + PIF4 + SPY', ['PIF2', 'PIF3', 'PIF4', 'SPY'])
  );
  head.append(actions);
  intro.append(head);

  const metrics = el('div', 'metric-stack');
  [
    ['Annualized return', formatAnnualized(payload.stats?.annualizedPortfolioReturnPct)],
    ['Latest checkpoint', formatDate(payload.stats?.latestCheckpoint)],
    ['Funds in composite', String(payload.stats?.fundCount ?? 0)],
    ['Watch ticker', state.model.watchlistTickers.join(', ') || '—'],
  ].forEach(([label, value]) => {
    const tile = el('div', 'metric-tile');
    tile.append(el('span', 'hero-label', label));
    tile.append(el('strong', '', value));
    metrics.append(tile);
  });
  intro.append(metrics);
  section.append(intro);

  const fundGrid = el('div', 'fund-grid');
  state.model.comparisonSeries.filter((series) => series.kind === 'fund').forEach((fund) => {
    const card = el('article', 'fund-card');
    card.append(el('span', 'data-pill fund', 'Fund'));
    card.append(el('strong', '', `${fund.label} ${formatAnnualized(fund.annualizedReturnPct)}`));
    card.append(el('p', 'muted-copy', `Total return ${formatPercent(fund.totalReturnPct)}. ${fund.note}`));
    const actionsRow = el('div', 'action-row');
    actionsRow.append(renderActionButton(`${fund.label} + AVI + SPY`, [fund.id, 'AVI', 'SPY']));
    card.append(actionsRow);
    fundGrid.append(card);
  });
  section.append(fundGrid);

  const split = el('div', 'detail-split');
  split.append(
    renderTableCard(
      'Underlying funds',
      'PDF-derived lines',
      [
        { label: 'Fund', render: (row) => `<span class="mono">${row.label}</span>` },
        { label: 'Annualized', render: (row) => formatAnnualized(row.annualizedReturnPct) },
        { label: 'Total', render: (row) => formatPercent(row.totalReturnPct) },
        { label: 'Checkpoint', render: (row) => `${formatDate(row.latestCheckpoint)}<br><span class="footnote">${row.note}</span>` },
      ],
      state.model.comparisonSeries.filter((series) => series.kind === 'fund'),
      'No PIF fund data loaded.'
    )
  );

  const sourceCard = el('article', 'detail-card');
  sourceCard.append(el('span', 'section-eyebrow', 'Source files'));
  sourceCard.append(el('h2', '', 'PDFs and watchlist carried into the composite.'));
  const sourceList = el('ul', 'source-list');
  state.model.sourcePdfs.forEach((source) => sourceList.append(el('li', '', source.split('\\').pop() || source)));
  if (state.model.watchlistTickers.length) {
    sourceList.append(el('li', '', `Watchlist ticker: ${state.model.watchlistTickers.join(', ')}`));
  }
  (payload.warnings ?? []).forEach((warning) => sourceList.append(el('li', '', warning)));
  sourceCard.append(sourceList);
  split.append(sourceCard);
  section.append(split);
  return section;
}
function renderFundDetail(view) {
  const fund = view.payload;
  const section = el('section', 'detail-grid');
  const card = el('article', 'detail-card');
  const head = el('div', 'detail-head');
  const copy = el('div', 'detail-copy');
  copy.append(el('span', 'section-eyebrow', `${fund.label} fund view`));
  copy.append(el('h2', '', `${fund.label} on its own, with quick jumps back to AVI and SPY.`));
  copy.append(el('p', '', `${fund.description} ${fund.note}`));
  head.append(copy);
  const actions = el('div', 'detail-actions');
  actions.append(
    renderActionButton(`${fund.label} + SPY`, [fund.id, 'SPY']),
    renderActionButton(`${fund.label} + AVI + SPY`, [fund.id, 'AVI', 'SPY']),
    renderActionButton(`${fund.label} + PABRAI + SPY`, [fund.id, 'PABRAI', 'SPY'])
  );
  head.append(actions);
  card.append(head);

  const metrics = el('div', 'metric-stack');
  [
    ['Annualized return', formatAnnualized(fund.annualizedReturnPct)],
    ['Total return', formatPercent(fund.totalReturnPct)],
    ['Latest checkpoint', formatDate(fund.latestCheckpoint)],
    ['Watch ticker', state.model.watchlistTickers.join(', ') || '—'],
  ].forEach(([label, value]) => {
    const tile = el('div', 'metric-tile');
    tile.append(el('span', 'hero-label', label));
    tile.append(el('strong', '', value));
    metrics.append(tile);
  });
  card.append(metrics);
  section.append(card);

  const split = el('div', 'detail-split');
  const sourceCard = el('article', 'detail-card');
  sourceCard.append(el('span', 'section-eyebrow', 'Checkpoint behavior'));
  sourceCard.append(el('h2', '', 'Why the line goes flat near the end.'));
  sourceCard.append(el('p', 'muted-copy', 'The supplied PDFs run through December 31, 2025. After that checkpoint, each single-fund line stays flat until a newer report is added.'));
  split.append(sourceCard);

  const fileCard = el('article', 'detail-card');
  fileCard.append(el('span', 'section-eyebrow', 'Source files'));
  fileCard.append(el('h2', '', 'PDFs behind this fund line.'));
  const sourceList = el('ul', 'source-list');
  state.model.sourcePdfs.forEach((source) => sourceList.append(el('li', '', source.split('\\').pop() || source)));
  fileCard.append(sourceList);
  split.append(fileCard);
  section.append(split);
  return section;
}

function renderPendingDetail(view) {
  const section = el('section', 'empty-card');
  section.append(el('span', 'section-eyebrow', 'Pending member'));
  section.append(el('h3', '', `${view.label} still needs actual trade detail.`));
  section.append(el('p', '', view.summary));
  const list = el('ul', 'pending-list');
  (view.payload.roughSymbols ?? []).forEach((symbol) => list.append(el('li', '', symbol)));
  section.append(list);
  return section;
}

function renderActiveDetail() {
  const view = getActiveView();
  if (!view) return el('section', 'empty-card', 'No active view available.');
  if (view.kind === 'portfolio') return renderAviDetail(view);
  if (view.kind === 'composite') return renderPabraiDetail(view);
  if (view.kind === 'fund') return renderFundDetail(view);
  return renderPendingDetail(view);
}

function renderDashboard() {
  const root = document.querySelector('#dashboard-root');
  root.innerHTML = '';
  root.append(
    renderCompareLab(),
    renderAnnualizedStrip(),
    renderChartCard(),
    renderActiveDetail()
  );

  const compareCount = document.querySelector('#compare-count');
  compareCount.textContent = `${state.selectedSeriesIds.length} active line${state.selectedSeriesIds.length === 1 ? '' : 's'}`;
}

function bootHeader() {
  const metadata = state.model.metadata;
  document.querySelector('#subtitle').textContent = 'Compare AVI, the Pabrai composite, each PIF fund, and SPY on one fixed five-year canvas, then swap the detail panel without rebuilding the chart.';
  document.querySelector('#window-range').textContent = `${formatDate(metadata.windowStart)} to ${formatDate(metadata.windowEnd)}`;
  document.querySelector('#benchmark-name').textContent = `${metadata.benchmarkSymbol} · ${metadata.benchmarkName}`;
}

loadData()
  .then(({ dashboardData, pabraiNav }) => {
    state.rawData = dashboardData;
    state.pabraiNav = pabraiNav;
    state.model = buildModel(dashboardData, pabraiNav);
    state.activeView = state.model.views.some((view) => view.id === 'AVI') ? 'AVI' : state.model.views[0]?.id ?? 'AVI';
    state.selectedSeriesIds = sanitizeSelection(state.selectedSeriesIds);
    bootHeader();
    buildFocusTabs();
    renderDashboard();
  })
  .catch((error) => {
    const root = document.querySelector('#dashboard-root');
    root.innerHTML = '';
    const card = el('section', 'empty-card');
    card.append(el('span', 'section-eyebrow', 'Load failure'));
    card.append(el('h3', '', 'The comparison lab could not load.'));
    card.append(el('p', '', error.message));
    root.append(card);
  });
