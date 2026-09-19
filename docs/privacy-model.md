# Privacy Model — Kredit Protocol

## Overview

Kredit uses Midnight's `disclose()` mechanism to create a strict boundary between private data (witnesses) and public data (ledger state). The raw credit score never crosses this boundary.

## Data Flow

```
OFF-CHAIN (Private)          BOUNDARY (disclose())          ON-CHAIN (Public)
─────────────────────────────────────────────────────────────────────────────
rawScore ────────────────────► persistentCommit(score, salt) ──► credentials map
salt ─────────────────────────► (never crosses)                 (commitment hash)
holderSecret ──────────────────► persistentHash(holder) ────────► holder key
issuerSecret ──────────────────► persistentHash(issuer) ────────► issuer key
adminSecret ───────────────────► persistentHash(admin) ─────────► admin key

score >= threshold ───────────► disclose(eligible) ────────────► circuit return (Boolean)
revoked? ─────────────────────► disclose(!revoked) ────────────► circuit return (Boolean)
```

## What an Observer CAN Learn

| Observable | Source |
|---|---|
| Address holds a credential | `credentials` map has an entry for `holderKey(address)` |
| Credential passed threshold check | `proveEligibility()` returns a Boolean |
| Credential is revoked | `revoked` set contains the holder key |
| Which address is a registered issuer | `issuerRegistry` map keys |
| Admin address | `contractAdmin` ledger field |

## What an Observer CANNOT Learn

| Protected | Protection Mechanism |
|---|---|
| Raw credit score | Never enters ledger or circuit return; only used inside `proveEligibility` for comparison |
| Credential salt | Private witness; only used inside circuit for commitment verification |
| Issuer's private signing key | Domain-separated hash; secret never leaves issuer's machine |
| Holder's secret key | Domain-separated hash; secret never leaves holder's machine |
| Admin's secret key | Domain-separated hash; secret never leaves admin's machine |
| Which exact tier user qualifies for | Circuit returns only the result for the specific threshold asked |

## Privacy Limitations

1. **Credential existence is visible.** An observer can see that a commitment exists for a given address.

2. **Repeated proofs can be linked.** If the same holder generates multiple proofs with the same credential, an observer can correlate them.

3. **Threshold probing.** If a verifier asks `prove(score >= 700)` and it passes, the observer learns the score is at least 700. An adversary can binary-search by querying multiple thresholds. Mitigation: issuers can define tier-based thresholds (e.g., "eligible for Tier 1" vs "eligible for Tier 2") to reduce granularity.

4. **Issuer knows the raw score.** When an issuer calls `issueCredential(subject)`, they provide the raw score and salt as private witnesses. The issuer must be trusted — they learn the score during issuance. This is inherent to the credential issuance model.

5. **Holder linkability.** The `holderKey = persistentHash(["kredit:holder:", address])` links the on-chain credential to a specific Midnight address. If the address is public (e.g., used for transactions), the credential is linkable to the address owner.

6. **Timing metadata.** Blockchain timestamps reveal when credentials were issued and proofs generated.

7. **localStorage storage.** The raw score, salt, and all secret keys are stored in the browser's localStorage. This is not encrypted at rest and is accessible to any JavaScript running on the same origin. For a production deployment, consider using encrypted storage or hardware-backed key storage.

## Commitment Scheme

Kredit uses `persistentCommit<Uint<16>>(score, salt)` to create a cryptographic commitment:

- `persistentCommit` is a SHA-256 hash with a random 32-byte salt
- The salt ensures the commitment is computationally hiding (256-bit randomness)
- The commitment is deterministic for the same (score, salt) pair
- The salt must never be reused across credentials

## Identity Derivation

All identities use domain-separated `persistentHash`:

```
adminPk    = persistentHash(["kredit:admin:pk:",    secretKey])
issuerPk   = persistentHash(["kredit:issuer:pk:",   secretKey])
holderKey  = persistentHash(["kredit:holder:",       address])
```

Domain separators prevent cross-contract hash collisions and ensure each identity type is unique.
