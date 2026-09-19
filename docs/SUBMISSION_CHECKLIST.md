# Submission Checklist — Kredit Protocol

**Level 3: Half light, half shadow**
**Date:** 2026-09-20
**Repo:** https://github.com/rue19/kredit-midnight

---

## Requirements

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Fully functional dApp using Midnight's privacy model | PARTIAL | Contract deploys, frontend works client-side via providers.ts, wallet integration, private state never leaves browser. **BLOCKER:** No deployed contract on Preprod yet (needs funded wallet). |
| 2 | ≥3 tests passing | **PASS** | 15 tests passing (8 original + 7 new). See `docs/test-output.txt`. |
| 3 | CI/CD with passing runs | **PASS** | GitHub Actions workflow at `.github/workflows/ci.yml`. 2 consecutive green runs (35461275467, 35461576782). |
| 4 | Product proposal | **PASS** | `docs/proposal.md` — Age/Eligibility Gate via Selective Disclosure. |
| 5 | ≥10 meaningful commits | **PASS** | 11 new conventional commits (fix/test/docs/chore). Total repo: 33 commits. |
| 6 | Public repo with complete README | **PASS** | README rewritten with correct URLs, versions, privacy model, architecture, quick start. |
| 7 | Live demo link (Vercel) | PARTIAL | URL exists: https://kreditmidnight.vercel.app — deployment status unverified (needs Vercel env vars). |
| 8 | Screenshot of test output | MISSING | `screenshots/tests-passing.png` not yet created. **Human action needed.** |
| 9 | 1-minute demo video script | **PASS** | `docs/demo-script.md` — 10-shot script with timings and narration. |
| 10 | README "Privacy model" section | **PASS** | Three-part section: CAN learn, CANNOT learn, Known limitations and residual leakage. |

---

## New Commits (11)

```
a9400da docs: rewrite README, add proposal, demo script, LICENSE, privacy model
cc049be fix: build contract package before frontend in CI
5cb6e05 fix: add GH_TOKEN and cache for compact compiler in CI
e1e7653 fix: typecheck only contract and api (skip frontend JSX)
c6c83ad fix: correct repo URLs to rue19/kredit-midnight
69b55bf fix: improve error messages, add privacy panel, remove maintenance note, fix vercel.json
084e485 chore: add CI privacy check and update .env.example with Preprod endpoints
cb18927 fix: remove server-side private state routes (privacy)
bf6151a test: add 7 new tests (15 total) and document disclose() calls
03a9197 chore: update lock file for toolchain migration
cd5eb5f fix: pin compact compiler to 0.31.1 for network compatibility
3cfc785 docs: level 3 audit
```

## CI Runs

| Run | Status | URL |
|---|---|---|
| fix: build contract package before frontend in CI | GREEN | https://github.com/rue19/kredit-midnight/actions/runs/35461275467 |
| docs: rewrite README, add proposal, demo script, LICENSE, privacy model | GREEN | https://github.com/rue19/kredit-midnight/actions/runs/35461576782 |

## Test Output

```
✓ test/kredit.test.ts (15 tests) 333ms
Test Files  1 passed (1)
     Tests  15 passed (15)
```

## Files Added/Modified

| File | Status |
|---|---|
| `docs/level3-audit.md` | NEW |
| `docs/toolchain.md` | NEW |
| `docs/proposal.md` | NEW |
| `docs/demo-script.md` | NEW |
| `docs/test-output.txt` | NEW |
| `docs/privacy-model.md` | UPDATED |
| `LICENSE` | NEW |
| `README.md` | REWRITTEN |
| `.github/workflows/ci.yml` | UPDATED |
| `contract/src/kredit.compact` | UPDATED (comments) |
| `contract/test/kredit.test.ts` | UPDATED (7 new tests) |
| `contract/package.json` | UPDATED (compact-js 2.5.1) |
| `frontend/app/api/call/route.ts` | DELETED (privacy) |
| `frontend/app/api/deploy/route.ts` | DELETED (privacy) |
| `frontend/app/verify/page.tsx` | UPDATED (privacy panel) |
| `frontend/app/issuer/page.tsx` | UPDATED (error msgs) |
| `frontend/app/user/page.tsx` | UPDATED (error msg) |
| `start-services.sh` | UPDATED (paths, image tag) |
| `vercel.json` | UPDATED (installCommand) |
| `.env.example` | UPDATED (Preprod endpoints) |

---

## Remaining Human Actions

1. **Fund Preprod wallet** from faucet and deploy contract → set `CONTRACT_ADDRESS`
2. **Set Vercel env vars** if CLI not authenticated
3. **Take screenshot** of terminal test output → `screenshots/tests-passing.png`
4. **Record 1-minute demo video** using `docs/demo-script.md`
5. **Submit proposal** for approval
