# BBMB-Index Premium Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the BBMB-Index dashboard from vanilla HTML/CSS/JS to a premium React app with Vite, Tailwind CSS v4, Framer Motion animations, D3-powered interactive charts, and Geist typography.

**Architecture:** Vite builds a React 19 SPA to `dist/`. The existing `scripts/build-dashboard-data.mjs` continues to generate `dashboard-data.json` and `pabrai_nav.json` into `dist/`. The Vite dev server proxies those JSON files. All business logic from `app/app.js` is ported into React hooks (`useDataLoader`, `useModel`). The D3 chart is a controlled React component that owns its SVG via refs.

**Tech Stack:** Vite, React 19, Tailwind CSS v4, Framer Motion, D3 (d3-scale, d3-shape, d3-array), Geist + Geist Mono fonts

---

## Task 1: Scaffold Vite + React + Tailwind project

**Files:**
- Create: `vite.config.js`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`
- Modify: `package.json`
- Create: `index.html` (Vite entry at project root)

**Step 1: Install dependencies**

```bash
npm install react react-dom framer-motion d3-scale d3-shape d3-array
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

**Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    port: 4173,
    proxy: {
      '/dashboard-data.json': {
        target: 'http://localhost:4174',
        changeOrigin: true,
      },
      '/pabrai_nav.json': {
        target: 'http://localhost:4174',
        changeOrigin: true,
      },
    },
  },
});
```

**Step 3: Create root `index.html`** (Vite entry point)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Boba Bonh Mi Bros</title>
    <meta name="description" content="Compare AVI, the Pabrai composite, each PIF fund, and SPY across a fixed five-year window.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Note: If Google Fonts doesn't host Geist, use `fontsource` instead:
```bash
npm install @fontsource-variable/geist @fontsource-variable/geist-mono
```
Then import in `main.jsx`:
```js
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
```

**Step 4: Create `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #f0ebe3;
  --color-bg-deep: #e6dfd3;
  --color-surface: #fffbf5;
  --color-surface-muted: rgba(249, 242, 232, 0.88);
  --color-surface-glass: rgba(255, 251, 245, 0.82);
  --color-ink: #141210;
  --color-muted: #6b6158;
  --color-line: rgba(74, 61, 46, 0.14);
  --color-line-strong: rgba(74, 61, 46, 0.24);
  --color-accent: #0f6d67;
  --color-series-avi: #0f6d67;
  --color-series-pabrai: #bc6a35;
  --color-series-pif2: #507d3f;
  --color-series-pif3: #9d5234;
  --color-series-pif4: #5f7286;
  --color-series-spy: #171717;
  --font-sans: 'Geist Variable', 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono Variable', 'Geist Mono', 'Consolas', monospace;
  --radius-xl: 1.75rem;
  --radius-lg: 1.375rem;
  --radius-md: 1rem;
  --shadow-card: 0 24px 60px rgba(78, 55, 29, 0.08);
  --shadow-soft: 0 16px 40px rgba(78, 55, 29, 0.06);
  --shadow-hover: 0 14px 28px rgba(61, 44, 23, 0.1);
}

body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
  color: var(--color-ink);
  background:
    radial-gradient(circle at 0% 0%, rgba(197, 145, 84, 0.22), transparent 26%),
    radial-gradient(circle at 100% 0%, rgba(15, 109, 103, 0.12), transparent 22%),
    radial-gradient(circle at 50% 100%, rgba(188, 106, 53, 0.08), transparent 20%),
    linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-deep) 100%);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image: radial-gradient(rgba(17, 14, 11, 0.16) 0.7px, transparent 0.7px);
  background-size: 10px 10px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.3));
  z-index: 50;
}
```

**Step 5: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 6: Create `src/App.jsx`** (skeleton)

```jsx
export default function App() {
  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7 pb-14">
      <h1 className="text-4xl font-semibold tracking-tighter">Boba Bonh Mi Bros</h1>
      <p className="mt-4 text-muted">Scaffolding complete. Components coming next.</p>
    </div>
  );
}
```

**Step 7: Update `package.json` scripts**

Add to scripts:
```json
{
  "dev:vite": "vite",
  "dev:data": "node server.mjs",
  "build:app": "vite build",
  "preview": "vite preview"
}
```

**Step 8: Update `server.mjs`** to serve on port 4174 (Vite dev proxies to it)

Change `const port = 4173;` to `const port = 4174;` so it doesn't conflict with Vite's dev server.

**Step 9: Verify**

```bash
npm run build && npm run dev:vite
```

Expected: Vite dev server on port 4173 showing the skeleton h1.

**Step 10: Commit**

```bash
git add vite.config.js src/ index.html package.json package-lock.json server.mjs
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

## Task 2: Port data layer into React hooks

**Files:**
- Create: `src/hooks/useDataLoader.js`
- Create: `src/hooks/useModel.js`
- Create: `src/lib/formatters.js`
- Create: `src/lib/series.js`
- Create: `src/lib/constants.js`

**Step 1: Create `src/lib/constants.js`**

Port `seriesAppearance` and color mappings from `app/app.js:118-129`. This is the single source of truth for series colors, labels, and kind mappings.

```js
export const SERIES_COLORS = {
  AVI: 'var(--color-series-avi)',
  PABRAI: 'var(--color-series-pabrai)',
  PIF2: 'var(--color-series-pif2)',
  PIF3: 'var(--color-series-pif3)',
  PIF4: 'var(--color-series-pif4)',
  SPY: 'var(--color-series-spy)',
};

export const SERIES_RAW_COLORS = {
  AVI: '#0f6d67',
  PABRAI: '#bc6a35',
  PIF2: '#507d3f',
  PIF3: '#9d5234',
  PIF4: '#5f7286',
  SPY: '#171717',
};

export const SERIES_LABELS = {
  AVI: { kindLabel: 'Portfolio' },
  PABRAI: { kindLabel: 'Composite' },
  PIF2: { kindLabel: 'Fund' },
  PIF3: { kindLabel: 'Fund' },
  PIF4: { kindLabel: 'Fund' },
  SPY: { kindLabel: 'Benchmark' },
};

export function getSeriesAppearance(id) {
  return {
    color: SERIES_COLORS[id] ?? SERIES_COLORS.SPY,
    rawColor: SERIES_RAW_COLORS[id] ?? SERIES_RAW_COLORS.SPY,
    kindLabel: SERIES_LABELS[id]?.kindLabel ?? 'Series',
  };
}
```

**Step 2: Create `src/lib/formatters.js`**

Port all formatting functions from `app/app.js:10-66` — `formatPercent`, `formatAnnualized`, `formatNumber`, `formatDate`. Identical logic, just exported as named functions.

**Step 3: Create `src/lib/series.js`**

Port utility functions from `app/app.js:74-116` — `yearsBetween`, `annualizeReturn`, `latestNonNull`, `interpolateSeriesValue`. These are pure functions used by the model builder.

**Step 4: Create `src/hooks/useDataLoader.js`**

```js
import { useState, useEffect } from 'react';

export function useDataLoader() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('./dashboard-data.json').then(r => {
        if (!r.ok) throw new Error(`Failed: ${r.status}`);
        return r.json();
      }),
      fetch('./pabrai_nav.json').then(r => r.ok ? r.json() : null),
    ])
      .then(([dashboardData, pabraiNav]) => {
        setData({ dashboardData, pabraiNav });
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { data, error, loading };
}
```

**Step 5: Create `src/hooks/useModel.js`**

Port `buildModel` from `app/app.js:162-274`, `buildPifSeries` from `app/app.js:131-160`, and the preset/view definitions. This hook takes `{ dashboardData, pabraiNav }` and returns the full model object. Use `useMemo` so it only recalculates when data changes.

```js
import { useMemo } from 'react';
import { buildPifSeries, buildComparisonSeries, buildViews, buildPresets } from './modelHelpers';
// Or inline all the logic — the key point is it returns the same shape
// as the vanilla app's `state.model`

export function useModel(data) {
  return useMemo(() => {
    if (!data) return null;
    // Port buildModel logic here
    // Return: { metadata, avi, pabrai, dates, windowStart, windowEnd,
    //           comparisonSeries, seriesById, views, presets, ... }
  }, [data]);
}
```

**Step 6: Wire into App.jsx**

```jsx
import { useState } from 'react';
import { useDataLoader } from './hooks/useDataLoader';
import { useModel } from './hooks/useModel';

export default function App() {
  const { data, error, loading } = useDataLoader();
  const model = useModel(data);
  const [activeView, setActiveView] = useState('AVI');
  const [selectedSeriesIds, setSelectedSeriesIds] = useState(['AVI', 'PABRAI', 'SPY']);
  const [activePresetId, setActivePresetId] = useState('avi-pabrai-spy');

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message={error.message} />;
  if (!model) return null;

  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7 pb-14">
      <p>Model loaded: {model.comparisonSeries.length} series, {model.dates.length} dates</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7">
      <div className="rounded-[1.75rem] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
        <p className="text-muted">Loading comparison lab...</p>
      </div>
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] py-7">
      <div className="rounded-[1.75rem] border border-line bg-surface-glass p-8 shadow-card backdrop-blur-xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Load failure</span>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">The comparison lab could not load.</h3>
        <p className="mt-2 text-muted">{message}</p>
      </div>
    </div>
  );
}
```

**Step 7: Verify**

```bash
npm run build && npm run dev:vite
```

Expected: Page loads, shows "Model loaded: 6 series, ~1200 dates"

**Step 8: Commit**

```bash
git add src/hooks/ src/lib/ src/App.jsx
git commit -m "feat: port data layer and model builder into React hooks"
```

---

## Task 3: Build shared UI primitives

**Files:**
- Create: `src/components/ui/Pill.jsx`
- Create: `src/components/ui/Chip.jsx`
- Create: `src/components/ui/ActionButton.jsx`
- Create: `src/components/ui/GlassCard.jsx`
- Create: `src/components/ui/Eyebrow.jsx`

**Step 1: Create `GlassCard.jsx`**

The base card component used everywhere. Warm glass panel with inner refraction border, configurable border-radius.

```jsx
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', as = 'section', ...props }) {
  const Tag = as === 'motion' ? motion.section : as;
  return (
    <Tag
      className={`relative rounded-[var(--radius-xl)] border border-line bg-surface-glass shadow-card backdrop-blur-xl ${className}`}
      {...props}
    >
      <div className="pointer-events-none absolute inset-px rounded-[inherit] border border-white/40" />
      <div className="relative">{children}</div>
    </Tag>
  );
}
```

**Step 2: Create `Eyebrow.jsx`**

```jsx
export default function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
      {children}
    </span>
  );
}
```

**Step 3: Create `Pill.jsx`**

The data-type pill (Portfolio, Composite, Fund, Benchmark). Color maps to series kind.

```jsx
const kindStyles = {
  portfolio: 'text-series-avi',
  composite: 'text-series-pabrai',
  fund: 'text-series-pif2',
  benchmark: 'text-series-spy',
  pending: 'text-muted',
};

export default function Pill({ kind, children }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-line bg-white/70 px-2 py-1 text-[0.73rem] font-semibold tracking-wide ${kindStyles[kind] ?? kindStyles.pending}`}>
      {children}
    </span>
  );
}
```

**Step 4: Create `Chip.jsx`**

Interactive pill-shaped button with hover lift, active press, and selected state.

```jsx
import { motion } from 'framer-motion';

export default function Chip({ selected, onClick, children, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-3.5 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2 ${
        selected
          ? 'border-transparent bg-gradient-to-br from-stone-900 to-stone-800 text-amber-50'
          : 'border-line bg-white/70 text-ink hover:border-line-strong'
      } ${className}`}
      whileHover={{ y: -1, boxShadow: '0 14px 28px rgba(61,44,23,0.1)' }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
```

**Step 5: Create `ActionButton.jsx`**

The teal-tinted action chip used for quick compare jumps.

```jsx
import { motion } from 'framer-motion';

export default function ActionButton({ onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/24 bg-accent/10 px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-accent/16 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI primitives (GlassCard, Chip, Pill, ActionButton, Eyebrow)"
```

---

## Task 4: Hero and PageShell layout

**Files:**
- Create: `src/components/layout/PageShell.jsx`
- Create: `src/components/layout/Hero.jsx`
- Create: `src/components/layout/BrandMark.jsx`

**Step 1: Create `PageShell.jsx`**

The outer container. Just the max-width wrapper with padding.

```jsx
export default function PageShell({ children }) {
  return (
    <div className="relative mx-auto w-[min(1380px,calc(100vw-36px))] space-y-5 py-7 pb-14 max-md:w-[min(100vw-24px,1380px)] max-md:pt-5">
      {children}
    </div>
  );
}
```

**Step 2: Create `BrandMark.jsx`**

Port the inline SVG from `app/index.html:16-44`. Wrap in a floating container with the gentle animation.

```jsx
import { motion } from 'framer-motion';

export default function BrandMark() {
  return (
    <motion.div
      className="flex-none w-[138px] p-1.5 rounded-[28px] bg-amber-50/92 shadow-soft max-md:w-[108px]"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.78), var(--shadow-soft)' }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
    >
      <svg viewBox="0 0 190 110" role="presentation" className="block w-full h-auto">
        {/* Port exact SVG paths from app/index.html:18-43 */}
      </svg>
    </motion.div>
  );
}
```

**Step 3: Create `Hero.jsx`**

Asymmetric hero with left-aligned copy (~60%) and right stat panels. Uses motion for staggered entrance.

```jsx
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import BrandMark from './BrandMark';
import Eyebrow from '../ui/Eyebrow';
import { formatDate } from '../../lib/formatters';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export default function Hero({ metadata, selectedCount }) {
  return (
    <motion.header
      className="grid grid-cols-[minmax(0,1.35fr)_minmax(280px,0.78fr)] gap-5 items-stretch max-lg:grid-cols-1"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <GlassCard className="h-full p-6 overflow-hidden max-md:p-5">
          <div className="flex items-center gap-4 max-md:items-start">
            <BrandMark />
            <div className="min-w-0">
              <Eyebrow>Five-year comparison lab</Eyebrow>
              <h1 className="mt-1.5 text-4xl font-semibold leading-none tracking-tighter text-balance md:text-6xl">
                Boba Bonh Mi Bros
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted text-pretty">
            Compare AVI, the Pabrai composite, each PIF fund, and SPY on one fixed five-year canvas,
            then swap the detail panel without rebuilding the chart.
          </p>
        </GlassCard>
      </motion.div>

      <motion.div className="grid gap-3.5" variants={stagger}>
        <motion.div variants={fadeUp}>
          <HeroPanel
            label="Window"
            value={`${formatDate(metadata.windowStart)} to ${formatDate(metadata.windowEnd)}`}
            note="Fixed comparison span"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <HeroPanel
            label="Compare stack"
            value={`${selectedCount} active line${selectedCount === 1 ? '' : 's'}`}
            note={`${metadata.benchmarkSymbol} — ${metadata.benchmarkName}`}
          />
        </motion.div>
      </motion.div>
    </motion.header>
  );
}

function HeroPanel({ label, value, note }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-amber-50/88 p-4 shadow-card backdrop-blur-xl">
      <Eyebrow>{label}</Eyebrow>
      <strong className="mt-2.5 block text-lg font-semibold leading-tight lg:text-xl">{value}</strong>
      <span className="mt-2.5 block leading-snug text-muted">{note}</span>
    </div>
  );
}
```

**Step 4: Wire Hero into App.jsx**

Replace the skeleton content with `<PageShell>` + `<Hero>`.

**Step 5: Verify**

Run Vite, check that the hero renders with the brand mark floating, stat panels appear with stagger animation.

**Step 6: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add Hero, PageShell, and BrandMark with staggered entrance"
```

---

## Task 5: Focus tabs

**Files:**
- Create: `src/components/focus/FocusTabs.jsx`

**Step 1: Create `FocusTabs.jsx`**

```jsx
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import Eyebrow from '../ui/Eyebrow';
import Chip from '../ui/Chip';

export default function FocusTabs({ views, activeView, onViewChange }) {
  return (
    <GlassCard className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] items-center gap-4 p-5 max-lg:grid-cols-1">
      <div>
        <Eyebrow>Focus view</Eyebrow>
        <h2 className="mt-1.5 text-lg font-semibold leading-tight tracking-tight lg:text-xl">
          Change the detail panel without losing your compare stack
        </h2>
      </div>
      <div className="flex flex-wrap justify-end gap-2.5 max-lg:justify-start" role="tablist">
        {views.map((view) => (
          <Chip
            key={view.id}
            selected={activeView === view.id}
            onClick={() => onViewChange(view.id)}
            role="tab"
            aria-selected={activeView === view.id}
          >
            {view.label}
          </Chip>
        ))}
      </div>
    </GlassCard>
  );
}
```

**Step 2: Wire into App.jsx, verify, commit**

```bash
git add src/components/focus/
git commit -m "feat: add FocusTabs component"
```

---

## Task 6: Compare lab

**Files:**
- Create: `src/components/compare/CompareLab.jsx`
- Create: `src/components/compare/CompareChip.jsx`
- Create: `src/components/compare/PresetPanel.jsx`
- Create: `src/components/compare/SelectionPanel.jsx`

**Step 1: Create `CompareChip.jsx`**

A chip with a colored dot and annualized return subtext. Toggles series on click.

```jsx
import Chip from '../ui/Chip';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized } from '../../lib/formatters';

export default function CompareChip({ series, selected, onToggle }) {
  const { color } = getSeriesAppearance(series.id);
  return (
    <Chip selected={selected} onClick={() => onToggle(series.id)}>
      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
      <span className="grid gap-0.5">
        <strong className="text-sm font-semibold">{series.shortLabel ?? series.label}</strong>
        <span className="text-xs opacity-70">{formatAnnualized(series.annualizedReturnPct)}</span>
      </span>
    </Chip>
  );
}
```

**Step 2: Create `PresetPanel.jsx`**

Sidebar callout with preset buttons.

```jsx
import Chip from '../ui/Chip';
import Eyebrow from '../ui/Eyebrow';

export default function PresetPanel({ presets, activePresetId, onPresetSelect }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/88 p-5">
      <Eyebrow>Presets</Eyebrow>
      <h3 className="mt-2 text-base font-semibold tracking-tight">Quick starting stacks</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Jump straight into common combinations, then fine-tune with the chips on the left.
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {presets.map((preset) => (
          <Chip
            key={preset.id}
            selected={activePresetId === preset.id}
            onClick={() => onPresetSelect(preset.seriesIds, preset.id)}
          >
            {preset.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Create `SelectionPanel.jsx`**

Shows the currently active lines with their annualized return and notes.

```jsx
import Eyebrow from '../ui/Eyebrow';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized } from '../../lib/formatters';

export default function SelectionPanel({ selectedSeries }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/88 p-5">
      <Eyebrow>Active stack</Eyebrow>
      <h3 className="mt-2 text-base font-semibold tracking-tight">
        {selectedSeries.length} line{selectedSeries.length === 1 ? '' : 's'} on the canvas
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Every selected line gets its own annualized card above the chart.
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {selectedSeries.map((series) => {
          const { color } = getSeriesAppearance(series.id);
          return (
            <div key={series.id} className="flex w-full items-center justify-between gap-3.5 rounded-[14px] border border-line/60 bg-white/90 p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
                <div className="grid gap-0.5 min-w-0">
                  <strong className="text-sm font-semibold">{series.label}</strong>
                  <span className="text-xs text-muted truncate">{series.note}</span>
                </div>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap font-mono">
                {formatAnnualized(series.annualizedReturnPct)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 4: Create `CompareLab.jsx`**

The main compare section: left side has grouped chips, right side has preset + selection panels.

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import CompareChip from './CompareChip';
import PresetPanel from './PresetPanel';
import SelectionPanel from './SelectionPanel';
import Eyebrow from '../ui/Eyebrow';

const GROUP_CONFIG = [
  { title: 'Portfolios and composite', ids: ['AVI', 'PABRAI'] },
  { title: 'Single PIF funds', ids: ['PIF2', 'PIF3', 'PIF4'] },
  { title: 'Benchmark', ids: ['SPY'] },
];

export default function CompareLab({
  comparisonSeries,
  seriesById,
  selectedSeriesIds,
  selectedSeries,
  presets,
  activePresetId,
  onToggle,
  onPresetSelect,
}) {
  return (
    <GlassCard className="grid grid-cols-[minmax(0,1.3fr)_minmax(290px,0.9fr)] gap-5 p-6 max-lg:grid-cols-1">
      <div className="grid gap-3.5 content-start">
        <div>
          <Eyebrow>Compare lines</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
            Pick any stack you want
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            AVI, PABRAI, each PIF fund, and SPY all live on the same five-year chart.
            Toggle combinations without rebuilding the page.
          </p>
        </div>

        <div className="grid gap-4">
          {GROUP_CONFIG.map((group) => {
            const available = group.ids.map(id => seriesById[id]).filter(Boolean);
            if (!available.length) return null;
            return (
              <div key={group.title} className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/82 p-3.5">
                <h3 className="mb-3 text-sm font-semibold tracking-tight">{group.title}</h3>
                <div className="flex flex-wrap gap-2.5">
                  {available.map((series) => (
                    <CompareChip
                      key={series.id}
                      series={series}
                      selected={selectedSeriesIds.includes(series.id)}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="grid gap-3.5 content-start">
        <PresetPanel presets={presets} activePresetId={activePresetId} onPresetSelect={onPresetSelect} />
        <SelectionPanel selectedSeries={selectedSeries} />
      </aside>
    </GlassCard>
  );
}
```

**Step 5: Wire into App, verify, commit**

```bash
git add src/components/compare/
git commit -m "feat: add CompareLab with chips, presets, and selection panel"
```

---

## Task 7: Annualized strip with animated cards

**Files:**
- Create: `src/components/metrics/AnnualizedStrip.jsx`
- Create: `src/components/metrics/AnnualizedCard.jsx`
- Create: `src/components/metrics/AnimatedNumber.jsx`

**Step 1: Create `AnimatedNumber.jsx`**

A component that counts up from 0 to the target value on first mount. Uses requestAnimationFrame, not React state updates per frame.

```jsx
import { useRef, useEffect, useState } from 'react';

export default function AnimatedNumber({ value, format, duration = 600 }) {
  const [display, setDisplay] = useState(format(0));
  const ref = useRef({ startTime: null, animationId: null });

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplay(format(value));
      return;
    }

    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(format(value * eased));
      if (progress < 1) {
        ref.current.animationId = requestAnimationFrame(tick);
      }
    }
    ref.current.animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current.animationId);
  }, [value, format, duration]);

  return <>{display}</>;
}
```

**Step 2: Create `AnnualizedCard.jsx`**

```jsx
import { motion } from 'framer-motion';
import Pill from '../ui/Pill';
import AnimatedNumber from './AnimatedNumber';
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized, formatPercent } from '../../lib/formatters';

export default function AnnualizedCard({ series }) {
  const { kindLabel } = getSeriesAppearance(series.id);
  return (
    <motion.article
      layout
      layoutId={`annualized-${series.id}`}
      className="rounded-[var(--radius-lg)] border border-line/60 bg-amber-50/90 p-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.62)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <Pill kind={series.kind}>{kindLabel}</Pill>
      <strong className="mt-2.5 block text-3xl font-semibold leading-none font-mono lg:text-4xl">
        <AnimatedNumber value={series.annualizedReturnPct} format={formatAnnualized} />
      </strong>
      <span className="mt-2.5 block text-sm leading-snug text-muted">
        {series.label} total return {formatPercent(series.totalReturnPct)}.
      </span>
      <span className="mt-1 block text-sm leading-snug text-muted">{series.note}</span>
    </motion.article>
  );
}
```

**Step 3: Create `AnnualizedStrip.jsx`**

```jsx
import { AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import AnnualizedCard from './AnnualizedCard';
import Eyebrow from '../ui/Eyebrow';

export default function AnnualizedStrip({ selectedSeries }) {
  return (
    <GlassCard className="p-6">
      <div>
        <Eyebrow>Annualized return</Eyebrow>
        <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
          Only the yearly compounding view stays at the top.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Total return still shows up inside each card, but the headline number is always annualized return.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 max-md:grid-cols-1">
        <AnimatePresence mode="popLayout">
          {selectedSeries.map((series) => (
            <AnnualizedCard key={series.id} series={series} />
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
```

**Step 4: Wire into App, verify cards animate in/out when toggling series, commit**

```bash
git add src/components/metrics/
git commit -m "feat: add AnnualizedStrip with animated cards and number countup"
```

---

## Task 8: D3-powered performance chart

**Files:**
- Create: `src/components/chart/PerformanceChart.jsx`
- Create: `src/hooks/useChartInteraction.js`
- Create: `src/components/chart/ChartTooltip.jsx`
- Create: `src/components/chart/ChartLegend.jsx`
- Create: `src/components/chart/ChartNotes.jsx`
- Create: `src/components/chart/ValueReadout.jsx`

This is the largest task. It builds the interactive D3 chart with crosshair, tooltips, zoom/pan, line morphing, and value readout.

**Step 1: Create `src/hooks/useChartInteraction.js`**

Manages chart interaction state: hovered date index, hovered series, zoom range, and mouse position. Uses refs and callbacks to avoid re-renders on every mouse move.

```js
import { useRef, useState, useCallback } from 'react';

export function useChartInteraction(dates) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredSeriesId, setHoveredSeriesId] = useState(null);
  const [zoomRange, setZoomRange] = useState(null); // [startIndex, endIndex] or null for full
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event, svgRect, xScale) => {
    const mouseX = event.clientX - svgRect.left;
    mouseRef.current = { x: mouseX, y: event.clientY - svgRect.top };

    // Find nearest date index via xScale.invert + bisect
    // Set hoveredIndex
  }, [dates]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setHoveredSeriesId(null);
  }, []);

  const handleWheel = useCallback((event, xScale) => {
    event.preventDefault();
    // Zoom: expand/contract zoomRange centered on cursor position
    // Double-click resets: setZoomRange(null)
  }, []);

  const resetZoom = useCallback(() => setZoomRange(null), []);

  return {
    hoveredIndex,
    hoveredSeriesId,
    zoomRange,
    mouseRef,
    setHoveredIndex,
    setHoveredSeriesId,
    handleMouseMove,
    handleMouseLeave,
    handleWheel,
    resetZoom,
  };
}
```

**Step 2: Create `PerformanceChart.jsx`**

The main chart component. Uses D3 scales (scaleLinear, scaleTime) for positioning, SVG for rendering. React owns the DOM, D3 only computes scales and paths.

Key details:
- `d3.scaleLinear()` for y-axis (return %)
- `d3.scaleLinear()` for x-axis (index-based, maps to pixel)
- `d3.line()` with `.defined()` for building SVG paths from returnPctSeries
- Crosshair: vertical `<line>` at hovered x position, rendered conditionally
- Line highlighting: hovered series at full opacity/thicker stroke, others at 0.4
- New lines: CSS `stroke-dashoffset` animation on mount (draw-in effect)
- Line transitions: use `d3.line()` to compute new path strings, then Framer Motion `animate` on the `d` attribute (or CSS transition on `d`)

```jsx
import { useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import GlassCard from '../ui/GlassCard';
import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import ChartNotes from './ChartNotes';
import ValueReadout from './ValueReadout';
import Eyebrow from '../ui/Eyebrow';
import { useChartInteraction } from '../../hooks/useChartInteraction';
import { formatDate, formatPercent } from '../../lib/formatters';
import { getSeriesAppearance } from '../../lib/constants';

const WIDTH = 1100;
const HEIGHT = 430;
const PADDING = { top: 18, right: 34, bottom: 44, left: 78 };

export default function PerformanceChart({ selectedSeries, dates, windowStart, windowEnd }) {
  const svgRef = useRef(null);
  const interaction = useChartInteraction(dates);

  const { xScale, yScale, allValues, minVal, maxVal } = useMemo(() => {
    const allValues = selectedSeries.flatMap(s => s.returnPctSeries).filter(v => v != null);
    const rawMin = Math.min(...allValues, 0);
    const rawMax = Math.max(...allValues, 0);
    const span = Math.max(rawMax - rawMin, 0.12);
    const minVal = rawMin - span * 0.12;
    const maxVal = rawMax + span * 0.12;

    const xScale = d3Scale.scaleLinear()
      .domain([0, dates.length - 1])
      .range([PADDING.left, WIDTH - PADDING.right]);

    const yScale = d3Scale.scaleLinear()
      .domain([minVal, maxVal])
      .range([HEIGHT - PADDING.bottom, PADDING.top]);

    return { xScale, yScale, allValues, minVal, maxVal };
  }, [selectedSeries, dates]);

  const lineFn = useMemo(() =>
    d3Shape.line()
      .defined((d) => d !== null && d !== undefined)
      .x((d, i) => xScale(i))
      .y((d) => yScale(d)),
    [xScale, yScale]
  );

  const gridTicks = useMemo(() => yScale.ticks(4), [yScale]);

  const xLabelIndexes = useMemo(() => {
    const idxs = [0, Math.floor(dates.length / 4), Math.floor(dates.length / 2), Math.floor(dates.length * 3 / 4), dates.length - 1];
    return [...new Set(idxs)];
  }, [dates]);

  const zeroY = yScale(0);

  const handleMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const index = Math.round(xScale.invert(mouseX));
    const clamped = Math.max(0, Math.min(dates.length - 1, index));
    interaction.setHoveredIndex(clamped);

    // Find nearest series
    const mouseY = e.clientY - rect.top;
    let nearestId = null;
    let nearestDist = Infinity;
    selectedSeries.forEach(s => {
      const val = s.returnPctSeries[clamped];
      if (val == null) return;
      const sy = yScale(val);
      const dist = Math.abs(sy - mouseY);
      if (dist < nearestDist && dist < 40) {
        nearestDist = dist;
        nearestId = s.id;
      }
    });
    interaction.setHoveredSeriesId(nearestId);
    interaction.mouseRef.current = { x: e.clientX - rect.left, y: mouseY };
  }, [xScale, yScale, dates, selectedSeries, interaction]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Performance canvas</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight lg:text-2xl">
            Every selected line shares the same five-year frame.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Normalized return from {formatDate(windowStart)} through {formatDate(windowEnd)}.
            PIF lines stay flat after their latest PDF checkpoint.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-gradient-to-b from-white/90 to-amber-50/70 p-4 overflow-x-auto relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block w-full min-w-[900px] h-auto"
          role="img"
          aria-label="Five-year comparison chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => interaction.setHoveredIndex(null)}
          onDoubleClick={interaction.resetZoom}
        >
          {/* Grid lines */}
          {gridTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left} y1={yScale(tick)}
                x2={WIDTH - PADDING.right} y2={yScale(tick)}
                stroke="rgba(74,61,46,0.08)" strokeWidth={1}
              />
              <text
                x={PADDING.left - 10} y={yScale(tick) + 4}
                textAnchor="end" fill="#6b6158" fontSize={12}
                fontFamily="var(--font-mono)"
              >
                {formatPercent(tick)}
              </text>
            </g>
          ))}

          {/* Zero line */}
          <line
            x1={PADDING.left} y1={zeroY}
            x2={WIDTH - PADDING.right} y2={zeroY}
            stroke="rgba(23,23,23,0.18)" strokeWidth={1.2}
            strokeDasharray="4 6"
          />

          {/* Series lines */}
          {selectedSeries.map((series) => {
            const { rawColor } = getSeriesAppearance(series.id);
            const path = lineFn(series.returnPctSeries);
            const isHovered = interaction.hoveredSeriesId === series.id;
            const isDimmed = interaction.hoveredSeriesId && !isHovered;
            return (
              <g key={series.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={rawColor}
                  strokeWidth={isHovered ? 4 : 3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isDimmed ? 0.4 : 1}
                  style={{ transition: 'opacity 200ms, stroke-width 200ms' }}
                />
                {/* Endpoint dot */}
                {(() => {
                  for (let i = series.returnPctSeries.length - 1; i >= 0; i--) {
                    const v = series.returnPctSeries[i];
                    if (v != null) {
                      return (
                        <circle
                          cx={xScale(i)} cy={yScale(v)} r={4.8}
                          fill={rawColor} stroke="rgba(255,255,255,0.88)" strokeWidth={2}
                          opacity={isDimmed ? 0.4 : 1}
                          style={{ transition: 'opacity 200ms' }}
                        />
                      );
                    }
                  }
                  return null;
                })()}
              </g>
            );
          })}

          {/* Crosshair */}
          {interaction.hoveredIndex !== null && (
            <line
              x1={xScale(interaction.hoveredIndex)} y1={PADDING.top}
              x2={xScale(interaction.hoveredIndex)} y2={HEIGHT - PADDING.bottom}
              stroke="rgba(20,18,16,0.3)" strokeWidth={1}
              strokeDasharray="3 3"
              pointerEvents="none"
            />
          )}

          {/* X-axis labels */}
          {xLabelIndexes.map((i) => (
            <text
              key={i}
              x={xScale(i)} y={HEIGHT - 12}
              textAnchor="middle" fill="#6b6158" fontSize={12}
              fontFamily="var(--font-mono)"
            >
              {formatDate(dates[i])}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {interaction.hoveredIndex !== null && (
          <ChartTooltip
            hoveredIndex={interaction.hoveredIndex}
            date={dates[interaction.hoveredIndex]}
            selectedSeries={selectedSeries}
            mousePosition={interaction.mouseRef.current}
          />
        )}
      </div>

      <ValueReadout
        selectedSeries={selectedSeries}
        hoveredIndex={interaction.hoveredIndex}
      />

      <ChartLegend selectedSeries={selectedSeries} />
      <ChartNotes selectedSeries={selectedSeries} />
    </GlassCard>
  );
}
```

**Step 3: Create `ChartTooltip.jsx`**

Floating card positioned near the cursor, shows date + all series values at that index.

```jsx
import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent, formatDate } from '../../lib/formatters';

export default function ChartTooltip({ hoveredIndex, date, selectedSeries, mousePosition }) {
  const entries = selectedSeries
    .map((s) => ({
      id: s.id,
      label: s.label,
      value: s.returnPctSeries[hoveredIndex],
      color: getSeriesAppearance(s.id).rawColor,
    }))
    .filter((e) => e.value != null)
    .sort((a, b) => b.value - a.value);

  if (!entries.length) return null;

  const left = mousePosition.x + 16;
  const top = mousePosition.y - 20;

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur-lg"
      style={{ left, top, minWidth: 160 }}
    >
      <p className="text-xs font-semibold text-muted font-mono">{formatDate(date)}</p>
      <div className="mt-1 grid gap-1">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              {entry.label}
            </span>
            <span className="font-mono font-semibold">{formatPercent(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Create `ValueReadout.jsx`**

Persistent strip below chart showing final value per series, updates to show value-at-cursor during hover.

```jsx
import { getSeriesAppearance } from '../../lib/constants';
import { formatPercent, latestNonNull } from '../../lib/formatters';
// Note: import latestNonNull from lib/series instead

export default function ValueReadout({ selectedSeries, hoveredIndex }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {selectedSeries.map((series) => {
        const { rawColor } = getSeriesAppearance(series.id);
        const value = hoveredIndex !== null
          ? series.returnPctSeries[hoveredIndex]
          : series.totalReturnPct;
        return (
          <div key={series.id} className="flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ background: rawColor }} />
            <span className="font-semibold">{series.shortLabel}</span>
            <span className="font-mono text-muted">{formatPercent(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 5: Create `ChartLegend.jsx`**

Port legend from vanilla app. Row of chips with dot + label + annualized.

```jsx
import { getSeriesAppearance } from '../../lib/constants';
import { formatAnnualized } from '../../lib/formatters';

export default function ChartLegend({ selectedSeries }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2.5">
      {selectedSeries.map((series) => {
        const { rawColor } = getSeriesAppearance(series.id);
        return (
          <div key={series.id} className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white/88 px-3.5 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: rawColor }} />
            <div>
              <strong className="text-sm font-semibold">{series.label}</strong>
              <span className="ml-1.5 text-xs text-muted">{formatAnnualized(series.annualizedReturnPct)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 6: Create `ChartNotes.jsx`**

Grid of note cards for each selected series.

```jsx
export default function ChartNotes({ selectedSeries }) {
  return (
    <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {selectedSeries.map((series) => (
        <article key={series.id} className="rounded-2xl border border-line/60 bg-amber-50/86 p-3.5">
          <strong className="text-sm font-semibold">{series.label}</strong>
          <p className="mt-1 text-sm leading-relaxed text-muted">{series.description} {series.note}</p>
        </article>
      ))}
    </div>
  );
}
```

**Step 7: Wire into App, verify**

Run Vite. Verify: chart renders, crosshair tracks mouse, tooltip shows values at date, lines dim on hover, value readout updates.

**Step 8: Commit**

```bash
git add src/components/chart/ src/hooks/useChartInteraction.js
git commit -m "feat: add D3-powered interactive chart with crosshair, tooltip, and value readout"
```

---

## Task 9: Detail views (AVI, Pabrai, Fund, Pending)

**Files:**
- Create: `src/components/detail/DetailRouter.jsx`
- Create: `src/components/detail/AviDetail.jsx`
- Create: `src/components/detail/PabraiDetail.jsx`
- Create: `src/components/detail/FundDetail.jsx`
- Create: `src/components/detail/PendingDetail.jsx`
- Create: `src/components/detail/DataTable.jsx`
- Create: `src/components/metrics/MetricTile.jsx`

**Step 1: Create `MetricTile.jsx`**

```jsx
import Eyebrow from '../ui/Eyebrow';
import AnimatedNumber from './AnimatedNumber';

export default function MetricTile({ label, value, format }) {
  return (
    <div className="rounded-[18px] border border-line/60 bg-white/90 p-4">
      <Eyebrow>{label}</Eyebrow>
      <strong className="mt-2 block text-xl font-semibold leading-tight font-mono">
        {format ? <AnimatedNumber value={value} format={format} /> : value}
      </strong>
    </div>
  );
}
```

**Step 2: Create `DataTable.jsx`**

Shared table component. Port from `renderTableCard` in `app/app.js:572-611`. Warm alternating rows, hover slide highlight.

```jsx
import Eyebrow from '../ui/Eyebrow';

export default function DataTable({ title, kicker, columns, rows, emptyMessage }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-amber-50/88 p-6 shadow-card backdrop-blur-xl">
      <Eyebrow>{kicker}</Eyebrow>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
      {!rows.length ? (
        <p className="mt-4 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.label} className="border-b border-line/60 pb-2 text-left text-xs font-bold uppercase tracking-widest text-muted">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="group relative border-t border-line/60 transition-colors hover:bg-white/50">
                <td className="pointer-events-none absolute inset-0 w-0 bg-accent/5 transition-all group-hover:w-full" />
                {columns.map((col) => (
                  <td key={col.label} className="relative px-2 py-3 text-sm align-top first:pl-0">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

**Step 3: Create `AviDetail.jsx`**

Port from `renderAviDetail` in `app/app.js:621-710`. Use MetricTile for stats, DataTable for positions tables, left amber border on warnings. Include ActionButtons for quick compare jumps.

Follow the same structure as the vanilla version:
- Intro card with eyebrow, h2, summary, action buttons, metric tiles
- 2-column table grid: open positions + realized positions
- 2-column split: unclassified holdings + data quality warnings

**Step 4: Create `PabraiDetail.jsx`**

Port from `renderPabraiDetail` in `app/app.js:712-788`. Fund cards in an asymmetric 2-column grid with gradient top edges matching each fund's series color. Use DataTable for underlying funds table.

**Step 5: Create `FundDetail.jsx`**

Port from `renderFundDetail` in `app/app.js:789-839`. Simplified single-card layout with metric tiles, checkpoint explanation aside.

**Step 6: Create `PendingDetail.jsx`**

Port from `renderPendingDetail` in `app/app.js:841-850`. Dashed border empty state.

```jsx
import Eyebrow from '../ui/Eyebrow';

export default function PendingDetail({ view }) {
  return (
    <div className="rounded-[var(--radius-xl)] border-2 border-dashed border-line bg-surface-muted p-8">
      <Eyebrow>Pending member</Eyebrow>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{view.label} still needs actual trade detail.</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{view.summary}</p>
      {view.payload?.roughSymbols?.length > 0 && (
        <ul className="mt-3 grid gap-2 pl-4 text-sm text-muted list-disc">
          {view.payload.roughSymbols.map((s) => <li key={s}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}
```

**Step 7: Create `DetailRouter.jsx`**

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import AviDetail from './AviDetail';
import PabraiDetail from './PabraiDetail';
import FundDetail from './FundDetail';
import PendingDetail from './PendingDetail';

export default function DetailRouter({ view, model, onSetSeries }) {
  if (!view) return null;

  const inner = (() => {
    switch (view.kind) {
      case 'portfolio': return <AviDetail view={view} model={model} onSetSeries={onSetSeries} />;
      case 'composite': return <PabraiDetail view={view} model={model} onSetSeries={onSetSeries} />;
      case 'fund': return <FundDetail view={view} model={model} onSetSeries={onSetSeries} />;
      default: return <PendingDetail view={view} />;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {inner}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 8: Wire into App, verify all views, commit**

```bash
git add src/components/detail/ src/components/metrics/MetricTile.jsx
git commit -m "feat: add all detail views (AVI, Pabrai, Fund, Pending) with DataTable and MetricTile"
```

---

## Task 10: Wire everything together in App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Full App.jsx assembly**

Wire all components into App with proper state management:
- `activeView` + `setActiveView`
- `selectedSeriesIds` + toggle/preset logic (port `sanitizeSelection`, `toggleSeries`, `setSelectedSeries` from `app/app.js:276-312`)
- Computed: `selectedSeries`, `activeViewObj`
- Render order: PageShell > Hero > FocusTabs > CompareLab > AnnualizedStrip > PerformanceChart > DetailRouter

**Step 2: Verify full flow**

- Page loads with staggered animation
- Hero shows correct window and count
- Focus tabs switch detail views with cross-fade
- Compare chips toggle series, annualized cards animate in/out
- Presets work
- Chart shows crosshair, tooltip, line dimming
- Detail views render correctly for each tab
- Mobile: single-column collapse at breakpoints

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire all components into App with full state management"
```

---

## Task 11: Update build pipeline

**Files:**
- Modify: `package.json`
- Modify: `scripts/build-dashboard-data.mjs`

**Step 1: Update build script**

Remove the lines in `build-dashboard-data.mjs:831-836` that copy `app/` files to `dist/`. Vite now handles the frontend build. The data script should only output JSON files.

Replace lines 831-836:
```js
// Remove these:
// await Promise.all([
//   fs.copyFile(path.join(appDir, 'index.html'), path.join(distDir, 'index.html')),
//   fs.copyFile(path.join(appDir, 'styles.css'), path.join(distDir, 'styles.css')),
//   fs.copyFile(path.join(appDir, 'app.js'), path.join(distDir, 'app.js')),
//   fs.copyFile(path.join(dataDir, 'pabrai_nav.json'), path.join(distDir, 'pabrai_nav.json')),
// ]);
```

Keep only:
```js
await fs.copyFile(path.join(dataDir, 'pabrai_nav.json'), path.join(distDir, 'pabrai_nav.json'));
```

**Step 2: Update package.json scripts**

```json
{
  "scripts": {
    "extract:pabrai": "node scripts/extract-pabrai-pdf-data.mjs",
    "build:data": "node scripts/build-dashboard-data.mjs",
    "build:app": "vite build",
    "build": "node scripts/build-dashboard-data.mjs && vite build",
    "serve": "node server.mjs",
    "dev": "vite",
    "dev:data": "node server.mjs"
  }
}
```

**Step 3: Update `vite.config.js`** to not empty outDir (so data JSON persists)

Already set: `emptyOutDir: false`

**Step 4: Verify production build**

```bash
npm run build:data && npm run build:app && npm run serve
```

Expected: Server on 4174 serves the built React app with real data.

**Step 5: Commit**

```bash
git add package.json scripts/build-dashboard-data.mjs vite.config.js
git commit -m "feat: update build pipeline for Vite + data script coexistence"
```

---

## Task 12: Polish pass — responsive, accessibility, performance

**Files:**
- Modify: various components

**Step 1: Responsive breakpoints**

Audit all grid layouts. Ensure:
- Hero: `max-lg:grid-cols-1`
- CompareLab: `max-lg:grid-cols-1`
- FocusTabs: `max-lg:grid-cols-1`, tabs left-align
- FundGrid: `max-md:grid-cols-1`, `md:grid-cols-2`
- Detail splits: `max-lg:grid-cols-1`
- Chart: `min-w-[760px]` on mobile with horizontal scroll
- Page shell: tighter padding on mobile

**Step 2: Accessibility**

- Focus rings on all interactive elements (already via Chip component)
- `role="tablist"` and `role="tab"` on focus tabs (already done)
- `aria-label` on chart SVG (already done)
- `aria-selected` on tabs (already done)
- Skip-to-content link at top of page
- Semantic HTML: `<header>`, `<main>`, `<section>`, `<aside>`, `<article>`, `<nav>`

**Step 3: Performance**

- Wrap `BrandMark` in `React.memo` (perpetual float animation)
- Wrap `AnimatedNumber` — it already manages its own lifecycle
- Ensure chart `onMouseMove` uses `useCallback`
- Check no unnecessary re-renders with React DevTools

**Step 4: Verify everything, commit**

```bash
git add -A
git commit -m "feat: responsive, accessibility, and performance polish"
```

---

## Task 13: Final cleanup

**Step 1: Remove old `app/` directory** (optional — keep as reference or delete)

Ask the user whether to keep or remove `app/index.html`, `app/styles.css`, `app/app.js`.

**Step 2: Update root `index.html`** meta tags if needed (og:image, etc.)

**Step 3: Final visual QA**

Open in browser, verify:
- All animations feel smooth and premium
- No layout jumps on mobile
- Chart tooltip positions correctly near edges
- All data displays match the vanilla version's output
- No console errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete premium redesign — React + Tailwind + D3 + Framer Motion"
```
