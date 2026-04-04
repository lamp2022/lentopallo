---
phase: 01-foundation
verified: 2026-04-04T18:22:00Z
status: human_needed
score: 3/4 must-haves verified (4th requires human)
human_verification:
  - test: "Open app in browser via `npm run dev`, compare to original index.html side-by-side"
    expected: "All interactions work identically: rotation, scoring (+1/-1), picker, roster add/edit/remove, set switching, court flip, clear court (two-tap), new game (two-tap), help overlay"
    why_human: "MIG-02 requires pixel-perfect functional parity — runtime behavior, visual match, and touch interactions cannot be verified by static analysis"
  - test: "Open http://localhost:5173/Lentopallo/ and verify visual refresh"
    expected: "Softer shadows, 10px border-radius on court cells, warmer #fafafa background, softened borders — all colors (green/red/blue/amber) unchanged, all tap targets >= 48px"
    why_human: "D-05 visual refresh quality is a subjective visual judgment"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** A deployable Vite + TypeScript app on GitHub Pages with Supabase schema and RLS in place
**Verified:** 2026-04-04T18:22:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App builds via `npm run build` and deploys to GitHub Pages without errors | VERIFIED | Build exits 0, dist/index.html contains `/Lentopallo/assets/` paths (2 occurrences); deploy.yml uses `actions/deploy-pages@v4` on push to main |
| 2 | All existing features (rotation, scoring, roster, event log) work identically in the TypeScript build | ? HUMAN | render.ts is 552 lines, exports all required handlers (handleRotate, addPlayer, clearCourt, newGame, openPicker, addScore, etc.); main.ts wires all event listeners; cannot verify runtime behavior without browser |
| 3 | TypeScript strict mode passes with zero `any` types in scoring and stats logic | VERIFIED | `tsc --noEmit` exits 0; grep for `any` in scoring.ts, court.ts, types.ts, render.ts returns zero matches |
| 4 | Supabase schema (clubs, teams, players, team_players, matches, events, profiles) exists with RLS policies, CHECK constraints, and indexes applied | VERIFIED | Migration file exists (291 lines); 7 CREATE TABLE, 8 ALTER TABLE ENABLE RLS, 18 CREATE POLICY, 6 CREATE INDEX; all CHECK constraints present |

**Score:** 3/4 truths auto-verified (1 requires human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types.ts` | All domain interfaces | VERIFIED | Exports: Player, Court, GameEvent, ScoreEntry, ScoreMap, GameState, ScoreView, PlayerRole, CourtPosition, EventType |
| `src/scoring.ts` | Pure scoring logic | VERIFIED | Exports: recalcScores, calcStreaks, calcScoreView; zero `any` |
| `src/court.ts` | Court rotation | VERIFIED | Exports: rotate, POSITIONS_NORMAL, POSITIONS_FLIPPED |
| `src/utils.ts` | XSS escaping | VERIFIED | Exports: esc |
| `src/state.ts` | Global typed state | VERIFIED | Exports: state, getPlayerByNr, getServerNr, isOnCourt, getPositions |
| `src/persistence.ts` | localStorage save/load | VERIFIED | Exports: saveState, loadState, encodeShareUrl, decodeShareUrl |
| `src/main.ts` | Entry point wiring | VERIFIED | Imports loadState, state, recalcScores, renderAll; calls loadState() and renderAll() |
| `src/render.ts` | All render + interaction functions | VERIFIED | 552 lines; exports renderAll, renderCourt, renderRoster, renderBench, renderScoreBoard, renderScoreBtns, renderSetBar, plus all interaction handlers; 15 esc() call sites |
| `style.css` | All CSS extracted from index.html | VERIFIED | 168 lines; contains :root with --bg, --green, --red; .court-cell border-radius 10px; box-shadow on court cells; --bg #fafafa |
| `index.html` | Thin Vite shell | VERIFIED | Contains `<script type="module" src="/src/main.ts">`; zero `var` declarations; no inline JS block |
| `vite.config.ts` | Vite config with base URL | VERIFIED | Contains `base: '/Lentopallo/'` |
| `tsconfig.json` | TypeScript strict config | VERIFIED | Contains `"strict": true` |
| `src/scoring.test.ts` | Unit tests for scoring | VERIFIED | 8 test cases |
| `src/utils.test.ts` | Unit tests for esc | VERIFIED | 3 test cases |
| `.github/workflows/deploy.yml` | GitHub Pages deploy workflow | VERIFIED | Contains: `actions/deploy-pages@v4`, `branches: ['main']`, `npm run build`, `path: './dist'` |
| `dist/index.html` | Built app with correct base URL | VERIFIED | Contains `/Lentopallo/assets/index-BFIHWxo4.js` and `/Lentopallo/assets/index-vS8PPsLJ.css` |
| `supabase/migrations/20260404_001_initial_schema.sql` | Complete DDL | VERIFIED | 291 lines; 7 tables, 8 RLS enables, 18 policies, 6 indexes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/scoring.ts | src/types.ts | `import type { GameEvent, ScoreMap, ScoreView }` | WIRED | Line 1 of scoring.ts |
| src/main.ts | src/state.ts | `import { state }` | WIRED | Line 2 of main.ts |
| src/persistence.ts | src/types.ts | `import type { GameState }` | WIRED | Line 1 of persistence.ts |
| src/render.ts | src/state.ts | `import { state }` | WIRED | Line 1 of render.ts |
| src/render.ts | src/utils.ts | `import { esc }` | WIRED | Line 3 of render.ts |
| src/render.ts | src/scoring.ts | `import { recalcScores, calcStreaks, calcScoreView }` | WIRED | Line 4 of render.ts |
| src/main.ts | src/render.ts | `import { renderAll, ... }` | WIRED | Lines 4+ of main.ts; `renderAll()` called at line 35 |
| .github/workflows/deploy.yml | dist/ | `npm run build` -> `upload-pages-artifact` | WIRED | Workflow step sequence confirmed |
| vite.config.ts | dist/index.html | `base: '/Lentopallo/'` injected into asset paths | WIRED | dist/index.html contains `/Lentopallo/assets/` |
| profiles.id | auth.users.id | `REFERENCES auth.users(id)` | WIRED | Two FK references in migration file |
| RLS policies | profiles.club_id | `auth.uid()` subquery | WIRED | 23 occurrences of auth.uid() in policies |

### Data-Flow Trace (Level 4)

Not applicable for this phase — no components rendering dynamic data from an API. The app reads from localStorage (persistence.ts) and renders from in-memory state (state.ts). The flow: `loadState() -> state -> renderAll()` is fully wired in main.ts lines 29–35.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run build` exits 0 | `npm run build` | "built in 79ms", 3 output files | PASS |
| `tsc --noEmit` exits 0 | `npx tsc --noEmit` | No output (clean) | PASS |
| All 11 unit tests pass | `npx vitest run` | 2 test files, 11 tests, 0 failures | PASS |
| dist/index.html has correct base URL | `grep "Lentopallo/assets" dist/index.html` | 2 matches (JS + CSS) | PASS |
| Runtime app behavior | Cannot test without browser | — | SKIP (human) |

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|---------|
| MIG-01 | 01-01 | Existing index.html migrated to Vite + TypeScript | SATISFIED | src/ modules exist, package.json has vite + typescript, build works |
| MIG-02 | 01-02 | All existing functionality preserved | NEEDS HUMAN | render.ts has all handlers wired; browser verification required |
| MIG-03 | 01-01 | TypeScript strict mode, zero `any` in scoring/stats | SATISFIED | `tsc --noEmit` exits 0; grep finds zero `any` in core modules |
| MIG-04 | 01-03 | GitHub Pages deployment via Vite build | SATISFIED | deploy.yml exists with correct steps; build produces correct output |
| DB-01 | 01-04 | PostgreSQL schema: all 7 tables | SATISFIED | Migration file: clubs, teams, players, team_players, matches, events, profiles |
| DB-02 | 01-04 | RLS policies on all tables scoped to club_id | SATISFIED | 8 `ENABLE ROW LEVEL SECURITY`, 18 policies using `auth.uid() -> profiles -> club_id` |
| DB-03 | 01-04 | CHECK constraints: jersey 1-99, set 1-5, delta (-1,+1) | SATISFIED | All three CHECK constraints confirmed in migration file |
| DB-04 | 01-04 | Indexes on events(match_id), events(player_id), players(club_id), matches(team_id, date) | SATISFIED | 6 CREATE INDEX statements covering all required patterns |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/render.ts | 452 | `input.placeholder = 'Nimi'` | Info | HTML input placeholder attribute — not a code stub, correct usage |

No blocking anti-patterns found. The single match is an HTML form input placeholder, which is the correct use of `placeholder`. No `TODO`, `FIXME`, empty returns, or hardcoded empty data arrays found in any source module.

### Human Verification Required

#### 1. Pixel-Perfect Functional Parity (MIG-02)

**Test:** Run `npm run dev` in the project root. Open http://localhost:5173/Lentopallo/ in browser. Verify these interactions work identically to the original index.html:

1. Add a player (number + name) in roster
2. Click court cell, select player from picker
3. Press Rotaatio button — players shift positions
4. Press +1 and -1 score buttons — scores update in scoreboard
5. Open picker, press +1 Pelitilannepiste
6. Switch sets (Era 1/2/3) — scores filter correctly
7. Check score table shows correct totals and streaks
8. Flip court with Kaanna kentta button
9. Clear court (two-tap confirm)
10. New game (two-tap confirm)
11. Press ? help button — overlay appears

**Expected:** All 11 interactions above behave identically to the original single-file app. State persists on page reload (localStorage).

**Why human:** Runtime behavior, event handler wiring, and visual/functional parity cannot be verified by static code analysis.

#### 2. Visual Refresh Quality (D-05 / Plan 03)

**Test:** With dev server running, compare visual appearance to original.

**Expected:** Softer shadows visible on court cells, roster tags, and picker; border-radius on court cells appears larger (10px vs original 6px); background is slightly warm (#fafafa vs pure white); all colors unchanged (green/red/blue/amber); all tap targets still >= 48px.

**Why human:** CSS visual quality is a subjective judgment that cannot be verified programmatically.

### Gaps Summary

No automated gaps found. All artifacts exist, are substantive, and are properly wired. All 8 requirements have implementation evidence. The sole blocker to marking this phase as `passed` is the human verification checkpoint for MIG-02 (functional parity) — this was a `gate: blocking` checkpoint in Plan 02 that the SUMMARY acknowledges as "pending" (Task 2 of Plan 02 was a human checkpoint).

Plan 03 SUMMARY similarly notes the visual refresh human checkpoint as pending.

---

_Verified: 2026-04-04T18:22:00Z_
_Verifier: Claude (gsd-verifier)_
