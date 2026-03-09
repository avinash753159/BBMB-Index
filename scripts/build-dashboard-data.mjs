import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fetchAllSuperinvestors } from './scrape-dataroma.mjs';

const root = process.cwd();
const dataDir = path.join(root, 'data');

const distDir = path.join(root, 'dist');

const globalWindowStart = '2009-03-05'; // earliest date for fetching prices (Buffett goes back to 2009)
const aviWindowStart = '2021-03-05';    // AVI data only goes back to 2021
const windowEnd = '2026-03-05';
const benchmarkSymbol = 'SPY';

const roughMembers = {
  AVI: { label: 'AVI', status: 'ready', roughSymbols: ['BABA', 'BRK.B', 'CHGG', 'DIDIY', 'OXY', 'SOC', 'BIMAS.IS', 'MU', 'PLTR'] },
  JOEY: { label: 'JOEY', status: 'pending', roughSymbols: ['CHGG', 'OXY'] },
  PRAB: { label: 'PRAB', status: 'pending', roughSymbols: ['FOUR', 'OXY'] },
};

const singleTickerMembers = [
  { id: 'WAGN', label: 'WAGN', ticker: 'WAGN', description: 'WAGN stock performance over the five-year window.' },
];

// Quarterly 13F snapshots from Dataroma (tickers with >= ~1% weight)
// Each quarter maps to the 13F filing date (end of quarter)
const superinvestorPortfolios = [
  {
    id: 'LI_LU',
    label: 'Li Lu',
    shortLabel: 'Li Lu',
    source: 'Himalaya Capital 13F quarterly snapshots via Dataroma',
    managerId: 'HC',
    quarters: {
      '2019-12-31': { MU: 100.00 },
      '2020-03-31': { MU: 84.95, GOOG: 15.05 },
      '2020-06-30': { MU: 55.59, BAC: 17.34, GOOG: 11.61, META: 7.83, AAPL: 4.46, PDD: 3.17 },
      '2020-09-30': { MU: 51.85, BAC: 18.10, GOOG: 11.10, META: 8.78, AAPL: 6.09, PDD: 4.09 },
      '2020-12-31': { MU: 53.93, BAC: 19.90, META: 9.22, GOOG: 8.78, AAPL: 5.33, PDD: 2.85 },
      '2021-03-31': { MU: 51.17, BAC: 24.17, GOOG: 8.98, META: 8.53, AAPL: 4.69, PDD: 2.46 },
      '2021-06-30': { MU: 47.59, BAC: 24.86, GOOG: 10.51, META: 9.72, AAPL: 5.08, PDD: 2.25 },
      '2021-09-30': { MU: 37.92, BAC: 24.42, 'BRK.B': 11.41, GOOG: 10.66, META: 9.05, AAPL: 5.00, PDD: 1.53 },
      '2021-12-31': { MU: 40.12, BAC: 24.36, META: 11.06, 'BRK.B': 10.07, GOOG: 9.33, AAPL: 5.06 },
      '2022-03-31': { MU: 37.57, BAC: 25.27, 'BRK.B': 13.32, GOOG: 10.08, META: 8.19, AAPL: 5.57 },
      '2022-06-30': { MU: 33.86, BAC: 24.24, GOOG: 17.77, 'BRK.B': 13.08, AAPL: 5.54, GOOGL: 5.51 },
      '2022-09-30': { MU: 32.98, BAC: 25.27, GOOG: 16.79, 'BRK.B': 13.75, AAPL: 6.02, GOOGL: 5.20 },
      '2022-12-31': { MU: 29.76, BAC: 25.07, 'BRK.B': 14.39, GOOG: 14.01, GOOGL: 11.64, AAPL: 5.12 },
      '2023-03-31': { BAC: 25.36, MU: 20.20, GOOG: 15.52, 'BRK.B': 13.59, GOOGL: 12.94, EWBC: 6.25, AAPL: 6.14 },
      '2023-06-30': { BAC: 28.96, GOOG: 20.56, 'BRK.B': 17.09, GOOGL: 16.99, AAPL: 8.22, EWBC: 8.18 },
      '2023-09-30': { BAC: 27.20, GOOG: 22.05, GOOGL: 18.29, 'BRK.B': 17.28, EWBC: 8.04, AAPL: 7.15 },
      '2023-12-31': { BAC: 29.56, GOOG: 20.83, GOOGL: 17.25, 'BRK.B': 15.55, EWBC: 9.70, AAPL: 7.10 },
      '2024-03-31': { BAC: 30.33, GOOG: 20.50, GOOGL: 16.98, 'BRK.B': 16.70, EWBC: 9.72, AAPL: 5.76 },
      '2024-06-30': { BAC: 28.07, GOOG: 21.80, GOOGL: 18.08, 'BRK.B': 14.26, EWBC: 7.94, AAPL: 6.25, OXY: 3.61 },
      '2024-09-30': { BAC: 29.02, GOOG: 20.58, GOOGL: 17.06, 'BRK.B': 16.71, EWBC: 9.29, OXY: 3.06, AAPL: 2.99 },
      '2024-12-31': { BAC: 29.31, GOOG: 21.38, GOOGL: 17.76, 'BRK.B': 15.01, EWBC: 9.81, AAPL: 2.93, OXY: 2.67 },
      '2025-03-31': { BAC: 26.12, 'BRK.B': 21.61, GOOGL: 17.78, GOOG: 17.31, EWBC: 11.26, OXY: 3.27, AAPL: 1.11 },
      '2025-06-30': { BAC: 18.36, PDD: 17.93, GOOGL: 16.67, 'BRK.B': 16.22, GOOG: 16.17, EWBC: 10.43, OXY: 2.29, AAPL: 0.84 },
      '2025-09-30': { GOOGL: 19.14, PDD: 18.85, GOOG: 18.48, BAC: 16.66, 'BRK.B': 13.97, EWBC: 9.15, OXY: 2.15, AAPL: 0.87 },
      '2025-12-31': { GOOGL: 22.31, GOOG: 21.55, BAC: 16.08, PDD: 14.64, 'BRK.B': 12.64, EWBC: 8.74, OXY: 1.69, CROX: 1.51, AAPL: 0.84 },
    },
  },
  {
    id: 'BUFFETT',
    label: 'Buffett',
    shortLabel: 'Buffett',
    source: 'Berkshire Hathaway 13F quarterly snapshots via Dataroma',
    managerId: 'BRK',
    quarters: {
      '2009-03-31': { KO: 20.29, WFC: 18.81, PG: 13.07, AXP: 7.75, KHC: 7.53, WMT: 5.64, JNJ: 4.22, USB: 3.22, MCO: 1.34, COP: 1.22 },
      '2009-06-30': { KO: 18.19, WFC: 17.91, PG: 12.00, AXP: 9.34, KHC: 7.32, WMT: 6.17, JNJ: 4.40, USB: 3.47, COP: 2.41, MCO: 1.82 },
      '2009-09-30': { KO: 17.52, WFC: 18.49, PG: 10.63, AXP: 10.88, KHC: 6.39, WMT: 5.52, JNJ: 4.42, USB: 3.18, COP: 2.62, MCO: 2.22 },
      '2009-12-31': { KO: 17.22, WFC: 17.62, PG: 10.25, AXP: 11.12, KHC: 5.73, WMT: 5.82, JNJ: 4.38, USB: 2.97, COP: 2.85, MCO: 2.56 },
      '2010-03-31': { KO: 16.94, WFC: 17.93, AXP: 12.30, PG: 10.25, KHC: 5.73, WMT: 5.69, JNJ: 4.38, USB: 3.26, COP: 2.67, MCO: 2.78 },
      '2010-06-30': { KO: 18.93, WFC: 14.72, AXP: 10.60, PG: 10.63, KHC: 6.05, WMT: 5.54, JNJ: 4.36, USB: 2.91, MCO: 2.05, COP: 2.42 },
      '2010-09-30': { KO: 19.98, WFC: 14.69, AXP: 11.87, PG: 10.29, KHC: 5.72, WMT: 5.50, JNJ: 4.26, USB: 2.79, MCO: 2.70, COP: 2.35 },
      '2010-12-31': { KO: 19.20, WFC: 16.00, AXP: 13.55, PG: 9.49, KHC: 5.24, WMT: 5.38, JNJ: 4.11, USB: 3.15, MCO: 2.81, COP: 2.80 },
      '2011-03-31': { KO: 19.53, WFC: 16.57, AXP: 13.60, PG: 9.31, KHC: 5.78, WMT: 5.43, JNJ: 4.25, USB: 3.14, MCO: 2.49, COP: 3.08 },
      '2011-06-30': { KO: 19.05, WFC: 15.59, AXP: 14.37, PG: 9.66, KHC: 6.13, WMT: 5.48, JNJ: 4.19, USB: 3.01, COP: 3.03, MCO: 2.18 },
      '2011-09-30': { KO: 20.84, WFC: 13.23, AXP: 11.87, PG: 10.02, KHC: 6.56, WMT: 6.14, JNJ: 4.65, USB: 2.70, COP: 2.67, MCO: 2.02 },
      '2011-12-31': { KO: 21.28, WFC: 14.58, AXP: 13.34, PG: 10.21, KHC: 6.13, WMT: 6.02, JNJ: 4.56, USB: 2.87, COP: 2.76, MCO: 2.53 },
      '2012-03-31': { KO: 20.70, WFC: 15.97, AXP: 14.74, PG: 9.90, KHC: 5.85, WMT: 6.21, JNJ: 4.38, USB: 3.02, MCO: 2.76, DVA: 1.80 },
      '2012-06-30': { KO: 21.36, WFC: 16.64, AXP: 14.17, PG: 9.50, KHC: 5.64, WMT: 6.77, JNJ: 4.41, USB: 2.97, MCO: 2.64, DVA: 1.89 },
      '2012-09-30': { KO: 21.20, WFC: 18.55, AXP: 15.49, PG: 8.74, KHC: 5.54, WMT: 6.36, JNJ: 4.39, USB: 3.15, MCO: 2.84, DVA: 2.28 },
      '2012-12-31': { WFC: 19.16, KO: 19.89, AXP: 14.22, PG: 8.31, IBM: 7.71, KHC: 5.40, WMT: 6.18, USB: 3.21, DVA: 2.33, MCO: 2.35 },
      '2013-03-31': { WFC: 20.37, KO: 18.79, IBM: 9.60, AXP: 14.84, PG: 7.80, KHC: 5.14, WMT: 5.40, USB: 3.11, DVA: 3.00, MCO: 2.77 },
      '2013-06-30': { WFC: 20.28, KO: 17.45, IBM: 10.74, AXP: 14.18, PG: 7.52, KHC: 4.87, WMT: 5.29, USB: 2.88, DVA: 3.31, MCO: 2.89 },
      '2013-09-30': { WFC: 21.47, KO: 16.93, IBM: 10.96, AXP: 14.48, PG: 7.24, KHC: 4.59, WMT: 4.99, DVA: 3.25, USB: 2.92, MCO: 3.16 },
      '2013-12-31': { WFC: 23.37, KO: 15.26, IBM: 11.35, AXP: 14.00, PG: 6.52, KHC: 4.11, WMT: 5.14, DVA: 3.85, USB: 2.87, MCO: 3.20 },
      '2014-03-31': { WFC: 22.06, KO: 15.94, IBM: 11.12, AXP: 13.09, PG: 6.69, WMT: 5.51, KHC: 4.41, DVA: 3.65, USB: 2.77, MCO: 3.22 },
      '2014-06-30': { WFC: 22.74, KO: 16.09, IBM: 10.30, AXP: 13.56, PG: 6.61, WMT: 5.55, KHC: 4.39, DVA: 3.78, USB: 2.73, MCO: 3.34 },
      '2014-09-30': { WFC: 23.59, KO: 15.76, IBM: 10.22, AXP: 13.25, PG: 6.22, WMT: 5.20, KHC: 4.20, DVA: 3.49, USB: 2.59, MCO: 3.24 },
      '2014-12-31': { WFC: 24.08, KO: 16.89, IBM: 9.80, AXP: 12.32, PG: 6.76, WMT: 5.37, KHC: 4.64, DVA: 3.89, USB: 2.68, MCO: 3.44 },
      '2015-03-31': { WFC: 23.65, KO: 16.27, IBM: 9.37, AXP: 11.68, PG: 6.61, WMT: 4.69, KHC: 6.19, DVA: 3.78, USB: 2.61, MCO: 3.25 },
      '2015-06-30': { WFC: 22.82, KO: 15.32, IBM: 9.65, AXP: 11.09, PG: 6.21, KHC: 7.43, WMT: 4.98, DVA: 3.92, USB: 2.57, MCO: 3.28 },
      '2015-09-30': { WFC: 22.39, KO: 16.35, IBM: 10.16, AXP: 9.87, KHC: 8.34, PG: 6.23, WMT: 4.72, DVA: 3.30, USB: 2.47, MCO: 2.95 },
      '2015-12-31': { WFC: 22.81, KO: 15.21, IBM: 9.66, AXP: 9.24, KHC: 8.74, PG: 6.04, DVA: 3.50, WMT: 3.70, USB: 2.17, MCO: 3.08 },
      '2016-03-31': { KHC: 22.10, WFC: 19.84, KO: 15.83, IBM: 10.09, AXP: 7.87, PG: 5.55, DVA: 3.17, USB: 2.19, MCO: 3.18 },
      '2016-06-30': { KHC: 23.11, WFC: 18.62, KO: 16.02, IBM: 9.65, AXP: 7.18, PG: 5.71, DVA: 3.44, USB: 1.96, MCO: 3.34 },
      '2016-09-30': { KHC: 22.33, WFC: 17.96, KO: 15.16, AAPL: 10.64, IBM: 9.37, AXP: 7.42, PG: 5.24, DVA: 3.24, MCO: 3.13 },
      '2016-12-31': { KHC: 19.73, WFC: 18.95, KO: 13.66, AAPL: 13.94, IBM: 8.68, AXP: 8.84, PG: 4.72, DVA: 3.17, MCO: 3.19 },
      '2017-03-31': { KHC: 17.62, WFC: 18.18, AAPL: 16.14, KO: 13.08, IBM: 7.61, AXP: 8.83, PG: 4.46, DVA: 3.02, MCO: 3.09 },
      '2017-06-30': { AAPL: 19.30, KHC: 16.72, WFC: 16.83, KO: 13.03, AXP: 8.63, IBM: 6.38, PG: 4.35, DVA: 2.76, MCO: 3.18 },
      '2017-09-30': { AAPL: 21.35, WFC: 16.47, KHC: 14.77, KO: 12.85, AXP: 9.25, IBM: 5.30, PG: 4.11, DVA: 2.71, MCO: 3.37 },
      '2017-12-31': { AAPL: 23.83, WFC: 16.87, BAC: 7.24, KHC: 14.46, KO: 12.17, AXP: 8.86, PG: 3.96, MCO: 3.51, DVA: 2.69 },
      '2018-03-31': { AAPL: 22.39, WFC: 14.84, BAC: 9.88, KHC: 12.37, KO: 11.85, AXP: 8.26, USB: 2.82, MCO: 3.39, DVA: 2.48 },
      '2018-06-30': { AAPL: 23.87, BAC: 12.01, WFC: 12.83, KO: 11.54, KHC: 10.65, AXP: 8.19, USB: 2.78, MCO: 3.53, DVA: 2.35 },
      '2018-09-30': { AAPL: 25.79, BAC: 12.77, WFC: 11.23, KO: 10.59, KHC: 8.14, AXP: 8.56, USB: 2.93, MCO: 3.72, DVA: 2.37 },
      '2018-12-31': { AAPL: 21.51, BAC: 12.21, WFC: 11.34, KO: 12.37, KHC: 8.63, AXP: 7.93, USB: 3.03, MCO: 3.28, DVA: 2.26 },
      '2019-03-31': { AAPL: 23.77, BAC: 12.62, WFC: 10.17, KO: 12.56, KHC: 7.69, AXP: 8.43, USB: 2.82, MCO: 3.62, DVA: 2.37 },
      '2019-06-30': { AAPL: 24.19, BAC: 12.79, WFC: 10.05, KO: 12.91, AXP: 9.15, KHC: 6.71, USB: 2.68, MCO: 4.35, DVA: 2.34 },
      '2019-09-30': { AAPL: 25.60, BAC: 12.60, KO: 12.62, WFC: 9.32, AXP: 8.94, KHC: 5.74, USB: 2.65, MCO: 4.26, DVA: 2.50 },
      '2019-12-31': { AAPL: 29.74, BAC: 13.74, KO: 11.41, AXP: 9.10, WFC: 8.35, KHC: 5.38, USB: 2.78, MCO: 4.41, DVA: 2.37, JPM: 1.91 },
      '2020-03-31': { AAPL: 27.09, BAC: 8.80, KO: 11.79, AXP: 6.89, WFC: 5.79, KHC: 6.11, MCO: 3.39, JPM: 1.86, USB: 2.03, DVA: 1.88 },
      '2020-06-30': { AAPL: 36.35, BAC: 8.59, KO: 10.92, AXP: 6.57, KHC: 5.58, MCO: 3.97, USB: 1.85, DVA: 1.91, JPM: 1.48 },
      '2020-09-30': { AAPL: 44.21, BAC: 8.72, KO: 9.63, AXP: 6.75, KHC: 4.83, MCO: 3.82, VZ: 2.83, DVA: 1.77, USB: 1.57 },
      '2020-12-31': { AAPL: 47.14, BAC: 10.42, KO: 8.72, AXP: 7.04, KHC: 4.51, MCO: 3.36, VZ: 2.88, USB: 1.74, DVA: 1.30 },
      '2021-03-31': { AAPL: 40.07, BAC: 14.45, AXP: 7.93, KO: 7.80, KHC: 4.82, VZ: 3.42, MCO: 2.72, USB: 2.65, DVA: 1.44, GM: 1.42, BK: 1.27, CHTR: 1.19 },
      '2021-06-30': { AAPL: 41.46, BAC: 14.21, AXP: 8.55, KO: 7.39, KHC: 4.53, MCO: 3.05, VZ: 3.04, USB: 2.51, DVA: 1.48, CHTR: 1.28, BK: 1.27, GM: 1.21, VRSN: 1.00 },
      '2021-09-30': { AAPL: 42.78, BAC: 14.61, AXP: 8.66, KO: 7.15, KHC: 4.09, MCO: 2.99, VZ: 2.92, USB: 2.56, DVA: 1.43, BK: 1.28, GM: 1.08, CHTR: 1.04 },
      '2021-12-31': { AAPL: 47.60, BAC: 13.58, AXP: 7.49, KO: 7.16, KHC: 3.53, MCO: 2.91, VZ: 2.49, USB: 2.15, CVX: 1.36, BK: 1.27, DVA: 1.24, GM: 1.06 },
      '2022-03-31': { AAPL: 42.79, BAC: 11.45, AXP: 7.80, CVX: 7.13, KO: 6.82, KHC: 3.53, MCO: 2.29, OXY: 2.13, USB: 1.85, ATVI: 1.42, DVA: 1.12, HPQ: 1.04 },
      '2022-06-30': { AAPL: 40.76, BAC: 10.48, KO: 8.38, CVX: 7.79, AXP: 7.00, KHC: 4.14, OXY: 3.11, MCO: 2.24, USB: 1.84, ATVI: 1.77, HPQ: 1.14, BK: 1.01 },
      '2022-09-30': { AAPL: 41.76, BAC: 10.30, CVX: 8.02, KO: 7.57, AXP: 6.91, OXY: 4.03, KHC: 3.67, MCO: 2.03, ATVI: 1.51, TSM: 1.39, USB: 1.06, DVA: 1.01 },
      '2022-12-31': { AAPL: 38.90, BAC: 11.19, CVX: 9.78, KO: 8.51, AXP: 7.49, KHC: 4.43, OXY: 4.09, MCO: 2.30, ATVI: 1.35 },
      '2023-03-31': { AAPL: 46.44, BAC: 9.09, AXP: 7.69, KO: 7.63, CVX: 6.65, OXY: 4.07, KHC: 3.87, MCO: 2.32, ATVI: 1.30, HPQ: 1.09 },
      '2023-06-30': { AAPL: 51.00, BAC: 8.51, AXP: 7.59, KO: 6.92, CVX: 5.56, OXY: 3.78, KHC: 3.32, MCO: 2.46, HPQ: 1.07, DVA: 1.04 },
      '2023-09-30': { AAPL: 49.77, BAC: 8.98, AXP: 7.18, KO: 7.11, CVX: 5.90, OXY: 4.62, KHC: 3.48, MCO: 2.48, DVA: 1.08 },
      '2023-12-31': { AAPL: 49.54, BAC: 9.88, AXP: 8.07, KO: 6.70, CVX: 5.34, OXY: 4.14, KHC: 3.42, MCO: 2.74, CB: 1.29, DVA: 1.07 },
      '2024-03-31': { AAPL: 40.81, BAC: 11.81, AXP: 10.41, KO: 7.38, CVX: 5.85, OXY: 4.86, KHC: 3.62, MCO: 2.92, CB: 2.03, DVA: 1.50 },
      '2024-06-30': { AAPL: 30.09, BAC: 14.67, AXP: 12.54, KO: 9.09, CVX: 6.63, OXY: 5.75, KHC: 3.75, MCO: 3.71, CB: 2.46, DVA: 1.79 },
      '2024-09-30': { AAPL: 26.24, AXP: 15.44, BAC: 11.88, KO: 10.79, CVX: 6.56, OXY: 4.94, MCO: 4.40, KHC: 4.29, CB: 2.93, DVA: 2.22 },
      '2024-12-31': { AAPL: 28.12, AXP: 16.84, BAC: 11.19, KO: 9.32, CVX: 6.43, OXY: 4.89, MCO: 4.37, KHC: 3.74, CB: 2.80, DVA: 2.02 },
      '2025-03-31': { AAPL: 25.65, AXP: 15.70, KO: 11.03, BAC: 10.14, CVX: 7.64, OXY: 5.03, MCO: 4.42, KHC: 3.81, CB: 3.14, DVA: 2.07 },
      '2025-06-30': { AAPL: 22.31, AXP: 18.78, BAC: 11.12, KO: 10.99, CVX: 6.79, MCO: 4.81, OXY: 4.32, KHC: 3.26, CB: 3.04, DVA: 1.87 },
      '2025-09-30': { AAPL: 22.69, AXP: 18.84, BAC: 10.96, KO: 9.92, CVX: 7.09, OXY: 4.68, MCO: 4.40, CB: 3.31, KHC: 3.17 },
      '2025-12-31': { AAPL: 22.60, AXP: 20.46, BAC: 10.38, KO: 10.20, CVX: 7.24, MCO: 4.60, OXY: 3.97, CB: 3.90, KHC: 2.88, GOOGL: 2.04, DVA: 1.32, KR: 1.14 },
    },
  },
  {
    id: 'NORBERT',
    label: 'Norbert Lou',
    shortLabel: 'Norbert',
    source: 'Punch Card Management 13F quarterly snapshots via Dataroma',
    managerId: 'PC',
    quarters: {
      '2019-06-30': { 'BRK.A': 56.87, WGO: 25.60, BIDU: 17.53 },
      '2019-09-30': { 'BRK.A': 57.11, WGO: 23.34, BIDU: 19.55 },
      '2019-12-31': { 'BRK.A': 54.89, WGO: 28.10, BIDU: 17.01 },
      '2020-03-31': { 'BRK.A': 58.74, WGO: 17.99, BIDU: 17.74, ALLY: 5.53 },
      '2020-06-30': { 'BRK.A': 52.73, ALLY: 17.97, WGO: 17.11, BIDU: 12.19 },
      '2020-09-30': { ALLY: 29.73, 'BRK.A': 43.49, WGO: 23.31, BIDU: 3.47 },
      '2020-12-31': { ALLY: 35.17, 'BRK.A': 40.71, WGO: 24.12 },
      '2021-03-31': { ALLY: 41.11, 'BRK.A': 37.20, WGO: 21.69 },
      '2021-06-30': { ALLY: 43.20, 'BRK.A': 38.49, WGO: 18.31 },
      '2021-09-30': { ALLY: 43.55, 'BRK.A': 37.23, WGO: 19.22 },
      '2021-12-31': { 'BRK.A': 40.27, ALLY: 40.11, WGO: 19.62 },
      '2022-03-31': { 'BRK.A': 47.32, ALLY: 36.68, WGO: 16.00 },
      '2022-06-30': { 'BRK.A': 44.22, ALLY: 36.23, WGO: 17.41, SWBI: 2.13 },
      '2022-09-30': { 'BRK.A': 47.17, ALLY: 32.29, WGO: 17.63, SWBI: 2.90 },
      '2022-12-31': { 'BRK.A': 52.99, ALLY: 27.64, WGO: 17.01, SWBI: 2.36 },
      '2023-03-31': { 'BRK.A': 50.89, ALLY: 27.86, WGO: 18.01, SWBI: 3.24 },
      '2023-06-30': { 'BRK.A': 52.05, ALLY: 25.66, WGO: 19.14, SWBI: 3.15 },
      '2023-09-30': { 'BRK.A': 53.59, ALLY: 25.42, WGO: 17.12, SWBI: 3.13 },
      '2023-12-31': { 'BRK.A': 49.70, ALLY: 27.58, WGO: 19.06, SWBI: 2.99 },
      '2024-03-31': { 'BRK.A': 55.36, ALLY: 21.93, WGO: 18.44, SWBI: 3.65 },
      '2024-06-30': { 'BRK.A': 63.17, SGOV: 17.30, WGO: 15.97, SWBI: 3.56 },
      '2024-09-30': { 'BRK.A': 72.10, SGOV: 17.49, WGO: 7.15, SWBI: 3.26 },
      '2024-12-31': { 'BRK.A': 75.42, SGOV: 18.50, PDD: 4.00, SWBI: 2.08 },
      '2025-03-31': { 'BRK.A': 53.44, SGOV: 27.00, PDD: 16.76, SWBI: 2.79 },
      '2025-06-30': { 'BRK.A': 34.10, SGOV: 18.39, CROX: 17.36, PYPL: 15.60, PDD: 14.02 },
      '2025-09-30': { 'BRK.A': 33.92, SGOV: 17.68, PDD: 17.01, CROX: 16.38, PYPL: 13.53, FISV: 1.48 },
      '2025-12-31': { 'BRK.A': 36.38, SGOV: 18.88, CROX: 16.90, PDD: 15.64, PYPL: 12.20 },
    },
  },
];

function buildSuperinvestorMember(portfolio, priceSeries, baseDates, spyPriceByDate, modelEndDate, marketCaps = {}) {
  // Sort quarter dates and build rebalancing schedule
  const quarterDates = Object.keys(portfolio.quarters).sort();
  if (!quarterDates.length) return null;

  // Parse quarters into normalized weight arrays
  function getWeightsForDate(date, dateIdx) {
    // Find the most recent quarter on or before this date
    let best = null;
    for (const qd of quarterDates) {
      if (qd <= date) best = qd;
    }
    // No quarter data exists for dates before the first filing
    if (!best) return [];
    const raw = portfolio.quarters[best];
    // Filter out tickers with no price data at this specific date, then renormalize
    const available = Object.entries(raw).filter(([ticker]) => {
      const price = priceSeries[ticker]?.aligned?.[dateIdx];
      return price != null;
    });
    const totalPct = available.reduce((s, [, v]) => s + v, 0);
    if (!totalPct) return [];
    return available.map(([ticker, pct]) => ({ ticker, weight: pct / totalPct }));
  }

  // Compute cumulative portfolio value with quarterly rebalancing
  // On each day: portfolio grows by weighted stock returns since last rebalance
  // On rebalance dates: lock in gains, reset weights to new quarter's allocations
  let cumulativeValue = 1.0; // starts at $1
  let currentWeights = null;
  let rebalancePrices = {};
  let lastRebalanceIdx = -1;
  const returnPctSeries = [];

  // Collect all unique tickers across all quarters
  const allTickers = new Set();
  for (const q of Object.values(portfolio.quarters)) {
    for (const t of Object.keys(q)) allTickers.add(t);
  }

  for (let i = 0; i < baseDates.length; i++) {
    const date = baseDates[i];

    // Check if we need to rebalance (new quarter boundary crossed)
    const weights = getWeightsForDate(date, i);
    const currentQuarter = quarterDates.filter((qd) => qd <= date).pop() ?? quarterDates[0];
    const needsRebalance = currentWeights === null || (
      lastRebalanceIdx >= 0 && currentQuarter !== (quarterDates.filter((qd) => qd <= baseDates[lastRebalanceIdx]).pop() ?? quarterDates[0])
    );

    if (needsRebalance && weights.length > 0) {
      // If we have existing positions, compute value before rebalancing
      if (currentWeights && currentWeights.length > 0 && lastRebalanceIdx >= 0) {
        let periodValue = 0;
        let valid = true;
        for (const w of currentWeights) {
          const price = priceSeries[w.ticker]?.aligned?.[i];
          const basePrice = rebalancePrices[w.ticker];
          if (price == null || basePrice == null) { valid = false; break; }
          periodValue += w.weight * (price / basePrice);
        }
        if (valid) cumulativeValue *= periodValue;
      }

      // Set new weights and record rebalance prices
      currentWeights = weights;
      rebalancePrices = {};
      for (const w of weights) {
        rebalancePrices[w.ticker] = priceSeries[w.ticker]?.aligned?.[i] ?? null;
      }
      lastRebalanceIdx = i;
    }

    // Compute current portfolio value
    if (!currentWeights || currentWeights.length === 0) {
      returnPctSeries.push(null);
      continue;
    }

    let periodValue = 0;
    let valid = true;
    for (const w of currentWeights) {
      const price = priceSeries[w.ticker]?.aligned?.[i];
      const basePrice = rebalancePrices[w.ticker];
      if (price == null || basePrice == null) { valid = false; break; }
      periodValue += w.weight * (price / basePrice);
    }

    if (valid) {
      returnPctSeries.push(cumulativeValue * periodValue - 1);
    } else {
      returnPctSeries.push(null);
    }
  }

  // Determine effective data start from first non-null return
  const firstDataIdx = returnPctSeries.findIndex((v) => v !== null);
  const effectiveStart = firstDataIdx >= 0 ? baseDates[firstDataIdx] : baseDates[0];

  const totalReturnPct = latestNonNull(returnPctSeries);
  const annualizedReturnPct = annualizeReturn(totalReturnPct, effectiveStart, modelEndDate);
  const benchmarkStartPrice = spyPriceByDate[effectiveStart];
  const benchmarkReturnPctSeries = baseDates.map((date) => {
    if (date < effectiveStart) return null;
    const sp = spyPriceByDate[date];
    return sp != null && benchmarkStartPrice ? (sp / benchmarkStartPrice) - 1 : null;
  });
  const benchmarkReturnPct = latestNonNull(benchmarkReturnPctSeries);
  const annualizedBenchmarkReturnPct = annualizeReturn(benchmarkReturnPct, effectiveStart, modelEndDate);

  // Current holdings (latest quarter) for the detail table
  // If full holdings data is available (from scraped holdings page), prefer it
  // as it has exact weightPct for ALL holdings, not just top ones from history
  const latestQuarter = quarterDates[quarterDates.length - 1];
  const latestRaw = portfolio.quarters[latestQuarter];
  const useFullHoldings = portfolio.holdings?.length > 0;
  const holdingsSource = useFullHoldings
    ? Object.fromEntries(portfolio.holdings.map(h => [h.ticker, h.weightPct]))
    : latestRaw;
  const currentHoldings = Object.entries(holdingsSource)
    .map(([ticker, pct]) => ({
      ticker,
      weight: pct / 100,
      returnPct: (() => {
        const aligned = priceSeries[ticker]?.aligned;
        if (!aligned) return null;
        const first = aligned.find((v) => v != null);
        const last = latestNonNull(aligned);
        return first && last ? (last / first) - 1 : null;
      })(),
      marketCap: marketCaps[ticker] ?? null,
    }))
    .sort((a, b) => b.weight - a.weight);

  return {
    id: portfolio.id,
    label: portfolio.label,
    shortLabel: portfolio.shortLabel,
    managerId: portfolio.managerId ?? null,
    status: 'ready',
    strategyType: 'superinvestor',
    source: portfolio.source,
    holdings: currentHoldings,
    benchmarkSymbol,
    windowStart: effectiveStart,
    windowEnd,
    chart: {
      dates: baseDates,
      portfolioReturnPctSeries: returnPctSeries,
      benchmarkReturnPctSeries,
      portfolioLabel: `${portfolio.label} (quarterly-rebalanced 13F backtest)`,
      benchmarkLabel: 'SPY over the same window',
    },
    stats: {
      portfolioReturnPct: totalReturnPct,
      annualizedPortfolioReturnPct: annualizedReturnPct,
      benchmarkReturnPct,
      annualizedBenchmarkReturnPct,
      returnSpreadPct: totalReturnPct != null && benchmarkReturnPct != null ? totalReturnPct - benchmarkReturnPct : null,
      annualizedReturnSpreadPct: annualizedReturnPct != null && annualizedBenchmarkReturnPct != null ? annualizedReturnPct - annualizedBenchmarkReturnPct : null,
      holdingCount: currentHoldings.length,
      quarterCount: quarterDates.length,
    },
    description: `${portfolio.label} portfolio replicated from ${quarterDates.length} quarterly 13F filings, rebalanced each quarter to match actual holdings. Source: ${portfolio.source}.`,
  };
}

const symbolMap = {
  'BRK.B': 'BRK-B',
  'BRK.A': 'BRK-A',
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
  const period1 = Math.floor(Date.parse(`${globalWindowStart}T00:00:00Z`) / 1000);
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
  if (value === null || value === undefined || Number.isNaN(value)) return '�';
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
  if (!fundNames.length || !spyPriceByDate[aviWindowStart]) return null;

  const benchmarkStart = spyPriceByDate[aviWindowStart];
  const benchmarkEnd = spyPriceByDate[modelEndDate];
  const fundModels = fundNames.map((name) => {
    const rows = [...pabraiNavData.funds[name]].sort((left, right) => left.date.localeCompare(right.date));
    const startNav = interpolateSeriesValue(rows, aviWindowStart);
    const endNav = interpolateSeriesValue(rows, modelEndDate);
    const latestCheckpoint = rows[rows.length - 1].date;
    const modelReturnPct = startNav && endNav ? (endNav / startNav) - 1 : null;
    const matchedSpyReturnPct = benchmarkStart && benchmarkEnd ? (benchmarkEnd / benchmarkStart) - 1 : null;
    const annualizedModelReturnPct = annualizeReturn(modelReturnPct, aviWindowStart, modelEndDate);
    const annualizedMatchedSpyReturnPct = annualizeReturn(matchedSpyReturnPct, aviWindowStart, modelEndDate);
    const spreadPct = modelReturnPct !== null && matchedSpyReturnPct !== null ? modelReturnPct - matchedSpyReturnPct : null;
    const annualizedSpreadPct = annualizedModelReturnPct !== null && annualizedMatchedSpyReturnPct !== null ? annualizedModelReturnPct - annualizedMatchedSpyReturnPct : null;

    return {
      ticker: name,
      positionType: 'fund',
      confidence: 'medium',
      startDate: aviWindowStart,
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

  const portfolioReturnPctSeries = baseDates.map((date) => {
    if (date < aviWindowStart) return null;
    return averageNonNull(fundModels.map((fund) => {
      const nav = interpolateSeriesValue(fund.rows, date);
      return nav !== null && fund.startNav ? (nav / fund.startNav) - 1 : null;
    }));
  });
  const benchmarkReturnPctSeries = baseDates.map((date) => {
    if (date < aviWindowStart) return null;
    const spyPrice = spyPriceByDate[date];
    return spyPrice !== null && spyPrice !== undefined && benchmarkStart ? (spyPrice / benchmarkStart) - 1 : null;
  });

  const portfolioReturnPct = latestNonNull(portfolioReturnPctSeries);
  const benchmarkReturnPct = latestNonNull(benchmarkReturnPctSeries);
  const annualizedPortfolioReturnPct = annualizeReturn(portfolioReturnPct, aviWindowStart, modelEndDate);
  const annualizedBenchmarkReturnPct = annualizeReturn(benchmarkReturnPct, aviWindowStart, modelEndDate);
  const returnSpreadPct = portfolioReturnPct !== null && benchmarkReturnPct !== null ? portfolioReturnPct - benchmarkReturnPct : null;
  const annualizedReturnSpreadPct = annualizedPortfolioReturnPct !== null && annualizedBenchmarkReturnPct !== null ? annualizedPortfolioReturnPct - annualizedBenchmarkReturnPct : null;
  const latestCheckpoint = fundModels.reduce((latest, fund) => fund.latestCheckpoint > latest ? fund.latestCheckpoint : latest, fundModels[0]?.latestCheckpoint ?? aviWindowStart);

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
    windowStart: aviWindowStart,
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
      startDate: aviWindowStart,
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
  const modelStartDate = row.buy_date <= aviWindowStart ? aviWindowStart : effectiveDate(row.buy_date, baseDates);
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
  const startValueUsd = quantityUsed ? usdPriceAt(priceSeries, row.ticker, aviWindowStart) * quantityUsed : null;
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
  const modelStartDate = row.buy_date <= aviWindowStart ? aviWindowStart : effectiveDate(row.buy_date, baseDates);
  const modelSellDate = row.sell_date ? effectiveDate(row.sell_date, baseDates) : null;
  const startValueUsd = quantityUsed ? usdPriceAt(priceSeries, row.ticker, aviWindowStart) * quantityUsed : null;
  const totalReturnPct = buyPriceUsd && row.sell_price ? (row.sell_price / buyPriceUsd) - 1 : null;
  const annualizedReturnPct = annualizeReturn(totalReturnPct, row.buy_date, row.sell_date);
  const includedInMainModel = Boolean(quantityUsed && buyCostUsd && sellProceedsUsd && modelSellDate && row.sell_date >= aviWindowStart);

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

async function fetchMarketCaps(tickers) {
  // Get a Yahoo Finance crumb + cookies for authenticated batch quote requests
  let cookies = '';
  let crumb = '';
  try {
    const r1 = await fetch('https://fc.yahoo.com', {
      headers: { 'user-agent': 'Mozilla/5.0' },
      redirect: 'manual',
    });
    const setCookies = r1.headers.getSetCookie?.() ?? [];
    cookies = setCookies.map((c) => c.split(';')[0]).join('; ');
    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'user-agent': 'Mozilla/5.0', cookie: cookies },
    });
    crumb = await r2.text();
  } catch (err) {
    console.log(`[MCAP] Failed to get Yahoo crumb: ${err.message}`);
    return {};
  }

  const caps = {};
  // Batch in groups of 50 symbols
  const batchSize = 50;
  const yahooTickers = tickers.map((t) => toYahooSymbol(t));
  for (let i = 0; i < yahooTickers.length; i += batchSize) {
    const batch = yahooTickers.slice(i, i + batchSize);
    const originalBatch = tickers.slice(i, i + batchSize);
    try {
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${batch.map(encodeURIComponent).join(',')}&crumb=${encodeURIComponent(crumb)}`;
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0', cookie: cookies, accept: 'application/json' },
      });
      if (!res.ok) {
        console.log(`[MCAP] Batch ${i / batchSize + 1} failed: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const results = data?.quoteResponse?.result ?? [];
      for (const q of results) {
        if (q.marketCap) {
          // Map yahoo symbol back to original ticker
          const origIdx = batch.indexOf(q.symbol);
          const origTicker = origIdx >= 0 ? originalBatch[origIdx] : q.symbol;
          caps[origTicker] = q.marketCap;
        }
      }
      console.log(`[MCAP] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(yahooTickers.length / batchSize)}: got ${results.filter((r) => r.marketCap).length} caps`);
    } catch { /* skip batch */ }
  }
  return caps;
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

  // Fetch Dataroma scraped superinvestor data
  const dataromaCachePath = path.join(dataDir, 'dataroma-cache.json');
  const dataromaData = await fetchAllSuperinvestors({ cachePath: dataromaCachePath });

  // Convert scraped data to portfolio format compatible with buildSuperinvestorMember()
  const scrapedSuperinvestorPortfolios = dataromaData.investors
    .filter(inv => inv.holdings.length > 0)
    .map(inv => {
      // Use full quarterly history if available, fall back to current holdings only
      let quarters = inv.quarters && Object.keys(inv.quarters).length > 0
        ? inv.quarters
        : {};
      // If no history was scraped, create a single quarter from current holdings
      if (Object.keys(quarters).length === 0) {
        const latestQuarter = inv.filingDate || '2025-12-31';
        const quarterData = {};
        for (const h of inv.holdings) {
          quarterData[h.ticker] = h.weightPct;
        }
        quarters = { [latestQuarter]: quarterData };
      }
      const id = inv.managerId.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      return {
        id: `DATAROMA_${id}`,
        label: inv.name,
        shortLabel: inv.name.split(' - ')[0].split(' (')[0].trim(),
        source: `${inv.name} 13F via Dataroma`,
        managerId: inv.managerId,
        holdings: inv.holdings,
        quarters,
      };
    });

  // Merge hardcoded portfolios (with full quarterly history) with scraped ones (deduped)
  const hardcodedManagerIds = new Set(['HC', 'BRK', 'PC']); // Li Lu, Buffett, Norbert
  const mergedSuperinvestorPortfolios = [
    ...superinvestorPortfolios,
    ...scrapedSuperinvestorPortfolios.filter(p => !hardcodedManagerIds.has(p.managerId)),
  ];

  const trackedOpenPositions = positions.filter((row) => row.member === 'AVI' && row.position_status === 'open');
  const realizedPositions = positions.filter((row) => row.member === 'AVI' && row.position_status === 'sold');
  const holdingsBySymbol = Object.fromEntries(holdings.filter((row) => row.symbol !== 'CASH').map((row) => [row.symbol, row]));

  const superinvestorSymbols = mergedSuperinvestorPortfolios.flatMap((p) =>
    Object.values(p.quarters).flatMap((q) => Object.keys(q))
  );

  const symbolsToFetch = uniqueBy([
    benchmarkSymbol,
    'TRYUSD=X',
    ...new Set([
      ...positions.map((row) => row.ticker),
      ...holdings.filter((row) => row.symbol !== 'CASH').map((row) => row.symbol),
      ...singleTickerMembers.map((stm) => stm.ticker),
      ...superinvestorSymbols,
    ]),
  ], (value) => value);

  const rawSeriesEntries = [];
  for (const symbol of symbolsToFetch) {
    try {
      rawSeriesEntries.push(await fetchYahooSeries(symbol));
    } catch (err) {
      console.log(`[SKIP] Could not fetch ${symbol}: ${err.message}`);
    }
  }

  const benchmarkDates = rawSeriesEntries.find((entry) => entry.symbol === benchmarkSymbol)?.series.map((entry) => entry.date) ?? [];
  const baseDates = benchmarkDates.filter((date) => date >= globalWindowStart && date <= windowEnd);
  const priceSeries = Object.fromEntries(
    rawSeriesEntries.map((entry) => [entry.symbol, {
      ...entry,
      dates: baseDates,
      aligned: alignSeries(entry.series, baseDates),
    }])
  );

  // Fetch market caps for all unique tickers across all superinvestor portfolios + AVI positions
  const aviTickers = trackedOpenPositions.map(row => row.ticker);
  const allSuperTickers = [...new Set([
    ...mergedSuperinvestorPortfolios.flatMap(p =>
      Object.values(p.quarters).flatMap(q => Object.keys(q))
    ),
    ...aviTickers,
  ])];
  console.log(`[MCAP] Fetching market caps for ${allSuperTickers.length} unique tickers...`);
  const marketCaps = await fetchMarketCaps(allSuperTickers);
  console.log(`[MCAP] Got market caps for ${Object.keys(marketCaps).length} tickers`);

  const trackedOpenModels = trackedOpenPositions.map((row) => buildOpenPositionModel(row, holdingsBySymbol, priceSeries, baseDates));
  const realizedModels = realizedPositions.map((row) => buildRealizedPositionModel(row, priceSeries, baseDates));
  const realizedPerformanceModels = realizedModels.filter((row) => row.includedInMainModel);

  const contributions = new Map();
  const withdrawals = new Map();
  let openingCapitalUsd = 0;

  for (const position of [...trackedOpenModels, ...realizedPerformanceModels]) {
    if (!position.quantityUsed) continue;
    if (position.buyDate <= aviWindowStart) {
      openingCapitalUsd += position.startValueUsd ?? 0;
    } else {
      const contributionDate = effectiveDate(position.buyDate, baseDates);
      contributions.set(contributionDate, (contributions.get(contributionDate) ?? 0) + (position.buyCostUsd ?? 0));
    }

    if (position.type === 'realized' && position.sellDate && position.sellDate >= aviWindowStart) {
      const withdrawalDate = effectiveDate(position.sellDate, baseDates);
      withdrawals.set(withdrawalDate, (withdrawals.get(withdrawalDate) ?? 0) + (position.sellProceedsUsd ?? 0));
    }
  }

  const spyPrices = priceSeries[benchmarkSymbol].aligned;
  const spyPriceByDate = Object.fromEntries(baseDates.map((date, index) => [date, spyPrices[index]]));
  const openingSpyPrice = spyPriceByDate[aviWindowStart];
  const modelEndDate = baseDates[baseDates.length - 1];
  const pabraiMember = buildPabraiMember(pabraiNavData, baseDates, spyPriceByDate, modelEndDate);

  let benchmarkShares = openingSpyPrice ? openingCapitalUsd / openingSpyPrice : 0;
  let contributedCapitalUsd = openingCapitalUsd;
  let cumulativeWithdrawalsUsd = 0;
  const portfolioReturnPctSeries = [];
  const benchmarkReturnPctSeries = [];

  for (const date of baseDates) {
    if (date < aviWindowStart) {
      portfolioReturnPctSeries.push(null);
      benchmarkReturnPctSeries.push(null);
      continue;
    }
    if (date !== aviWindowStart && contributions.has(date) && spyPriceByDate[date]) {
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
  const annualizedPortfolioReturnPct = annualizeReturn(portfolioReturnPct, aviWindowStart, modelEndDate);
  const annualizedBenchmarkReturnPct = annualizeReturn(benchmarkReturnPct, aviWindowStart, modelEndDate);
  const returnSpreadPct = portfolioReturnPct !== null && benchmarkReturnPct !== null ? portfolioReturnPct - benchmarkReturnPct : null;
  const annualizedReturnSpreadPct = annualizedPortfolioReturnPct !== null && annualizedBenchmarkReturnPct !== null ? annualizedPortfolioReturnPct - annualizedBenchmarkReturnPct : null;

  const attributionRows = [
    ...trackedOpenModels.map((position) => {
      const baseCapitalUsd = position.buyDate <= aviWindowStart ? position.startValueUsd : position.buyCostUsd;
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
      const baseCapitalUsd = position.buyDate <= aviWindowStart ? position.startValueUsd : position.buyCostUsd;
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
      marketCap: marketCaps[row.ticker] ?? null,
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
  warnings.push(`AVI chart window is fixed to ${aviWindowStart} through ${windowEnd}.`);
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
    windowStart: aviWindowStart,
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

  // Build single-ticker members (e.g. WAGN)
  const tickerMembers = [];
  for (const stm of singleTickerMembers) {
    const record = priceSeries[stm.ticker];
    if (!record) {
      // No price data available — add as partial member
      tickerMembers.push({
        id: stm.id,
        label: stm.label,
        status: 'ready',
        strategyType: 'single_ticker',
        ticker: stm.ticker,
        benchmarkSymbol,
        windowStart: aviWindowStart,
        windowEnd,
        chart: { dates: baseDates, portfolioReturnPctSeries: [], benchmarkReturnPctSeries: [], portfolioLabel: `${stm.ticker} stock`, benchmarkLabel: 'SPY' },
        stats: {},
        description: `${stm.description} (Price data not yet available from Yahoo Finance.)`,
      });
      continue;
    }
    const aligned = record.aligned;
    const firstIdx = aligned.findIndex((v) => v !== null);
    if (firstIdx === -1) continue;
    const startPrice = aligned[firstIdx];
    const tickerStartDate = baseDates[firstIdx];
    const returnPctSeries = aligned.map((p) => (p !== null && p !== undefined ? (p / startPrice) - 1 : null));
    const totalReturnPct = latestNonNull(returnPctSeries);
    const annualizedReturnPct = annualizeReturn(totalReturnPct, tickerStartDate, modelEndDate);
    const benchmarkStartPrice = spyPriceByDate[tickerStartDate];
    const benchmarkReturnPctSeries = baseDates.map((date) => {
      if (date < tickerStartDate) return null;
      const sp = spyPriceByDate[date];
      return sp !== null && sp !== undefined && benchmarkStartPrice ? (sp / benchmarkStartPrice) - 1 : null;
    });
    const benchmarkReturnPct = latestNonNull(benchmarkReturnPctSeries);
    const annualizedBenchmarkReturnPct = annualizeReturn(benchmarkReturnPct, tickerStartDate, modelEndDate);
    tickerMembers.push({
      id: stm.id,
      label: stm.label,
      status: 'ready',
      strategyType: 'single_ticker',
      ticker: stm.ticker,
      benchmarkSymbol,
      windowStart: tickerStartDate,
      windowEnd,
      chart: {
        dates: baseDates,
        portfolioReturnPctSeries: returnPctSeries,
        benchmarkReturnPctSeries,
        portfolioLabel: `${stm.ticker} stock`,
        benchmarkLabel: 'SPY over the same 5-year window',
      },
      stats: {
        portfolioReturnPct: totalReturnPct,
        annualizedPortfolioReturnPct: annualizedReturnPct,
        benchmarkReturnPct,
        annualizedBenchmarkReturnPct,
        returnSpreadPct: totalReturnPct !== null && benchmarkReturnPct !== null ? totalReturnPct - benchmarkReturnPct : null,
        annualizedReturnSpreadPct: annualizedReturnPct !== null && annualizedBenchmarkReturnPct !== null ? annualizedReturnPct - annualizedBenchmarkReturnPct : null,
      },
      description: stm.description,
    });
  }

  // Build superinvestor backtested portfolios
  const superinvestorMembers = mergedSuperinvestorPortfolios.map((portfolio) =>
    buildSuperinvestorMember(portfolio, priceSeries, baseDates, spyPriceByDate, modelEndDate, marketCaps)
  );

  // Build standalone SPY member covering the full date range
  const spyFirstIdx = spyPrices.findIndex((v) => v != null);
  const spyStartPrice = spyFirstIdx >= 0 ? spyPrices[spyFirstIdx] : null;
  const spyStartDate = spyFirstIdx >= 0 ? baseDates[spyFirstIdx] : globalWindowStart;
  const spyReturnPctSeries = spyPrices.map((p) =>
    p != null && spyStartPrice ? (p / spyStartPrice) - 1 : null
  );
  const spyTotalReturnPct = latestNonNull(spyReturnPctSeries);
  const spyAnnualizedReturnPct = annualizeReturn(spyTotalReturnPct, spyStartDate, modelEndDate);
  const spyMember = {
    id: 'SPY',
    label: 'SPY',
    shortLabel: 'SPY',
    status: 'ready',
    strategyType: 'benchmark',
    benchmarkSymbol,
    windowStart: spyStartDate,
    windowEnd,
    chart: {
      dates: baseDates,
      portfolioReturnPctSeries: spyReturnPctSeries,
      benchmarkReturnPctSeries: spyReturnPctSeries,
      portfolioLabel: 'S&P 500 (SPY)',
      benchmarkLabel: 'SPY',
    },
    stats: {
      portfolioReturnPct: spyTotalReturnPct,
      annualizedPortfolioReturnPct: spyAnnualizedReturnPct,
      benchmarkReturnPct: spyTotalReturnPct,
      annualizedBenchmarkReturnPct: spyAnnualizedReturnPct,
    },
    description: 'SPDR S&P 500 ETF Trust — full date range benchmark.',
  };

  const externalMembers = [pabraiMember, ...tickerMembers, ...superinvestorMembers, spyMember].filter(Boolean);

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
    windowStart: aviWindowStart,
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
      windowStart: globalWindowStart,
      windowEnd,
      benchmarkName: 'SPDR S&P 500 ETF Trust',
    },
    dates: baseDates,
    members: [memberData, ...externalMembers, ...pendingMembers],
  };

  // Remove duplicated dates arrays from each member's chart (saves ~4.5MB)
  // Remove benchmarkReturnPctSeries (frontend reads SPY directly, saves ~2.6MB)
  // Trim leading nulls from portfolio series (saves ~593KB, ~20%)
  for (const member of dashboardData.members) {
    // Strip unused member-level fields (not consumed by frontend)
    delete member.source;
    delete member.componentFunds;
    delete member.cashHoldings;
    delete member.warnings;
    delete member.attribution;
    delete member.currentUnclassifiedHoldings;
    delete member.strategyNote;
    delete member.sourcePdfs;
    delete member.benchmarkSymbol;
    delete member.windowStart;
    delete member.windowEnd;
    // Strip verbose description for superinvestors (client has fallback text)
    if (member.strategyType === 'superinvestor') delete member.description;
    // Strip realizedPositions (not used by frontend)
    delete member.realizedPositions;
    // Slim trackedOpenPositions to only fields used by frontend: ticker, currentWeightPct, marketCap
    if (member.trackedOpenPositions) {
      member.trackedOpenPositions = member.trackedOpenPositions.map(p => ({
        ticker: p.ticker,
        currentWeightPct: p.currentWeightPct,
        marketCap: p.marketCap,
      }));
    }
    // Strip null fields from holdings and shorten keys to reduce payload
    // t=ticker, w=weight, r=returnPct, m=marketCap
    // Cap holdings at top 30 by weight to reduce JSON size
    if (member.holdings) {
      const sorted = [...member.holdings].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
      member.holdings = sorted.slice(0, 15).map(h => {
        const row = { t: h.ticker, w: h.weight };
        if (h.returnPct != null) row.r = h.returnPct;
        if (h.marketCap != null) row.m = h.marketCap;
        return row;
      });
    }
    // Strip unused stats sub-fields
    if (member.stats) {
      delete member.stats.benchmarkReturnPct;
      delete member.stats.annualizedBenchmarkReturnPct;
      delete member.stats.realizedNamesWithoutSize;
      delete member.stats.excludedSnapshotWeightPct;
      delete member.stats.cashSnapshotWeightPct;
      delete member.stats.quarterCount;
      delete member.stats.totalContributedCapitalUsd;
    }
    if (member.chart) {
      delete member.chart.dates;
      delete member.chart.benchmarkReturnPctSeries;
      delete member.chart.portfolioLabel;
      delete member.chart.benchmarkLabel;
      const series = member.chart.portfolioReturnPctSeries;
      if (series) {
        const startIdx = series.findIndex(v => v !== null);
        const trimmed = startIdx > 0 ? series.slice(startIdx) : series;
        if (startIdx > 0) member.chart.chartStartIdx = startIdx;
        // Encode as scaled integers (×1000) then delta-encode for compact JSON
        const scaled = trimmed.map(v => v === null ? null : Math.round(v * 1e3));
        const deltas = [scaled[0]];
        for (let i = 1; i < scaled.length; i++) {
          deltas.push(scaled[i] - scaled[i - 1]);
        }
        member.chart.portfolioReturnPctSeries = deltas;
      }
    }
  }

  // Downsample dates and chart series to every 3rd trading day (~weekly)
  // to reduce payload size while maintaining chart visual fidelity
  const STEP = 30;
  const origDates = dashboardData.dates;
  const keepIndices = [];
  for (let i = 0; i < origDates.length; i += STEP) keepIndices.push(i);
  // Always include the last date
  if (keepIndices[keepIndices.length - 1] !== origDates.length - 1) {
    keepIndices.push(origDates.length - 1);
  }
  dashboardData.dates = keepIndices.map(i => origDates[i]);

  for (const member of dashboardData.members) {
    if (member.chart?.portfolioReturnPctSeries) {
      // Undo delta encoding first
      const deltas = member.chart.portfolioReturnPctSeries;
      const values = [deltas[0]];
      for (let i = 1; i < deltas.length; i++) values.push(values[i - 1] + deltas[i]);

      // Map from original index space to downsampled
      const startIdx = member.chart.chartStartIdx ?? 0;
      const sampledValues = keepIndices.map(origIdx => {
        const seriesIdx = origIdx - startIdx;
        if (seriesIdx < 0 || seriesIdx >= values.length) return null;
        return values[seriesIdx];
      });

      // Find new startIdx and trim leading nulls
      const newStart = sampledValues.findIndex(v => v !== null);
      const trimmed = newStart > 0 ? sampledValues.slice(newStart) : sampledValues;
      if (newStart > 0) member.chart.chartStartIdx = newStart;
      else delete member.chart.chartStartIdx;

      // Re-delta encode
      const newDeltas = [trimmed[0]];
      for (let i = 1; i < trimmed.length; i++) {
        newDeltas.push(trimmed[i] - trimmed[i - 1]);
      }
      member.chart.portfolioReturnPctSeries = newDeltas;
    }
  }

  // Compact JSON: round floats to 4 decimal places to shrink payload
  const replacer = (_key, value) =>
    typeof value === 'number' && !Number.isInteger(value)
      ? Math.round(value * 1e4) / 1e4
      : value;
  // Embed pabrai_nav into dashboard data to eliminate second network request
  try {
    const pabraiNav = JSON.parse(await fs.readFile(path.join(dataDir, 'pabrai_nav.json'), 'utf-8'));
    dashboardData.pabraiNav = pabraiNav;
  } catch {}

  await fs.writeFile(path.join(distDir, 'dashboard-data.json'), JSON.stringify(dashboardData, replacer));

  // Keep standalone copy for dev server compatibility
  await fs.copyFile(path.join(dataDir, 'pabrai_nav.json'), path.join(distDir, 'pabrai_nav.json'));

  console.log(`Built dashboard data for ${memberData.label}.`);
  console.log(`Modeled return: ${formatPercent(portfolioReturnPct)} vs matched SPY ${formatPercent(benchmarkReturnPct)} (spread ${formatPercent(returnSpreadPct)}).`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});


