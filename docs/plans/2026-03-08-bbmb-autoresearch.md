# BBMB Autoresearch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `program.md` and supporting infrastructure so an AI agent can autonomously improve the BBMB dashboard overnight using a Lighthouse-scored keep/discard git loop.

**Architecture:** A `program.md` in the project root instructs the agent. The agent modifies code, runs `npm run build`, starts `vite preview`, runs Lighthouse CLI, extracts 4 scores, compares against baseline, and keeps or reverts via git. Results are logged to `results.tsv`.

**Tech Stack:** Lighthouse CLI (npm dev dep), Vite preview (already available), git, bash

---

### Task 1: Install Lighthouse CLI

**Files:**
- Modify: `package.json`

**Step 1: Install lighthouse as a dev dependency**

Run:
```bash
npm install --save-dev lighthouse
```

**Step 2: Verify installation**

Run:
```bash
npx lighthouse --version
```
Expected: Version number printed (e.g., `12.x.x`)

**Step 3: Add convenience scripts to package.json**

Add these scripts to `package.json`:
```json
"preview": "vite preview --port 4174",
"lighthouse": "lighthouse http://localhost:4174 --output=json --output-path=./lighthouse-report.json --chrome-flags=\"--headless --no-sandbox\""
```

**Step 4: Verify the full pipeline works**

Run:
```bash
npm run build && npx vite preview --port 4174 &
sleep 3
npx lighthouse http://localhost:4174 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox"
kill %1
```
Expected: `lighthouse-report.json` created with score data.

**Step 5: Add lighthouse artifacts to .gitignore**

Append to `.gitignore`:
```
lighthouse-report.json
```

**Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add lighthouse CLI as dev dependency"
```

---

### Task 2: Create results.tsv with header

**Files:**
- Create: `results.tsv`

**Step 1: Create results.tsv**

Create `results.tsv` with tab-separated header:
```
commit	perf	a11y	bp	seo	status	description
```

Note: columns are separated by literal tab characters, NOT spaces.

**Step 2: Commit**

```bash
git add results.tsv
git commit -m "chore: add results.tsv for autoresearch experiment log"
```

---

### Task 3: Create program.md

**Files:**
- Create: `program.md`

**Step 1: Write program.md**

Create `program.md` with the full agent instructions. Content below:

````markdown
# BBMB Dashboard Autoresearch

This is an autonomous dashboard improvement loop. You are an AI agent that continuously improves the BBMB-Index investment dashboard by finding and fixing issues, then evaluating each change with Lighthouse.

## Setup

To set up a new experiment run:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar8`). The branch `autoresearch/<tag>` must not already exist.
2. **Create the branch**: `git checkout -b autoresearch/<tag>` from current master.
3. **Read context**: Read these files for full context:
   - `program.md` — this file, your instructions.
   - `src/App.jsx` — main application component with all state.
   - `src/hooks/useModel.js` — data model construction.
   - `vite.config.js` — build configuration.
   - `package.json` — scripts and dependencies.
4. **Verify build works**: Run `npm run build` and confirm it succeeds.
5. **Establish baseline**: Run the full evaluation pipeline (see below) and record the baseline scores in `results.tsv`.
6. **Confirm and go**: Confirm setup looks good, then begin the loop.

## The Evaluation Pipeline

Each experiment follows this exact sequence:

```bash
# 1. Build the project
npm run build

# 2. Start preview server in background
npx vite preview --port 4174 &
PREVIEW_PID=$!
sleep 3

# 3. Run Lighthouse
npx lighthouse http://localhost:4174 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox"

# 4. Extract scores
node -e "
const r = require('./lighthouse-report.json');
const c = r.categories;
console.log('perf:' + Math.round(c.performance.score * 100));
console.log('a11y:' + Math.round(c.accessibility.score * 100));
console.log('bp:' + Math.round(c['best-practices'].score * 100));
console.log('seo:' + Math.round(c.seo.score * 100));
"

# 5. Kill the preview server
kill $PREVIEW_PID 2>/dev/null
wait $PREVIEW_PID 2>/dev/null
```

If the build fails, skip Lighthouse — treat it as a crash.
If Lighthouse fails or hangs for >2 minutes, kill everything and treat as a crash.

## The Keep/Discard Rule

Compare the 4 scores against the previous baseline (the last `keep` row in `results.tsv`):

- **KEEP** if: no score dropped AND at least one score improved.
- **KEEP** if: all scores equal BUT the change is a clear code quality/simplicity win (fewer lines, cleaner structure, removed dead code).
- **DISCARD** if: any score dropped.
- **CRASH** if: build failed, Lighthouse failed, or server wouldn't start.

## What You Can Modify

**Everything** is fair game except:
- `program.md` — do not change these instructions.
- `results.tsv` — only append new rows, never modify existing rows or the header.
- `data/*.csv`, `data/*.json` — do not delete or corrupt source data files.
- `node_modules/`, `package-lock.json` — do not manually edit (use npm commands).

## How to Find Improvements

Your primary source of ideas is Lighthouse itself. After each run:

1. **Read Lighthouse audit details**: Parse `lighthouse-report.json` and look at failing or low-scoring audits. Each audit has an `id`, `score`, and `description` telling you exactly what to fix.
2. **Check build output**: Look for warnings during `npm run build`.
3. **Scan components for accessibility**: Missing `alt` text, missing `aria-*` attributes, poor color contrast, non-semantic HTML, missing focus indicators, keyboard navigation gaps.
4. **Scan for performance issues**: Large bundle imports, unoptimized re-renders, missing `React.memo`, missing `loading="lazy"` on images, render-blocking resources.
5. **Check responsive design**: Missing viewport meta, fixed widths, text too small on mobile.
6. **Check SEO basics**: Missing meta description, missing heading hierarchy, missing lang attribute.
7. **Code quality**: Dead code, unused imports, redundant wrappers, overly complex logic.

**Priority order**: accessibility > performance > best practices > SEO > code quality.

When stuck, re-run Lighthouse — scores may have shifted and new audits may now be actionable.

## Logging Results

Append each experiment to `results.tsv` (tab-separated):

```
commit	perf	a11y	bp	seo	status	description
```

- `commit`: short git hash (7 chars)
- `perf`: Lighthouse performance score (0-100)
- `a11y`: Lighthouse accessibility score (0-100)
- `bp`: Lighthouse best-practices score (0-100)
- `seo`: Lighthouse SEO score (0-100)
- `status`: `keep`, `discard`, or `crash`
- `description`: short text of what this experiment tried

## The Experiment Loop

LOOP FOREVER:

1. Read the current Lighthouse report (or run a fresh baseline if none exists).
2. Identify one specific improvement to try based on audit results.
3. Make the code changes. Keep changes small and focused — one idea per experiment.
4. `git add -A && git commit -m "description of change"`
5. Run the evaluation pipeline (build → preview → lighthouse → extract scores).
6. Compare scores against baseline.
7. If **keep**: record in results.tsv. This commit becomes the new baseline.
8. If **discard**: record in results.tsv, then `git reset --hard HEAD~1`.
9. If **crash**: record in results.tsv with scores `0	0	0	0`, then `git reset --hard HEAD~1`. If it's a simple bug (typo, missing import), fix and retry once.
10. GOTO 1.

**NEVER STOP.** Do not pause to ask the human. Do not ask "should I continue?". Run indefinitely until manually stopped. If you run out of ideas, read the Lighthouse report more carefully, look at different components, try combining approaches, or attempt more ambitious refactors.

## Tips

- **One change per experiment.** Don't bundle unrelated fixes — if one breaks something, you lose both.
- **Read before writing.** Always read a file before modifying it.
- **Small changes win.** A 1-point accessibility improvement from adding an `aria-label` is a guaranteed keep. Don't over-engineer.
- **Simplicity criterion.** If you can remove code and scores don't drop, that's a keep.
- **Don't fight the framework.** Work with React, Tailwind, and Vite patterns already in the codebase.
````

**Step 2: Commit**

```bash
git add program.md
git commit -m "feat: add program.md for autonomous dashboard improvement loop"
```

---

### Task 4: Delete autoresearch-master directory

**Files:**
- Delete: `autoresearch-master/` (entire directory)

The original ML training code is no longer needed. The concept has been adapted into `program.md`.

**Step 1: Remove the directory**

```bash
rm -rf autoresearch-master
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove original autoresearch ML code (replaced by program.md)"
```

---

### Task 5: Verify end-to-end pipeline

**Step 1: Run a full build**

```bash
npm run build
```
Expected: Build succeeds, `dist/` contains `index.html` and assets.

**Step 2: Run the full evaluation pipeline**

```bash
npx vite preview --port 4174 &
PREVIEW_PID=$!
sleep 3
npx lighthouse http://localhost:4174 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox"
kill $PREVIEW_PID 2>/dev/null
wait $PREVIEW_PID 2>/dev/null
```

**Step 3: Extract and verify scores**

```bash
node -e "const r=require('./lighthouse-report.json');const c=r.categories;console.log('perf:'+Math.round(c.performance.score*100));console.log('a11y:'+Math.round(c.accessibility.score*100));console.log('bp:'+Math.round(c['best-practices'].score*100));console.log('seo:'+Math.round(c.seo.score*100));"
```

Expected: Four scores printed (e.g., `perf:85`, `a11y:92`, `bp:100`, `seo:90`).

**Step 4: Record baseline in results.tsv**

Append the baseline row with the current commit hash and extracted scores.

**Step 5: Commit baseline**

```bash
git add results.tsv
git commit -m "chore: record baseline Lighthouse scores"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Install Lighthouse CLI | `package.json`, `.gitignore` |
| 2 | Create results.tsv | `results.tsv` |
| 3 | Create program.md | `program.md` |
| 4 | Remove autoresearch-master | `autoresearch-master/` |
| 5 | Verify end-to-end pipeline | `results.tsv` (baseline row) |
