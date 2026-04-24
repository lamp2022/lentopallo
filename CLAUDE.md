# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Volleyball rotation and serve-tracking app for youth teams. Currently a single-file standalone HTML/CSS/JS app (`index.html`) with no build system, no framework, and no backend. State is persisted to localStorage and can be shared via base64-encoded URL hash.

A PRD exists (`LENTOPALLO-PRD.md`) for expanding to a club-wide platform using Vite + vanilla TypeScript + Supabase, but this has **not been implemented yet**.

## Running

Open `index.html` directly in a browser. No build step, no server required.

## Architecture

Everything lives in `index.html` (~890 lines). Key concepts:

- **Court model**: `court` object maps position numbers (1–6) to player jersey numbers. Position 1 is the server. Positions render in grid order defined by `positions` array (changes when court is flipped).
- **Rotation**: `rotate()` cycles players 1→6→5→4→3→2→1 and awards a serve tick to the player leaving position 1.
- **Scoring**: Two types — serve points (`addScore`, +1/-1 for server at position 1) and situation points (`addPointFromPicker`, +1 for any on-court player). Both append to `eventLog`.
- **Event log**: Flat array of `{ts, set, player, name, delta, type, court}` objects. All scores/stats are derived from this via `recalcScores()`. The `court` snapshot enables future replay.
- **Streaks**: `calcStreaks()` computes consecutive +1 serve runs per player from eventLog. Only shown in the "Yhteensä" (total) view.
- **Persistence**: `saveState()` writes to localStorage on every render. `loadState()` checks URL hash first, then localStorage, then falls back to hardcoded defaults.
- **Picker**: Modal overlay for selecting/swapping players on a court position. Enforces libero rules (back row only, can't replace passari).

## Conventions

- All UI text is in Finnish.
- XSS protection via `esc()` helper — all user-supplied strings must pass through it before insertion into innerHTML.
- Destructive actions (clear court, new game) use a two-click confirmation pattern with a 3-second timeout.
- Player roles: `""` (normaali), `"libero"`, `"passari"` — max one of each on a roster.

## UI Design Principles (from UI-PERIAATTEET.md)

- Mobile-first, designed for courtside one-handed use during matches.
- All interactive targets minimum 48×48px; critical buttons (scoring, rotation) larger.
- Court must be visible without scrolling. Roster and stats are secondary/collapsible.
- Color semantics: green = positive, red = negative, blue = action, amber = serve streaks.
- No hover-dependent interactions.

## Planned Migration

The PRD specifies migrating to: Vite + vanilla TypeScript + Supabase (Auth, PostgreSQL with RLS, Edge Functions). Key additions: user/club/team hierarchy, multi-match support, offline-first with localStorage fallback + sync, PWA with service worker. The current `eventLog` maps to a planned `events` table.
