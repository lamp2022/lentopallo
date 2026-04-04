# Requirements: Lentopallo

**Defined:** 2026-04-04
**Core Value:** Courtside rotation tracking must work instantly and offline — if the coach can't score a serve in under 2 seconds during a live match, nothing else matters.

## v1 Requirements

### Migration

- [ ] **MIG-01**: Existing index.html migrated to Vite + vanilla TypeScript project
- [ ] **MIG-02**: All existing functionality preserved (rotation, scoring, roster, event log, localStorage)
- [ ] **MIG-03**: TypeScript strict mode with no `any` types in scoring/stats logic
- [ ] **MIG-04**: GitHub Pages deployment via Vite build output

### Authentication

- [ ] **AUTH-01**: User can sign up via invite link sent by admin (magic link email)
- [ ] **AUTH-02**: User can log in with email magic link or email/password
- [ ] **AUTH-03**: User session persists across browser refresh
- [ ] **AUTH-04**: Auth redirect works correctly on GitHub Pages (hash-based routing)
- [ ] **AUTH-05**: No service role key exposed in client build (anon key only)

### Admin

- [ ] **ADM-01**: Admin can create a club
- [ ] **ADM-02**: Admin can create teams within the club
- [ ] **ADM-03**: Admin can send invite emails to coaches (paste multiple emails, validate before sending, retry broken ones)
- [ ] **ADM-04**: Admin can assign roles (admin, coach) to club members
- [ ] **ADM-05**: Admin can manage club-wide player roster (add, edit, deactivate players)
- [ ] **ADM-06**: Dedicated admin page for user/team/roster management

### Roles & Access

- [ ] **ROLE-01**: Three roles: admin (full access), coach (team management + scoring), viewer (read-only, future)
- [ ] **ROLE-02**: User sees only their own club's data after login
- [ ] **ROLE-03**: Coach can access multiple teams within their club
- [ ] **ROLE-04**: Row Level Security enforces club-scoped data isolation in Supabase

### Players & Teams

- [ ] **TEAM-01**: Players belong to the club roster (not to a single team)
- [ ] **TEAM-02**: Players can be assigned to multiple teams (many-to-many via join table)
- [ ] **TEAM-03**: Jersey number is unique per team assignment (same player can have different numbers on different teams)
- [ ] **TEAM-04**: If two players on the same team have a jersey conflict, system flags it for resolution
- [ ] **TEAM-05**: Coach can assign/remove club players to/from their teams
- [ ] **TEAM-06**: Player list shows which teams each player is assigned to
- [ ] **TEAM-07**: CSV import for bulk player roster upload

### Database

- [ ] **DB-01**: PostgreSQL schema: clubs, teams, players, team_players (join), matches, events, profiles
- [ ] **DB-02**: RLS policies on all tables scoped to club_id
- [ ] **DB-03**: CHECK constraints: jersey number 1-99, set 1-5, delta in (-1, +1)
- [ ] **DB-04**: Indexes on events(match_id), events(player_id), players(club_id), matches(team_id, date)
- [ ] **DB-05**: Supabase Free tier keep-alive (GitHub Actions weekly ping to prevent project pause)

### Match & Scoring

- [ ] **MATCH-01**: Coach can create a match (opponent, date, optional notes)
- [ ] **MATCH-02**: Single scorer per match (no concurrent use)
- [ ] **MATCH-03**: Scoring works identically to current app (position 1 = server, +1/-1 buttons)
- [ ] **MATCH-04**: Court rotation preserved (1->6->5->4->3->2->1 cycle)
- [ ] **MATCH-05**: Event log preserves court_json snapshot on every event
- [ ] **MATCH-06**: Coach can close/finalize a match

### Offline & Sync

- [ ] **SYNC-01**: All scoring operations work without network (offline-first)
- [ ] **SYNC-02**: Mutations queued in IndexedDB (via idb library), not localStorage
- [ ] **SYNC-03**: Queue flushes to Supabase on reconnect (background sync)
- [ ] **SYNC-04**: Conflict resolution: append-only events with client-generated UUIDs, server deduplicates on ID
- [ ] **SYNC-05**: Online/offline status indicator visible to user
- [ ] **SYNC-06**: iOS Safari fallback: navigator.onLine event (no SyncManager API)

### Statistics

- [ ] **STAT-01**: Per-player serve statistics: points per set, per match, per season
- [ ] **STAT-02**: Per-player serve streaks (longest, average, list) with visualization
- [ ] **STAT-03**: Per-player serve efficiency: points / (points + lost)
- [ ] **STAT-04**: Per-team statistics: total serve points, best server per match/season
- [ ] **STAT-05**: Per-set breakdown for team statistics
- [ ] **STAT-06**: Season-scoped statistics (this season vs previous)
- [ ] **STAT-07**: Trend chart: serve points per match over time (uplot, not chart.js)

### UI & UX

- [ ] **UI-01**: Mobile-first design (375px primary), one-handed courtside use
- [ ] **UI-02**: All tap targets >= 48px, critical buttons (scoring, rotate) larger
- [ ] **UI-03**: Court grid visible without scrolling on mobile
- [ ] **UI-04**: Modern, clean visual refresh without sacrificing usability
- [ ] **UI-05**: Works well with big hands on small screens
- [ ] **UI-06**: Two-tap confirmation for all destructive actions
- [ ] **UI-07**: Team selection screen after login

### Internationalization

- [ ] **I18N-01**: Finnish and English language support
- [ ] **I18N-02**: Language toggle in UI
- [ ] **I18N-03**: Custom i18n implementation (30-line string map, no i18next — overkill for 2 languages)

### Security

- [ ] **SEC-01**: XSS protection via esc() on all user-generated content + CSP headers
- [ ] **SEC-02**: No Supabase service role key in client bundle (build-time check)
- [ ] **SEC-03**: Rate limiting via Supabase Edge Functions (max 100 events/min per user)
- [ ] **SEC-04**: Input validation: jersey 1-99, name max 30 chars, set 1-5
- [ ] **SEC-05**: RLS tested with two real users in two different clubs before launch
- [ ] **SEC-06**: Audit log: events table records who, what, when with court snapshot

## v2 Requirements

### Platform

- **PWA-01**: Service worker for app shell caching
- **PWA-02**: Web app manifest with install prompt
- **PWA-03**: SW update flow with user notification

### Viewer Role

- **VIEW-01**: Player/viewer role with read-only statistics access
- **VIEW-02**: Player can view own stats across teams

### Federation

- **FED-01**: Finnish Volleyball Federation roster import (if API exists)
- **FED-02**: Automated season roster sync

### Advanced Stats

- **ASTAT-01**: Per-set efficiency trend across multiple matches
- **ASTAT-02**: Audit log UI (who changed what, browsable)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multi-user scoring | Race conditions on append-only log during live match; single scorer is correct model |
| Push notifications | VAPID key infra, low open rate for sports apps |
| Social login (Google/Apple OAuth) | Clubs use shared emails; magic link works with any address |
| Video uploads | Storage costs blow past Free tier; link external video in notes |
| Rich text match notes | Scope creep into chat/forum territory; plain text sufficient |
| Full scouting stats (dig%, attack%) | Requires per-rally input flow; bloats courtside UI |
| Rotation legality checker | High complexity, many edge cases; coach's responsibility |
| Real-time chat | Not core to rotation tracking |
| Mobile native app | Web-first; PWA covers install-to-home-screen |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIG-01 | TBD | Pending |
| MIG-02 | TBD | Pending |
| MIG-03 | TBD | Pending |
| MIG-04 | TBD | Pending |
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| ADM-01 | TBD | Pending |
| ADM-02 | TBD | Pending |
| ADM-03 | TBD | Pending |
| ADM-04 | TBD | Pending |
| ADM-05 | TBD | Pending |
| ADM-06 | TBD | Pending |
| ROLE-01 | TBD | Pending |
| ROLE-02 | TBD | Pending |
| ROLE-03 | TBD | Pending |
| ROLE-04 | TBD | Pending |
| TEAM-01 | TBD | Pending |
| TEAM-02 | TBD | Pending |
| TEAM-03 | TBD | Pending |
| TEAM-04 | TBD | Pending |
| TEAM-05 | TBD | Pending |
| TEAM-06 | TBD | Pending |
| TEAM-07 | TBD | Pending |
| DB-01 | TBD | Pending |
| DB-02 | TBD | Pending |
| DB-03 | TBD | Pending |
| DB-04 | TBD | Pending |
| DB-05 | TBD | Pending |
| MATCH-01 | TBD | Pending |
| MATCH-02 | TBD | Pending |
| MATCH-03 | TBD | Pending |
| MATCH-04 | TBD | Pending |
| MATCH-05 | TBD | Pending |
| MATCH-06 | TBD | Pending |
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SYNC-04 | TBD | Pending |
| SYNC-05 | TBD | Pending |
| SYNC-06 | TBD | Pending |
| STAT-01 | TBD | Pending |
| STAT-02 | TBD | Pending |
| STAT-03 | TBD | Pending |
| STAT-04 | TBD | Pending |
| STAT-05 | TBD | Pending |
| STAT-06 | TBD | Pending |
| STAT-07 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |
| UI-04 | TBD | Pending |
| UI-05 | TBD | Pending |
| UI-06 | TBD | Pending |
| UI-07 | TBD | Pending |
| I18N-01 | TBD | Pending |
| I18N-02 | TBD | Pending |
| I18N-03 | TBD | Pending |
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| SEC-04 | TBD | Pending |
| SEC-05 | TBD | Pending |
| SEC-06 | TBD | Pending |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 0
- Unmapped: 56

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after initial definition*
