# Phase 1: Foundation - Research

**Researched:** 2026-04-04
**Domain:** Vite + TypeScript project scaffolding, Supabase schema + RLS, GitHub Pages deployment
**Confidence:** HIGH — all package versions verified against npm registry live; deployment patterns verified against official Vite docs; RLS syntax verified against official Supabase docs.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Module split: `main.ts`, `types.ts`, `state.ts`, `render.ts`, `scoring.ts`, `court.ts`, `utils.ts`, `persistence.ts`
- **D-02:** All render functions stay in single `render.ts` for Phase 1; split later if needed
- **D-03:** TypeScript strict mode from day one, zero `any` types in scoring/stats logic (MIG-03)
- **D-04:** Two-step visual approach: pixel-perfect CSS clone first (verifies MIG-02), then light refresh pass
- **D-05:** Refresh direction: clean modern minimal — softer shadows, slightly larger radius, better spacing, system-ui font stack; keep green/red/blue/amber color convention; iOS Settings-level clean
- **D-06:** GitHub Action triggers on push to main, builds with Vite, deploys to `gh-pages` branch automatically
- **D-07:** Vite `base` set to `'/Lentopallo/'` (app served from repo subdirectory)

### Claude's Discretion

- Supabase local dev setup approach (CLI+Docker vs hosted project)
- Exact TypeScript tsconfig settings beyond strict mode
- Vite plugin selection and config details
- Test framework choice (if any tests added in Phase 1)

### Deferred Ideas (OUT OF SCOPE)

- Supabase runtime integration (auth, queries) — Phase 2
- Offline sync with IndexedDB — Phase 3
- CSS-level responsive improvements for courtside use — Phase 3 (UI-01 through UI-05)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-01 | Migrate index.html to Vite + vanilla TypeScript project | Vite 8.0.3 scaffolding, tsconfig strict, module split D-01 |
| MIG-02 | All existing functionality preserved (rotation, scoring, roster, event log, localStorage) | Port patterns documented; pixel-perfect clone step before refresh |
| MIG-03 | TypeScript strict mode with no `any` in scoring/stats logic | Types-first approach; `recalcScores` + `calcStreaks` are pure functions, easy to type |
| MIG-04 | GitHub Pages deployment via Vite build output | Official GH Actions workflow verified; `base: '/Lentopallo/'` config |
| DB-01 | PostgreSQL schema: clubs, teams, players, team_players (join), matches, events, profiles | PRD schema documented; `team_players` join table added vs PRD's single FK |
| DB-02 | RLS policies on all tables scoped to club_id | Verified current Supabase RLS syntax (USING / WITH CHECK, per-operation) |
| DB-03 | CHECK constraints: jersey 1-99, set 1-5, delta in (-1, +1) | Standard PostgreSQL CHECK syntax confirmed |
| DB-04 | Indexes on events(match_id), events(player_id), players(club_id), matches(team_id, date) | Standard CREATE INDEX syntax; exact DDL provided below |
</phase_requirements>

---

## Summary

Phase 1 is a scaffolding + schema phase. The deliverable is a working Vite + TypeScript build of the existing app (all features intact, strict types) deployed to GitHub Pages, plus the Supabase database schema with RLS and indexes in place — but no runtime Supabase calls yet.

The migration risk is low: the existing code is well-structured (~810 lines, clear function boundaries, event-sourcing model), and the module split in D-01 maps directly to the current logical layers. The main discipline required is defining TypeScript types before porting logic (not the reverse), which prevents the `any`-drift pitfall that kills event-sourcing codebases.

Vite 8.0.3 is the current npm latest, but `vite-plugin-pwa` 1.2.0 does not officially declare Vite 8 support in its peer deps (issue open, workaround confirmed stable). For Phase 1, which does not need PWA, use Vite 8 freely — the PWA question is deferred to Phase 2. The GitHub Actions deployment workflow from official Vite docs uses the `actions/deploy-pages` approach (cleaner than the `gh-pages` npm package alternative).

**Primary recommendation:** Scaffold with Vite 8 + TypeScript 6, define all domain types first (`types.ts`), port `scoring.ts` and `court.ts` as pure functions with unit tests, verify identical output vs the JS original, then apply the CSS refresh. Apply the Supabase schema via SQL migration files tracked in the repo.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | **8.0.3** | Build tool, dev server, asset bundling | Current npm latest; Node 25.9 satisfies `>=22.12.0` requirement; Rolldown-integrated |
| typescript | **6.0.2** | Type checking, compilation | Current stable; ships own compiler; strict mode enabled |
| @supabase/supabase-js | **2.101.1** | Supabase client (Phase 1: schema setup only, no runtime calls yet) | Current stable; ships own TS types; v2 API |

### Supporting (Phase 1 only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | **4.1.2** | Unit testing | Use for `recalcScores`, `calcStreaks`, `esc` pure function tests in Phase 1 |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| GitHub Actions (official) | — | Build + deploy to GH Pages on push to main |
| Supabase Dashboard SQL editor | — | Apply schema migration (supabase CLI not installed locally — use hosted project) |

### NOT Needed in Phase 1

| Library | Reason | Phase When Needed |
|---------|--------|-------------------|
| vite-plugin-pwa | PWA deferred; Vite 8 peer dep not officially declared | Phase 2+ |
| idb | IndexedDB offline queue deferred | Phase 3 |
| gh-pages (npm) | Replaced by official GH Actions `deploy-pages` workflow | Never needed |
| workbox-window | PWA dependency, deferred | Phase 2+ |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite 8.0.3 (current) | Vite 7.3.1 | Vite 7 still current stable in prior research; Vite 8 is now npm latest; no reason to pin to 7 for a new project |
| GitHub Actions deploy-pages | gh-pages npm package | Official Actions approach cleaner, no extra npm package, handles Pages config automatically |
| Supabase Dashboard SQL editor | Supabase CLI + Docker | CLI not installed; hosted project is simpler for schema-only Phase 1; no migration tooling needed until Phase 4+ |

**Installation:**

```bash
npm create vite@latest lentopallo -- --template vanilla-ts
cd lentopallo
npm install
npm install -D vitest@4.1.2
npm install @supabase/supabase-js@2.101.1
```

**Version verification (live npm registry, 2026-04-04):**

| Package | Verified Version | Publish Date |
|---------|-----------------|--------------|
| vite | 8.0.3 | current latest |
| typescript | 6.0.2 | current stable |
| @supabase/supabase-js | 2.101.1 | current latest |
| vitest | 4.1.2 | current latest |

[VERIFIED: npm registry, 2026-04-04]

---

## Architecture Patterns

### Recommended Project Structure (Phase 1)

```
src/
├── types.ts           # All domain interfaces (Player, Court, GameEvent, ScoreMap) — define FIRST
├── state.ts           # Global in-memory state + typed accessors
├── scoring.ts         # recalcScores(), calcStreaks(), addScore() — pure logic, unit-testable
├── court.ts           # rotate(), openPicker(), selectPlayer() — court position management
├── render.ts          # renderAll() + all render* functions (renderCourt, renderRoster, etc.)
├── persistence.ts     # saveState(), loadState(), URL hash encode/decode
├── utils.ts           # esc(), any small helpers
└── main.ts            # Entry: loadState() → renderAll() → wire event handlers

index.html             # Thin shell: <div id="app">, <script type="module" src="/src/main.ts">
style.css              # All CSS (extracted from index.html <style> block)
vite.config.ts         # base: '/Lentopallo/', resolve aliases
tsconfig.json          # strict: true, target: ES2022, module: ESNext
.github/
└── workflows/
    └── deploy.yml     # Build + deploy to GitHub Pages on push to main
```

### Pattern 1: Types-First Migration

**What:** Define all TypeScript interfaces before porting any logic. Zero `any` in core modules.

**When to use:** The very first file created in Phase 1. Everything else imports from `types.ts`.

**Example:**

```typescript
// src/types.ts
export interface Player {
  nr: number;         // 1–99
  name: string;       // max 30 chars
  role: 'normaali' | 'passari' | 'libero';
}

export type Court = Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number>>;

export interface GameEvent {
  ts: number;         // Unix timestamp (ms)
  set: number;        // 1–5
  player: number;     // player nr
  delta: 1 | -1;
  type: 'serve' | 'point';
  court: Court;       // snapshot at event time
}

export interface ScoreEntry {
  total: number;
  serve: number;
  point: number;
  sets: Record<number, number>;
}

export type ScoreMap = Record<string, ScoreEntry>;  // key: "player_NR"
```

### Pattern 2: Pure Function Extraction for Scoring

**What:** `recalcScores()` and `calcStreaks()` become pure functions `(events: GameEvent[]) => ScoreMap` — no side effects, no DOM access.

**When to use:** These are the only functions that need unit tests in Phase 1. Isolate them completely.

**Example:**

```typescript
// src/scoring.ts
import type { GameEvent, ScoreMap } from './types';

export function recalcScores(events: GameEvent[]): ScoreMap {
  const scores: ScoreMap = {};
  for (const e of events) {
    const key = `player_${e.player}`;
    if (!scores[key]) scores[key] = { total: 0, serve: 0, point: 0, sets: {} };
    const s = scores[key];
    if (e.delta === 1) {
      s.total++;
      if (e.type === 'serve') s.serve++;
      else s.point++;
      s.sets[e.set] = (s.sets[e.set] ?? 0) + 1;
    }
  }
  return scores;
}
```

### Pattern 3: Vite Config for GitHub Pages Subdirectory

**What:** `base` must match the repo name to make asset paths work on `username.github.io/Lentopallo/`.

**Example:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Lentopallo/',
})
```

[CITED: https://vite.dev/guide/static-deploy]

### Pattern 4: GitHub Actions Deploy Workflow

**What:** Official Vite deployment pattern using `actions/deploy-pages`.

**Example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: './dist'
      - id: deployment
        uses: actions/deploy-pages@v4
```

[CITED: https://vite.dev/guide/static-deploy]

### Pattern 5: Supabase Schema Migration (SQL files in repo)

**What:** SQL migration tracked in `supabase/migrations/` as plain `.sql` files. Applied manually via Supabase Dashboard SQL editor in Phase 1 (CLI not installed). CLI tooling added in later phases if needed.

**Example directory:**

```
supabase/
└── migrations/
    └── 20260404_001_initial_schema.sql
```

### Anti-Patterns to Avoid

- **`any` as migration shortcut:** Fastest path to unfixable scoring bugs. Define `GameEvent` fully before touching `recalcScores()`.
- **Porting logic before types:** If you write `function recalcScores(events)` without typing `events`, you've already failed MIG-03.
- **`innerHTML` with user data:** The existing `esc()` function must be ported to `utils.ts` and called everywhere in `render.ts` before any other rendering work.
- **`process.env` for env vars:** Vite uses `import.meta.env.VITE_*`. `process.env` is not available in Vite client builds.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript compilation | Custom tsc scripts | `vite build` (Vite handles tsc + esbuild) | Vite's build pipeline handles source maps, tree-shaking, asset fingerprinting |
| GitHub Pages deployment | Manual `git subtree push` | GitHub Actions `deploy-pages` | Manual push is error-prone; Actions handles permissions, concurrency, rollback |
| XSS escaping | Custom regex replace | Existing `esc(str)` from index.html (port as-is) | The DOM text node trick handles all edge cases; regex misses encoded variants |
| Unit test runner | Custom assertion scripts | Vitest | Native Vite integration, same config, runs in Node without browser |

**Key insight:** The main risk in this phase is over-engineering the TypeScript structure. The existing app is well-factored; the migration is mostly renaming globals to module exports, not redesigning.

---

## Common Pitfalls

### Pitfall 1: Vite 8 + vite-plugin-pwa Peer Dep Warning

**What goes wrong:** `npm install vite-plugin-pwa` in Phase 1 shows unmet peer dep warning for Vite 8; developer pins to Vite 7 or installs conflicting versions.

**Why it happens:** `vite-plugin-pwa@1.2.0` declares `vite: "^3.1.0 || ... || ^7.0.0"` but not `^8.0.0`. Confirmed working in production per GitHub issue #918, but not officially declared.

**How to avoid:** Do NOT install `vite-plugin-pwa` in Phase 1 — PWA is deferred. Use Vite 8 freely. Revisit for Phase 2.

**Warning signs:** `npm warn EBADENGINE` or peer dep warnings for vite during install.

[VERIFIED: npm registry peerDependencies check, 2026-04-04]

### Pitfall 2: TypeScript Strict Mode Breaks ES5 Patterns

**What goes wrong:** The existing code uses `var`, no semicolons on functions, `arguments`-style patterns. TypeScript strict mode flags several of these, causing compile errors during migration.

**Why it happens:** `strict: true` enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, and `useUnknownInCatchVariables` simultaneously.

**How to avoid:** Port to `const`/`let`, typed parameters, and typed return values from the start. Do not use `var` in TypeScript source. The CLAUDE.md convention of `var` applies only to the old `index.html` — new TypeScript files use `const`/`let`.

**Warning signs:** `error TS7006: Parameter 'x' implicitly has an 'any' type` on any function.

### Pitfall 3: Vite Base URL Missing Causes Blank Page on GitHub Pages

**What goes wrong:** Build succeeds, `dist/` is deployed, but app shows blank page with 404 errors for JS/CSS assets in DevTools.

**Why it happens:** Without `base: '/Lentopallo/'` in `vite.config.ts`, Vite generates absolute asset paths (`/assets/main.abc123.js`) that resolve to the root of `github.io`, not the repo subdirectory.

**How to avoid:** Set `base: '/Lentopallo/'` in `vite.config.ts` before running the first build. Verify in `dist/index.html` that `<script src="/Lentopallo/assets/...">` is present.

**Warning signs:** Blank page on `username.github.io/Lentopallo/` with 404 errors in browser console for JS/CSS.

### Pitfall 4: RLS Missing `WITH CHECK` on INSERT/UPDATE Policies

**What goes wrong:** RLS policies are created with only `USING` clause. SELECT is protected but INSERT silently allows writing data to any club_id.

**Why it happens:** Developers copy SELECT policy syntax for INSERT. In PostgreSQL, `USING` applies to row visibility (SELECT/UPDATE/DELETE), `WITH CHECK` applies to new row validation (INSERT/UPDATE).

**How to avoid:**
- SELECT policies: `USING (expression)` only
- INSERT policies: `WITH CHECK (expression)` only (no USING)
- UPDATE policies: both `USING` and `WITH CHECK`
- DELETE policies: `USING` only

```sql
-- Correct INSERT policy
CREATE POLICY "coach_can_insert_events"
ON events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'coach')
  )
);
```

[CITED: https://supabase.com/docs/guides/database/postgres/row-level-security]

### Pitfall 5: Service Role Key Leaked into Vite Build

**What goes wrong:** `VITE_SUPABASE_SERVICE_ROLE_KEY` in `.env.local` gets bundled into the client JS. Any visitor can extract it and bypass all RLS.

**How to avoid:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Service role key never has a `VITE_` prefix. Add `.env.local` to `.gitignore`.

### Pitfall 6: localStorage State from Old App Conflicts with New Build

**What goes wrong:** During development, the old `index.html` app wrote state to `localStorage.getItem('lentopallo')`. The new Vite build reads it on first load, but the new TypeScript types expect a different shape, causing a parse error or type assertion failure.

**How to avoid:** The new `persistence.ts` must parse localStorage defensively with a version check or schema validation. Provide a migration path or simply clear on shape mismatch (acceptable for Phase 1).

---

## Code Examples

### tsconfig.json (Phase 1)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### Supabase Schema DDL (Phase 1)

Note: `DB-01` requirement lists `team_players` join table (many-to-many), but PRD §2.1 has `players.team_id` as direct FK. Use the normalized join table per the requirement:

```sql
-- Enable RLS on all tables after creation
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- CHECK constraints (DB-03)
-- jersey: CHECK (nr BETWEEN 1 AND 99) — in players table
-- set: CHECK (set_nr BETWEEN 1 AND 5) — in events table
-- delta: CHECK (delta IN (-1, 1)) — in events table

-- Indexes (DB-04)
CREATE INDEX idx_events_match ON events(match_id);
CREATE INDEX idx_events_player ON events(player_id);
CREATE INDEX idx_players_club ON players(club_id);
CREATE INDEX idx_matches_team ON matches(team_id, date);
```

### RLS Policy Pattern

```sql
-- Example: coaches/admins of a club can insert events
CREATE POLICY "club_members_see_events"
ON events FOR SELECT TO authenticated
USING (
  match_id IN (
    SELECT m.id FROM matches m
    JOIN teams t ON t.id = m.team_id
    JOIN profiles p ON p.club_id = t.club_id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "coaches_insert_events"
ON events FOR INSERT TO authenticated
WITH CHECK (
  match_id IN (
    SELECT m.id FROM matches m
    JOIN teams t ON t.id = m.team_id
    JOIN profiles p ON p.club_id = t.club_id
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'coach')
  )
);
```

### Unit Test Pattern (Vitest)

```typescript
// src/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { recalcScores } from './scoring'
import type { GameEvent } from './types'

const sampleEvents: GameEvent[] = [
  { ts: 1000, set: 1, player: 7, delta: 1, type: 'serve', court: { 1: 7 } },
  { ts: 2000, set: 1, player: 7, delta: 1, type: 'serve', court: { 1: 7 } },
  { ts: 3000, set: 1, player: 3, delta: -1, type: 'serve', court: { 1: 3 } },
]

describe('recalcScores', () => {
  it('counts serve points correctly', () => {
    const scores = recalcScores(sampleEvents)
    expect(scores['player_7'].serve).toBe(2)
    expect(scores['player_7'].total).toBe(2)
    expect(scores['player_3']).toBeUndefined()
  })
})
```

---

## Schema Design Note: PRD vs Requirements Discrepancy

**Issue:** PRD §2.1 defines `players.team_id uuid FK → teams.id` (direct FK), but `DB-01` requirement specifies `team_players` join table for many-to-many.

**Resolution:** Use `team_players` join table per DB-01. This is the correct long-term design (a club player can be on multiple teams). The PRD was written before the requirements were finalized.

```sql
-- Correct: team_players join table (DB-01)
players (
  id uuid PK DEFAULT gen_random_uuid(),
  club_id uuid FK → clubs.id,   -- player belongs to club, not team
  nr int NOT NULL CHECK (nr BETWEEN 1 AND 99),
  name text NOT NULL,
  role text CHECK (role IN ('normaali','passari','libero')) DEFAULT 'normaali',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

team_players (
  team_id uuid FK → teams.id,
  player_id uuid FK → players.id,
  nr int NOT NULL CHECK (nr BETWEEN 1 AND 99),  -- jersey per team (TEAM-03)
  PRIMARY KEY (team_id, player_id),
  UNIQUE (team_id, nr)  -- no duplicate jersey per team (TEAM-04)
)
```

[ASSUMED: PRD shows direct FK, requirements show join table; planner should confirm join table is the intended design before implementing]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PRD's `players.team_id` should be replaced with `team_players` join table per DB-01 | Schema Design Note | If PRD intent was direct FK, schema is wrong and requires migration later |
| A2 | Supabase hosted project (not CLI+Docker) is the right local dev approach for Phase 1 | Standard Stack | If team needs offline-first schema versioning, CLI+Docker setup needed sooner |

---

## Open Questions

1. **PRD vs DB-01 schema discrepancy**
   - What we know: PRD §2.1 has `players.team_id`, DB-01 says `team_players` join table
   - What's unclear: Which design was intended for Phase 1
   - Recommendation: Use join table (DB-01 is more recent, aligns with TEAM-02/TEAM-03 requirements)

2. **Supabase local dev vs hosted project**
   - What we know: Supabase CLI not installed; user left this to Claude's discretion (D-08)
   - Recommendation: Use hosted Supabase project for Phase 1 (schema-only, no auth yet); no local CLI needed until auth integration in Phase 2

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server, npm scripts | Yes | 25.9.0 | — |
| npm | Package management | Yes | 11.12.1 | — |
| git | Version control, GH Actions deploy | Yes | 2.53.0 | — |
| python3 | Local static server (optional) | Yes | 3.14.3 | — |
| Supabase CLI | Schema type generation | No | — | Use Supabase Dashboard SQL editor (manual) |

**Node 25.9.0 satisfies Vite 8's requirement of `>=22.12.0`.** [VERIFIED: npm view vite engines]

**Missing dependencies with no fallback:** None — all required dependencies are available.

**Missing dependencies with fallback:**
- Supabase CLI: Not installed. Phase 1 uses Supabase Dashboard SQL editor directly. CLI needed in Phase 2+ for type generation and migration tooling.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (or via `vite.config.ts` test block) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-03 | `recalcScores()` returns correct totals | unit | `npx vitest run src/scoring.test.ts` | Wave 0 |
| MIG-03 | `calcStreaks()` returns correct streak lengths | unit | `npx vitest run src/scoring.test.ts` | Wave 0 |
| MIG-03 | `esc()` escapes XSS characters correctly | unit | `npx vitest run src/utils.test.ts` | Wave 0 |
| MIG-01 | `npm run build` completes without TypeScript errors | build | `npx tsc --noEmit` | Wave 0 |
| MIG-02 | Visual: pixel-perfect match to original app | manual | Visual comparison screenshot | N/A — manual |
| MIG-04 | GitHub Actions workflow runs green | CI | Push to main → Actions tab | Wave 0 |
| DB-03 | CHECK constraints reject out-of-range values | manual SQL | Supabase Dashboard SQL editor | N/A — manual |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npx vitest run`
- **Per wave merge:** `npx tsc --noEmit && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + manual visual check + GH Actions green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/scoring.test.ts` — covers MIG-03 (`recalcScores`, `calcStreaks`)
- [ ] `src/utils.test.ts` — covers `esc()` XSS safety
- [ ] `vitest.config.ts` — configure test environment (`jsdom` for DOM-dependent tests)
- [ ] `package.json` test script: `"test": "vitest run"`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 2) | — |
| V3 Session Management | No (Phase 2) | — |
| V4 Access Control | Yes (schema/RLS) | Supabase RLS with USING + WITH CHECK per operation |
| V5 Input Validation | Yes | TypeScript types + CHECK constraints in PostgreSQL |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service role key in client bundle | Information Disclosure | Never use `VITE_` prefix for service role key; audit `.env.local` |
| Cross-club data access via RLS gap | Elevation of Privilege | All RLS policies derive club_id from `auth.uid()` via profiles join; never trust client-provided club_id |
| XSS via player names | Tampering | `esc()` function on all user-generated content in `render.ts` |
| INSERT bypassing club scope | Tampering | `WITH CHECK` on all INSERT/UPDATE policies |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gh-pages` npm package for deploy | GitHub Actions `deploy-pages` | GH Actions became standard ~2022 | No extra npm dependency; handles permissions natively |
| Vite 7.x | Vite 8.0.3 (Rolldown-integrated) | Released late 2025 | Faster builds via Rolldown; breaking changes minimal for vanilla TS |
| TypeScript `module: CommonJS` | `module: ESNext` + `moduleResolution: Bundler` | TS 5+ | Required for Vite; CommonJS in browser context causes issues |

**Deprecated / outdated:**
- `vite.config.js` with `resolve.alias` using `path.resolve(__dirname, ...)`: In Vite 8 with `moduleResolution: Bundler`, prefer `import.meta.dirname` or simple string aliases.
- `process.env` for environment variables: Use `import.meta.env.VITE_*` exclusively in Vite projects.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry, 2026-04-04] — vite 8.0.3, typescript 6.0.2, @supabase/supabase-js 2.101.1, vitest 4.1.2
- [VERIFIED: npm view vite engines] — Node `>=22.12.0` requirement; Node 25.9.0 satisfies it
- [VERIFIED: npm view vite-plugin-pwa peerDependencies] — Vite 8 not in peer deps; Vite 7 is maximum declared support
- [CITED: https://vite.dev/guide/static-deploy] — GitHub Actions workflow, `base` URL configuration
- [CITED: https://supabase.com/docs/guides/database/postgres/row-level-security] — RLS USING vs WITH CHECK per operation type
- `.planning/research/STACK.md` — prior stack research (versions now updated to current)
- `.planning/research/ARCHITECTURE.md` — offline-first architecture patterns
- `.planning/research/PITFALLS.md` — identified pitfalls (service role key, RLS gaps, GH Pages routing)
- `docs/PRD.md` — schema definition, RLS intent, migration phases
- `index.html` — existing app source (migration target)

### Secondary (MEDIUM confidence)
- [WebSearch verified] — GitHub issue #918: vite-plugin-pwa works with Vite 8 in production despite missing peer dep declaration; workaround available via npm overrides

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry live
- Architecture: HIGH — module split defined in CONTEXT.md D-01; patterns directly map to existing app structure
- Pitfalls: HIGH — Vite base URL and RLS WITH CHECK verified against official docs; service role key risk is well-documented
- GitHub Actions workflow: HIGH — verified against official Vite deployment docs

**Research date:** 2026-04-04
**Valid until:** 2026-07-04 (stable ecosystem; re-verify vite-plugin-pwa Vite 8 support before Phase 2)
