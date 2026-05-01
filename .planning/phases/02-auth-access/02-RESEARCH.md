# Phase 2: Auth & Access — Research

**Researched:** 2026-04-05
**Domain:** Supabase Auth (magic link / implicit flow), GitHub Pages SPA routing, RLS bootstrap, team-selection UI
**Confidence:** HIGH (core stack verified against installed packages and official docs)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up via invite link sent by admin (magic link email) | `signInWithOtp` + `inviteUserByEmail` via Edge Function — see Auth Patterns section |
| AUTH-02 | User can log in with email magic link or email/password | `signInWithOtp` for magic link; `signInWithPassword` for password — both available in @supabase/supabase-js 2.101.1 |
| AUTH-03 | User session persists across browser refresh | `persistSession: true` (default) writes to localStorage; `INITIAL_SESSION` event restores on reload |
| AUTH-04 | Auth redirect works correctly on GitHub Pages (hash-based routing) | Implicit flow delivers token in URL hash; `detectSessionInUrl: true` (default) auto-exchanges; base path `/lentopallo-v2/` must be registered as redirect URL in Supabase dashboard |
| AUTH-05 | No service role key exposed in client build (anon key only) | `VITE_` prefix exposes to bundle; service role key must NOT have `VITE_` prefix; build-time grep check in `vite.config.ts` |
| ROLE-01 | Three roles: admin, coach, viewer | Already encoded in `profiles.role` CHECK constraint in Phase 1 schema |
| ROLE-02 | User sees only their own club's data after login | Phase 1 RLS policies scope all tables to `club_id` via `profiles` join — verified in migration SQL |
| ROLE-03 | Coach can access multiple teams within their club | `teams` table has `club_id` FK; RLS allows all club members to read all club teams |
| ROLE-04 | Row Level Security enforces club-scoped data isolation in Supabase | Phase 1 RLS already written; Phase 2 must verify it works with a real authenticated session |
| UI-07 | Team selection screen after login | Covered in 02-UI-SPEC.md; render function `renderTeamSelect()` in `render.ts` |
</phase_requirements>

---

## Summary

Phase 2 wires Supabase Auth into the existing Vite + TypeScript app. The app is a static SPA on GitHub Pages — no server, no SSR. This constrains the auth flow to **implicit flow** (tokens arrive in URL hash, Supabase JS client auto-exchanges them via `detectSessionInUrl`). PKCE flow requires a server-side callback route and is out of scope for GitHub Pages.

The Phase 1 schema and RLS policies are already written. Phase 2 must (1) initialize the Supabase client, (2) implement login/session screens, (3) guard the scoring view behind `auth.getSession()`, and (4) add the team-selection screen. A critical **RLS bootstrap pitfall** exists: new users need a `profiles` row with `club_id` before RLS passes — this is partially handled by the Phase 1 `handle_new_user` trigger, but `club_id` is NULL until an admin assigns it, so the app must handle the "authenticated but no club" state gracefully.

Admin invite flow (`AUTH-01`) requires the service_role key, which must never ship in the client bundle. The only viable approach for a static site is a **Supabase Edge Function** that wraps `auth.admin.inviteUserByEmail()`. This is Phase 5 (ADM-03) work, but Phase 2 must not accidentally create a path that would expose the key. For Phase 2, the admin bootstraps their own account manually via Supabase Dashboard; the invite flow is out of scope until Phase 5.

**Primary recommendation:** Use implicit flow with `detectSessionInUrl: true` (default). Initialize one `supabase` singleton in `src/supabase.ts`. Gate all screens behind `onAuthStateChange`. Fetch teams via `supabase.from('teams').select()` after login — RLS ensures club isolation.

---

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Vite + vanilla TypeScript + Supabase JS client (no React/Vue/Svelte)
- **Hosting**: GitHub Pages static output, base path `/lentopallo-v2/`
- **Budget**: Supabase Free tier — no auto-backups, 500MB DB
- **Offline**: Must work without network — scoring path must never await network
- **Mobile**: One-handed courtside use, all interactions under 2 seconds
- **No framework**: Vanilla TS, `const`/`let`, strict mode, no `any` in scoring/stats logic
- **Code conventions**: verb-first function names, `getElementById` exclusively, `esc()` on all user content
- **Phase 2 specific (from 02-UI-SPEC.md)**: Finnish copy, `--surface2` (not `--surface`) on auth screens, `renderAuthScreen()` / `renderTeamSelect()` in `render.ts`, `authState` flag in `main.ts`

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.101.1 (installed) | Auth, database queries, RLS enforcement | Official client; already in package.json |
| TypeScript | 6.0.2 (installed) | Type safety | Phase 1 constraint; strict mode enforced |
| Vite | 8.0.3 (installed) | Build + env variable injection | Phase 1 constraint |
| vitest | 4.1.2 (installed) | Unit tests | Phase 1 infrastructure, jsdom env |

[VERIFIED: npm view + node_modules inspection]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | Auth flows use supabase-js auth module | No additional auth library needed |

**No new dependencies needed for Phase 2.** All auth functionality is in `@supabase/supabase-js` already installed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Implicit flow | PKCE flow | PKCE requires server-side callback route — impossible on GitHub Pages static hosting |
| Edge Function for invite | Expose service_role in client | Service role key bypasses RLS entirely — never acceptable |
| `onAuthStateChange` | Polling `getSession` | Event-driven is correct; polling wastes resources |

---

## Architecture Patterns

### Recommended Project Structure (additions to Phase 1)

```
src/
├── supabase.ts       # Singleton createClient — import everywhere
├── auth.ts           # signInWithOtp, signOut, getSession helpers
├── teams.ts          # fetchTeams() — queries teams table via RLS
├── main.ts           # authState gate, onAuthStateChange listener (extend existing)
├── render.ts         # renderAuthScreen(), renderTeamSelect() (extend existing)
├── types.ts          # Extend with AuthState, TeamRow types
└── style.css         # Add .login-card, .team-card etc. (extend existing)
```

### Pattern 1: Supabase Singleton

**What:** One `createClient` call, imported by all modules. Never instantiate twice.
**When to use:** Always — multiple instances create session conflicts.

```typescript
// src/supabase.ts
// Source: Supabase JS docs + community consensus
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,       // writes session to localStorage
    detectSessionInUrl: true,   // auto-exchanges hash token on redirect
  },
})
```

[VERIFIED: official docs + WebSearch — detectSessionInUrl is the key for implicit flow]

### Pattern 2: Auth State Gate in main.ts

**What:** `onAuthStateChange` drives which screen renders. Single source of truth.
**When to use:** On every page load — replaces the direct `renderAll()` call for unauthenticated users.

```typescript
// src/main.ts (extend existing)
// Source: Supabase onAuthStateChange docs
import { supabase } from './supabase'

type AuthScreen = 'login' | 'loading' | 'team-select' | 'scoring'
let authState: AuthScreen = 'loading'

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') {
    if (session) {
      authState = 'team-select'
      renderTeamSelect()
    } else {
      authState = 'login'
      renderAuthScreen()
    }
  } else if (event === 'SIGNED_IN') {
    authState = 'team-select'
    renderTeamSelect()
  } else if (event === 'SIGNED_OUT') {
    authState = 'login'
    renderAuthScreen()
  }
})
```

[VERIFIED: event types INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED from Supabase docs + community]

### Pattern 3: Magic Link Send

**What:** `signInWithOtp` with `emailRedirectTo` pointing to the GitHub Pages URL.
**When to use:** Login screen CTA.

```typescript
// src/auth.ts
// Source: Supabase passwordless login docs
import { supabase } from './supabase'

export async function sendMagicLink(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,   // only allow pre-invited users
      emailRedirectTo: 'https://[USERNAME].github.io/lentopallo-v2/',
    },
  })
  return { error }
}
```

[VERIFIED: signInWithOtp API from official docs; shouldCreateUser: false from docs]

### Pattern 4: Team Fetch (RLS-scoped)

**What:** `supabase.from('teams').select()` — RLS automatically filters to the user's club.
**When to use:** After login, for team-selection screen.

```typescript
// src/teams.ts
import { supabase } from './supabase'

export interface TeamRow {
  id: string
  name: string
  season: string | null
}

export async function fetchTeams(): Promise<TeamRow[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, season')
    .order('name')
  if (error) return []
  return data ?? []
}
```

[VERIFIED: Supabase JS select() API; RLS policy in Phase 1 migration SQL ensures club scoping]

### Pattern 5: Build-Time Service Role Key Check

**What:** Vite plugin that aborts build if `VITE_SERVICE_ROLE` or `service_role` appears in any env var name prefixed with `VITE_`.
**When to use:** In `vite.config.ts` — prevents AUTH-05 / SEC-02 violation.

```typescript
// vite.config.ts (extend existing)
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/lentopallo-v2/',
  plugins: [
    {
      name: 'no-service-role-in-bundle',
      buildStart() {
        const forbidden = Object.keys(process.env).filter(
          k => k.startsWith('VITE_') && k.toLowerCase().includes('service')
        )
        if (forbidden.length > 0) {
          throw new Error(`Service role key must NOT be prefixed with VITE_: ${forbidden.join(', ')}`)
        }
      },
    },
  ],
})
```

[ASSUMED: Vite plugin hook `buildStart` is appropriate; pattern derived from Vite docs on env and plugins]

### Anti-Patterns to Avoid

- **PKCE flow on GitHub Pages**: requires `/auth/confirm` server endpoint — static hosting cannot serve it
- **Multiple `createClient` calls**: causes session conflicts; one singleton only
- **`getUser()` on every render**: expensive server round-trip; use `getSession()` for UI gating, `getUser()` only for server-validated operations
- **Service role key with `VITE_` prefix**: exposes to browser bundle, bypasses all RLS
- **Calling `supabase.auth.admin.*` from client**: admin API requires service_role key — must go through Edge Function
- **Using `--surface` on auth screens**: amber-tinted court context; use `--surface2` per UI-SPEC

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom localStorage session store | `persistSession: true` (default in createClient) | Handles token refresh, expiry, storage key namespacing |
| Token exchange from URL hash | Parse `window.location.hash` manually | `detectSessionInUrl: true` (default) | Client library handles PKCE code verifier, hash extraction, race conditions |
| Auto token refresh | `setInterval` to refresh JWT | `autoRefreshToken: true` (default) | Handles refresh timing, retry on failure, tab visibility |
| Sign-out | Delete localStorage manually | `supabase.auth.signOut()` | Cleans up all storage keys, fires SIGNED_OUT event |
| Email validation | Regex | HTML `type="email"` + check for `@` before calling API | Browser validation is sufficient; Supabase rejects invalid emails anyway |

---

## Common Pitfalls

### Pitfall 1: Redirect URL Not Registered in Supabase Dashboard

**What goes wrong:** Magic link email sends user to GitHub Pages URL, but Supabase blocks the redirect with "Redirect URL is not allowed" error.
**Why it happens:** Supabase requires all allowed redirect URLs to be whitelisted in Auth > URL Configuration > Redirect URLs.
**How to avoid:** Register `https://[username].github.io/lentopallo-v2/` (exact) AND `http://localhost:5173/` (dev) in Supabase Dashboard before testing.
**Warning signs:** Magic link sends successfully but browser shows error page after click.

### Pitfall 2: New User Has NULL club_id — RLS Blocks All Queries

**What goes wrong:** User signs in for the first time. The `handle_new_user` trigger creates a `profiles` row, but `club_id` is NULL. Every `teams`, `players`, `matches` query returns empty (RLS evaluates to false, returns 0 rows silently — not an error).
**Why it happens:** The RLS policies use `SELECT club_id FROM profiles WHERE id = auth.uid()` — if club_id is NULL, the IN clause matches nothing.
**How to avoid:** After login, always check `profiles.club_id !== null` before fetching teams. If NULL, show "Waiting for admin to assign your club" state instead of empty team list.
**Warning signs:** `fetchTeams()` returns `[]` even though teams exist in the database.

[ASSUMED: NULL club_id causes silent empty results not an error — consistent with Postgres RLS behavior, not directly verified in session]

### Pitfall 3: Hash Fragment Vanishes on GitHub Pages 404

**What goes wrong:** User clicks magic link → GitHub Pages serves 404 for any path that isn't `/lentopallo-v2/index.html` → hash fragment `#access_token=...` is lost → user is stuck on 404 page.
**Why it happens:** GitHub Pages does not support SPA fallback routing. The redirect URL must point exactly to `https://[username].github.io/lentopallo-v2/` (with trailing slash, no sub-path) so it loads `index.html` directly.
**How to avoid:** `emailRedirectTo` must be the exact root URL that serves `index.html`. Never use a sub-path like `/auth/callback`.
**Warning signs:** Magic link redirect shows GitHub 404 page.

### Pitfall 4: `INITIAL_SESSION` Fires Before DOM is Ready

**What goes wrong:** `onAuthStateChange` fires synchronously or near-synchronously on page load before `DOMContentLoaded`, causing `getElementById` calls in render functions to return null.
**Why it happens:** Supabase client reads localStorage synchronously during `createClient` and fires `INITIAL_SESSION` very quickly.
**How to avoid:** Initialize Supabase client and set up `onAuthStateChange` inside `DOMContentLoaded` handler, or ensure all render functions check element existence.
**Warning signs:** `TypeError: Cannot set properties of null` in render functions on page load.

### Pitfall 5: Theme Token `--surface` on Auth Screens

**What goes wrong:** Login card uses `--surface` (amber/hunaja court background) instead of `--surface2` — auth screens look like the court, breaking visual separation.
**Why it happens:** Copy-paste from scoring UI.
**How to avoid:** Per 02-UI-SPEC.md: auth screens use `--surface2` (`#f5f5f7`), never `--surface`.

### Pitfall 6: Sign-Out Confirmation Pattern Drift

**What goes wrong:** Sign-out executes on single tap instead of two-tap confirmation pattern.
**Why it happens:** Forgetting to implement `confirmingSignOut` boolean flag matching Phase 1 `confirmingClear` / `confirmingNewGame` pattern.
**How to avoid:** Match Phase 1 pattern exactly: boolean flag + `setTimeout(3000)` reset + red text on first tap.

---

## Code Examples

### Initialize Client and Check Session on Load

```typescript
// Source: Supabase implicit flow docs + Phase 1 main.ts pattern
import { supabase } from './supabase'

document.addEventListener('DOMContentLoaded', () => {
  supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case 'INITIAL_SESSION':
        session ? showTeamSelect() : showLogin()
        break
      case 'SIGNED_IN':
        showTeamSelect()
        break
      case 'SIGNED_OUT':
        showLogin()
        break
    }
  })
})
```

### Send Magic Link

```typescript
// Source: Supabase signInWithOtp docs
const { error } = await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    shouldCreateUser: false,
    emailRedirectTo: import.meta.env.VITE_REDIRECT_URL,
  },
})
```

### Sign Out with Two-Tap Confirmation

```typescript
// Source: Phase 1 confirmingNewGame pattern
let confirmingSignOut = false
let signOutTimeout: ReturnType<typeof setTimeout> | null = null

function handleSignOut() {
  if (!confirmingSignOut) {
    confirmingSignOut = true
    renderSignOutButton()  // renders "Vahvista uloskirjautuminen" in --red
    signOutTimeout = setTimeout(() => {
      confirmingSignOut = false
      renderSignOutButton()
    }, 3000)
  } else {
    if (signOutTimeout) clearTimeout(signOutTimeout)
    confirmingSignOut = false
    supabase.auth.signOut()
  }
}
```

### Fetch Teams (RLS-scoped)

```typescript
// Source: Supabase JS select() docs
const { data: teams, error } = await supabase
  .from('teams')
  .select('id, name, season')
  .order('name')
```

### Check for Null club_id Before Rendering Teams

```typescript
// Source: Phase 1 schema — profiles.club_id is nullable
const { data: profile } = await supabase
  .from('profiles')
  .select('club_id, role')
  .single()

if (!profile?.club_id) {
  renderNoClubState()  // "Odota järjestelmänvalvojan hyväksyntää"
  return
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase.auth.session()` | `supabase.auth.getSession()` | v2.0 (2022) | Old method removed; getSession is current |
| `supabase.auth.user()` | `supabase.auth.getUser()` | v2.0 (2022) | getUser makes server round-trip; getSession reads localStorage |
| `supabase.auth.signIn()` | `supabase.auth.signInWithOtp()` | v2.0 (2022) | Explicit method names per auth type |
| PKCE flow for all SPAs | Implicit flow for static/hash-based SPAs | 2023 | PKCE requires server callback; implicit is correct for GitHub Pages |

**Deprecated/outdated:**
- `supabase.auth.session()` — removed in v2; use `getSession()`
- `supabase.auth.user()` — removed in v2; use `getUser()` (server-validated) or `getSession().data.session?.user` (local)
- `supabase.auth.signIn({ email, password })` — removed in v2; use `signInWithPassword` or `signInWithOtp`

[VERIFIED: @supabase/supabase-js 2.101.1 installed; v2 API confirmed]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Build-time check via Vite `buildStart` plugin hook blocks service_role key from bundle | Architecture Patterns #5 | Security risk if hook doesn't fire or is bypassable — verify hook timing |
| A2 | NULL `club_id` in profiles causes RLS to return empty results silently (not an error) | Pitfall 2 | If it throws an error instead, error handling differs slightly — low risk |
| A3 | `emailRedirectTo` must use trailing slash `https://[user].github.io/lentopallo-v2/` | Pitfall 3 | If trailing slash not required, no functional impact |
| A4 | `VITE_REDIRECT_URL` should be added to `.env.example` for configurable redirect | Code Examples | If hardcoded instead, environment switching (dev/prod) is manual |

---

## Open Questions (RESOLVED)

1. **Has the Supabase project been created? Is the schema applied?** — RESOLVED: Plan 01 and 03 user_setup sections require `.env.local` with live credentials and schema migration applied before execution.

2. **How does the first admin account get created?** — RESOLVED: Plan 03 user_setup includes manual step: create first admin user via Supabase Dashboard > Authentication > Users, then set `profiles.role = 'admin'` and `profiles.club_id` via SQL Editor.

3. **What GitHub username/repo slug is the app deployed to?** — RESOLVED: Repo is `lentopallo-v2`, base path `/lentopallo-v2/`. Plan user_setup includes registering redirect URL in Supabase Dashboard.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @supabase/supabase-js | All auth operations | ✓ | 2.101.1 | — |
| Vite | Build + env injection | ✓ | 8.0.3 | — |
| Node.js | npm run dev/build | ✓ | (implicit from npm working) | — |
| Supabase project (remote) | Auth flows, RLS queries | ? | unknown | Cannot test auth without live project |
| `.env.local` with real keys | Runtime auth | ✗ (only .env.example) | — | Manual setup required before testing |

**Missing dependencies with no fallback:**
- Live Supabase project credentials in `.env.local` — auth cannot be tested without this; Wave 0 must include setup verification

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` (jsdom environment) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-03 | Session persists across reload (INITIAL_SESSION with stored session) | unit (mock supabase) | `npm test -- auth` | ❌ Wave 0 |
| AUTH-04 | Hash token detected and exchanged (`detectSessionInUrl`) | manual | manual browser test | — |
| AUTH-05 | Service role key not in Vite bundle | build check | `npm run build` (plugin throws) | ❌ Wave 0 |
| ROLE-02 | Club-scoped RLS returns only own club's teams | manual (2 users) | manual Supabase SQL | — |
| ROLE-04 | RLS enforced end-to-end | integration | manual (deferred to Phase 4 SEC-05) | — |
| UI-07 | Team selection screen renders teams from Supabase | unit (mock fetch) | `npm test -- teams` | ❌ Wave 0 |

AUTH-04, ROLE-02, ROLE-04 are manual-only: they require a live Supabase project and real user sessions.

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual browser smoke test of magic link flow before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/auth.test.ts` — unit tests for `sendMagicLink` (mock supabase client), session state logic
- [ ] `src/teams.test.ts` — unit tests for `fetchTeams` with mock supabase response
- [ ] Supabase mock pattern: `vi.mock('./supabase', () => ({ supabase: { auth: {...}, from: {...} } }))`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth magic link / signInWithOtp |
| V3 Session Management | yes | supabase-js persistSession + autoRefreshToken; localStorage storage |
| V4 Access Control | yes | Supabase RLS on all tables (Phase 1 policies); `profiles.role` CHECK constraint |
| V5 Input Validation | yes | `esc()` on all user content; email format validation before API call |
| V6 Cryptography | no | No custom crypto; Supabase handles JWT signing |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service role key in client bundle | Information Disclosure | Never prefix with `VITE_`; build-time check in vite.config.ts |
| RLS bypass via NULL club_id | Elevation of Privilege | App checks `profile.club_id` before queries; RLS returns 0 rows for NULL anyway |
| Replay of magic link | Repudiation | Supabase magic links are one-time use by design |
| XSS via user email in DOM | Tampering | Email display must go through `esc()` from utils.ts |
| Session fixation | Spoofing | `supabase.auth.signOut()` clears all session data; two-tap confirmation prevents accidental sign-out |
| Open redirect via emailRedirectTo | Spoofing | Supabase enforces allowlist; register exact URL in Dashboard |

---

## Sources

### Primary (HIGH confidence)
- `node_modules/@supabase/supabase-js/package.json` — version 2.101.1 verified installed
- `/supabase/migrations/20260404_001_initial_schema.sql` — Phase 1 RLS policies verified
- `/src/main.ts`, `/src/types.ts` — Phase 1 TypeScript patterns verified
- `02-UI-SPEC.md` — UI design contract for auth screens
- [Supabase passwordless login docs](https://supabase.com/docs/guides/auth/passwordless-login/auth-magic-link) — signInWithOtp API
- [Supabase implicit flow docs](https://supabase.com/docs/guides/auth/sessions/implicit-flow) — hash fragment token delivery

### Secondary (MEDIUM confidence)
- [Supabase onAuthStateChange discussion](https://github.com/orgs/supabase/discussions/3031) — event types confirmed: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY
- [Supabase inviteUserByEmail docs](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — admin API, requires service_role
- [Edge Function invite pattern](https://blog.mansueli.com/allowing-users-to-invite-others-with-supabase-edge-functions) — workaround for client-side invite

### Tertiary (LOW confidence)
- WebSearch: `getSession` vs `getUser` security difference — confirmed `getSession` reads localStorage, `getUser` validates with server
- WebSearch: `detectSessionInUrl` behavior with hash fragments for static SPAs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed packages verified against npm registry and node_modules
- Auth API: HIGH — signInWithOtp, onAuthStateChange, implicit flow verified via official docs
- Architecture: HIGH — patterns derived from Phase 1 codebase + official docs
- Pitfalls: MEDIUM — redirect URL pitfall and NULL club_id pitfall are well-known patterns; INITIAL_SESSION timing is ASSUMED
- RLS: HIGH — Phase 1 SQL migration verified in codebase

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (Supabase JS API is stable; implicit flow behavior unlikely to change)
