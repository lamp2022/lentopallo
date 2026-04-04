# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 01-Foundation
**Areas discussed:** Module structure, Visual refresh scope, GitHub Pages deploy

---

## Module Structure

| Option | Description | Selected |
|--------|-------------|----------|
| By layer | state.ts, render.ts, scoring.ts, persistence.ts, utils.ts — clean separation of concerns | ✓ |
| By feature | court.ts, roster.ts, scoring.ts, eventlog.ts — each feature self-contained | |
| Hybrid | Core layers + feature modules — best of both but more files | |

**User's choice:** By layer (Recommended)
**Notes:** Clean separation of concerns, easy to add Supabase sync later by extending persistence layer.

### Follow-up: Render file granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Single render.ts | All render* functions in one file (~200 lines) | ✓ |
| Split by UI section | renderCourt.ts, renderScoreboard.ts, renderRoster.ts | |

**User's choice:** Single render.ts (Recommended)
**Notes:** Split later if it grows in Phase 3.

---

## Visual Refresh Scope

### Migration approach

| Option | Description | Selected |
|--------|-------------|----------|
| Pixel-perfect clone first | Migrate CSS as-is, then light refresh pass. Two steps — easier to verify MIG-02. | ✓ |
| Modernize during migration | Rewrite CSS alongside TS migration. Faster but harder to verify. | |
| Minimal — keep current look | No visual changes in Phase 1. Save for Phase 3. | |

**User's choice:** Pixel-perfect clone first (Recommended)

### Style direction

| Option | Description | Selected |
|--------|-------------|----------|
| Clean modern minimal | Softer shadows, larger radius, better spacing, system-ui font. iOS Settings-level clean. | ✓ |
| Sport/athletic feel | Bolder type, tighter spacing, darker surfaces. Live sports scoreboard apps. | |
| You decide | Claude picks what works for courtside mobile use. | |

**User's choice:** Clean modern minimal
**Notes:** Keep existing color convention (green/red/blue/amber).

---

## GitHub Pages Deploy

### Deployment method

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Action + gh-pages branch | Push to main triggers build, deploys to gh-pages. Clean separation. | ✓ |
| Build to docs/ folder | Vite outputs to docs/, commit build artifacts to main. Simpler but pollutes main. | |
| Manual deploy | Run npm run deploy locally. No CI/CD. | |

**User's choice:** GitHub Action + gh-pages branch (Recommended)

### URL structure

| Option | Description | Selected |
|--------|-------------|----------|
| Repo subdirectory | username.github.io/Lentopallo/. Standard, no DNS config. | ✓ |
| Custom domain later | Start with repo URL, add CNAME later. | |

**User's choice:** Repo subdirectory (Recommended)

---

## Claude's Discretion

- Supabase local development approach (user skipped this area)
- Exact TypeScript tsconfig settings beyond strict mode
- Vite plugin selection and config details
- Test framework choice

## Deferred Ideas

- Supabase runtime integration — Phase 2
- Offline sync with IndexedDB — Phase 3
- CSS responsive improvements for courtside use — Phase 3
