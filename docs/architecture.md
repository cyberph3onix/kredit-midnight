# Architecture — Kredit Protocol

## Overview

Kredit is a Confidential Credential & Eligibility Protocol on Midnight. It allows users to hold private numeric credentials (credit scores, KYC tiers, reputation indices) and prove claims about them without revealing the underlying values.

## System Components

### 1. Smart Contract (`kredit.compact`)

Written in Compact, compiled to ZK circuits via the Midnight compiler.

**Public Ledger State:**
- `contractAdmin: Bytes<32>` — Domain-separated hash of admin's secret key
- `credentials: Map<Bytes<32>, Bytes<32>>` — holder key → commitment hash
- `issuerRegistry: Map<Bytes<32>, Boolean>` — issuer pk → registered (true)
- `revoked: Set<Bytes<32>>` — set of revoked holder keys

**Private Witnesses:**
- `adminSecret()` — Admin's 32-byte secret key
- `issuerSecret()` — Issuer's 32-byte secret key
- `credentialScore()` — The raw credit score (Uint<16>)
- `credentialSalt()` — Random salt for commitment
- `holderSecret()` — Holder's 32-byte secret key

**Circuits:**
1. `rotateAdmin(newAdmin)` — Transfer admin role (admin-only)
2. `registerIssuer(issuerId)` — Register a trusted issuer (admin-only)
3. `unregisterIssuer(issuerId)` — Remove an issuer (admin-only)
4. `issueCredential(subject)` — Issue credential commitment (issuer-only)
5. `revokeCredential(subject)` — Revoke a credential (issuer-only)
6. `proveEligibility(threshold) → Boolean` — Prove score >= threshold
7. `proveNotRevoked() → Boolean` — Prove credential is not revoked

### 2. TypeScript Witnesses (`witnesses.ts`)

Implements the off-chain witness functions that provide private data to circuits:
- Each witness returns `[privateState, value]` tuples
- Private state is stored client-side (localStorage)
- Score and salt never leave the user's machine

### 3. Frontend (Next.js)

Three views corresponding to three roles:
- **Issuer Console** — Issue/revoke credentials (admin-gated)
- **User View** — Connect wallet, generate eligibility proofs
- **Verifier View** — Check pass/fail for a given address and threshold

### 4. API Package

Shared TypeScript types and provider configuration for Midnight.js integration.

## Deployment

- Contract: Compiled and deployed to Midnight Preprod
- Frontend: Deployed to Vercel/Netlify
- Proof Server: Local Docker on port 6300 (or wallet-hosted)
