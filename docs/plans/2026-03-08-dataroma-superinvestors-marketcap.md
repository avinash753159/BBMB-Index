# Dataroma Superinvestors + Market Cap Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scrape all ~82 superinvestors from Dataroma at build time, backtest their portfolios, add market cap data per holding from Yahoo Finance, and provide a logarithmic market cap range slider that filters both holdings tables and which superinvestors appear in the UI.

**Architecture:** The build script (`scripts/build-dashboard-data.mjs`) gains a Dataroma scraper that fetches the investor list + each investor's current holdings page, then fetches market caps from Yahoo Finance. The frontend adds a `MarketCapSlider` component and filtering logic in `App.jsx` that filters superinvestor holdings and dims/hides investors with no holdings in range.

**Tech Stack:** Node.js fetch for scraping, Yahoo Finance API for market caps, React + Tailwind for the slider UI, existing D3 chart infrastructure.

---

### Task 1: Create Dataroma scraper module

**Files:**
- Create: `scripts/scrape-dataroma.mjs`

**Step 1: Write the scraper module**

This module exports two functions: `fetchSuperinvestorList()` and `fetchHoldings(managerId)`.

```js
// scripts/scrape-dataroma.mjs
const BASE = 'https://www.dataroma.com/m';
const HEADERS = { 'user-agent': 'Mozilla/5.0' };

// Delay between requests to be respectful
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Fetches the full list of superinvestors from Dataroma.
 * Returns: [{ name, managerId, url }]
 */
export async function fetchSuperinvestorList() {
  const res = await fetch(`${BASE}/managers.php`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Dataroma managers page: ${res.status}`);
  const html = await res.text();

  const investors = [];
  // Match links like: holdings.php?m=BRK
  const linkRe = /holdings\.php\?m=([^"&]+)"[^>]*>([^<]+)</g;
  let match;
  while ((match = linkRe.exec(html)) !== null) {
    const managerId = match[1];
    const name = match[2].trim();
    if (managerId && name) {
      investors.push({ managerId, name, url: `${BASE}/holdings.php?m=${managerId}` });
    }
  }
  return investors;
}

/**
 * Fetches current holdings for a single superinvestor.
 * Returns: { managerId, name, filingDate, holdings: [{ ticker, company, weightPct, shares, reportedPrice, value }] }
 */
export async function fetchHoldings(managerId) {
  const res = await fetch(`${BASE}/holdings.php?m=${managerId}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Dataroma holdings for ${managerId}: ${res.status}`);
  const html = await res.text();

  // Extract filing date (e.g., "Q4 2025, Portfolio date: 31 Dec 2025")
  const dateMatch = html.match(/Portfolio date:\s*(\d{1,2}\s+\w+\s+\d{4})/i);
  const filingDate = dateMatch ? dateMatch[1] : null;

  // Extract investor name from page
  const nameMatch = html.match(/<title>([^<]+)<\/title>/);
  const name = nameMatch ? nameMatch[1].replace(/ - Dataroma.*$/i, '').trim() : managerId;

  const holdings = [];

  // Parse table rows - each holding has: ticker-company, weight%, shares, price, value
  // Match rows containing stock data: look for ticker patterns like "AAPL - Apple Inc."
  const rowRe = /<td[^>]*>\s*<a[^>]*>([A-Z][A-Z0-9.]+)\s*-\s*([^<]+)<\/a>\s*<\/td>/g;
  const rows = html.split(/<tr[^>]*>/);

  for (const row of rows) {
    // Find ticker + company
    const tickerMatch = row.match(/<a[^>]*>([A-Z][A-Z0-9.]{0,8})\s*-\s*([^<]+)<\/a>/);
    if (!tickerMatch) continue;

    const ticker = tickerMatch[1].trim();
    const company = tickerMatch[2].trim();

    // Find all td values in this row
    const tdValues = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let tdMatch;
    while ((tdMatch = tdRe.exec(row)) !== null) {
      tdValues.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    // Weight % is typically the first numeric value after ticker
    let weightPct = null;
    let shares = null;
    let reportedPrice = null;
    let value = null;

    for (const val of tdValues) {
      const clean = val.replace(/[$,%]/g, '').replace(/,/g, '').trim();
      const num = parseFloat(clean);
      if (isNaN(num)) continue;
      if (weightPct === null && num > 0 && num <= 100) { weightPct = num; continue; }
      if (shares === null && num > 100) { shares = num; continue; }
      if (reportedPrice === null && num > 0 && num < 100000) { reportedPrice = num; continue; }
      if (value === null && num > 100000) { value = num; continue; }
    }

    if (ticker && weightPct !== null) {
      holdings.push({ ticker, company, weightPct, shares, reportedPrice, value });
    }
  }

  return { managerId, name, filingDate, holdings };
}

/**
 * Fetch all superinvestors and their holdings.
 * Caches results to data/dataroma-cache.json.
 * Pass forceRefresh=true to re-scrape even if cache exists and is fresh.
 */
export async function fetchAllSuperinvestors({ delayMs = 1500, forceRefresh = false, cachePath = null } = {}) {
  // Check cache first
  if (cachePath && !forceRefresh) {
    try {
      const { promises: fs } = await import('node:fs');
      const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
      const ageHours = (Date.now() - new Date(cached.fetchedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) {
        console.log(`[DATAROMA] Using cached data (${ageHours.toFixed(1)}h old, ${cached.investors.length} investors)`);
        return cached;
      }
    } catch { /* cache miss, proceed with fetch */ }
  }

  console.log('[DATAROMA] Fetching superinvestor list...');
  const list = await fetchSuperinvestorList();
  console.log(`[DATAROMA] Found ${list.length} superinvestors. Fetching holdings...`);

  const investors = [];
  for (const inv of list) {
    try {
      await delay(delayMs);
      const data = await fetchHoldings(inv.managerId);
      investors.push(data);
      console.log(`  [${investors.length}/${list.length}] ${data.name}: ${data.holdings.length} holdings`);
    } catch (err) {
      console.log(`  [SKIP] ${inv.name}: ${err.message}`);
    }
  }

  const result = { fetchedAt: new Date().toISOString(), investors };

  // Save cache
  if (cachePath) {
    const { promises: fs } = await import('node:fs');
    await fs.writeFile(cachePath, JSON.stringify(result, null, 2));
    console.log(`[DATAROMA] Cached ${investors.length} investors to ${cachePath}`);
  }

  return result;
}
```

**Step 2: Test the scraper standalone**

Run: `node -e "import('./scripts/scrape-dataroma.mjs').then(m => m.fetchSuperinvestorList().then(l => console.log(l.length, 'investors found', l.slice(0,3))))"`
Expected: Prints ~82 investors with managerId and name.

**Step 3: Commit**

```bash
git add scripts/scrape-dataroma.mjs
git commit -m "feat: add Dataroma superinvestor scraper module"
```

---

### Task 2: Integrate scraper into build pipeline

**Files:**
- Modify: `scripts/build-dashboard-data.mjs`

**Step 1: Import scraper and fetch data at build time**

At the top of `build-dashboard-data.mjs`, add the import and modify `main()`:

```js
import { fetchAllSuperinvestors } from './scrape-dataroma.mjs';
```

In `main()`, after the existing file reads (~line 756), add:

```js
// Fetch Dataroma superinvestor data (cached for 24h)
const dataromaCachePath = path.join(dataDir, 'dataroma-cache.json');
const dataromaData = await fetchAllSuperinvestors({ cachePath: dataromaCachePath });
```

**Step 2: Replace hardcoded superinvestorPortfolios with scraped data**

After fetching dataroma data, convert scraped holdings into the same format the existing `buildSuperinvestorMember()` expects. Since we only have *current* holdings (not quarterly history), we create a single-quarter entry for each investor:

```js
// Build superinvestor portfolio definitions from Dataroma scrape
const scrapedSuperinvestorPortfolios = dataromaData.investors
  .filter(inv => inv.holdings.length > 0)
  .map(inv => {
    // Create a single-quarter snapshot using current holdings
    const latestQuarter = '2025-12-31'; // most recent 13F quarter
    const quarterData = {};
    for (const h of inv.holdings) {
      quarterData[h.ticker] = h.weightPct;
    }
    // Create a stable ID from managerId
    const id = inv.managerId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return {
      id: `DATAROMA_${id}`,
      label: inv.name,
      shortLabel: inv.name.split(' - ')[0].split(' (')[0].trim(),
      source: `${inv.name} 13F via Dataroma`,
      managerId: inv.managerId,
      holdings: inv.holdings, // preserve raw holdings for market cap filtering
      quarters: { [latestQuarter]: quarterData },
    };
  });
```

Keep the existing hardcoded `superinvestorPortfolios` (Li Lu, Buffett, Norbert) as they have full quarterly history. Merge them:

```js
// Existing hardcoded investors (with quarterly history) take priority
const hardcodedIds = new Set(superinvestorPortfolios.map(p => p.id));
const hardcodedManagerMap = { LI_LU: 'HC', BUFFETT: 'BRK', NORBERT: 'PC' };

const mergedSuperinvestorPortfolios = [
  ...superinvestorPortfolios, // keep full quarterly history
  ...scrapedSuperinvestorPortfolios.filter(p => {
    // Skip if we already have this investor with full quarterly data
    return !Object.values(hardcodedManagerMap).includes(p.managerId);
  }),
];
```

**Step 3: Collect all scraped tickers for Yahoo Finance fetching**

Update the `symbolsToFetch` array to include scraped tickers:

```js
const scrapedSymbols = dataromaData.investors.flatMap(inv =>
  inv.holdings.map(h => h.ticker)
);

const symbolsToFetch = uniqueBy([
  benchmarkSymbol,
  'TRYUSD=X',
  ...new Set([
    ...positions.map((row) => row.ticker),
    ...holdings.filter((row) => row.symbol !== 'CASH').map((row) => row.symbol),
    ...singleTickerMembers.map((stm) => stm.ticker),
    ...superinvestorSymbols,
    ...scrapedSymbols,
  ]),
], (value) => value);
```

**Step 4: Build superinvestor members using merged list**

Replace the existing superinvestor build loop (~line 1171):

```js
const superinvestorMembers = mergedSuperinvestorPortfolios.map((portfolio) =>
  buildSuperinvestorMember(portfolio, priceSeries, baseDates, spyPriceByDate, modelEndDate)
).filter(Boolean);
```

**Step 5: Run build and verify**

Run: `npm run build:data`
Expected: Console shows Dataroma fetch (or cache hit), then builds all superinvestor members. `dist/dashboard-data.json` should have ~80+ members with `strategyType: 'superinvestor'`.

**Step 6: Commit**

```bash
git add scripts/build-dashboard-data.mjs
git commit -m "feat: integrate Dataroma scraper into build pipeline"
```

---

### Task 3: Add market cap data from Yahoo Finance

**Files:**
- Modify: `scripts/build-dashboard-data.mjs`

**Step 1: Create a market cap fetcher**

Add this function to `build-dashboard-data.mjs`:

```js
async function fetchMarketCaps(tickers) {
  const caps = {};
  for (const ticker of tickers) {
    try {
      const yahooTicker = encodeURIComponent(toYahooSymbol(ticker));
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`;
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' } });
      if (!res.ok) continue;
      const payload = await res.json();
      const meta = payload?.chart?.result?.[0]?.meta;
      if (meta?.marketCap) {
        caps[ticker] = meta.marketCap;
      } else if (meta?.regularMarketPrice && meta?.sharesOutstanding) {
        caps[ticker] = meta.regularMarketPrice * meta.sharesOutstanding;
      }
    } catch { /* skip */ }
  }
  return caps;
}
```

Note: Yahoo Finance v8 chart endpoint includes `meta.marketCap` for many tickers. If that field is not available, we fall back to `price * sharesOutstanding`. If neither works, we skip the ticker.

**Step 2: Fetch market caps for all unique superinvestor tickers**

In `main()`, after building `priceSeries`, add:

```js
// Fetch market caps for all unique tickers across superinvestors
const allSuperTickers = [...new Set(
  mergedSuperinvestorPortfolios.flatMap(p =>
    Object.values(p.quarters).flatMap(q => Object.keys(q))
  )
)];
console.log(`[MCAP] Fetching market caps for ${allSuperTickers.length} unique tickers...`);
const marketCaps = await fetchMarketCaps(allSuperTickers);
console.log(`[MCAP] Got market caps for ${Object.keys(marketCaps).length} tickers`);
```

**Step 3: Attach market cap to superinvestor holdings in output**

In `buildSuperinvestorMember`, modify the `currentHoldings` construction (~line 287) to include market cap:

Add a `marketCaps` parameter to `buildSuperinvestorMember`:

```js
function buildSuperinvestorMember(portfolio, priceSeries, baseDates, spyPriceByDate, modelEndDate, marketCaps = {}) {
```

Then in the `currentHoldings` mapping, add:

```js
marketCap: marketCaps[ticker] ?? null,
```

And pass `marketCaps` when calling:

```js
const superinvestorMembers = mergedSuperinvestorPortfolios.map((portfolio) =>
  buildSuperinvestorMember(portfolio, priceSeries, baseDates, spyPriceByDate, modelEndDate, marketCaps)
).filter(Boolean);
```

**Step 4: Add market cap to the member output**

In the return value of `buildSuperinvestorMember` (~line 301), add to `stats`:

```js
holdings: currentHoldings, // already includes marketCap per holding
```

**Step 5: Run build and verify market caps**

Run: `npm run build:data`
Then: `node -e "const d=require('./dist/dashboard-data.json'); const s=d.members.find(m=>m.id==='BUFFETT'); console.log(s.holdings.slice(0,3).map(h=>({t:h.ticker,mc:h.marketCap})))"`
Expected: Shows tickers with marketCap values (large numbers like 3e12 for AAPL).

**Step 6: Commit**

```bash
git add scripts/build-dashboard-data.mjs
git commit -m "feat: add market cap data per holding from Yahoo Finance"
```

---

### Task 4: Dynamic color generation for many superinvestors

**Files:**
- Modify: `src/lib/constants.js`

**Step 1: Add dynamic color generation**

The existing `SERIES_COLORS` map only has 12 hardcoded entries. With ~82 superinvestors we need dynamic colors. Update `getSeriesAppearance`:

```js
// Generate a stable color from a string ID using a hash
function hashColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const sat = 40 + (Math.abs(hash >> 8) % 30); // 40-70%
  const lum = 30 + (Math.abs(hash >> 16) % 25); // 30-55%
  return `hsl(${hue}, ${sat}%, ${lum}%)`;
}

export function getSeriesAppearance(id) {
  const color = SERIES_COLORS[id];
  const rawColor = SERIES_RAW_COLORS[id];
  if (color && rawColor) {
    return { color, rawColor, kindLabel: SERIES_KIND_LABELS[id] ?? 'Series' };
  }
  // Dynamic color for scraped superinvestors
  const generated = hashColor(id);
  return { color: generated, rawColor: generated, kindLabel: 'Superinvestor' };
}
```

**Step 2: Commit**

```bash
git add src/lib/constants.js
git commit -m "feat: dynamic color generation for scraped superinvestors"
```

---

### Task 5: Update useModel to handle many superinvestors

**Files:**
- Modify: `src/hooks/useModel.js`

**Step 1: Update model to pass through market cap data**

The `superinvestorMembers` mapping in `useModel.js` (~line 65) already pulls from `rawData.members`. Add `holdings` to the series object:

```js
const superinvestorMembers = rawData.members
  .filter((m) => m.strategyType === 'superinvestor')
  .map((m) => ({
    id: m.id,
    label: m.label,
    shortLabel: m.shortLabel ?? m.label,
    kind: 'superinvestor',
    returnPctSeries: m.chart?.portfolioReturnPctSeries ?? [],
    totalReturnPct: m.stats?.portfolioReturnPct ?? null,
    annualizedReturnPct: m.stats?.annualizedPortfolioReturnPct ?? null,
    description: m.description ?? `${m.label} backtested portfolio.`,
    note: `Static-weight backtest from 13F filings. ${m.stats?.holdingCount ?? 0} holdings.`,
    holdings: m.holdings ?? [], // includes marketCap per holding
  }));
```

Also add a `allMarketCaps` summary to the model for the slider to know the global range:

```js
// Collect all market caps across all superinvestors for slider bounds
const allMarketCaps = superinvestorMembers
  .flatMap(sm => (sm.holdings || []).map(h => h.marketCap).filter(Boolean));
const marketCapRange = allMarketCaps.length
  ? { min: Math.min(...allMarketCaps), max: Math.max(...allMarketCaps) }
  : { min: 0, max: 5e12 };
```

Add `marketCapRange` to the returned model object.

**Step 2: Commit**

```bash
git add src/hooks/useModel.js
git commit -m "feat: pass market cap data through useModel"
```

---

### Task 6: Create MarketCapSlider component

**Files:**
- Create: `src/components/ui/MarketCapSlider.jsx`

**Step 1: Build the dual-handle logarithmic slider**

```jsx
import { useMemo, useCallback, useRef } from 'react';

const MIN_CAP = 0;
const MAX_CAP = 5e12; // $5T
const LOG_MIN = 0; // log10(1) = 0, but we'll use 0 for the low end
const LOG_MAX = Math.log10(MAX_CAP); // ~12.7

function capToSlider(cap) {
  if (cap <= 0) return 0;
  return Math.log10(Math.max(cap, 1)) / LOG_MAX * 100;
}

function sliderToCap(pct) {
  if (pct <= 0) return 0;
  return Math.pow(10, (pct / 100) * LOG_MAX);
}

function formatCap(value) {
  if (value <= 0) return '$0';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

export default function MarketCapSlider({ capMin, capMax, onChange }) {
  const trackRef = useRef(null);
  const minPct = capToSlider(capMin);
  const maxPct = capToSlider(capMax);

  const handleMinChange = useCallback((e) => {
    const val = Number(e.target.value);
    const newMin = sliderToCap(val);
    onChange([newMin, capMax]);
  }, [capMax, onChange]);

  const handleMaxChange = useCallback((e) => {
    const val = Number(e.target.value);
    const newMax = sliderToCap(val);
    onChange([capMin, newMax]);
  }, [capMin, onChange]);

  // Tick marks at key market cap thresholds
  const ticks = useMemo(() => [
    { label: '$1B', value: 1e9 },
    { label: '$10B', value: 1e10 },
    { label: '$100B', value: 1e11 },
    { label: '$1T', value: 1e12 },
  ], []);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-medium">
          Market Cap: <span className="text-ink">{formatCap(capMin)}</span>
        </span>
        <span>to <span className="text-ink">{formatCap(capMax)}</span></span>
      </div>
      <div className="relative" ref={trackRef}>
        {/* Filled range highlight */}
        <div
          className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded bg-ink/20"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={minPct}
          onChange={handleMinChange}
          className="slider-range pointer-events-auto absolute inset-0 w-full cursor-pointer"
          style={{ zIndex: minPct > 50 ? 5 : 3 }}
          aria-label="Minimum market cap"
        />
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={maxPct}
          onChange={handleMaxChange}
          className="slider-range pointer-events-auto w-full cursor-pointer"
          style={{ zIndex: maxPct < 50 ? 5 : 3 }}
          aria-label="Maximum market cap"
        />
        {/* Tick marks */}
        <div className="pointer-events-none relative h-3 -mt-1">
          {ticks.map((t) => (
            <span
              key={t.label}
              className="absolute -translate-x-1/2 text-[0.6rem] text-muted/60"
              style={{ left: `${capToSlider(t.value)}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/MarketCapSlider.jsx
git commit -m "feat: add logarithmic dual-handle MarketCapSlider component"
```

---

### Task 7: Wire market cap filtering into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add market cap state**

Add to the state declarations in `App()`:

```js
const [capRange, setCapRange] = useState([0, 5e12]);
```

Import the slider:

```js
import MarketCapSlider from './components/ui/MarketCapSlider';
```

**Step 2: Add filtering logic**

Add a `useMemo` that filters superinvestor series based on cap range:

```js
// Filter superinvestor holdings by market cap range
const { filteredSeriesIds, holdingsMatchCounts } = useMemo(() => {
  if (!model) return { filteredSeriesIds: new Set(), holdingsMatchCounts: {} };
  const [minCap, maxCap] = capRange;
  const matchCounts = {};
  const passIds = new Set();

  for (const s of model.comparisonSeries) {
    if (s.kind !== 'superinvestor') {
      passIds.add(s.id); // non-superinvestors always pass
      continue;
    }
    const holdings = s.holdings ?? [];
    const matching = holdings.filter(h => {
      if (!h.marketCap) return true; // include if no cap data
      return h.marketCap >= minCap && h.marketCap <= maxCap;
    });
    matchCounts[s.id] = { matched: matching.length, total: holdings.length };
    if (matching.length > 0) passIds.add(s.id);
  }

  return { filteredSeriesIds: passIds, holdingsMatchCounts: matchCounts };
}, [model, capRange]);
```

**Step 3: Apply filter to allToggleSeries**

Update the `allToggleSeries` memo to include match info:

```js
const allToggleSeries = useMemo(() => {
  if (!model) return [];
  const chartSeries = model.comparisonSeries.map((s) => ({
    id: s.id,
    label: s.shortLabel ?? s.label,
    dimmed: !filteredSeriesIds.has(s.id),
    matchCount: holdingsMatchCounts[s.id] ?? null,
  }));
  const pendingIds = new Set(chartSeries.map((s) => s.id));
  const pendingViews = model.views
    .filter((v) => v.kind === 'pending' && !pendingIds.has(v.id))
    .map((v) => ({ id: v.id, label: v.label, dimmed: false, matchCount: null }));
  return [...chartSeries, ...pendingViews];
}, [model, filteredSeriesIds, holdingsMatchCounts]);
```

**Step 4: Render MarketCapSlider in the controls area**

In the JSX, add the slider after `TimeRangeSlider`:

```jsx
<MarketCapSlider
  capMin={capRange[0]}
  capMax={capRange[1]}
  onChange={setCapRange}
/>
```

**Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire market cap filter state and slider into App"
```

---

### Task 8: Update FocusTabs to show dimmed/filtered superinvestors

**Files:**
- Modify: `src/components/focus/FocusTabs.jsx`

**Step 1: Update FocusTabs to accept dimmed state and match counts**

The `allSeries` items now have `dimmed` and `matchCount` fields. Update `FilterChip` and the rendering:

```jsx
function FilterChip({ on, onClick, children, dimmed, matchInfo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
        dimmed
          ? 'border-line/50 bg-white/50 text-muted/50 opacity-50'
          : on
            ? 'border-ink bg-ink text-white shadow-md'
            : 'border-line bg-white text-ink hover:border-ink hover:shadow-sm'
      }`}
    >
      {children}
      {matchInfo && (
        <span className="ml-1 text-[0.65rem] opacity-70">
          {matchInfo.matched}/{matchInfo.total}
        </span>
      )}
    </button>
  );
}
```

Update the chip rendering to pass `dimmed` and `matchInfo`:

```jsx
<FilterChip
  key={item.id}
  on={isOn}
  dimmed={item.dimmed}
  matchInfo={item.matchCount}
  onClick={() => { ... }}
>
```

**Step 2: Remove hardcoded SUPERINVESTOR_IDS**

Replace the hardcoded `Set(['LI_LU', 'BUFFETT', 'NORBERT'])` with a dynamic check. The `views` prop already contains kind information. Or pass `comparisonSeries` to identify superinvestors:

```jsx
const superIds = new Set(
  allSeries.filter(item => {
    // Check if this series is a superinvestor via views
    const view = views.find(v => v.id === item.id);
    return view?.kind === 'superinvestor';
  }).map(item => item.id)
);
const brosSeries = allSeries.filter(item => !superIds.has(item.id));
const superSeries = allSeries.filter(item => superIds.has(item.id));
```

**Step 3: Commit**

```bash
git add src/components/focus/FocusTabs.jsx
git commit -m "feat: show dimmed superinvestors and match counts in FocusTabs"
```

---

### Task 9: Filter holdings in SuperinvestorDetail

**Files:**
- Modify: `src/components/detail/SuperinvestorDetail.jsx`
- Modify: `src/App.jsx` (pass capRange to DetailRouter)

**Step 1: Pass capRange through to DetailRouter**

In `App.jsx`, update the DetailRouter call:

```jsx
<DetailRouter view={activeViewObj} model={model} onSetSeries={handleSetSeries} capRange={capRange} />
```

**Step 2: Update DetailRouter to pass capRange**

In `src/components/detail/DetailRouter.jsx`, accept `capRange` and pass it to SuperinvestorDetail:

```jsx
case 'superinvestor':
  return <SuperinvestorDetail view={view} onSetSeries={onSetSeries} capRange={capRange} />;
```

**Step 3: Filter holdings in SuperinvestorDetail**

Add filtering logic to `SuperinvestorDetail`:

```jsx
export default function SuperinvestorDetail({ view, onSetSeries, capRange }) {
  const payload = view.payload;
  const stats = payload?.stats ?? {};
  const allHoldings = payload?.holdings ?? [];
  const [minCap, maxCap] = capRange ?? [0, 5e12];

  const filteredHoldings = allHoldings.filter(h => {
    if (!h.marketCap) return true;
    return h.marketCap >= minCap && h.marketCap <= maxCap;
  });

  // Show filtered count
  const filterActive = filteredHoldings.length < allHoldings.length;
```

Use `filteredHoldings` instead of `holdings` in the DataTable. Add a market cap column:

```jsx
columns={[
  {
    label: 'Ticker',
    render: (row) => (
      <div className="flex items-center gap-2">
        <TickerLogo ticker={row.ticker} />
        <span className="font-mono font-medium">{row.ticker}</span>
      </div>
    ),
  },
  {
    label: 'Weight',
    render: (row) => formatPercent(row.weight, 1, false),
  },
  {
    label: 'Mkt Cap',
    render: (row) => row.marketCap ? formatMarketCap(row.marketCap) : '—',
  },
  {
    label: '5yr Return',
    render: (row) => (
      <span className="font-mono font-medium">
        {row.returnPct != null ? formatPercent(row.returnPct) : '—'}
      </span>
    ),
  },
]}
rows={filteredHoldings.slice(0, 10)}
```

Add a helper for formatting market caps (add to `src/lib/formatters.js`):

```js
export function formatMarketCap(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}
```

**Step 4: Show filter status**

Add a small note when filter is active:

```jsx
{filterActive && (
  <p className="text-xs text-muted">
    Showing {filteredHoldings.length} of {allHoldings.length} holdings in selected market cap range
  </p>
)}
```

**Step 5: Commit**

```bash
git add src/components/detail/SuperinvestorDetail.jsx src/components/detail/DetailRouter.jsx src/App.jsx src/lib/formatters.js
git commit -m "feat: filter superinvestor holdings by market cap range"
```

---

### Task 10: Add .gitignore entry for cache and run full integration test

**Files:**
- Modify: `.gitignore`

**Step 1: Add cache file to .gitignore**

Add `data/dataroma-cache.json` to `.gitignore` so the potentially large cache file isn't committed.

**Step 2: Run full build**

Run: `npm run build:data`
Expected: Scrapes Dataroma (or uses cache), fetches market caps, builds all members, writes dashboard-data.json.

**Step 3: Run dev server and verify**

Run: `npm run dev`
Expected:
- App loads with ~82 superinvestors in the FocusTabs Superinvestors section
- MarketCapSlider appears below the time range slider
- Dragging the slider dims/hides superinvestors with no holdings in range
- Clicking a superinvestor shows filtered holdings in the detail view
- Match count badges show on superinvestor chips (e.g., "5/8")

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore Dataroma cache file"
```

---

## Execution Notes

- **Rate limiting**: The scraper uses a 1.5s delay between Dataroma requests. Full scrape takes ~2 minutes for 82 investors. Cache lasts 24 hours.
- **Yahoo Finance market cap**: Some tickers may not return market cap data. Those holdings pass through the filter regardless (shown in all cap ranges).
- **Hardcoded vs scraped**: Li Lu, Buffett, and Norbert keep their full quarterly history for accurate backtesting. All other scraped investors use single-quarter current holdings only.
- **UI overflow**: With 82 superinvestors, FocusTabs will need to scroll horizontally or wrap. The existing `flex-wrap` handles this.
