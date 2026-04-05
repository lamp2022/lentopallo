---
phase: 02-auth-access
verified: 2026-04-05T13:49:00Z
status: human_needed
score: 4/5 roadmap success criteria verified
re_verification: false
human_verification:
  - test: "Admin invite flow: admin receives invite link, clicks it, gains access to their club — no other club's data is visible"
    expected: "Admin lands on team selection screen showing only their club's teams; zero cross-club data leakage"
    why_human: "Requires live Supabase project with two clubs, two real users, and actual email delivery — cannot verify RLS isolation programmatically without a running backend"
  - test: "Magic link redirect lands on correct GitHub Pages production URL"
    expected: "Clicking magic link redirects to https://[username].github.io/lentopallo/ (production base path)"
    why_human: "Requires actual email delivery and GitHub Pages deployment; also flagging a base path mismatch that needs human resolution (see Gaps Summary)"
---

# Phase 2: Auth & Access Verification Report

**Phase Goal:** Users can authenticate via magic link, see only their club's data, and select a team before scoring
**Verified:** 2026-04-05T13:49:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin receives invite link, clicks it, gains access to their club — no other club's data is visible | ? HUMAN | RLS migration SQL exists and is correct; cannot verify cross-club isolation without two live users |
| 2 | Coach logs in via magic link and session persists across browser refresh | ✓ VERIFIED | `persistSession: true` + `detectSessionInUrl: true` in supabase.ts; `onAuthStateChange(INITIAL_SESSION)` re-enters team-select when session exists |
| 3 | Magic link redirect lands correctly on the GitHub Pages production URL | ? HUMAN | Base path mismatch: `vite.config.ts` uses `/lentopallo/` but `.env.example` uses `lentopallo-v2/`; requires human to confirm production redirect URL is correct |
| 4 | No Supabase service role key appears anywhere in the built client bundle | ✓ VERIFIED | Build guard plugin `no-service-role-in-bundle` in vite.config.ts confirmed to throw with SECURITY error when `VITE_SERVICE_ROLE_KEY=test npx vite build` is run |
| 5 | After login, user sees a team selection screen and can enter the scoring view for their team | ✓ VERIFIED | `renderTeamSelect()` exists and is wired to `SIGNED_IN` and `INITIAL_SESSION` events; `selectTeam()` transitions to scoring view; all render functions substantive |

**Score:** 3/5 truths programmatically verified (2 require human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/supabase.ts` | Supabase singleton createClient | ✓ VERIFIED | Exports `supabase`; `persistSession: true`, `detectSessionInUrl: true`, `autoRefreshToken: true` |
| `src/auth.ts` | Auth helpers: sendMagicLink, signOut, getSession | ✓ VERIFIED | All three functions exported; `shouldCreateUser: false` confirmed |
| `src/teams.ts` | Team fetch via RLS-scoped query | ✓ VERIFIED | `fetchTeams()` and `fetchUserProfile()` exported; real DB queries via supabase client |
| `src/types.ts` | AuthScreen type, UserProfile interface | ✓ VERIFIED | `AuthScreen` type exported; `UserProfile` exported from teams.ts |
| `vite.config.ts` | Build-time service role key guard | ✓ VERIFIED | Plugin `no-service-role-in-bundle` with `service` substring check; throws Error on violation |
| `src/render.ts` | renderAuthScreen, renderLinkSent, renderAuthLoading, renderAuthError, renderTeamSelect, renderNoClubState | ✓ VERIFIED | All 6 functions exist and are substantive (no placeholders) |
| `src/main.ts` | onAuthStateChange gate driving screen rendering | ✓ VERIFIED | Wired to `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`; inside `DOMContentLoaded` |
| `src/state.ts` | authState, selectedTeamId, userEmail, confirmingSignOut fields | ✓ VERIFIED | All fields present; `AuthScreen` imported from `./types` |
| `style.css` | Login card, team card, auth screen CSS classes | ✓ VERIFIED | `.login-card`, `.team-card`, `.login-input`, `.login-btn`, `.signout-link` all exist with `var(--surface2)` |
| `supabase/migrations/20260405_002_profiles_rls_admin.sql` | Admin RLS policy for profiles | ✓ VERIFIED | `admins_update_club_profiles` and `admins_read_club_profiles` policies; SECURITY DEFINER helpers to avoid recursion |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/auth.ts` | `src/supabase.ts` | `import { supabase }` | ✓ WIRED | Line 1: `import { supabase } from './supabase'` |
| `src/teams.ts` | `src/supabase.ts` | `import { supabase }` | ✓ WIRED | Line 1: `import { supabase } from './supabase'` |
| `src/main.ts` | `src/supabase.ts` | `supabase.auth.onAuthStateChange` | ✓ WIRED | Line 4 import; line 118 usage |
| `src/main.ts` | `src/render.ts` | `onAuthStateChange calls renderAuthScreen/renderTeamSelect` | ✓ WIRED | `renderAuthScreen` (line 128, 139), `renderTeamSelect` (line 124, 134), `renderAuthLoading` (line 115) |
| `src/render.ts` | `src/auth.ts` | `sendMagicLink and signOutUser imports` | ✓ WIRED | Line 8: `import { sendMagicLink, signOutUser } from './auth'`; used in `handleLogin` and `handleSignOut` |
| `src/render.ts` | `src/teams.ts` | `fetchTeams and fetchUserProfile imports` | ✓ WIRED | Line 9: `import { fetchTeams, fetchUserProfile } from './teams'`; used in `renderTeamSelect` |
| `index.html` | auth-container / scoring-container | Show/hide pattern | ✓ WIRED | Both containers present; scoring-container starts `display:none`; toggles on auth state changes |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `renderTeamSelect` | `teams` (TeamRow[]) | `fetchTeams()` → `supabase.from('teams').select('id, name, season').order('name')` | Yes — real DB query | ✓ FLOWING |
| `renderTeamSelect` | `profile` (UserProfile) | `fetchUserProfile(userId)` → `supabase.from('profiles').select(...).eq('id', userId).single()` | Yes — real DB query | ✓ FLOWING |
| `renderTeamSelect` | `state.userEmail` | Set from `session.user.email` in onAuthStateChange handler | Yes — from Supabase session | ✓ FLOWING |
| `renderAuthScreen` | (no dynamic data — form only) | N/A | N/A | ✓ N/A |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All unit tests pass | `npx vitest run` | 20 tests, 4 files — all passing | ✓ PASS |
| TypeScript compiles cleanly | `npx tsc --noEmit` | Zero errors | ✓ PASS |
| Build guard blocks service role key | `VITE_SERVICE_ROLE_KEY=test npx vite build` | SECURITY error thrown, build aborted | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 02-01 | User can sign up via invite link sent by admin (magic link email) | ✓ SATISFIED | `sendMagicLink` with `shouldCreateUser: false`; only pre-invited users authenticate |
| AUTH-02 | 02-01 | User can log in with email magic link | ✓ SATISFIED | `sendMagicLink` → `supabase.auth.signInWithOtp`; `renderAuthScreen` handles email input flow |
| AUTH-03 | 02-01 | User session persists across browser refresh | ✓ SATISFIED | `persistSession: true` in supabase.ts; `INITIAL_SESSION` handler re-renders team-select when session exists |
| AUTH-04 | 02-02 | Auth redirect works correctly on GitHub Pages | ? NEEDS HUMAN | `detectSessionInUrl: true` is in place; but base path mismatch (`/lentopallo/` vs `lentopallo-v2/` in env.example) must be validated with live deployment |
| AUTH-05 | 02-01 | No service role key exposed in client build | ✓ SATISFIED | Build guard plugin confirmed working: SECURITY error on `VITE_SERVICE_ROLE_KEY=test` |
| ROLE-01 | 02-01 | Three roles: admin, coach, viewer | ✓ SATISFIED | `UserProfile.role: 'admin' \| 'coach' \| 'viewer'` typed; profiles table schema enforces this |
| ROLE-02 | 02-02 | User sees only their own club's data after login | ? NEEDS HUMAN | `fetchTeams()` is RLS-scoped; `fetchUserProfile` scoped to `eq('id', userId)`; requires live two-club test to confirm isolation |
| ROLE-03 | 02-02 | Coach can access multiple teams within their club | ✓ SATISFIED | `fetchTeams()` returns all teams for user's club (RLS via profiles.club_id); team selection lists all club teams |
| ROLE-04 | 02-03 | Row Level Security enforces club-scoped data isolation in Supabase | ? NEEDS HUMAN | Migration SQL exists with correct policies and SECURITY DEFINER helpers; requires live Supabase test to confirm enforcement |
| UI-07 | 02-02 | Team selection screen after login | ✓ SATISFIED | `renderTeamSelect()` wired to `SIGNED_IN`/`INITIAL_SESSION`; renders team list with VALITSE JOUKKUE heading and team cards |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `vite.config.ts` | 4 | `base: '/lentopallo/'` differs from `.env.example` `VITE_REDIRECT_URL=.../lentopallo-v2/` | ⚠️ Warning | AUTH-04 redirect URL mismatch could cause magic link to land on wrong path in production |

Note: `placeholder` matches in render.ts (lines 455, 582) are HTML `placeholder=` attributes on input elements — not stub implementations.

### Human Verification Required

#### 1. Cross-club RLS isolation

**Test:** Log in as User A (Club A). Verify teams, profiles, and all data visible belong only to Club A. Log in as User B (Club B). Verify User A's data is invisible.
**Expected:** Zero cross-club data leakage in teams, profiles tables.
**Why human:** Requires two live Supabase accounts in separate clubs; RLS enforcement cannot be verified without real authenticated sessions hitting the database.

#### 2. Magic link redirect on GitHub Pages

**Test:** Click magic link email while production app is live on GitHub Pages. Observe the redirect URL.
**Expected:** App loads at the correct base path and `onAuthStateChange(SIGNED_IN)` fires, transitioning to team-select.
**Why human:** Requires actual email delivery, live GitHub Pages deployment, and browser-level URL hash processing. Also needs human to resolve the base path mismatch: `vite.config.ts` has `base: '/lentopallo/'` but `.env.example` and the plan used `/lentopallo-v2/`. One or both must be corrected and verified.

### Gaps Summary

No hard blockers were found — all artifacts exist, are substantive, and are wired correctly. The phase's programmatically-verifiable goals are achieved.

One warning requires human attention: **base path mismatch** between `vite.config.ts` (`base: '/lentopallo/'`) and `.env.example` (`VITE_REDIRECT_URL=http://localhost:5173/lentopallo-v2/`). If the production Supabase redirect allowlist was configured with `lentopallo-v2` but the build outputs `lentopallo`, magic links will redirect to a 404. This directly affects AUTH-04.

Two success criteria require human verification as they depend on live Supabase infrastructure and real email delivery (SC1: cross-club isolation, SC3: production redirect).

---

_Verified: 2026-04-05T13:49:00Z_
_Verifier: Claude (gsd-verifier)_
