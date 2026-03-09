# Leaderboard & Category Reorganization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize sidebar into 3 category rows (Compare, Bond Me Bros, Superinvestors) with dynamic ranking by annualized return within each row.

**Architecture:** Add a `category` field to each series in useModel, then update FocusTabs to render 3 rows sorted by windowed annualized return. Replace the banh mi SVG with a cleaner minimal version.

**Tech Stack:** React, Tailwind CSS, inline SVG

---

### Task 1: Add category field to series in useModel

**Files:**
- Modify: `src/hooks/useModel.js`

**Step 1: Add category to each series**

In `buildModel()`, assign a `category` property to each series object:
- `'compare'` for SPY (benchmark)
- `'bros'` for AVI, JOEY, PRAB (pending members)
- `'superinvestors'` for everything else: PABRAI, PIF2, PIF3, PIF4, WAGN, and all superinvestor 13F portfolios

Changes in `useModel.js`:

1. The AVI series object (line ~87-97): add `category: 'bros'`
2. The PABRAI series object (line ~98-109): add `category: 'superinvestors'`
3. The pifSeries entries (built in `buildPifSeries`): add `category: 'superinvestors'` to return object
4. The tickerMembers (WAGN etc, line ~51-63): add `category: 'superinvestors'`
5. The superinvestorMembers (line ~65-78): add `category: 'superinvestors'`
6. The SPY series (line ~113-123): add `category: 'compare'`
7. The pending members in views (line ~169-176): these need category too. Add `category: 'bros'` to the pending view objects

Also add `category` to the pending series items that get added via `pendingViews` in `App.jsx` (allToggleSeries). These pending members (JOEY, PRAB) should get `category: 'bros'`.

**Step 2: Commit**

```
git add src/hooks/useModel.js
git commit -m "feat: add category field to all series (compare/bros/superinvestors)"
```

---

### Task 2: Update FocusTabs to render 3 category rows

**Files:**
- Modify: `src/components/focus/FocusTabs.jsx`

**Step 1: Replace the 2-section split with 3-category split**

Currently FocusTabs splits series by `superinvestor` kind vs not. Replace with category-based grouping:

```jsx
export default function FocusTabs({ views, allSeries, selectedSeriesIds, onToggle, onSetSeries, activeView, onViewChange, maxDisplay = 5 }) {
  const compareSeries = allSeries.filter(item => item.category === 'compare');
  const brosSeries = allSeries.filter(item => item.category === 'bros');
  const superSeries = allSeries.filter(item => item.category === 'superinvestors');

  return (
    <nav aria-label="Series comparison" className="space-y-2">
      {/* Compare row - just SPY */}
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow className="mr-1">Compare</Eyebrow>
        {compareSeries.map((item) => {
          const isOn = selectedSeriesIds.includes(item.id);
          return (
            <FilterChip
              key={item.id}
              on={isOn}
              dimmed={item.dimmed}
              matchInfo={item.matchCount}
              onClick={() => {
                onToggle(item.id);
                const hasView = views.some((v) => v.id === item.id);
                if (hasView) onViewChange(item.id);
              }}
            >
              <SeriesAvatar id={item.id} size="xs" />
              {item.label}
            </FilterChip>
          );
        })}
      </div>

      {/* Bond Me Bros row - AVI, JOEY, PRAB */}
      {brosSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Bond Me Bros</Eyebrow>
          {brosSeries.map((item) => {
            const isOn = selectedSeriesIds.includes(item.id);
            return (
              <FilterChip
                key={item.id}
                on={isOn}
                dimmed={item.dimmed}
                matchInfo={item.matchCount}
                onClick={() => {
                  onToggle(item.id);
                  const hasView = views.some((v) => v.id === item.id);
                  if (hasView) onViewChange(item.id);
                }}
              >
                <SeriesAvatar id={item.id} size="xs" />
                {item.label}
              </FilterChip>
            );
          })}
        </div>
      )}

      {/* Superinvestors row - everything else + All toggle */}
      {superSeries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow className="mr-1">Superinvestors</Eyebrow>
          <button
            type="button"
            onClick={() => {
              const allSuperIds = superSeries.filter((s) => !s.dimmed).map((s) => s.id);
              const allOn = allSuperIds.every((id) => selectedSeriesIds.includes(id));
              if (allOn) {
                const nonSuper = selectedSeriesIds.filter((id) => {
                  const found = superSeries.find(s => s.id === id);
                  return !found;
                });
                onSetSeries(nonSuper.length ? nonSuper : ['SPY']);
              } else {
                onSetSeries([...new Set(['SPY', ...selectedSeriesIds, ...allSuperIds])]);
              }
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-150 ${
              superSeries.filter((s) => !s.dimmed).every((s) => selectedSeriesIds.includes(s.id))
                ? 'border-ink bg-ink text-white shadow-md'
                : 'border-line bg-white text-muted hover:border-ink hover:text-ink hover:shadow-sm'
            }`}
          >
            All
          </button>
          {superSeries.map((item) => {
            const isOn = selectedSeriesIds.includes(item.id);
            return (
              <FilterChip
                key={item.id}
                on={isOn}
                dimmed={item.dimmed}
                matchInfo={item.matchCount}
                onClick={() => {
                  onToggle(item.id);
                  const hasView = views.some((v) => v.id === item.id);
                  if (hasView) onViewChange(item.id);
                }}
              >
                <SeriesAvatar id={item.id} size="xs" />
                {item.label}
              </FilterChip>
            );
          })}
        </div>
      )}
    </nav>
  );
}
```

**Step 2: Commit**

```
git add src/components/focus/FocusTabs.jsx
git commit -m "feat: split sidebar into 3 category rows (Compare, Bond Me Bros, Superinvestors)"
```

---

### Task 3: Pass category through allToggleSeries and sort by windowed annualized return

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add category to allToggleSeries items**

In the `allToggleSeries` useMemo (around line 123-147), pass through the `category` field from the series:

```js
const chartSeries = model.comparisonSeries.map((s) => ({
  id: s.id,
  label: s.shortLabel ?? s.label,
  kind: s.kind,
  category: s.category,  // ADD THIS
  dimmed: !filteredSeriesIds.has(s.id),
  matchCount: holdingsMatchCounts[s.id] ?? null,
  annualizedReturnPct: s.annualizedReturnPct,
}));
```

And for pending views:
```js
const pendingViews = model.views
  .filter((v) => v.kind === 'pending' && !pendingIds.has(v.id))
  .map((v) => ({
    id: v.id,
    label: v.label,
    kind: 'pending',
    category: 'bros',  // ADD THIS - JOEY and PRAB are bros
    dimmed: false,
    matchCount: null,
    annualizedReturnPct: null,
  }));
```

**Step 2: Make sorting use windowed annualized returns**

The current sorting in `allToggleSeries` uses the full-window `annualizedReturnPct` from the model, which doesn't change when the time range slider moves. To make the leaderboard dynamic:

Replace the sort in `allToggleSeries` with windowed returns. Add `rangeStartIdx` to the dependency array. Compute windowed annualized return for each series:

```js
const allToggleSeries = useMemo(() => {
  if (!model) return [];
  const startIdx = rangeStartIdx;
  const trimmedDates = model.dates.slice(startIdx);
  const wEnd = trimmedDates[trimmedDates.length - 1];

  const chartSeries = model.comparisonSeries.map((s) => {
    // Compute windowed annualized return
    const trimmed = s.returnPctSeries.slice(startIdx);
    const baseIdx = trimmed.findIndex((v) => v != null);
    let windowedAnnualized = s.annualizedReturnPct;
    if (baseIdx !== -1) {
      const baseVal = 1 + trimmed[baseIdx];
      const renormalized = trimmed.map((v) => v == null ? null : ((1 + v) / baseVal) - 1);
      const totalReturn = latestNonNull(renormalized);
      const firstDataDate = trimmedDates[baseIdx];
      windowedAnnualized = annualizeReturn(totalReturn, firstDataDate, wEnd);
    }
    return {
      id: s.id,
      label: s.shortLabel ?? s.label,
      kind: s.kind,
      category: s.category,
      dimmed: !filteredSeriesIds.has(s.id),
      matchCount: holdingsMatchCounts[s.id] ?? null,
      annualizedReturnPct: windowedAnnualized,
    };
  });

  const pendingIds = new Set(chartSeries.map((s) => s.id));
  const pendingViews = model.views
    .filter((v) => v.kind === 'pending' && !pendingIds.has(v.id))
    .map((v) => ({
      id: v.id,
      label: v.label,
      kind: 'pending',
      category: 'bros',
      dimmed: false,
      matchCount: null,
      annualizedReturnPct: null,
    }));

  const all = [...chartSeries, ...pendingViews];
  // Sort by annualized return descending within each category
  // (FocusTabs filters by category, so just sort globally)
  all.sort((a, b) => {
    const aRet = a.annualizedReturnPct ?? -Infinity;
    const bRet = b.annualizedReturnPct ?? -Infinity;
    return bRet - aRet;
  });
  return all;
}, [model, filteredSeriesIds, holdingsMatchCounts, rangeStartIdx]);
```

**Step 3: Commit**

```
git add src/App.jsx
git commit -m "feat: dynamic leaderboard ranking by windowed annualized return"
```

---

### Task 4: Replace banh mi SVG with minimal iconic version

**Files:**
- Modify: `src/components/layout/BrandMark.jsx`

**Step 1: Replace the banh mi SVG**

Replace the existing banh mi SVG (the second `<svg>` in BrandMark) with a cleaner, more minimal/iconic version that matches the boba's style. The new version should be simpler — clean shapes, fewer details, same warm color palette:

```jsx
{/* Banh mi — minimal iconic */}
<svg viewBox="0 0 72 40" className="h-11 w-auto" role="presentation">
  <defs>
    <linearGradient id="bm-crust" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f5d880" />
      <stop offset="100%" stopColor="#d4a028" />
    </linearGradient>
    <linearGradient id="bm-crumb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f8ecd0" />
      <stop offset="100%" stopColor="#e8d4a0" />
    </linearGradient>
  </defs>

  {/* Top baguette dome */}
  <path d="M6 22 C8 4, 24 0, 36 0 C48 0, 64 4, 66 22 Z"
    fill="url(#bm-crust)" stroke="#c09018" strokeWidth="0.8" />

  {/* Score lines */}
  <path d="M22 5 L24 16" stroke="#c8a840" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  <path d="M34 3 L35.5 16" stroke="#c8a840" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  <path d="M46 5 L48 16" stroke="#c8a840" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

  {/* Bread shine */}
  <path d="M26 5 c6-1.2 12-1.2 18 0" stroke="rgba(255,255,255,0.35)"
    strokeWidth="1.5" strokeLinecap="round" fill="none" />

  {/* Filling strip — colorful band */}
  <rect x="10" y="20" width="52" height="5" rx="1" fill="url(#bm-crumb)" />

  {/* Filling accents */}
  <line x1="12" y1="21.5" x2="60" y2="21.5" stroke="#e87530" strokeWidth="1.2" strokeLinecap="round" />
  <line x1="14" y1="23" x2="58" y2="23" stroke="#78b050" strokeWidth="1" strokeLinecap="round" />
  <circle cx="22" cy="22" r="1.2" fill="#3d8828" />
  <circle cx="36" cy="22.5" r="1.2" fill="#3d8828" />
  <circle cx="50" cy="22" r="1.2" fill="#3d8828" />

  {/* Bottom bread */}
  <path d="M8 25 C10 34, 26 36, 36 36 C46 36, 62 34, 64 25 Z"
    fill="url(#bm-crumb)" stroke="#c8a848" strokeWidth="0.6" />
</svg>
```

**Step 2: Commit**

```
git add src/components/layout/BrandMark.jsx
git commit -m "style: replace banh mi SVG with cleaner minimal iconic version"
```

---

### Task 5: Verify everything works

**Step 1: Run dev server**

```
npm run dev
```

**Step 2: Verify**

- Three rows appear: Compare (SPY), Bond Me Bros (AVI, JOEY, PRAB), Superinvestors (all others with All toggle)
- Moving the time range slider reorders chips within each row by annualized return
- Changing market cap filter dims superinvestors with no matching holdings
- The banh mi logo looks cleaner and matches the boba style
- All existing functionality (charts, detail views, selection) still works

**Step 3: Commit if any fixes needed**
