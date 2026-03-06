# BBMB-Index Premium Redesign

## Date: 2026-03-05

## Overview
Full migration of the BBMB-Index financial comparison dashboard from vanilla HTML/CSS/JS to a premium React application with interactive D3 charting, Framer Motion animations, and Tailwind CSS styling.

## Stack
- Vite + React 19
- Tailwind CSS v4
- Framer Motion
- D3 (d3-scale, d3-shape, d3-array) for chart
- Geist + Geist Mono fonts

## Architecture

### Project Structure
```
src/
  main.jsx
  App.jsx
  index.css
  hooks/
    useDataLoader.js
    useModel.js
    useChartInteraction.js
  components/
    layout/
      PageShell.jsx
      Hero.jsx
    compare/
      CompareLab.jsx
      CompareChip.jsx
      PresetPanel.jsx
      SelectionPanel.jsx
    metrics/
      AnnualizedStrip.jsx
      AnnualizedCard.jsx
      MetricTile.jsx
    chart/
      PerformanceChart.jsx
      ChartLegend.jsx
      ChartNotes.jsx
    detail/
      DetailRouter.jsx
      AviDetail.jsx
      PabraiDetail.jsx
      FundDetail.jsx
      PendingDetail.jsx
      DataTable.jsx
    focus/
      FocusTabs.jsx
    ui/
      Pill.jsx
      Chip.jsx
      ActionButton.jsx
```

### Data Flow
- App fetches data via useDataLoader (dashboard-data.json + pabrai_nav.json)
- useModel transforms raw data into the comparison model
- activeView and selectedSeriesIds held in App state
- Props down, callbacks up — no global state library

## Visual Design

### Color Palette
- Background: `#f0ebe3` with radial gradients (muted teal top-right, muted amber top-left)
- Surfaces: `#fffbf5`, 1px `rgba(74,61,46,0.10)` border + inner `rgba(255,255,255,0.4)` refraction border
- Ink: `#141210` (warm off-black)
- Muted: `#6b6158`
- Accent: `#0f6d67` (teal) — active states and primary actions only
- Series colors: unchanged (already good)
- Shadows: warm-tinted `rgba(78,55,29,0.08)`

### Typography
- Geist for all UI text
- Geist Mono for numbers, tickers, percentages
- Hero h1: text-4xl md:text-6xl tracking-tighter leading-none font-semibold
- Section h2: text-xl md:text-2xl tracking-tight leading-tight
- Body: text-base text-stone-500 leading-relaxed max-w-[65ch]
- Eyebrows: text-xs font-semibold uppercase tracking-widest muted

### Layout
- Max width: max-w-[1400px] mx-auto
- Hero: asymmetric split, left-aligned copy ~60%, right stat panels
- Major cards: rounded-[1.75rem], inner cards: rounded-2xl
- Generous padding: p-8 major, p-5 inner
- Annualized strip: auto-fit grid min 220px
- Compare lab: 2-column (wide left, narrow right)

### Surfaces & Depth
- Cards: backdrop-blur-xl on warm cream
- Inner border refraction on hero, chart, compare lab
- Fixed noise overlay at 0.12 opacity on body::before
- Diffusion shadows: shadow-[0_24px_60px_rgba(78,55,29,0.08)]

### Chips & Interactive Elements
- rounded-full, 1px border, warm cream bg
- Active: dark gradient from-stone-900 to-stone-800, cream text
- Hover: translateY(-1px) + stronger shadow
- Press: scale-[0.98]
- Focus: ring-2 ring-teal-600/20 ring-offset-2

## Motion & Animation

### Page Load
- Hero fades in (opacity 0-1, y: 12-0, 400ms spring)
- Stat panels stagger 80ms after
- Focus strip 120ms after
- Dashboard cards cascade with staggerChildren: 0.06, spring physics

### Interaction Transitions
- Compare chip toggle: AnimatePresence + layout prop on annualized cards
- Focus tab switch: cross-fade (opacity + slight y shift, 200ms)
- Preset click: spring on chips, layoutId on annualized cards
- Chart lines: D3 path morph 400ms ease-out

### Micro-interactions
- Brand mark: gentle float (existing)
- Compare chips: magnetic pull via useMotionValue (not useState)
- Annualized numbers: 600ms countup on first appear
- Table rows: highlight slides in from left on hover
- Action buttons: directional hover fill

### Performance Rules
- Perpetual animations isolated in React.memo components
- Only transform and opacity animated
- will-change: transform used sparingly
- Magnetic hover via useMotionValue outside render cycle

## Chart Interaction (Bloomberg Energy)

### Crosshair
- Vertical line snaps to nearest date on mouse move
- Horizontal line tracks to hovered series value

### Tooltip
- Floating card near cursor
- Shows date + every active series' value at that date
- Sorted by value, each with color dot

### Line Behavior
- Snap-to-date (data points, not arbitrary pixels)
- Endpoint dots pulse on first render, static after
- Hover near line: highlighted (thicker stroke), others dim to 40% opacity
- Toggle: existing lines morph to new scale (400ms), new line draws in via stroke-dashoffset

### Zoom & Pan
- Mouse wheel zooms x-axis
- Shift+drag to pan
- Double-click resets to full window

### Value Readout
- Persistent strip below chart showing each series' final value
- Updates live during hover to show value-at-cursor

## Detail Views

### AVI Detail
- Metric tiles with countup animation
- Tables with alternating warm/white rows, hover slide
- Data quality warnings: left amber border accent

### Pabrai Detail
- Fund cards in asymmetric 2-column grid
- Gradient top edge matching fund series color

### Fund Detail
- Single-card hero with key stats
- Checkpoint explanation in muted aside

### Pending Detail
- Dashed border empty state with muted messaging
