---
phase: 02
reviewers: [gemini, claude]
reviewed_at: 2026-04-05T21:30:00Z
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md]
---

# Cross-AI Plan Review — Phase 2

## Gemini Review

### Summary
The implementation plan for Phase 2 is technically sound, security-conscious, and well-aligned with the project's "Vanilla TS + Supabase" constraints. The strategy for handling GitHub Pages' limitations (hash-based routing and implicit flow) is proactive, and the inclusion of a build-time guard to prevent service-key leakage demonstrates a high level of engineering rigor. The modular approach to state-gating via `onAuthStateChange` is the correct architectural choice for a vanilla application.

### Strengths
- Security Guardrails: The custom Vite plugin to block `VITE_`-prefixed service keys is an excellent "fail-safe" for a public GitHub Pages deployment.
- Mobile-First UX: Maintaining the "two-tap sign-out" pattern with a 3-second timeout ensures consistency with Phase 1 interactions.
- Finnish Localization: Finnish copy integrated directly into render functions from the start.
- Implicit Flow Awareness: Correctly identifying the need for `detectSessionInUrl: true` for GitHub Pages.
- Explicit Signup Prevention: `shouldCreateUser: false` is critical for invite-only model.

### Concerns
- **MEDIUM: Offline Data Persistence** — `persistSession` is covered, but team data isn't cached. If a coach opens the app with no connectivity, `fetchTeams` fails → stuck on loading screen.
- **MEDIUM: RLS Scope Gap** — Plan 02-03 focuses on `profiles` RLS, but the roadmap requires club-scoped data for all entities. Core table RLS (teams, rotations, stats) not covered in this migration.
- **LOW: Brittle UI Restoration** — "Scoring HTML captured and restored" via innerHTML can break event listeners or DOM element references. Safer to re-run the rendering function.
- **LOW: Initial Session Race Condition** — Possible UI "flicker" of login screen before session is detected from localStorage.

### Suggestions
- Implement local caching for teams in localStorage to satisfy the "under 2 seconds" rule
- Expand RLS migration to include club isolation policies for all tables
- Use declarative rendering (clean function call) instead of HTML capture/restore
- Introduce `sessionInitialized` boolean to prevent screen flicker
- Shorten "Lähetä kirjautumislinkki" button text for small mobile screens

### Risk Assessment: LOW
Plans are highly detailed and address the most significant technical hurdles. Offline team caching and RLS scope are the remaining gaps.

---

## Claude Review

### Plan 02-01: Supabase Client + Auth Infrastructure

**Summary:** Solid, focused infrastructure plan. Creates the minimal viable backend layer. Code samples are complete and directly executable. TDD approach with vitest mocks is appropriate.

**Strengths:**
- Correct implicit flow choice for GitHub Pages
- `shouldCreateUser: false` prevents open signups
- Build-time service key guard — simple, elegant, fails loudly
- Clean module boundaries (supabase.ts, auth.ts, teams.ts)
- Tests mock at the right boundary
- `fetchTeams()` returns `[]` on error — defensive

**Concerns:**
- **HIGH:** `fetchUserProfile()` does `getSession()` internally — redundant round-trip, couples data fetch to auth state. Should accept `userId: string` parameter.
- **MEDIUM:** No rate limiting or cooldown on initial login screen `sendMagicLink` — only the link-sent screen has the 60s cooldown.
- **MEDIUM:** `redirectUrl` fallback doesn't validate for typos or empty string edge cases.
- **LOW:** `TeamRow` and `UserProfile` defined in teams.ts, not types.ts — minor inconsistency.
- **LOW:** No build-time check for missing required env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

**Risk: LOW**

### Plan 02-02: Auth UI Screens + State Gate

**Summary:** Most complex plan in the phase — 6 render functions, auth state gate, scoring HTML capture/restore. Architecture is sound (event-driven state machine) but implementation has fragility risks.

**Strengths:**
- Event-driven auth gate via `onAuthStateChange` is correct
- Finnish copy pre-written reduces ambiguity
- Two-tap sign-out reuses Phase 1 pattern
- `--surface2` backgrounds for visual distinction
- XSS protection via `esc()` on all user content
- Button disabled during API call prevents double-submit

**Concerns:**
- **HIGH:** `captureScoringHtml()`/`restoreScoringHtml()` pattern is brittle — `addEventListener` listeners lost, dynamic DOM state lost, snapshot may be stale. Should use show/hide toggle instead.
- **HIGH:** `selectTeam` uses string interpolation in `onclick` — `esc()` escapes HTML entities but not JS string delimiters. Team names with quotes break the handler. Use `data-*` attributes + event delegation.
- **MEDIUM:** No loading state for team fetch — async calls to `fetchTeams()` and `fetchUserProfile()` could show blank screen for 1-2 seconds.
- **MEDIUM:** `renderAuthError()` hardcodes "link expired" but auth errors have other causes. Should accept error message parameter.
- **MEDIUM:** No handling for failed `TOKEN_REFRESHED` — though Supabase emits `SIGNED_OUT` in that case.
- **LOW:** `window.location.hash` check for `#access_token` is fragile if hash format changes.

**Risk: MEDIUM**

### Plan 02-03: Admin RLS + E2E Verification

**Summary:** Minimal and focused. Well-structured RLS policies. `autonomous: false` and human gate are appropriate.

**Strengths:**
- `club_id IS NULL` clause enables onboarding new users
- `WITH CHECK` prevents admin from assigning profiles to other clubs
- `admins_read_club_profiles` is forward-looking for Phase 5 admin panel
- Human verification checkpoint is practical

**Concerns:**
- **LOW:** Multi-admin race condition on unclaimed profiles (edge case for MVP)

**Risk: LOW**

### Overall Phase Risk: MEDIUM
Plans 01 and 03 are solid. Plan 02 has correct architecture but two implementation choices (innerHTML capture and inline onclick string interpolation) create real bug vectors. Fixable during execution.

---

## Consensus Summary

### Agreed Strengths
- **Build-time service key guard** — both reviewers highlight the Vite plugin as excellent security engineering
- **Implicit flow + detectSessionInUrl** — correct architectural choice for GitHub Pages, well-researched
- **shouldCreateUser: false** — critical for invite-only model, correctly identified by both
- **onAuthStateChange event-driven gate** — both agree this is the right pattern for vanilla TS
- **Two-tap sign-out** — consistent with Phase 1 UX pattern, praised by both
- **Finnish copy integration** — reduces ambiguity for executor

### Agreed Concerns
1. **innerHTML capture/restore is brittle** (Gemini: LOW, Claude: HIGH) — Both reviewers flag the `captureScoringHtml()`/`restoreScoringHtml()` pattern as fragile. Event listeners, dynamic DOM state, and scroll positions are lost. **Recommendation: Use show/hide toggle on separate containers instead.**

2. **Offline team data not cached** (Gemini: MEDIUM, Claude: implicit in fetchTeams concern) — If connectivity drops after login, `fetchTeams()` fails and user is stuck. **Recommendation: Cache team list in localStorage after first successful fetch.**

3. **Initial session timing / screen flicker** (Gemini: LOW, Claude: LOW in hash check) — Both note the potential for brief UI flicker before auth state resolves.

### Divergent Views
- **RLS scope gap**: Gemini flags that Phase 2 doesn't include RLS policies for all tables (teams, matches, etc.). Claude doesn't raise this — likely because Phase 1 schema already includes these policies (verified in migration SQL). Gemini's concern appears to be a misread; Phase 1 RLS is already comprehensive.

- **Inline onclick XSS risk**: Claude flags this as HIGH (team names with quotes break the JS string). Gemini doesn't mention it. Claude's concern is valid — `esc()` doesn't escape JS string context, only HTML entities. This should be addressed.

- **fetchUserProfile coupling**: Only Claude flags the redundant `getSession()` call inside `fetchUserProfile()`. Valid architectural refinement but not a blocker.

### Priority Fixes Before Execution
1. Replace innerHTML capture/restore with show/hide containers (both reviewers)
2. Use data-* attributes + event delegation instead of inline onclick (Claude HIGH)
3. Add loading state in renderTeamSelect during async fetches (Claude MEDIUM)
4. Accept userId parameter in fetchUserProfile (Claude HIGH)
