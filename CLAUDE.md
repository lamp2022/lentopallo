# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step. Open `index.html` directly in a browser, or serve locally:

```
python3 -m http.server 8080
```

GitHub Pages hosts the app at the repo root (`index.html`).

## Architecture

Single-file app: all HTML, CSS, and JS live in `index.html` (~810 lines). No framework, no bundler, no dependencies.

**State (all in-memory + localStorage):**
- `players` — roster array `[{nr, name, role}]`
- `court` — map of position (1–6) → player number `{1: 7, 2: 3, ...}`
- `eventLog` — append-only array of scoring events `{ts, set, player, delta, type, court}`
- `scores / serveScores / pointScores` — derived from `eventLog` via `recalcScores()`
- `currentSet`, `scoreViewSet`, `serveTicks` — game state

**Key functions:**
- `renderAll()` — redraws everything; call after any state change
- `recalcScores()` — recomputes all score objects from `eventLog`
- `calcStreaks(playerNr)` — returns array of streak lengths from `eventLog`
- `addScore(delta, event)` — adds event for player in position 1 (server)
- `rotate()` — shifts court positions 1→6→5→4→3→2→1, marks serve tick
- `openPicker(pos)` / `closePicker()` — player selection popup
- `saveToStorage()` / `loadFromStorage()` — localStorage persistence
- `esc(str)` — XSS-safe HTML escaping, use for all user-generated content

**Scoring model:**
- Position 1 = server. Score buttons (+1/−1) always act on player in position 1.
- Clicking a court cell opens a picker: can assign player, record point from picker, or clear cell.
- Two score types: `'serve'` (from rotate flow) and `'point'` (from picker).

## Planned Migration (docs/PRD.md)

Next phase: **Vite + vanilla TypeScript + Supabase JS client**, hosted on GitHub Pages via `gh-pages` branch or `docs/` folder. Key planned additions: auth (magic link), RLS, multi-team support, offline sync (localStorage fallback). See `docs/PRD.md` for full schema and roadmap.

## UI Constraints (docs/UI-PERIAATTEET.md)

- Designed for one-handed courtside use on mobile (375px primary)
- All tap targets ≥ 48px; critical buttons (±1, rotate) larger
- Court grid must stay visible without scrolling
- Picker opens full-width on mobile (`min-width: 90vw`)
- Destructive actions require two-tap confirmation (already implemented via `confirmingClear` / `confirmingNewGame` flags)
- Color convention: green = positive, red = negative/destructive, blue = action/navigation

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Lentopallo — Volleyball Rotation & Statistics App**

A volleyball club management app for tracking court rotations, serving statistics, and player performance. Currently a single-file HTML/JS app used courtside on mobile. Being migrated to Vite + vanilla TypeScript + Supabase to support multi-team clubs, authentication, persistent statistics, and offline-first mobile use.

**Core Value:** Courtside rotation tracking must work instantly and offline — if the coach can't score a serve in under 2 seconds during a live match, nothing else matters.

### Constraints

- **Tech stack**: Vite + vanilla TypeScript + Supabase JS client (decided in PRD)
- **Hosting**: GitHub Pages (static output, no SSR)
- **Budget**: Supabase Free tier ($0/mo) — 500MB DB, no auto-backups
- **Offline**: Must work without network; sync when connectivity returns
- **Mobile**: One-handed courtside use, all interactions under 2 seconds
- **No framework**: Vanilla TS, no React/Vue/Svelte — keep it simple
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- HTML5 — markup for UI structure in `index.html`
- CSS3 — styling, grid layout for court visualization, animations
- JavaScript (ES6) — vanilla JS, no frameworks; all logic in `index.html` script block
- **Planned:** TypeScript — migration target in PRD (see section 6.4)
## Runtime
- Browser (modern, ES6 compatible) — no server-side runtime currently
- **Planned:** Node.js + Vite — for build pipeline and development
- **Current:** None (no dependencies, no `package.json`)
- **Planned:** npm — with Vite + TypeScript + Supabase JS client
## Frameworks
- **Current:** None — vanilla HTML/CSS/JS
- **Planned:** Vite (build tool) + vanilla TypeScript (no UI framework like React/Vue)
- **Current:** localStorage API (browser native, no library)
- **Planned:** Supabase JavaScript Client — for remote persistence + offline sync
- Not currently in use
- **Current:** None (single HTML file, served directly or via `python3 -m http.server`)
- **Planned:** Vite (dev server, build to static assets)
## Key Dependencies
- None — zero external dependencies
- `@supabase/supabase-js` — Supabase JavaScript client for auth, database queries, RLS enforcement
- `vite` — fast build tool and dev server
- `typescript` — type checking
- No UI frameworks (React, Vue, Svelte)
- No bundlers other than Vite
- No HTTP clients (uses native `fetch` API)
## Configuration
- **Current:** Hardcoded state in memory; all data in localStorage under key `'lentopallo'`
- **Planned:** `.env.local` for Supabase URL and anon key (see docs/PRD.md section 3)
- **Current:** No build step; served as-is from `/index.html`
- **Planned:**
- Viewport: mobile-first, 375px target width (see UI-PERIAATTEET.md)
- Cache headers: `no-cache, no-store, must-revalidate` already set in `index.html` meta tags (line 6–8)
## Platform Requirements
- Any modern browser (Chrome, Firefox, Safari, Edge) with ES6 support
- Optional: Python 3 for local server (`python3 -m http.server 8080`)
- **Planned:** Node.js 18+ for Vite dev server
- GitHub Pages hosting (free, static hosting)
- **Planned:** Supabase PostgreSQL + Auth (Free or Pro tier; see PRD section 5.2)
- **Planned:** Supabase Edge Functions for rate limiting (PRD section 1.3)
## Current Code Organization
- `index.html` (810 lines) — entire app in one file
- In-memory objects: `players`, `court`, `eventLog`, `scores`, `currentSet`, `serveTicks`, etc.
- Persistence: `localStorage.getItem('lentopallo')` / `localStorage.setItem()` (lines 823, 858)
- `renderAll()` — full UI redraw
- `recalcScores()` — derive all scores from `eventLog`
- `addScore(delta, event)` — append event
- `rotate()` — advance court positions
- `esc(str)` — XSS-safe escaping
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- **No framework**: Pure vanilla JS, no build step, no dependencies
- **`var` only**: No `let`/`const` used anywhere — legacy ES5 style
- **String concatenation**: HTML built with `+` operator, no template literals
- **Semicolons**: Always used
- **Indentation**: 2 spaces
## Function Patterns
- **Verb-first naming**: `renderAll()`, `addScore()`, `openPicker()`, `clearPos()`
- **`render*` prefix**: Functions that update DOM (`renderCourt`, `renderRoster`, `renderBench`, `renderScoreBoard`, `renderScoreBtns`, `renderSetBar`)
- **Early returns**: Used for validation (`if (!nr || nr < 1 || nr > 99) return;`)
- **Inline event handlers**: `onclick` attributes in HTML strings, not `addEventListener` (except for keyboard events on inputs)
## DOM Manipulation
- **`getElementById` exclusively**: No `querySelector` usage
- **`innerHTML` for bulk updates**: All render functions replace entire innerHTML
- **`classList.toggle`**: Used for show/hide (`collapsed`, `open`, `active`)
- **No DOM diffing**: Full re-render on every state change via `renderAll()`
## Error Handling
- **Silent fail pattern**: `try-catch` blocks with empty catch for localStorage and URL decode
- **Validation at entry points**: `addPlayer()` validates number range, duplicates, max count
- **No error UI**: Errors silently ignored, no user-facing error messages
## XSS Safety
- **`esc()` function** (line 815): Creates DOM text node to safely escape user input
- **Required for all user-generated content**: Player names always passed through `esc()`
## State Management
- **Global variables**: All state in top-level `var` declarations
- **Immutable pattern for court snapshots**: `JSON.parse(JSON.stringify(court))` in event log
- **Render-everything pattern**: Call `renderAll()` after any state change
- **Auto-save**: `renderAll` wrapped to call `saveState()` on every invocation (line 879–880)
## Confirmation Pattern
- **Two-tap destructive actions**: `confirmingClear` / `confirmingNewGame` boolean flags
- **3-second timeout**: Confirmation state resets after 3000ms via `setTimeout`
- **Visual feedback**: Button text and border color change to red during confirmation
## UI Color Convention
- Green (`--green`): Positive actions, scores
- Red (`--red`): Negative/destructive actions
- Blue (`--blue`): Navigation, primary actions
- Amber (`--amber`): Serve ticks, streaks
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Immediate-mode rendering: full page redraw on any state change
- Event-sourcing: immutable append-only event log (eventLog) as single source of truth
- Derived state: all scores computed from eventLog, never stored directly
- Stateless localStorage: identical to in-memory state, full sync on load
- No framework, no bundler, no external dependencies
## Layers
- Purpose: Render UI and handle user interaction
- Location: `index.html` lines 10–179 (HTML/CSS) + render functions
- Contains: DOM structure, styles (CSS custom properties), event handlers
- Depends on: State layer via global variables
- Used by: User interactions, touch events, form submissions
- Purpose: Hold in-memory game state and persist to localStorage
- Location: `index.html` lines 272–287 (variable declarations)
- Contains: `players`, `court`, `eventLog`, `scores`, `currentSet`, `serveTicks`, etc.
- Depends on: Nothing (pure data)
- Used by: All render and compute functions
- Purpose: Immutable append-only record of all scoring events
- Location: `index.html` line 280: `var eventLog = []`
- Contains: Objects `{ts, set, player, delta, type, court}` — one entry per score change
- Depends on: Nothing
- Used by: `recalcScores()`, `calcStreaks()`, undo recovery
- Purpose: Derive all displayable data from eventLog
- Location: `index.html` functions: `recalcScores()`, `calcStreaks()`
- Contains: Score aggregation, streak calculation, per-set/per-total statistics
- Depends on: eventLog (only)
- Used by: Rendering functions to display scoreboard
- Purpose: Handle user input and translate to state mutations
- Location: `index.html` functions: `addScore()`, `rotate()`, `selectPlayer()`, `clearCourt()`, etc.
- Contains: Form handlers, court cell pickers, button click handlers
- Depends on: State layer
- Used by: DOM event listeners (onclick, onchange)
- Purpose: Serialize/deserialize state to/from localStorage
- Location: `index.html` functions: `saveState()`, `loadState()`
- Contains: JSON serialization of `players`, `court`, `eventLog`, `currentSet`, `serveTicks`
- Depends on: State layer
- Used by: Page load/before unload, manual save
## Data Flow
- All state is in-memory global variables. No component state.
- localStorage is kept in sync via `saveState()` (called at end of `renderAll()`).
- On page load, `loadState()` restores all variables from localStorage.
- Undo: manually delete from eventLog, recalculate, render (not yet UI-exposed).
## Key Abstractions
- Purpose: Represents which player occupies each court position (1–6)
- Examples: `court = {1: 7, 2: 3, 3: 0, 4: 5, 5: 2, 6: 8}`
- Pattern: Object with position keys (integers), player number values (integers); `0` = empty
- Purpose: Complete audit trail of all scoring changes
- Examples: `{ts: 1680000000, set: 1, player: 7, delta: 1, type: 'serve', court: {...}}`
- Pattern: Append-only array. Never deleted. Enables undo, replay, statistics.
- Purpose: Aggregated statistics per player
- Examples: `{player_7: {total: 12, serve: 8, point: 4, streaks: [3, 2, 1]}}`
- Pattern: Derived from eventLog in `recalcScores()`. Keyed by player number.
- Purpose: Database of available players
- Examples: `{nr: 7, name: 'Anna', role: 'normaali'}`
- Pattern: Array of objects. Edited via form inputs. Role affects court eligibility (libero → back row only).
## Entry Points
- Location: `index.html` lines 838–879
- Triggers: Browser load, GitHub Pages serve
- Responsibilities: Restore state from localStorage, render initial UI
- Scoring buttons: `addScore(+1)`, `addScore(-1)` (lines 355–372)
- Court cells: `openPicker(position)` (line 635)
- Roster form: `addPlayer()` (line 298)
- Rotate button: `rotate()` (line 797)
- All ultimately call `renderAll()` + `saveState()`
- No periodic save. Save only on state change (eager write).
## Error Handling
- Player number: checked in form input `type="number"` (0–99)
- Set number: validated in `recalcScores()` — filtered by `set === currentSet || scoreViewSet === 0`
- Court position: must exist (1–6), silently ignores invalid
- Roster: duplicate numbers prevented by checking existing entries
- XSS: all user-generated content escaped via `esc(str)` before insertion to DOM
## Cross-Cutting Concerns
- Client-side: form `type="number"`, `maxlength` attributes
- Pattern: check before appending to eventLog
- Example: `if (nr < 1 || nr > 99) return;`
- Function `esc(str)` (line 815) escapes `<`, `>`, `&`, `"`, `'`
- Used on all player names, roster tags, court display: `esc(players_by_nr[nr].name)`
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
