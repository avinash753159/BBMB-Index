/**
 * Nancy Pelosi quarterly portfolio snapshots (estimated weights %).
 *
 * Methodology:
 *   1. Starting positions estimated from govtrades.com cumulative holdings,
 *      pelositracker.app current weights, and CapitolTrades.com trade records.
 *   2. Trades applied using midpoints of disclosed ranges:
 *        $1K-15K -> $8K,  $15K-50K -> $32.5K,  $50K-100K -> $75K,
 *        $100K-250K -> $175K,  $250K-500K -> $375K,  $500K-1M -> $750K,
 *        $1M-5M -> $3M,  $5M-25M -> $15M
 *   3. Positions accumulated (buys add, sells subtract).
 *   4. Weights normalized to sum to 100% each quarter.
 *   5. Only publicly-traded equities included (private LLCs, real-estate funds excluded).
 *   6. Call-option exercises treated as purchases at the disclosed range.
 *
 * Sources:
 *   - capitoltrades.com/trades?politician=P000197
 *   - pelositracker.app/portfolios/nancy-pelosi
 *   - govtrades.com/house-stock-tracker/nancy-pelosi/portfolio
 *   - stockcircle.com/congress-stock-trades/nancy-pelosi
 *   - Various news articles (Yahoo Finance, Fox Business, Investing.com)
 *
 * Generated: 2026-03-14
 */

export const pelosiQuarterlySnapshots = {
  // ─── 2023 ───────────────────────────────────────────────────────
  //
  // Pre-2023 base portfolio (from govtrades cumulative + news):
  //   AAPL ~$30M, MSFT ~$10M, GOOGL ~$6M, NVDA ~$5M, AMZN ~$5M,
  //   CRM ~$6M, DIS ~$11M, TSLA ~$4.5M, NFLX ~$4M, CRWD ~$1M,
  //   AB ~$3M, PYPL ~$3.5M, V ~$3M, RBLX ~$1M

  // Q1 2023: No trades in Q1 itself
  '2023-03-31': {
    AAPL: 32.0, DIS: 12.0, MSFT: 10.5, CRM: 6.5, GOOGL: 6.5,
    NVDA: 5.5, AMZN: 5.5, TSLA: 4.8, NFLX: 4.3, PYPL: 3.7,
    AB: 3.2, V: 3.2, RBLX: 1.2, CRWD: 1.1,
  },

  // Q2 2023: AAPL buy $750K (Apr 7), AAPL exchange $750K (Jun 7),
  //          AAPL buy $375K (Jun 23), MSFT buy $750K (Jun 23)
  '2023-06-30': {
    AAPL: 34.2, MSFT: 11.7, DIS: 11.4, CRM: 6.1, GOOGL: 6.1,
    NVDA: 5.3, AMZN: 5.3, TSLA: 4.4, NFLX: 4.1, PYPL: 3.5,
    AB: 2.9, V: 2.9, RBLX: 1.1, CRWD: 1.0,
  },

  // Q3 2023: No trades reported this quarter
  '2023-09-30': {
    AAPL: 34.1, MSFT: 11.7, DIS: 11.4, CRM: 6.1, GOOGL: 6.1,
    NVDA: 5.6, AMZN: 5.3, TSLA: 4.1, NFLX: 4.1, PYPL: 3.5,
    AB: 3.0, V: 3.0, RBLX: 1.0, CRWD: 1.0,
  },

  // Q4 2023: NVDA buy $3M (Dec 22)
  '2023-12-31': {
    AAPL: 31.7, DIS: 10.9, MSFT: 10.9, NVDA: 8.8, CRM: 5.7,
    GOOGL: 5.7, AMZN: 5.2, TSLA: 3.9, NFLX: 3.9, PYPL: 3.3,
    CRWD: 3.3, AB: 2.9, V: 2.9, RBLX: 0.9,
  },

  // ─── 2024 ───────────────────────────────────────────────────────

  // Q1 2024: PANW buy $750K + $175K (Feb 26)
  '2024-03-31': {
    AAPL: 30.8, DIS: 10.6, MSFT: 10.6, NVDA: 9.3, CRM: 5.5,
    GOOGL: 5.5, AMZN: 5.0, TSLA: 3.8, NFLX: 3.6, CRWD: 3.6,
    PYPL: 3.2, V: 2.8, AB: 2.8, PANW: 2.1, RBLX: 0.8,
  },

  // Q2 2024: AVGO buy $3M (Jul 3), NVDA buy $3M (Jul 3),
  //          TSLA sell $375K (Jul 3), V sell $750K (Jul 3)
  '2024-06-30': {
    AAPL: 27.7, NVDA: 13.1, DIS: 10.0, MSFT: 10.0, CRM: 5.3,
    GOOGL: 5.3, AMZN: 4.7, CRWD: 3.7, NFLX: 3.4, AVGO: 3.2,
    TSLA: 3.2, PYPL: 2.9, AB: 2.6, PANW: 2.1, V: 2.1, RBLX: 0.7,
  },

  // Q3 2024: NVDA buy $3M (Jul 31), MSFT sell $3M (Jul 31)
  '2024-09-30': {
    AAPL: 25.1, NVDA: 16.6, DIS: 9.4, MSFT: 7.3, AVGO: 5.7,
    CRM: 5.0, GOOGL: 5.0, AMZN: 4.4, PANW: 3.6, CRWD: 3.6,
    NFLX: 3.3, TSLA: 3.1, PYPL: 2.9, AB: 2.5, V: 1.9, RBLX: 0.6,
  },

  // Q4 2024: AAPL sell $15M (Dec 31, $5M-25M range)
  '2024-12-31': {
    NVDA: 19.3, AAPL: 12.3, DIS: 10.7, MSFT: 8.6, AVGO: 7.0,
    GOOGL: 5.9, CRM: 5.9, AMZN: 5.2, PANW: 4.3, CRWD: 4.3,
    NFLX: 3.9, TSLA: 3.6, PYPL: 3.2, AB: 2.9, V: 2.1, RBLX: 0.8,
  },

  // ─── 2025 ───────────────────────────────────────────────────────

  // Q1 2025: AAPL sell $15M (Jan 20), NVDA sell $3M + buy $750K + $375K
  //          (net sell ~$1.875M), GOOGL buy $375K, AMZN buy $375K,
  //          PANW buy $3M, TEM buy $75K, VST buy $750K
  '2025-03-31': {
    NVDA: 17.2, DIS: 10.9, AVGO: 8.9, MSFT: 8.9, PANW: 8.3,
    GOOGL: 6.8, CRM: 6.0, AMZN: 6.0, CRWD: 4.7, NFLX: 4.0,
    TSLA: 3.8, AAPL: 3.6, PYPL: 3.1, AB: 2.9, V: 2.3, VST: 1.6,
    RBLX: 0.7, TEM: 0.3,
  },

  // Q2 2025: No trades reported (next filing Jul 10)
  '2025-06-30': {
    NVDA: 17.6, DIS: 11.0, AVGO: 9.4, MSFT: 8.6, PANW: 8.4,
    GOOGL: 6.8, AMZN: 6.1, CRM: 5.8, CRWD: 4.7, AAPL: 3.7,
    NFLX: 3.7, TSLA: 3.7, PYPL: 2.9, AB: 2.9, V: 2.1, VST: 1.6,
    RBLX: 0.7, TEM: 0.3,
  },

  // Q3 2025: AVGO buy $3M (Jul 10, exercise 200 calls),
  //          MATW sell $32.5K, AAPL sell $175K (Oct 27)
  '2025-09-30': {
    NVDA: 16.6, AVGO: 13.4, DIS: 10.5, MSFT: 8.3, PANW: 8.0,
    GOOGL: 6.6, AMZN: 5.9, CRM: 5.6, CRWD: 4.5, NFLX: 3.7,
    TSLA: 3.5, AAPL: 3.2, PYPL: 2.9, AB: 2.8, V: 2.0, VST: 1.6,
    RBLX: 0.6, TEM: 0.3,
  },

  // Q4 2025: PYPL sell $375K (Dec 30), DIS sell $3M (Dec 30),
  //          AAPL buy $375K calls (Dec 30)
  '2025-12-31': {
    NVDA: 17.3, AVGO: 14.2, PANW: 8.4, MSFT: 8.4, DIS: 7.3,
    GOOGL: 6.8, AMZN: 6.1, CRM: 5.8, CRWD: 4.7, AAPL: 4.0,
    NFLX: 3.7, TSLA: 3.7, AB: 2.9, PYPL: 2.1, V: 2.1, VST: 1.6,
    RBLX: 0.6, TEM: 0.3,
  },

  // ─── 2026 ───────────────────────────────────────────────────────
  //
  // Jan 2026 filing (massive rebalance):
  //   AAPL sell $15M + $15M, buy $375K
  //   GOOGL sell $3M, buy $750K + $375K
  //   AMZN sell $3M, buy $175K + $750K
  //   NVDA sell $3M, buy $175K + $375K
  //   DIS sell $3M
  //   AB buy $3M, TEM buy $75K, VST buy $175K
  //
  // Current weights from pelositracker.app (as of ~Mar 2026):
  '2026-03-31': {
    NVDA: 19.4, GOOGL: 16.3, AVGO: 15.3, VST: 10.2, PANW: 7.1,
    TEM: 6.1, AMZN: 6.1, CRWD: 5.1, AB: 5.1, MSFT: 3.1,
    TSLA: 3.1, AAPL: 3.1,
  },
};

/**
 * Ticker list (union of all tickers across all quarters).
 */
export const pelosiTickers = [
  ...new Set(
    Object.values(pelosiQuarterlySnapshots).flatMap(Object.keys)
  ),
].sort();

export default pelosiQuarterlySnapshots;
