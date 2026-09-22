# Kredit Protocol

**Confidential Credential & Eligibility Protocol on Midnight Network**

[![CI](https://github.com/rue19/kredit-midnight/actions/workflows/ci.yml/badge.svg)](https://github.com/rue19/kredit-midnight/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Live Demo:** [https://kreditmidnight.vercel.app](https://kreditmidnight.vercel.app)

> Prove you qualify for a loan — without revealing your credit score.

---

## What Is Kredit?

Kredit lets a user hold a **private numeric credential** — a credit score, KYC tier, or reputation index — and **prove a claim about it** ("I qualify," "I'm above threshold X," "my credential is valid and unrevoked") **without ever putting the underlying value on-chain.**

An issuer (e.g., a bank) issues a credential commitment on-chain. The user holds their raw score locally in their browser. When a verifier (e.g., a lender) needs to check eligibility, the user generates a ZK proof that their score meets the threshold. The verifier learns only the **boolean result** — never the actual score.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                          │
│  Issuer Console          User View           Verifier View       │
│  - deploy contract       - generate keys     - request proof     │
│  - register issuer       - enter score       - see pass/fail     │
│  - issue/revoke          - generate proof                        │
└──────────────────────┬──────────────┬────────────────────────────┘
                       │              │
               Midnight.js SDK   DApp Connector
                       │              │
                       ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LACE WALLET (Preprod)                         │
│    holds keys · signs txs · generates ZK proofs internally      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 MIDNIGHT NODE + INDEXER                           │
│          executes circuits, stores public ledger state            │
└─────────────────────────────────────────────────────────────────┘
```

### The Flow

1. **Deploy** — Admin deploys the Kredit contract on Midnight Preprod.
2. **Register Issuer** — Admin registers trusted issuers (banks, KYC providers).
3. **Issue Credential** — Issuer issues a credential commitment (`persistentCommit(score, salt)`). The raw score never touches the chain.
4. **User Holds Secrets** — The user's score, salt, and keys are stored locally in the browser.
5. **Generate Proof** — When a verifier requests a check, the user generates a ZK proof that `score >= threshold`. Only the boolean result is disclosed.
6. **Verify** — The verifier sees pass/fail and revocation status — never the actual score.

---

## Privacy Model

### What an Observer CAN Learn

| Observable | Description |
|---|---|
| Credential existence | Whether an address holds a commitment on-chain |
| Pass / fail | The boolean result of a threshold check |
| Revocation status | Whether a credential has been revoked |
| Issuer registry | Which addresses are registered as trusted issuers |

### What an Observer CANNOT Learn

| Protected | Description |
|---|---|
| Raw score | The actual numeric value behind the credential |
| Salt | The random 32-byte salt used in the commitment |
| Issuer key | The issuer's private signing material |
| Holder secret | The holder's domain-separated secret key |
| Admin secret | The admin's private key |

### Known Limitations

| Limitation | Impact |
|---|---|
| Holder linkability | Domain-separated keys allow linking multiple proof requests to the same holder |
| Threshold probing | Adversary can perform binary search to narrow the raw score |
| Issuer knows the raw score | When issuing a credential, the issuer observes the raw score |
| Client-side storage | `localStorage` stores secrets in plaintext — vulnerable to XSS |

---

## Contract Details

### 7 Circuits

| Circuit | Access | Description |
|---|---|---|
| `rotateAdmin(newAdmin)` | Admin | Transfer admin role |
| `registerIssuer(issuerId)` | Admin | Add trusted issuer |
| `unregisterIssuer(issuerId)` | Admin | Remove issuer |
| `issueCredential(subject)` | Issuer | Store credential commitment |
| `revokeCredential(subject)` | Issuer | Mark credential as revoked |
| `proveEligibility(threshold) → Bool` | Holder | Prove `score >= threshold` |
| `proveNotRevoked() → Bool` | Holder | Prove credential is not revoked |

### Public Ledger State

| Field | Type | Description |
|---|---|---|
| `contractAdmin` | `Bytes<32>` | Domain-separated admin public key |
| `credentials` | `Map<Bytes<32>, Bytes<32>>` | Holder key → commitment hash |
| `issuerRegistry` | `Map<Bytes<32>, Boolean>` | Issuer pk → registered |
| `revoked` | `Set<Bytes<32>>` | Revoked holder keys |

### Private Witnesses (never on-chain)

| Witness | Type |
|---|---|
| `adminSecret()` | `Bytes<32>` |
| `issuerSecret()` | `Bytes<32>` |
| `credentialScore()` | `Uint<16>` |
| `credentialSalt()` | `Bytes<32>` |
| `holderSecret()` | `Bytes<32>` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Contract Language | Compact 0.23 |
| Compiler | `compact` 0.31.1 |
| Compact JS | 2.5.1 |
| Compact Runtime | 0.16.0 |
| Midnight.js | 4.1.1 |
| DApp Connector API | 4.0.1 |
| Wallet | Lace (Midnight Preprod build, Chrome extension) |
| SDK | `@midnight-ntwrk/midnight-js-*` |
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 |
| Tests | Vitest + `@midnight-ntwrk/compact-runtime` simulator |
| CI/CD | GitHub Actions |
| Hosting | Vercel |

---

## Prerequisites

- **Node.js** v22+
- **Docker** (running, for proof server)
- **Compact toolchain** (`compact update 0.31.1`)
- **Lace wallet** (Midnight Preprod build, Chrome extension) with Developer Mode enabled

---

## Quick Start

```bash
# Clone
git clone https://github.com/rue19/kredit-midnight.git
cd kredit-midnight

# Install
npm install

# Compile the contract
npm run compact

# Run tests
npm test

# Start frontend
cd frontend && npx next dev --port 3000 --hostname 0.0.0.0
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Wallet Setup

1. Install the **Lace wallet** Chrome extension (Midnight Preprod build)
2. Enable **Developer Mode** in Lace wallet settings
3. Switch to the **Midnight Preprod** network
4. Ensure your wallet has shielded keys initialized

---

## Test Suite

15 tests covering the full lifecycle:

| # | Test | Category |
|---|---|---|
| 1 | Initializes admin correctly | Admin |
| 2 | Admin can register an issuer | Admin |
| 3 | IssueCredential stores a commitment | Issuer |
| 4 | ProveEligibility returns true for eligible score | Proof |
| 5 | ProveEligibility returns false for ineligible score | Proof |
| 6 | Revoked credential fails eligibility | Revocation |
| 7 | Only registered issuer can issue credentials | Access |
| 8 | Only admin can register issuers | Access |
| 9 | ProveEligibility returns true at exact threshold | Proof |
| 10 | ProveEligibility returns true for zero score/threshold | Edge |
| 11 | ProveEligibility returns true for max Uint16 | Edge |
| 12 | Unregistered issuer cannot issue credential | Access |
| 13 | Privacy: ledger state does not contain score or salt | Privacy |
| 14 | Admin rotation prevents old admin from registering issuers | Admin |
| 15 | ProveNotRevoked returns true for non-revoked credential | Revocation |

---

## Folder Structure

```
kredit-midnight/
├── contract/
│   ├── src/
│   │   ├── kredit.compact              # Smart contract (7 circuits)
│   │   ├── witnesses.ts                # TypeScript witness implementations
│   │   └── index.ts                    # Package exports
│   ├── test/
│   │   └── kredit.test.ts              # Contract unit tests (15 tests)
│   ├── managed/kredit/                 # Compiled artifacts (keys, zkir, contract)
│   └── package.json
├── api/
│   └── src/index.ts                    # Shared types
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Landing page with dithering shader
│   │   ├── issuer/page.tsx             # Issuer Console (deploy, register, issue, revoke)
│   │   ├── user/page.tsx               # User View (key generation, eligibility proof)
│   │   └── verify/page.tsx             # Verifier View
│   ├── components/
│   │   ├── ConnectWalletButton.tsx     # Wallet connect button
│   │   └── ui/dithering-shader.tsx     # WebGL animation
│   ├── lib/
│   │   ├── wallet.tsx                  # useWallet() hook (Lace DApp Connector)
│   │   ├── providers.ts                # Midnight SDK provider setup
│   │   └── prover.ts                   # Private state + proof builder
│   ├── public/
│   │   ├── keys/                       # compiled prover/verifier keys, copied from contract/managed
│   │   └── zkir/                       # compiled ZKIR circuits, copied from contract/managed
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── privacy-model.md
│   ├── toolchain.md                    # Version source of truth
│   └── proposal.md                     # Level 3 proposal
├── .github/workflows/ci.yml            # CI/CD pipeline
├── start-services.sh                   # Local dev startup script
├── .env.example
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `frontend/.env.local`:

```bash
cp .env.example frontend/.env.local
```

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_ZK_ARTIFACTS_URL` | _(empty = same origin)_ | Client-side ZK artifacts URL (served from `frontend/public`) |

---

## CI/CD

GitHub Actions runs on every push/PR to `main`:

1. Checkout code
2. Setup Node.js 22
3. Install Compact toolchain + dependencies
4. Compile contract
5. Run test suite
6. Build API and frontend

---

## Troubleshooting

### "No Midnight wallet detected"
- Install the Lace wallet Chrome extension (Midnight Preprod build)
- Enable **Developer Mode** in Lace wallet settings

### "Network mismatch"
- Open Lace wallet → Settings → Network → Switch to **Midnight Preprod**

### "shielded coin public key is not available"
- The wallet needs shielded keys initialized
- Check if the wallet has completed initial setup on Preprod

### Proof generation fails
- Proofs are generated locally by the connected wallet (Lace) — the wallet must have
  shielded keys initialized on the Midnight Preprod network

### Compact compilation fails
- Verify: `compact --version`
- Update: `compact update 0.31.1`

### Build errors
- This project uses Next.js 16 with breaking changes
- See `frontend/AGENTS.md` for important notes

---

## Submission

### Moonshots Level 3 — Confidential Credential & Eligibility Protocol

**Checklist:**

- [x] Compact contract with 7 circuits on Preprod (runtime 0.16.0)
- [x] 15 passing tests (Vitest + compact-runtime simulator)
- [x] Working frontend on Preprod (Next.js + Lace wallet integration)
- [x] ZK proof generation for eligibility and revocation checks
- [x] Privacy model with selective disclosure
- [x] CI/CD pipeline (GitHub Actions)
- [x] Documentation (README, architecture, privacy model, proposal)

**Key SDK Fixes:**
- CompiledContract wrapper (`CompiledContract.make()` + `withWitnesses()`)
- Wallet proving provider (`getProvingProvider()` + `createProofProvider()`)
- Synchronous `getCoinPublicKey`/`getEncryptionPublicKey` per SDK requirements
- Transaction serialization for `balanceUnsealedTransaction()`
- `toBytes32()` padding for all `Bytes<32>` circuit arguments

---

## License

MIT
