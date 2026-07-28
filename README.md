# Kredit Protocol

**A Confidential Credential & Eligibility Protocol on Midnight** — Prove you qualify without revealing your score.

## Contract Address

| Network | Contract Address |
|---------|------------------|
| Preprod | `<YOUR_DEPLOYED_CONTRACT_ADDRESS>` |

> **Do NOT remove this placeholder.** After deploying, replace `<YOUR_DEPLOYED_CONTRACT_ADDRESS>` everywhere it appears.

## Features

- **Private Credential Issuance** — Issuers issue credentials stored as cryptographic commitments (hashes), never raw values
- **Zero-Knowledge Eligibility Proofs** — Users prove their score meets a threshold without revealing the actual score
- **Revocation System** — Issuers can revoke credentials; verifiers check revocation status
- **Issuer Registry** — Admin-controlled registration of trusted credential issuers
- **Lace Wallet Integration** — Connect via Midnight's DApp Connector API on Preprod
- **Three Role-Based Views** — Issuer Console, User View, and Verifier View

## What This Project Does

Kredit lets a user hold a private numeric credential (a credit score, KYC tier, reputation index) and **prove a claim about it** ("I qualify," "I'm above threshold X") — **without ever putting the underlying value on-chain.**

An issuer (e.g., a bank) issues a credential commitment on-chain. The user holds their raw score locally in their browser. When a verifier (e.g., a lender) needs to check eligibility, the user generates a ZK proof that their score meets the threshold. The verifier learns only the boolean result — never the actual score.

## Privacy Model

| Can Observe | Cannot Observe |
|---|---|
| Address holds a credential (commitment exists) | The raw score/value behind the credential |
| Whether address passed a specific threshold check | Which exact threshold tier user qualifies for |
| Whether credential has been revoked | The salt linking commitment to raw score |
| Which address is a registered issuer | The issuer's private signing material |

**What users prove without revealing:** That their private score is greater than or equal to a public threshold — only the boolean result (`true`/`false`) is disclosed on-chain.

## Tech Stack

| Layer | Choice |
|---|---|
| Contract language | Compact 0.17 |
| Compiler | compact 0.25.0 |
| Proof generation | Local Proof Server (Docker, port 6300) |
| Node/Indexer | Preview/Preprod RPC |
| Wallet | Lace (Midnight Preview build, Chrome extension) |
| SDK | `@midnight-ntwrk/midnight-js-*`, DApp Connector API |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Tests | Vitest + compact-runtime simulator |
| CI/CD | GitHub Actions |

## Folder Structure

```
kredit-midnight/
├── contract/
│   ├── src/kredit.compact          # Smart contract (7 circuits)
│   ├── src/witnesses.ts            # TypeScript witness implementations
│   ├── test/kredit.test.ts         # Unit tests (8 passing)
│   └── managed/kredit/             # Compiled circuits + keys
├── api/
│   └── src/index.ts                # Shared types (KreditProviders, KreditPrivateState)
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── issuer/page.tsx         # Issuer Console (deploy, register, issue, revoke)
│   │   ├── user/page.tsx           # User View (key generation, eligibility proof)
│   │   ├── verify/page.tsx         # Verifier View (check eligibility + revocation)
│   │   └── api/                    # Server-side API routes
│   ├── lib/
│   │   ├── wallet.ts               # useWallet() hook (Lace DApp Connector)
│   │   ├── providers.ts            # Midnight SDK provider setup
│   │   └── prover.ts               # Private state management + proof builder
│   └── zk-server.js                # Local ZK artifacts HTTP server (port 3100)
├── docs/
│   ├── architecture.md             # System architecture
│   └── privacy-model.md            # Privacy model with data flow diagrams
├── .github/workflows/ci.yml        # CI/CD pipeline
├── kredit-midnight-prd.md          # Product Requirements Document
└── .env.example                    # Environment variable template
```

## Prerequisites

- **Node.js** v22+
- **Docker** (running)
- **Compact toolchain** (`compact update 0.25.0`)
- **Lace wallet** (Midnight Preview build, Chrome extension) with Developer Mode enabled

## Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/kredit-midnight.git
cd kredit-midnight

# Install root dependencies
npm install

# Install contract dependencies
cd contract && npm install && cd ..

# Install API dependencies
cd api && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Compile

```bash
# Compile the Compact contract
npm run compact
```

This compiles `contract/src/kredit.compact` and generates circuit artifacts in `contract/managed/kredit/`.

## Build

```bash
# Build contract and API packages
npm run build

# Build the frontend
cd frontend && npm run build && cd ..
```

## Run Tests

```bash
npm test
```

This runs 8 contract-level tests covering: admin initialization, issuer registration, credential issuance, eligible/ineligible score proofs, revocation blocking, and unauthorized access rejection.

## Run Locally

```bash
# Terminal 1: Start the ZK artifacts server
cd frontend && npm run zk-server

# Terminal 2: Start the proof server
docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'

# Terminal 3: Start the frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Manual Deployment

Deployment is **intentionally skipped** during setup. You must deploy the Compact contract manually:

```bash
NODE_OPTIONS="--max-old-space-size=12288" npm run deploy -- --network preprod
```

> **Note:** This command requires the Lace wallet to be connected and the proof server running.

## After Deployment

Once the contract is deployed, the only remaining manual steps are:

1. **Copy** the deployed contract address from the deployment output.
2. **Replace** every occurrence of `<YOUR_DEPLOYED_CONTRACT_ADDRESS>` in:
   - `README.md` (Contract Address table)
   - `frontend/app/user/page.tsx` (`CONTRACT_ADDRESS` constant)
   - `frontend/app/verify/page.tsx` (`CONTRACT_ADDRESS` constant)
   - `frontend/app/issuer/page.tsx` (`CONTRACT_ADDRESS` constant)

**No additional coding should be required after this step.**

## Environment Variables

Copy `.env.example` to `.env.local` in the `frontend/` directory:

```bash
cp .env.example frontend/.env.local
```

| Variable | Default | Description |
|---|---|---|
| `PROOF_SERVER_URL` | `http://localhost:6300` | URL of the local Midnight proof server |
| `NEXT_PUBLIC_ZK_ARTIFACTS_URL` | `http://localhost:3100` | URL of the ZK artifacts server |
| `ZK_ARTIFACTS_URL` | `http://localhost:3100` | Server-side ZK artifacts URL |
| `CONTRACT_ADDRESS` | `<YOUR_DEPLOYED_CONTRACT_ADDRESS>` | Deployed contract address |

## Screenshots

> *Screenshots to be added after deployment.*

## Initial Idea

> *Kredit was built to demonstrate that credential systems on-chain can protect隐私 instead of leaking it. Using Midnight's `disclose()` mechanism, users prove eligibility without ever revealing their actual score — solving a real privacy problem in DeFi lending, KYC, and reputation systems.*

## Troubleshooting

### "No Midnight wallet detected"
- Install the Lace wallet Chrome extension
- Enable **Developer Mode** in Lace wallet settings
- Ensure you are connected to the **Preprod** network

### "Proof server connection refused"
- Make sure Docker is running
- Start the proof server: `docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'`

### "ZK artifacts not found"
- Start the ZK artifacts server: `cd frontend && npm run zk-server`
- Verify it's running: `curl http://localhost:3100`

### Compact compilation fails
- Verify compact is installed: `compact --version`
- Update to the required version: `compact update 0.25.0`

### Build errors with Next.js
- This project uses Next.js 16 which has breaking changes from earlier versions
- See `frontend/AGENTS.md` for important notes

## License

MIT
