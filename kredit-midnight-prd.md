# Kredit Protocol — PRD
### A Confidential Credential & Eligibility Protocol on Midnight

**Program:** New Moon → Full Moon Monthly Moonshots (RiseIn x Midnight)
**Target levels:** 🌑 Level 1 → 🌒 Level 2 → 🌓 Level 3
**Track (L3):** Confidential Credentials — *prove a credential is valid without disclosing it*

---

## 1. Vision

Most "credit" or "credential" systems on-chain leak the exact thing they're supposed to protect: your score, your income, your identity. Kredit lets a user hold a private numeric or categorical credential — a credit score, a KYC tier, a reputation index — and **prove a claim about it** ("I qualify," "I'm above threshold X," "this credential is valid and unrevoked") **without ever putting the underlying value on-chain.**

This is a direct continuation of prior work: **CRCS** (ZK credential verification, Groth16 + threshold secret sharing) and the **Kredit** concept proposed for Stellar Rise (soulbound credit tokens from off-chain behavioral data). This PRD rebuilds that idea natively in **Compact**, using Midnight's public-ledger / private-witness model instead of a bolted-on ZK layer.

The three moon levels are **not three projects** — they are three checkpoints of one growing repo. Level 3 is the target architecture below; Level 1 and Level 2 are honest subsets of it, not toy detours.

---

## 2. Problem Statement

- Lenders/verifiers need to know "does this person qualify" — not the raw number behind it.
- Existing on-chain credit/reputation systems (including undercollateralized DeFi lending experiments) either (a) put the score fully on-chain (privacy loss) or (b) push all logic off-chain (trust loss).
- Midnight's model — public ledger state + private witnesses + `disclose()` — is purpose-built to resolve exactly this tension, but almost no reference dApp demonstrates the *credential issuance → private proof → revocation* lifecycle end to end.

---

## 3. Ultimate Architecture (Level 3 target)

This is the full system Level 3 must ship. Level 1 builds the bottom layer; Level 2 adds the middle; Level 3 completes the top and hardens all of it.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│  Issuer Console          User Wallet View         Verifier View     │
│  - issue credential      - view own commitment     - request proof  │
│  - revoke credential     - enter private score      - see pass/fail │
│                          - generate proof                           │
└───────────────┬───────────────────────┬──────────────────┬──────────┘
                │                       │                  │
        Midnight.js SDK        DApp Connector API   Midnight.js SDK
                │                       │                  │
                ▼                       ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          LACE WALLET (Preprod)                      │
│        holds keys · signs txs · talks to local Proof Server         │
└───────────────┬───────────────────────────────────────────┬─────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────┐        ┌──────────────────────────────┐
│        PROOF SERVER            │        │        MIDNIGHT NODE          │
│  (local Docker, :6300)         │        │   + INDEXER (Preprod RPC)     │
│  generates/verifies ZK proofs  │◄──────►│  executes circuits, stores    │
│  private inputs never leave    │        │  public ledger state          │
│  this boundary                 │        │                                │
└───────────────┬─────────────────┘        └──────────────┬───────────────┘
                │                                          │
                ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     KREDIT.COMPACT CONTRACT                          │
│                                                                       │
│  PUBLIC LEDGER STATE                    PRIVATE WITNESS              │
│  ├─ credentials: Map<addr, Bytes>        ├─ rawScore: Uint            │
│  │   (commitment hash, not the score)    ├─ issuerSecret (issuer only)│
│  ├─ issuerRegistry: Map<addr, Boolean>   └─ salt: Bytes               │
│  ├─ revoked: Map<addr, Boolean>                                       │
│  ├─ threshold: Uint (per verifier request, set at call time)         │
│  └─ eligibilityLog: Map<addr, Boolean>   ← only pass/fail is written  │
│                                                                       │
│  CIRCUITS                                                            │
│  ├─ issueCredential(subject, commitment)      [issuer-only]           │
│  ├─ revokeCredential(subject)                 [issuer-only]           │
│  ├─ proveEligibility(threshold) → Boolean     [disclose() boundary]   │
│  └─ proveNotRevoked() → Boolean                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Contract layer (Compact)
- **`ledger` state** — everything a block explorer / indexer can see: credential commitments (hashes, not raw values), issuer allowlist, revocation flags, and eligibility results (booleans only).
- **`witness` inputs** — everything that never leaves the user's machine / proof server: the raw score, the salt used in the commitment, the issuer's signing secret.
- **Circuits** — the four entry points above. `proveEligibility` is the core `disclose()` boundary: it takes the private `rawScore` witness and a public `threshold`, and discloses *only* the boolean result of `rawScore >= threshold`.

### 3.2 Issuer model
- An `issuerRegistry` map gates who can call `issueCredential` / `revokeCredential` — this is what makes the credential meaningful (not just "prove any number you typed in").
- Issuance writes a **commitment** (hash of score + salt), never the score.

### 3.3 Off-chain / SDK layer
- `midnight-js` providers for wallet, proof, and indexer.
- DApp Connector API for Lace connect/disconnect + tx signing.
- A local "prover" utility module that builds witness inputs client-side from user-entered private data (score never sent over the network in plaintext).

### 3.4 Frontend
- **Issuer Console** — restricted view for issuing/revoking (can be a simple gated route + issuer key for MVP).
- **User View** — connect Lace, see your own commitment status, enter your private score locally, generate a proof.
- **Verifier View** — anyone (a "lender") can request a threshold check against an address and see only pass/fail + revocation status.

### 3.5 Testing & CI/CD
- Contract-level tests: commitment issuance, correct pass on eligible witness, correct fail on ineligible witness, revoked credential always fails regardless of score.
- App-level test: end-to-end circuit call returns expected ledger mutation.
- GitHub Actions: `compact compile` on push → run test suite → (optionally) lint/build frontend. Badge in README.

### 3.6 Privacy model (what an observer can/cannot learn)

| Can observe | Cannot observe |
|---|---|
| That an address holds *a* credential (commitment exists) | The raw score/value behind the credential |
| Whether an address passed a specific threshold check | Which exact threshold tier the user actually qualifies for beyond the one asked |
| Whether a credential has been revoked | The salt or any data linking the commitment to the raw score without the witness |
| Which address is a registered issuer | The issuer's private signing material |

---

## 4. Feature Matrix by Level

| Feature | L1 (New Moon) | L2 (Crescent) | L3 (First Quarter) |
|---|:---:|:---:|:---:|
| Compact toolchain installed, `compact compile` working | ✅ | ✅ | ✅ |
| `ledger` (commitments map) + `witness` (rawScore) defined | ✅ | ✅ | ✅ |
| Single circuit: `proveEligibility(threshold)` with `disclose()` | ✅ | ✅ | ✅ (hardened) |
| Deployed to Preview/Preprod, address visible | ✅ | ✅ | ✅ |
| `managed/` dir committed (circuits + keys) | ✅ | ✅ | ✅ |
| Frontend (Next.js) calling the circuit | — | ✅ | ✅ |
| Lace connect/disconnect on Preprod | — | ✅ | ✅ |
| Observable privacy behavior in UI (score hidden, bool shown) | — | ✅ | ✅ |
| Issuer role + `issueCredential` / `revokeCredential` | — | — | ✅ |
| Revocation check folded into eligibility proof | — | — | ✅ |
| 3+ passing tests (contract + app) | — | — | ✅ |
| CI/CD (compile + test on every push, badge) | — | — | ✅ |
| Verifier-facing view (third party checks pass/fail) | — | optional | ✅ |
| Live demo deploy (Vercel/Netlify) | — | ✅ | ✅ |
| Demo video | — | ✅ (connect + call) | ✅ (1 min, full flow) |

---

## 5. Repo Structure (target, Level 3)

```
kredit-midnight/
├── README.md
├── .github/workflows/ci.yml
├── contract/
│   ├── src/kredit.compact
│   └── test/kredit.test.ts
├── managed/                  # generated: circuits + keys (do not gitignore)
├── api/                      # shared types, deploy + provider config
├── cli/                      # optional CLI for reading ledger state
├── frontend/
│   ├── app/                  # Next.js
│   │   ├── issuer/
│   │   ├── user/
│   │   └── verify/
│   └── lib/prover.ts         # builds private witness input client-side
└── docs/
    ├── architecture.md       # this PRD, trimmed
    └── privacy-model.md
```

---

## 6. Tech Stack

| Layer | Choice |
|---|---|
| Contract language | Compact (pinned version, e.g. 0.25.x) |
| Proof generation | Local Proof Server (Docker, port 6300) |
| Node/Indexer | Preview/Preprod RPC (Midnight latest stable release) |
| Wallet | Lace (Midnight Preview build), local proof server config |
| SDK | `@midnight-ntwrk/midnight-js-*`, DApp Connector API |
| Frontend | Next.js + TypeScript |
| Tests | Contract unit tests + app-level integration test |
| CI/CD | GitHub Actions |
| Hosting | Vercel or Netlify (frontend only — contract lives on Preprod) |
| Runtime | Node 22+ (some templates require 24.11+ — pin explicitly) |

---

## 7. Milestone Checklists

### Level 1 — New Moon
- [x] Toolchain installed (Compact compiler, proof server, Node 22, Docker)
- [x] `kredit.compact` compiles (`compact compile`), `managed/` generated
- [x] Passing test suite (basic)
- [ ] Deployed to Preview/Preprod, address recorded
- [x] README: public-state vs private-witness explanation
- [x] Initial idea paragraph in README
- [ ] 5+ meaningful commits

### Level 2 — Waxing Crescent
- [ ] Lace connect/disconnect wired via DApp Connector API
- [ ] `proveEligibility` circuit callable from frontend
- [ ] Observable privacy behavior demoed (score hidden, boolean shown)
- [ ] Deployed to Preprod, verifiable address
- [ ] Live demo link
- [ ] Demo video: connect + circuit call
- [ ] 8+ meaningful commits

### Level 3 — First Quarter
- [ ] Issuer role + issuance/revocation circuits added
- [ ] Revocation folded into eligibility proof logic
- [ ] 3+ tests passing (contract + integration), screenshot captured
- [ ] CI/CD workflow file + passing run + badge
- [ ] "Confidential Credentials" idea formally submitted for approval
- [ ] Privacy model section: can/cannot-observe table
- [ ] 1-minute demo video, full functionality
- [ ] 10+ meaningful commits

---

## 8. Open Questions / Next Decisions
- MVP issuer auth: hardcoded issuer address vs. a lightweight admin key rotation circuit?
- Should `proveEligibility` accept an arbitrary caller-supplied threshold, or a small fixed set of tiers (simpler circuit, cleaner privacy story)?
- Revocation: boolean flag (simple) vs. Merkle-based revocation list (more scalable, more complex for L3 scope) — recommend boolean flag for this program, note Merkle as future work.
