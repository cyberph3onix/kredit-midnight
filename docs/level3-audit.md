# Level 3 Audit — Kredit Protocol

**Date:** 2026-09-19
**Repo:** https://github.com/rue19/kredit-midnight
**Commits:** 21 | **Branch:** main

---

## A. Toolchain Audit

### Supported Versions (Midnight Compatibility Matrix, Sep 2026)

Both Preview and Preprod networks support identical versions:

| Component | Repo Pinned | Network Supported | Status |
|---|---|---|---|
| Compact compiler (`compact compile`) | 0.25.0 | **0.31.1** | OUTDATED |
| Compact language (pragma) | 0.23.0 | 0.23.0 | OK |
| Compact devtools | unversioned | 0.5.1 | UNPINNED |
| Compact JS | 2.5.0 | 2.5.1 | PATCH BEHIND |
| Compact runtime | ^0.16.0 | 0.16.0 | OK |
| Midnight.js | ^4.1.1 | 4.1.1 | OK |
| DApp Connector API | ^4.0.1 | 4.0.1 | OK |
| Wallet SDK | — | 1.2.0 | NOT DIRECTLY USED |
| Proof server Docker | untagged | **8.1.0** | MISSING TAG |
| Indexer (Preprod) | — | 4.3.3-hotfix | NEEDS ENDPOINT |

### Network Endpoints (Preprod)

| Service | URL |
|---|---|
| Node RPC | `https://rpc.preprod.midnight.network` |
| Indexer (GraphQL) | `https://indexer.preprod.midnight.network/api/v4/graphql` |
| Faucet | `https://midnight-tmnight-preprod.nethermind.dev/` |
| Block Explorer | `https://preprod.midnightexplorer.com/` |

### Breaking Changes (0.25.0 → 0.31.1)

- **v0.29.0**: `NativePointX`/`NativePointY` renamed to `nativePointX`/`nativePointY` — NOT USED by this contract
- **v0.30.0**: `NativePoint` renamed to `JubjubPoint` — NOT USED by this contract
- **v0.30.0**: New search order for included files — may affect relative imports
- **v0.31.0**: `convertBytesToUint` maxval changed from `number` to `bigint` — NOT USED by this contract

**Assessment:** No breaking changes affect this contract. Migration is safe.

---

## B. Privacy Audit

### CRITICAL: Server-Side Private State Routes

**`/api/call/route.ts`** (lines 14-24, 34-40):
- Accepts `privateState` containing `adminSecretKey`, `issuerSecretKey`, `holderSecretKey`, `score`, `salt` in POST body
- Reconstructs full `KreditPrivateState` server-side and uses it to call circuits
- **VIOLATION:** Raw score, salt, and all secrets cross a server boundary

**`/api/deploy/route.ts`** (lines 76-82):
- Returns `privateState` with all secrets (`adminSecretKey`, `issuerSecretKey`, `holderSecretKey`, `score`, `salt`) as JSON response
- **VIOLATION:** Secrets returned over network

**Mitigation:** These API routes are **dead code** — the frontend uses `providers.ts` client-side exclusively. No frontend code calls these routes. They must be removed.

### Clean Paths (Client-Side Only)

- `frontend/lib/providers.ts` — `deployKreditContract()` and `findKreditContract()` use wallet providers directly
- All three page components (`issuer/page.tsx`, `user/page.tsx`, `verify/page.tsx`) call `providers.ts` functions
- No `fetch()` calls to `/api/call` or `/api/deploy` from any frontend code
- No `console.log` in frontend TypeScript files
- No analytics or tracking code
- No URL parameters with private data

### localStorage Usage

- `frontend/lib/prover.ts` stores all secrets (score, salt, all keys) in localStorage under `kredit-private-state`
- Acceptable for MVP/demo; must be documented as a known limitation

### Threshold Probing

No mitigation exists. An adversary can binary-search the score by calling `proveEligibility` at different thresholds. Must be documented.

### Holder Linkability

`holderKey = persistentHash(["kredit:holder:", address])` links credentials to specific addresses on-chain. If the address is public, credentials are linkable across proofs.

---

## C. CI + Repo Audit

| Item | Finding |
|---|---|
| CI workflow | `.github/workflows/ci.yml` exists, runs on push/PR to main |
| CI issues | No npm cache, installs compact from `/latest/` URL, no typecheck step, no artifact upload |
| Badge URL | Points to `shrinjalik/kredit-midnight` (WRONG — should be `rue19/kredit-midnight`) |
| Clone URL in README | `shrinjalik/kredit-midnight` (WRONG) |
| Proof server image | `midnightnetwork/proof-server` (no version tag — needs `:8.1.0`) |
| LICENSE file | Missing (README claims MIT) |
| start-services.sh | Hardcoded `/home/shrin/Desktop/kreditmidnight/` paths |
| Vercel config | Missing `installCommand` for monorepo; incorrect `outputDirectory` |

---

## D. Gap Analysis (10 Requirements)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Functional dApp with Midnight privacy | PARTIAL | Contract + frontend work; no deployed contract; API routes violate privacy (but unused) |
| 2 | ≥3 tests passing | **MET** | 8 tests in `contract/test/kredit.test.ts` |
| 3 | CI/CD with passing runs | PARTIAL | Workflow exists; never verified green |
| 4 | Product proposal | MISSING | No `docs/proposal.md` |
| 5 | ≥10 meaningful commits | **MET** | 21 commits |
| 6 | Public repo with complete README | PARTIAL | Wrong URLs, wrong versions, maintenance note, no license |
| 7 | Live demo link | PARTIAL | Vercel URL exists; deployment status unknown; CONTRACT_ADDRESS empty |
| 8 | Screenshot of test output | MISSING | No `screenshots/tests-passing.png` |
| 9 | 1-minute demo video script | MISSING | No `docs/demo-script.md` |
| 10 | README "Privacy model" section | PARTIAL | Exists but incomplete (no residual leakage section) |

---

## Prioritized Fix List

### P0 — Must Fix (Blocks submission)
1. Pin compiler to 0.31.1 (Phase 1)
2. Remove `/api/call` and `/api/deploy` routes (Phase 3a)
3. Fix proof server image tag to `:8.1.0` (Phase 1)
4. Fix README clone URL and badge to `rue19/kredit-midnight` (Phase 5)
5. Add LICENSE file (Phase 5)
6. Reach 14+ passing tests (Phase 2)
7. CI must be green (Phase 4)
8. Write proposal doc (Phase 5)
9. Write demo script (Phase 5)

### P1 — Should Fix (Improves quality)
10. Remove "network maintenance" note from README (Phase 5)
11. Fix start-services.sh hardcoded paths (Phase 1)
12. Fix Vercel config for monorepo (Phase 3d)
13. Add npm cache to CI (Phase 4)
14. Add typecheck step to CI (Phase 4)
15. Add test output screenshot (Human step)

### P2 — Nice to Have
16. Contract: remove unused `issuerId` params
17. Add nullifier replay protection
18. Holder linkability mitigation
19. Threshold probing mitigation
