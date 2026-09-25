# Submission Checklist — Kredit Protocol

**Level 3: Confidential Credential & Eligibility Protocol**
**Repo:** https://github.com/rue19/kredit-midnight
**Verified:** 2026-09-25

Every PASS below was re-checked against the live repo, the live CI, the live
deployment, and the Midnight Preprod indexer on the date above — not carried
over from an earlier status pass. Where a claim could not be verified from the
repository or the public network, it is marked as such rather than checked off.

---

## Requirements

| # | Requirement | Status | How it was verified |
|---|---|---|---|
| 1 | Functional dApp using Midnight's privacy model | PASS | Contract deployed on Preprod (row 11); frontend deployed and serving `/`, `/issuer`, `/user`, `/verify`; private state is built and held client-side in the browser and never crosses a network boundary. |
| 2 | ≥3 tests passing | PASS | `npm test` → `Test Files 1 passed (1)`, `Tests 15 passed (15)`, exit code 0. Terminal capture embedded in the README (`screenshots/tests-passing.png`). |
| 3 | CI/CD with passing runs | PASS | Workflow at `.github/workflows/ci.yml` runs on every push/PR to `main`. Run on `main`: [`36177151325`](https://github.com/rue19/kredit-midnight/actions/runs/36177151325) — **success**, all steps green (compile contract → build contract → typecheck → privacy check → tests → build API → build frontend). Every push since the step-ordering fix is green: `36176044750`, `36176713796`, `36176771261`, `36177151325`. |
| 4 | Product proposal | PASS | `docs/proposal.md` — Eligibility Gate via Selective Disclosure. |
| 5 | ≥10 meaningful commits | PASS | 54 commits on `main`. Conventional-commit history across fix/test/docs/chore. |
| 6 | Public repo with complete README | PASS | Repo is public (`private: false`), MIT licensed, default branch `main`. README covers architecture, privacy model, contract/circuit surface, quick start, wallet setup, troubleshooting, and submission checklist. |
| 7 | Live demo link | PASS | `https://kredit-midnight-frontend.vercel.app` — unauthenticated `GET` returns **200** with zero redirects and serves the app (`<title>Kredit Protocol</title>`); `/issuer`, `/user`, `/verify` all return 200. No Vercel login wall. The deployment also has `NEXT_PUBLIC_CONTRACT_ADDRESS` set: the contract ID is present in the client bundles for all three pages. |
| 8 | Screenshot of test output | PASS | `screenshots/tests-passing.png` — terminal capture of `npm test -- --reporter=verbose` showing all 15 test names and `15 passed (15)`. Embedded in the README's Test Suite section. |
| 9 | Demo video | PASS | Walkthrough linked in the README: https://youtu.be/u_vi6gyc3AA — publicly viewable (unauthenticated 200, oEmbed resolves, title "kredit midnight demo"). Shot-by-shot script in `docs/demo-script.md`. |
| 10 | README "Privacy model" section | PASS | Three-part section: what an observer **can** learn, what they **cannot** learn, and known limitations (holder linkability, threshold probing, issuer visibility, client-side storage). Deeper treatment in `docs/privacy-model.md`. |

## Additional Level 3 requirements

| # | Requirement | Status | How it was verified |
|---|---|---|---|
| 11 | Contract **verifiable** on-chain | PASS | Contract ID `d7016be7…e39bed` queried against the public Preprod indexer (`https://indexer.preprod.midnight.network/api/v4/graphql`). Returns deploy transaction id `624845`, hash `ec1e9bc5388bd187638f69c09d01106a7dd4df9349c6be8e7eba372bc85d214a`, block `2692270`, deployed 2026-09-24 17:34:54 UTC. All 7 circuit names are recoverable from the returned on-chain state (15,506 bytes), so the address is the Kredit contract and not an empty deployment. Copy-paste `curl` in the README; capture in `screenshots/contract-verified.png`. |
| 12 | Successful compile listing circuits | PASS | `npm run compact` → `Compiling 7 circuits:` with Compact compiler 0.31.1 / language 0.23.0 / runtime 0.16.0, generating 7 prover + 7 verifier keypairs. Terminal capture in `screenshots/compile-output.png`, embedded in the README's Contract Details section. |

---

## Not verifiable from the repository

| Item | Note |
|---|---|
| Idea sourced from the program's provided idea list and approved | `docs/proposal.md` is self-authored. Nothing in the repo — and nothing queryable on the public Preprod network — can show whether the idea was drawn from the program's list or approved by the program. This has to be confirmed with the program directly. It is not an engineering item. |

---

## Known limitations (documented, not defects)

| Limitation | Where documented |
|---|---|
| Domain-separated holder keys allow linking multiple proof requests to one holder | README → Privacy Model → Known Limitations |
| A verifier can binary-search the raw score by probing thresholds | README → Privacy Model → Known Limitations |
| The issuing institution observes the raw score at issuance time | README → Privacy Model → Known Limitations |
| `localStorage` holds secrets in plaintext, so XSS would expose them | README → Privacy Model → Known Limitations |

---

## Reproducing the verification

```bash
git clone https://github.com/rue19/kredit-midnight.git
cd kredit-midnight
npm install
npm run compact     # Compiling 7 circuits
npm test            # Tests  15 passed (15)
```

Live deployment and on-chain contract: see the README's *Live Demo* and
*Deployed Contract* sections.
