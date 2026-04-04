# Lentopallo — Volleyball Rotation & Statistics App

## What This Is

A volleyball club management app for tracking court rotations, serving statistics, and player performance. Currently a single-file HTML/JS app used courtside on mobile. Being migrated to Vite + vanilla TypeScript + Supabase to support multi-team clubs, authentication, persistent statistics, and offline-first mobile use.

## Core Value

Courtside rotation tracking must work instantly and offline — if the coach can't score a serve in under 2 seconds during a live match, nothing else matters.

## Requirements

### Validated

- Serve rotation tracking (position 1-6 cycling) — existing
- Score recording (+1/-1) for server in position 1 — existing
- Court position player assignment via picker — existing
- Player roster management (nr, name, role) — existing
- Event log (append-only scoring history) — existing
- Per-set and total score views — existing
- Streak calculation per player — existing
- localStorage persistence — existing
- XSS protection via esc() — existing
- Two-tap confirmation for destructive actions — existing
- Mobile-first one-handed UI (48px+ tap targets) — existing

### Active

- [ ] Vite + vanilla TypeScript migration
- [ ] Supabase Auth (magic link + email/password)
- [ ] PostgreSQL database (clubs, teams, players, matches, events, profiles)
- [ ] Row Level Security (club-scoped data isolation)
- [ ] Role-based access (admin, coach, viewer)
- [ ] Offline-first with localStorage fallback + sync
- [ ] Match management (create, tag opponent/date)
- [ ] Per-player statistics (serve points per set/match/season, streaks, efficiency)
- [ ] Per-team statistics (totals, best server, per-set breakdown)
- [ ] Admin panel (user + team management)
- [ ] Team selection after login
- [ ] PWA (service worker, manifest, install prompt)
- [ ] Finnish + English language support
- [ ] CSV/Excel player import
- [ ] Rate limiting via Edge Functions
- [ ] Audit logging (who changed what, when)

### Out of Scope

- Social login (OAuth) — unnecessary complexity for club use
- Real-time chat — not core to rotation tracking
- Video posts/uploads — storage costs, not relevant
- Push notifications — low value for this use case
- Supabase Pro features (PITR, large DB) — start on Free tier
- Finnish Volleyball Federation API — research needed, may not exist; defer to future
- Multi-language beyond fi/en — no demand

## Context

- Existing app: ~810-line single-file `index.html` with no dependencies
- Used courtside during live volleyball matches on mobile (375px primary)
- Event-sourcing pattern: immutable eventLog is source of truth, scores are derived
- Target users: club admins and coaches managing youth/adult teams
- Typical club size: unknown, design for flexibility (2-15 teams)
- Hosting: GitHub Pages (Vite build output)
- PRD: `docs/PRD.md` — detailed schema, RLS rules, migration phases
- UI principles: `docs/UI-PERIAATTEET.md` — mobile-first constraints

## Constraints

- **Tech stack**: Vite + vanilla TypeScript + Supabase JS client (decided in PRD)
- **Hosting**: GitHub Pages (static output, no SSR)
- **Budget**: Supabase Free tier ($0/mo) — 500MB DB, no auto-backups
- **Offline**: Must work without network; sync when connectivity returns
- **Mobile**: One-handed courtside use, all interactions under 2 seconds
- **No framework**: Vanilla TS, no React/Vue/Svelte — keep it simple

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vite + vanilla TS (no framework) | Minimal complexity, fast builds, matches existing code style | -- Pending |
| Supabase for backend | Auth + DB + RLS + Edge Functions in one service, free tier available | -- Pending |
| Magic link auth | Easier onboarding for non-technical coaches | -- Pending |
| Event-sourcing preserved | Existing pattern works well for undo, replay, statistics | -- Pending |
| GitHub Pages hosting | Free, already in use, Vite outputs static files | -- Pending |
| Supabase Free tier | Start free, upgrade if needed | -- Pending |
| Fi + En bilingual | Primary users Finnish, English for broader reach | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after initialization*
