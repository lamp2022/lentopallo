---
phase: 01-foundation
verified: 2026-04-05T08:30:00Z
status: human_needed
score: 4/4 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 3/4
  gaps_closed:
    - "Plan 05 renamed button from 'Tallenna pelaajat' to 'Jaa kokoonpano' (3 occurrences, 0 old text remaining)"
    - "Plan 05 added layered shadow elevation hierarchy (6 dual-layer shadows in style.css)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open app via `npm run dev` at http://localhost:5173/Lentopallo/ and verify all 11 core interactions work"
    expected: "Rotation, scoring (+1/-1), picker, roster add/edit/remove, set switching, court flip, clear court (two-tap), new game (two-tap), help overlay, share link -- all functional"
    why_human: "MIG-02 requires functional parity verified in browser; static analysis confirmed wiring but not runtime behavior"
  - test: "Verify Plan 05 visual fix: shadow depth no longer 'too flat'"
    expected: "Court cells, roster tags, score buttons show visible layered shadow depth; overall feel is iOS-Settings-like"
    why_human: "User reported 'a little bit flat' in UAT test #12; Plan 05 applied layered shadows -- visual quality is subjective"
  - test: "Verify 'Jaa kokoonpano' button label is clear and help text matches"
    expected: "Roster section share button reads 'Jaa kokoonpano'; help section 8 heading and body also say 'Jaa kokoonpano'"
    why_human: "User reported misleading label in UAT test #10; Plan 05 renamed it -- human confirms Finnish text is appropriate"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** A deployable Vite + TypeScript app on GitHub Pages with Supabase schema and RLS in place
**Verified:** 2026-04-05T08:30:00Z
**Status:** human_needed
**Re-verification:** Yes -- after Plan 05 gap closure (button label + shadow depth)

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App builds via `npm run build` and deploys to GitHub Pages without errors | VERIFIED | Build exits 0 (52ms), 3 output files; deploy.yml with deploy-pages@v4; dist/index.html has 2 `/Lentopallo/assets/` refs |
| 2 | All existing features work identically in the TypeScript build | VERIFIED (code) | render.ts 552 lines with all handlers; main.ts wires all listeners; 15 esc() calls; UAT 12/14 passed; Plan 05 closed 2 gaps; runtime human check pending |
| 3 | TypeScript strict mode passes with zero `any` in scoring/stats | VERIFIED | `tsc --noEmit` exits 0; grep for `any` in scoring.ts, court.ts, types.ts = 0 matches |
| 4 | Supabase schema with RLS, CHECK constraints, and indexes | VERIFIED | 7 CREATE TABLE, 8 ENABLE RLS, 18 CREATE POLICY, 6 CREATE INDEX; all CHECKs present |

**Score:** 4/4 truths verified at code level; 3 human verification items remain

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types.ts` | Domain interfaces | VERIFIED | Player, Court, GameEvent, ScoreEntry, ScoreMap, GameState, ScoreView, PlayerRole, CourtPosition, EventType |
| `src/scoring.ts` | Pure scoring logic | VERIFIED | recalcScores, calcStreaks, calcScoreView; zero any |
| `src/court.ts` | Court rotation | VERIFIED | rotate, POSITIONS_NORMAL, POSITIONS_FLIPPED |
| `src/utils.ts` | XSS escaping | VERIFIED | esc function |
| `src/state.ts` | Global typed state | VERIFIED | state, getPlayerByNr, getServerNr, isOnCourt, getPositions |
| `src/persistence.ts` | localStorage save/load | VERIFIED | saveState, loadState, encodeShareUrl, decodeShareUrl |
| `src/main.ts` | Entry point wiring | VERIFIED | loadState(), renderAll() called |
| `src/render.ts` | All render + interaction | VERIFIED | 552 lines, 15 esc() calls, all handlers |
| `style.css` | CSS with refresh + shadows | VERIFIED | 168 lines, --bg #fafafa, border-radius 10px, 6 layered shadows |
| `index.html` | Thin Vite shell | VERIFIED | module script entry, no inline JS, "Jaa kokoonpano" x3 |
| `vite.config.ts` | Base URL config | VERIFIED | base: '/Lentopallo/' |
| `tsconfig.json` | Strict mode | VERIFIED | "strict": true |
| `src/scoring.test.ts` | Scoring tests | VERIFIED | 8 test cases |
| `src/utils.test.ts` | Utils tests | VERIFIED | 3 test cases |
| `.github/workflows/deploy.yml` | Deploy workflow | VERIFIED | deploy-pages@v4, branches: main, upload-pages-artifact |
| `dist/index.html` | Built output | VERIFIED | /Lentopallo/assets/ (2 matches) |
| `supabase/migrations/20260404_001_initial_schema.sql` | Complete DDL | VERIFIED | 7 tables, 8 RLS, 18 policies, 6 indexes |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| scoring.ts | types.ts | import type { GameEvent, ScoreMap, ScoreView } | WIRED |
| main.ts | state.ts | import { state } | WIRED |
| persistence.ts | types.ts | import type { GameState } | WIRED |
| render.ts | state.ts | import { state } | WIRED |
| render.ts | utils.ts | import { esc } | WIRED |
| render.ts | scoring.ts | import { recalcScores, calcStreaks, calcScoreView } | WIRED |
| main.ts | render.ts | import { renderAll, ... } | WIRED |
| deploy.yml | dist/ | npm run build + upload-pages-artifact | WIRED |
| vite.config.ts | dist/index.html | base URL injected | WIRED |
| profiles.id | auth.users | REFERENCES auth.users(id) | WIRED |
| RLS policies | profiles.club_id | auth.uid() subquery (23 occurrences) | WIRED |

### Data-Flow Trace (Level 4)

Not applicable -- no API data rendering. Flow: `loadState() -> state -> renderAll()` fully wired in main.ts.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build exits 0 | npm run build | 3 files, 52ms | PASS |
| tsc --noEmit exits 0 | npx tsc --noEmit | Clean | PASS |
| 11 unit tests pass | npx vitest run | 2 files, 11 tests, 0 failures | PASS |
| dist base URL correct | grep Lentopallo/assets dist/index.html | 2 matches | PASS |
| Button label fixed (Plan 05) | grep "Jaa kokoonpano" index.html | 3 matches, 0 old text | PASS |
| Layered shadows (Plan 05) | grep dual-layer shadows style.css | 6 found | PASS |
| Runtime behavior | Needs browser | -- | SKIP (human) |

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|----------|
| MIG-01 | 01-01 | Vite + TypeScript migration | SATISFIED | src/ modules, package.json, build works |
| MIG-02 | 01-02, 01-05 | All existing functionality preserved | SATISFIED (code) | render.ts all handlers; UAT 12/14 passed; Plan 05 closed 2 gaps |
| MIG-03 | 01-01 | TypeScript strict, zero any | SATISFIED | tsc exits 0; zero any in core modules |
| MIG-04 | 01-03 | GitHub Pages deployment | SATISFIED | deploy.yml + build output verified |
| DB-01 | 01-04 | PostgreSQL schema (7 tables) | SATISFIED | 7 CREATE TABLE in migration |
| DB-02 | 01-04 | RLS policies scoped to club_id | SATISFIED | 8 ENABLE RLS, 18 policies, auth.uid() |
| DB-03 | 01-04 | CHECK constraints | SATISFIED | jersey 1-99, set 1-5, delta (-1,+1) |
| DB-04 | 01-04 | Indexes | SATISFIED | 6 CREATE INDEX |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/render.ts | 452 | `input.placeholder = 'Nimi'` | Info | HTML placeholder, not a stub |

No blocking anti-patterns. No TODO, FIXME, or empty implementations.

### Human Verification Required

#### 1. Full Functional Parity (MIG-02)

**Test:** Run `npm run dev`. Open http://localhost:5173/Lentopallo/. Test all interactions: add player, court picker, rotation, scoring (+1/-1), picker point, set switching, court flip, clear court (two-tap), new game (two-tap), help overlay, share link (Jaa kokoonpano).
**Expected:** All interactions work. State persists on reload.
**Why human:** Runtime behavior requires browser execution.

#### 2. Visual Refresh -- Shadow Depth Fix (Plan 05)

**Test:** Compare court cells, roster tags, score buttons for visible depth.
**Expected:** Layered shadow depth creating iOS-Settings-like feel; no longer "too flat".
**Why human:** UAT #12 reported flat appearance; Plan 05 added layered shadows; subjective visual judgment.

#### 3. Button Label Fix (Plan 05)

**Test:** Check share button in roster section and help section 8.
**Expected:** "Jaa kokoonpano" everywhere; no "Tallenna pelaajat".
**Why human:** UAT #10 reported misleading label; Plan 05 renamed; confirm Finnish text is appropriate.

### Gaps Summary

No automated gaps. All 17 artifacts verified (exists, substantive, wired). All 11 key links confirmed. All 8 requirement IDs satisfied with implementation evidence. Build, typecheck, and 11 unit tests pass. UAT covered 14 tests (12 passed, 2 issues closed by Plan 05).

Status is `human_needed` because runtime functional parity and visual quality require browser verification. No code-level gaps remain.

---

_Verified: 2026-04-05T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
