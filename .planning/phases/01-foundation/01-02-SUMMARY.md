---
phase: 01-foundation
plan: "02"
subsystem: rendering
tags: [rendering, css, typescript, vite, xss-safety]
dependency_graph:
  requires: ["01-01"]
  provides: ["render.ts", "style.css", "vite-index-html"]
  affects: ["all future UI plans"]
tech_stack:
  added: []
  patterns: ["inline-onclick-window-exposure", "immediate-mode-rendering", "esc()-xss-guard"]
key_files:
  created:
    - src/render.ts
    - style.css
  modified:
    - index.html
    - src/main.ts
decisions:
  - "Expose interaction handlers to window via Object.assign for inline onclick compatibility"
  - "Call esc() defensively in event-push functions (addScore, addPointFromPicker) on stored names"
  - "Keep inline onclick in generated HTML (same pattern as original) rather than event delegation"
metrics:
  duration_minutes: 10
  completed_date: "2026-04-04"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 4
---

# Phase 01 Plan 02: Rendering Port Summary

**One-liner:** All HTML/CSS/JS rendering ported verbatim from monolithic index.html into typed TypeScript modules with 15 XSS-safe esc() call sites.

## What Was Built

Pixel-perfect TypeScript clone of the original single-file app, split across four files:

- **style.css** — all CSS extracted verbatim from index.html lines 11-178 (170+ lines, `:root` custom properties, court grid, picker overlay, score animations, set bar, serve ticks)
- **src/render.ts** — all render functions (`renderAll`, `renderSetBar`, `renderCourt`, `renderScoreBtns`, `renderBench`, `renderScoreBoard`, `renderRoster`) and all interaction handlers (`addScore`, `openPicker`, `selectPlayer`, `clearPos`, `closePicker`, `addPointFromPicker`, `addPlayer`, `removePlayer`, `setRole`, `editNr`, `editName`, `setSet`, `flipCourt`, `clearCourt`, `newGame`, `handleRotate`, `copyLink`, `toggleHelp`, `toggleRoster`, `showScorePopup`, `setScoreView`)
- **index.html** — thin Vite shell: head + static HTML structure + `<script type="module" src="/src/main.ts">`, no inline JS
- **src/main.ts** — loads state, calls `renderAll()`, wires all static `addEventListener` calls, exposes dynamic handlers to `window` for inline onclick in generated HTML

## Verification

- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 11/11 tests pass
- `npm run dev` starts at http://localhost:5173/Lentopallo/
- Human visual checkpoint pending (Task 2)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written.

### Notes

- The `clearBtn` button text in index.html uses "Tyhjenj&auml;" (HTML entity) — matches Finnish "Tyhjennä". The confirmation text in render.ts uses the Unicode escape `\u00e4` for consistency.
- `esc()` is called in `addScore` and `addPointFromPicker` on names stored in `eventLog.name` — defensive, since those names could later be rendered. This adds 2 calls beyond the HTML-rendering sites.

## Known Stubs

None — all render functions are fully wired to live state.

## Threat Flags

No new threat surface introduced. T-02-01 (XSS via innerHTML) mitigated: 15 `esc()` call sites verified in render.ts.

## Self-Check: PASSED

- FOUND: src/render.ts
- FOUND: style.css
- FOUND: index.html (Vite shell)
- FOUND: src/main.ts (updated)
- FOUND: commit 52e644d
