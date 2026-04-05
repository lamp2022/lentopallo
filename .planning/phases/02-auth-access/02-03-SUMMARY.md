---
phase: 02-auth-access
plan: "03"
subsystem: supabase-rls
tags: [rls, profiles, admin, migration, sql, security-definer]
dependency_graph:
  requires: ["02-02"]
  provides: ["admin-profile-rls"]
  affects: ["profiles table", "supabase RLS policies"]
tech_stack:
  added: []
  patterns: ["SECURITY DEFINER functions to break RLS recursion", "NULL club_id for onboarding gate"]
key_files:
  created:
    - supabase/migrations/20260405_002_profiles_rls_admin.sql
  modified:
    - src/render.ts
    - style.css
decisions:
  - "SECURITY DEFINER helper functions (get_my_club_id, is_admin) used to break infinite recursion in profiles RLS policies — sub-querying profiles from within profiles policies causes PostgreSQL infinite recursion"
  - "admins_update_club_profiles uses NULL club_id OR clause to allow onboarding new users; WITH CHECK restricts target club_id to admin's own club"
metrics:
  duration: "~45 min (including human verification)"
  completed: "2026-04-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 02 Plan 03: Admin Profile Management RLS Summary

## One-liner

Admin RLS policies with SECURITY DEFINER helpers, verified end-to-end auth flow including magic link, team selection, session persistence, and build guard.

## What Was Built

1. **SECURITY DEFINER helper functions** to avoid infinite recursion:
   - `get_my_club_id()` — returns current user's club_id, bypasses RLS
   - `is_admin()` — checks if current user is admin, bypasses RLS

2. **RLS policies** using the helper functions:
   - `admins_read_club_profiles` — admin can SELECT profiles in their club
   - `admins_update_club_profiles` — admin can UPDATE profiles in club + onboard NULL club_id users

3. **End-to-end verification** (human-verified):
   - Magic link login flow
   - Team selection with RLS-scoped data
   - Session persistence across refresh
   - Two-tap sign-out with 3s timeout
   - Build guard blocks service role key leakage

## Status

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Admin profile management RLS migration | Done | a6abf46, f625070 |
| 2 | Schema push + end-to-end auth verification | Done (human approved) | — |

## Deviations from Plan

- **RLS infinite recursion fix**: Original migration used direct sub-queries on `profiles` table from within `profiles` RLS policies. PostgreSQL detected infinite recursion. Fixed by introducing `SECURITY DEFINER` helper functions that bypass RLS.
- **Finnish typo fix**: "hyväksyintää" → "hyväksyntää" in no-club screen
- **Login button gradient**: Changed from flat `var(--blue)` to rotation button gradient for visual consistency

## Self-Check: PASSED

- Migration SQL exists with SECURITY DEFINER functions: FOUND
- RLS policies avoid infinite recursion: VERIFIED
- Full auth flow verified by human: APPROVED
- Build guard blocks service role key: VERIFIED
- Session persistence across refresh: VERIFIED
- Two-tap sign-out works: VERIFIED
