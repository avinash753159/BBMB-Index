/**
 * scrape-dataroma.mjs
 *
 * Scrapes Dataroma.com for superinvestor 13F holdings data.
 * Exports three functions:
 *   - fetchSuperinvestorList()
 *   - fetchHoldings(managerId)
 *   - fetchAllSuperinvestors({ delayMs, forceRefresh, cachePath })
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://www.dataroma.com/m';
const USER_AGENT = 'Mozilla/5.0';
const DEFAULT_DELAY_MS = 1500;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Small helper: sleep for `ms` milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a page from Dataroma with a browser-like user-agent.
 */
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.text();
}

/**
 * Fetch the list of all superinvestors from Dataroma.
 * Returns an array of { managerId, name }.
 */
export async function fetchSuperinvestorList() {
  const html = await fetchPage(`${BASE_URL}/managers.php`);

  const results = [];
  // Match links like: holdings.php?m=BRK">Warren Buffett - Berkshire Hathaway</a>
  const linkRegex = /holdings\.php\?m=([^"&]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const managerId = match[1].trim();
    const name = match[2].trim();
    // Skip empty or obviously invalid entries
    if (managerId && name) {
      results.push({ managerId, name });
    }
  }

  return results;
}

/**
 * Fetch a single investor's holdings from Dataroma.
 * Returns { managerId, name, filingDate, holdings: [...] }
 */
export async function fetchHoldings(managerId) {
  const url = `${BASE_URL}/holdings.php?m=${encodeURIComponent(managerId)}`;
  const html = await fetchPage(url);

  // Extract investor name from <div id="f_name">Warren Buffett - Berkshire Hathaway</div>
  let name = managerId;
  const nameMatch = html.match(/<div\s+id="f_name"[^>]*>([^<]+)<\/div>/i);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }

  // Extract filing / portfolio date from: Portfolio date: <span>31 Dec 2025</span>
  let filingDate = null;
  const dateMatch = html.match(/Portfolio\s+date:\s*<span>([^<]+)<\/span>/i);
  if (dateMatch) {
    filingDate = parseDataromaDate(dateMatch[1].trim());
  }

  // Extract holdings from the table.
  // Each row has this structure:
  //   <td class="hist">...</td>
  //   <td class="stock"><a href="...">AAPL<span> - Apple Inc.</span></a></td>
  //   <td>22.60</td>              (% of portfolio)
  //   <td class="...">...</td>    (recent activity)
  //   <td>227,917,808</td>        (shares)
  //   <td>$271.86</td>            (reported price)
  //   <td>$61,961,735,000</td>    (value)
  //   ... (current price, etc.)
  const holdings = [];

  // Match each stock cell and then parse the surrounding row
  const stockCellRegex = /<td\s+class="stock">\s*<a[^>]+>([A-Z][A-Z0-9.]*)<span>\s*-\s*([^<]+)<\/span><\/a>\s*<\/td>/gi;
  let stockMatch;

  while ((stockMatch = stockCellRegex.exec(html)) !== null) {
    const ticker = stockMatch[1].trim();
    const company = stockMatch[2].trim();
    const matchEnd = stockMatch.index + stockMatch[0].length;

    // Get the remaining cells in this row (everything after the stock cell until next </tr> or <tr)
    const afterStock = html.substring(matchEnd, matchEnd + 1000);
    const rowEnd = afterStock.search(/<\/tr>/i);
    const rowRest = rowEnd > -1 ? afterStock.substring(0, rowEnd) : afterStock;

    // Extract all <td> contents from the rest of the row
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowRest)) !== null) {
      const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(text);
    }

    // cells[0] = weight% (e.g. "22.60")
    // cells[1] = recent activity (e.g. "Reduce 4.32%" or " ")
    // cells[2] = shares (e.g. "227,917,808")
    // cells[3] = reported price (e.g. "$271.86")
    // cells[4] = value (e.g. "$61,961,735,000")
    // cells[0] = weight%, cells[1] = activity, cells[2] = shares,
    // cells[3] = reported price, cells[4] = value,
    // cells[5] = gap (empty), cells[6] = current price, cells[7] = +/- reported price
    const weightPct = parseFloat(cells[0]) || 0;
    const shares = parseInt((cells[2] || '').replace(/,/g, ''), 10) || 0;
    const reportedPrice = parseFloat((cells[3] || '').replace(/[$,]/g, '')) || 0;
    const value = parseFloat((cells[4] || '').replace(/[$,]/g, '')) || 0;
    const currentPrice = parseFloat((cells[6] || '').replace(/[$,]/g, '')) || null;
    const pctChangeFromReported = parseFloat((cells[7] || '').replace(/[%,]/g, '')) || null;

    if (ticker && weightPct > 0) {
      holdings.push({ ticker, company, weightPct, shares, reportedPrice, value, currentPrice, pctChangeFromReported });
    }
  }

  return { managerId, name, filingDate, holdings };
}

/**
 * Fetch full quarterly history for a single investor.
 * Returns { quarters: { '2025-12-31': { AAPL: 22.6, GOOGL: 18.1, ... }, ... } }
 *
 * The history page has rows like:
 *   <td class="period">2025 &nbsp Q4</td>
 *   <td>$402 M</td>
 *   <td class="sym"><span ...><a href="...">HCC</a><div>...39.47% of portfolio</div></span></td>
 *   ...more <td class="sym"> cells...
 */
export async function fetchHistory(managerId) {
  const url = `${BASE_URL}/hist/p_hist.php?f=${encodeURIComponent(managerId)}`;
  const html = await fetchPage(url);

  const quarters = {};

  // Split into table rows
  const rows = html.split(/<tr[^>]*>/i);

  for (const row of rows) {
    // Find quarter header: <td class="period">2025 &nbsp Q4</td>
    const periodMatch = row.match(/<td\s+class="period"[^>]*>(\d{4})\s*(?:&nbsp;?\s*)?Q([1-4])<\/td>/i);
    if (!periodMatch) continue;

    const year = parseInt(periodMatch[1]);
    const q = parseInt(periodMatch[2]);
    const endMonth = [null, '03', '06', '09', '12'][q];
    const endDay = [null, '31', '30', '30', '31'][q];
    const quarterDate = `${year}-${endMonth}-${endDay}`;

    // Find all sym cells in this row
    const holdingsMap = {};
    const symCellRegex = /<td\s+class="sym">([\s\S]*?)<\/td>/gi;
    let cellMatch;

    while ((cellMatch = symCellRegex.exec(row)) !== null) {
      const cell = cellMatch[1];
      // Extract ticker from <a ...>TICKER</a>
      const tickerMatch = cell.match(/<a[^>]+>([A-Z][A-Z0-9.]{0,8})<\/a>/);
      // Extract percentage from XX.XX% of portfolio
      const pctMatch = cell.match(/(\d{1,3}\.\d{1,2})%\s*of\s*portfolio/);
      if (tickerMatch && pctMatch) {
        const ticker = tickerMatch[1].trim();
        const pct = parseFloat(pctMatch[1]);
        if (pct > 0 && pct <= 100) {
          holdingsMap[ticker] = pct;
        }
      }
    }

    if (Object.keys(holdingsMap).length > 0) {
      quarters[quarterDate] = holdingsMap;
    }
  }

  return { quarters };
}

/**
 * Parse a date string like "31 Dec 2025" into ISO format "2025-12-31".
 */
function parseDataromaDate(str) {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/**
 * Orchestrator: fetch all superinvestors' holdings.
 *
 * Options:
 *   delayMs      - ms to wait between requests (default 1500)
 *   forceRefresh - skip cache check (default false)
 *   cachePath    - path to JSON cache file
 *
 * Returns { fetchedAt, investors: [...] }
 */
export async function fetchAllSuperinvestors({
  delayMs = DEFAULT_DELAY_MS,
  forceRefresh = false,
  cachePath = path.join(process.cwd(), 'data', 'dataroma-cache.json'),
} = {}) {
  // Check cache first
  if (!forceRefresh) {
    try {
      const stat = await fs.stat(cachePath);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs < CACHE_MAX_AGE_MS) {
        console.log(`[dataroma] Using cached data (${(ageMs / 3600000).toFixed(1)}h old): ${cachePath}`);
        const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
        return cached;
      }
    } catch {
      // No cache file or unreadable — continue with fresh fetch
    }
  }

  console.log('[dataroma] Fetching superinvestor list…');
  const managers = await fetchSuperinvestorList();
  console.log(`[dataroma] Found ${managers.length} superinvestors`);

  const investors = [];
  for (let i = 0; i < managers.length; i++) {
    const { managerId, name } = managers[i];
    console.log(`[dataroma] (${i + 1}/${managers.length}) Fetching ${name} [${managerId}]…`);

    try {
      const data = await fetchHoldings(managerId);
      // Fetch full quarterly history
      await sleep(delayMs);
      const history = await fetchHistory(managerId);
      data.quarters = history.quarters;
      investors.push(data);
      const qCount = Object.keys(history.quarters).length;
      console.log(`  → ${data.holdings.length} holdings, ${qCount} quarters, filed ${data.filingDate || '(unknown date)'}`);
    } catch (err) {
      console.warn(`  ⚠ Failed to fetch ${name} [${managerId}]: ${err.message}`);
    }

    // Rate-limit: sleep between requests (skip after last one)
    if (i < managers.length - 1) {
      await sleep(delayMs);
    }
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    investors,
  };

  // Write cache
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`[dataroma] Cached ${investors.length} investors to ${cachePath}`);
  } catch (err) {
    console.warn(`[dataroma] Failed to write cache: ${err.message}`);
  }

  return result;
}

// If run directly: quick test of fetchSuperinvestorList
if (process.argv[1] && (
  process.argv[1].endsWith('scrape-dataroma.mjs') ||
  process.argv[1].replace(/\\/g, '/').endsWith('scrape-dataroma.mjs')
)) {
  (async () => {
    try {
      console.log('Testing fetchSuperinvestorList()…');
      const list = await fetchSuperinvestorList();
      console.log(`Found ${list.length} superinvestors:`);
      list.slice(0, 10).forEach((m) => console.log(`  ${m.managerId} → ${m.name}`));
      if (list.length > 10) console.log(`  … and ${list.length - 10} more`);

      // Also test fetchHoldings with one manager
      if (list.length > 0) {
        const testId = list[0].managerId;
        console.log(`\nTesting fetchHoldings('${testId}')…`);
        const data = await fetchHoldings(testId);
        console.log(`  Name: ${data.name}`);
        console.log(`  Filing date: ${data.filingDate}`);
        console.log(`  Holdings (${data.holdings.length}):`);
        data.holdings.slice(0, 5).forEach((h) =>
          console.log(`    ${h.ticker} (${h.company}) — ${h.weightPct}%`)
        );
      }
    } catch (err) {
      console.error('Test failed:', err);
      process.exit(1);
    }
  })();
}
