# Phase 1: Foundation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate existing 810-line single-file HTML/JS volleyball app to Vite + vanilla TypeScript project. Establish Supabase PostgreSQL schema with RLS policies, CHECK constraints, and indexes. Deploy to GitHub Pages. All existing features (rotation, scoring, roster, event log, localStorage) must work identically after migration.

</domain>

<decisions>
## Implementation Decisions

### Module Structure
- **D-01:** Split monolith by layer: `main.ts` (entry), `types.ts` (interfaces), `state.ts` (global state + localStorage), `render.ts` (all DOM rendering), `scoring.ts` (addScore, recalcScores, calcStreaks), `court.ts` (rotate, position management), `utils.ts` (esc, helpers), `persistence.ts` (localStorage, later Supabase)
- **D-02:** All render functions stay in single `render.ts` — currently ~200 lines, manageable. Split later if it grows in Phase 3
- **D-03:** TypeScript strict mode from day one, zero `any` types in scoring/stats logic (MIG-03)

### Visual Refresh
- **D-04:** Two-step approach: first pixel-perfect CSS clone to verify MIG-02 (feature preservation), then a light refresh pass
- **D-05:** Refresh direction: clean modern minimal — softer shadows, slightly larger radius, better spacing, system-ui font stack. Keep existing color convention (green/red/blue/amber). iOS Settings-level clean.

### GitHub Pages Deployment
- **D-06:** GitHub Action triggers on push to main, builds with Vite, deploys to `gh-pages` branch automatically
- **D-07:** App served from repo subdirectory: `username.github.io/Lentopallo/`. Vite `base` set to `'/Lentopallo/'`

### Supabase Local Development
- **D-08:** Claude's discretion — user did not select this area for discussion. Choose pragmatic approach during planning.

### Claude's Discretion
- Supabase local dev setup approach (CLI+Docker vs hosted project)
- Exact TypeScript tsconfig settings beyond strict mode
- Vite plugin selection and config details
- Test framework choice (if any tests added in Phase 1)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing app (migration source)
- `index.html` — Complete existing application (~890 lines): HTML structure, CSS styles, all JS logic. The source of truth for what must be preserved.

### Requirements & architecture
- `docs/PRD.md` — Supabase schema definition (clubs, teams, players, team_players, matches, events, profiles), RLS rules, migration phases
- `docs/UI-PERIAATTEET.md` — Mobile-first UI constraints, color conventions, tap target sizes
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: MIG-01 through MIG-04, DB-01 through DB-04
- `.planning/ROADMAP.md` — Phase 1 success criteria and dependencies

### Codebase analysis
- `.planning/codebase/ARCHITECTURE.md` — Current architecture patterns (event-sourcing, immediate-mode rendering, global state)
- `.planning/codebase/CONVENTIONS.md` — Current code conventions (naming, DOM manipulation, error handling, XSS safety)
- `.planning/codebase/STRUCTURE.md` — Current file structure and entry points
- `.planning/codebase/STACK.md` — Current and planned technology stack

### Research
- `.planning/research/STACK.md` — Vite 7.3.1, TS 6.0.2, @supabase/supabase-js 2.101.1, idb, uplot
- `.planning/research/ARCHITECTURE.md` — Offline-first constraint, sync queue design, hash-based routing
- `.planning/research/PITFALLS.md` — RLS bypass risks, GH Pages auth redirect, Free tier pausing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `esc(str)` function (line 815) — XSS-safe escaping, port directly to `utils.ts`
- `recalcScores()` / `calcStreaks()` — core computation logic, port to `scoring.ts` with types
- `renderAll()` pattern — full-redraw approach, preserve as-is during migration
- Court rotation logic (`rotate()`) — well-defined 1->6->5->4->3->2->1 cycle
- CSS custom properties (`--bg`, `--blue`, `--surface2`, etc.) — preserve color system
- Two-tap confirmation pattern (`confirmingClear`/`confirmingNewGame`) — preserve exactly

### Established Patterns
- Event-sourcing: immutable append-only `eventLog` as single source of truth — MUST preserve
- Derived state: all scores computed from `eventLog`, never stored directly
- Global state with `renderAll()` on every change — keep for Phase 1, refactor opportunity later
- `getElementById` exclusively for DOM access
- `innerHTML` for bulk updates in render functions

### Integration Points
- `localStorage` key `'lentopallo'` — current persistence. `persistence.ts` will handle this
- URL hash for state sharing (Base64-encoded JSON) — preserve in migration
- No external API calls currently — Supabase client added but only schema/RLS setup in Phase 1 (no runtime calls yet)

</code_context>

<specifics>
## Specific Ideas

- Visual refresh should feel like iOS Settings — clean, not flashy, not hurting usability
- Keep existing color convention intact (green = positive, red = destructive, blue = action, amber = serve/streaks)
- The two-step migration approach (clone first, refresh second) ensures MIG-02 verification is clean

</specifics>

<deferred>
## Deferred Ideas

- Supabase runtime integration (auth, queries) — Phase 2
- Offline sync with IndexedDB — Phase 3
- CSS-level responsive improvements for courtside use — Phase 3 (UI-01 through UI-05)

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-04*
