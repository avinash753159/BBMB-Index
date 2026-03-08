# BBMB Autoresearch: Autonomous Dashboard Improvement Loop

**Date:** 2026-03-08
**Status:** Approved

## Overview

Adapt Andrej Karpathy's autoresearch framework into an autonomous dashboard improvement loop for the BBMB-Index project. An AI agent continuously scans the codebase, makes improvements, evaluates them via Lighthouse scores, and keeps or discards changes — running indefinitely without human intervention.

## Architecture

The agent operates in a git branch loop:

```
git checkout -b autoresearch/<tag>
LOOP FOREVER:
  1. Scan codebase for improvement opportunities
  2. Make changes to any files
  3. git commit
  4. npm run build
  5. Start vite preview (background)
  6. Run Lighthouse CLI against localhost
  7. Extract scores (performance, accessibility, SEO, best-practices)
  8. If no score regressed AND build succeeded → keep
  9. If any score regressed or build failed → git reset to previous commit
  10. Log results to results.tsv
```

## Key Files

| File | Role |
|------|------|
| `program.md` | Agent instructions — the only "config" file |
| `results.tsv` | Experiment log: commit, scores, status, description |
| Everything else | Fair game for modification |

## Evaluation Metric

Four Lighthouse scores (0-100 each):
- **Performance**
- **Accessibility**
- **Best Practices**
- **SEO**

**Keep rule:** No score drops below the previous baseline. Any improvement in any score (with no regressions) = keep.

Priority order for the agent: accessibility > performance > best practices > SEO.

## Dependencies

- `lighthouse` CLI (dev dependency)
- Vite preview (already available)

## Crash Handling & Safety

- **Build failure** = crash → revert, log, move on
- **Lighthouse timeout** (>2 min) = crash → kill server, revert
- **Server won't start** = crash → revert
- Agent must **never modify `program.md` structure or `results.tsv` format**
- Agent must **never delete `data/` contents** (source CSVs/JSONs)

## Results.tsv Format

Tab-separated, NOT comma-separated:

```
commit	perf	a11y	bp	seo	status	description
a1b2c3d	85	92	100	90	keep	baseline
b2c3d4e	87	92	100	90	keep	lazy-load chart component
c3d4e5f	85	90	100	90	discard	refactor broke aria labels
```

## Agent Self-Discovery Strategy

The agent finds improvements by:
1. Running Lighthouse and reading its specific audit failures/warnings
2. Checking for console warnings, build warnings, lint errors
3. Reading component code for accessibility gaps, performance anti-patterns
4. Checking responsive breakpoints, contrast ratios, semantic HTML
5. Looking at bundle size opportunities
6. When stuck — re-run Lighthouse to find new low-hanging fruit

## What Gets Removed from Original Autoresearch

All ML/GPU code is irrelevant. We keep only the concept:
- `program.md` (rewritten for dashboard context)
- `results.tsv` (adapted columns for Lighthouse scores)
- The git keep/discard loop pattern

## Scope

- Agent can modify any file in the project
- No time limit per experiment cycle (build + Lighthouse is fast)
- No human approval needed — agent runs autonomously overnight
- Human reviews kept changes in the morning
