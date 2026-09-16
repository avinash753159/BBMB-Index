# BBMB-Index

## What it does

BBMB-Index ("Boba Banh Mi Bros") is a personal investment performance dashboard. It compares a personal portfolio ("AVI"), Mohnish Pabrai's composite and PIF funds, single tickers, and superinvestor 13F portfolios scraped from Dataroma against SPY. The page shows performance and yearly-return charts, annualized returns, holdings tables and a holdings treemap, with time-range and market-cap filters.

## How it works

- `scripts/build-dashboard-data.mjs` - pulls daily prices from Yahoo Finance, combines them with the files in `data/` (positions, trades, current holdings, Pabrai NAV) and quarterly 13F snapshots, and writes `dist/dashboard-data.json`.
- `scripts/scrape-dataroma.mjs` - scrapes Dataroma for superinvestor 13F holdings (24-hour cache).
- `scripts/extract-pabrai-pdf-data.mjs` - extracts Pabrai fund figures from PDF statements (PDF paths are hardcoded to a local Downloads folder).
- `src/` - React 19 app built with Vite, Tailwind CSS v4 and d3 (`App.jsx`, `hooks/useModel.js`, `components/chart`, `components/detail`, `components/compare`).
- `server.mjs` - small Node static server for `dist/` with gzip and cache headers (port 4174 by default).
- `program.md`, `autoresearch.bat`, `results.tsv` - an autonomous "autoresearch" loop: Claude Code makes a change, rebuilds, scores the page with Lighthouse, and keeps or discards the change.
- `docs/plans/` - design and implementation plans for the redesign, leaderboard and Dataroma integration.

## Running it

```bash
npm install
npm run build    # build dashboard data, then the Vite app
npm run serve    # serve dist/ at http://localhost:4174
```

For development use `npm run dev`. On Windows, `start.bat` installs dependencies, builds the data if missing and opens the Vite dev server.

## Status

Personal side project. The default branch is `autoresearch/mar8`; `master` holds the version from before the autoresearch loop.
