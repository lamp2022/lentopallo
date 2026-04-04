---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` (or via `vite.config.ts` test block) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npx vitest run`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green + manual visual check + GH Actions green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | MIG-01 | — | N/A | build | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | MIG-03 | — | N/A | unit | `npx vitest run src/scoring.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | MIG-03 | — | N/A | unit | `npx vitest run src/utils.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | MIG-02 | — | N/A | manual | Visual comparison screenshot | N/A — manual | ⬜ pending |
| 1-03-01 | 03 | 2 | MIG-04 | — | N/A | CI | Push to main → Actions tab | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 1 | DB-03 | — | CHECK constraints reject bad data | manual SQL | Supabase Dashboard SQL editor | N/A — manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/scoring.test.ts` — stubs for MIG-03 (recalcScores, calcStreaks)
- [ ] `src/utils.test.ts` — stubs for MIG-03 (esc function)
- [ ] Vitest installed via `npm install -D vitest`
- [ ] `tsconfig.json` with strict mode for MIG-01

*Wave 0 tasks will be included in the first plan.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual pixel-perfect match | MIG-02 | Requires human visual comparison | Open old index.html and new app side-by-side, compare all views |
| CHECK constraints reject bad data | DB-03 | Requires Supabase dashboard SQL | INSERT row with out-of-range value, verify rejection |
| RLS policies block cross-club access | DB-04 | Requires Supabase auth context | Sign in as user A, attempt to read club B data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
