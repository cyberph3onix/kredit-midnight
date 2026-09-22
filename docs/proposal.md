# Kredit Protocol — Eligibility Gate via Selective Disclosure

**Midnight Moonshots Level 3 Submission**

---

## Target Users

Financial institutions, KYC providers, and their customers who need to prove eligibility without exposing sensitive personal data.

## Problem

Traditional credential verification requires sharing raw personal data — credit scores, age, income, KYC tier. This creates three compounding risks:

1. **Privacy exposure.** Holders disclose exact values when only a threshold matters (e.g., "score ≥ 700").
2. **Breach surface.** Every shared record is another database entry attackers can exfiltrate.
3. **Regulatory friction.** GDPR/CCPA minimize-data principles are violated by default when full values are transmitted.

A lender needs to know "is this applicant eligible?" — not the precise 687 credit score.

## Why Selective Disclosure

Zero-knowledge proofs let the holder prove "I meet the criteria" without revealing the underlying data. On Midnight, this is native via the `disclose()` mechanism, making selective disclosure a first-class primitive rather than a bolted-on layer.

Kredit Protocol leverages this to issue **private numeric credentials** — a committed integer value with a salt — and generate eligibility proofs that reveal only a pass/fail result.

## What is Public vs. Private

| Public | Private |
|---|---|
| Credential commitment (Pedersen hash) | Raw numeric score |
| Pass/fail eligibility result | Salt used in commitment |
| Revocation registry | Issuer signing key |
| Circuit verification key | Holder's secret key |

## MVP Scope

- **Smart contract** deployed on Midnight Preprod
- **7 ZK circuits:**
  1. Admin key rotation
  2. Issuer registration
  3. Credential issuance (commitment generation)
  4. Credential revocation
  5. Eligibility proof (threshold gate)
  6. Not-revoked proof
  7. Issuer unregistration
- **Next.js frontend** with 3 views: Issuer dashboard, User wallet, Verifier portal
- **15 passing tests** covering all circuit logic and contract state transitions
- **CI/CD pipeline** via GitHub Actions with automated test + deployment to Vercel

## Roadmap

1. Multi-threshold tiering (bronze/silver/platinum eligibility bands)
2. Nullifier-based replay protection (one proof per credential per window)
3. Credential transfer between holder wallets
4. Mobile wallet integration (Midnight wallet SDK)
5. Mainnet deployment

## Risks

| Risk | Mitigation |
|---|---|
| Threshold probing (iterative queries narrow exact value) | Tier-based queries — issuer defines bands, not exact cutoffs |
| Holder linkability across verifications | Domain-separated per-session keys |
| Issuer trust / rogue issuer | Admin-controlled registry with on-chain rotation |

## Success Metrics

- 1+ deployed contract on Midnight Preprod
- 15+ passing tests (unit + integration)
- Green CI pipeline on every push
- Working Vercel demo with live issuer/user/verifier flows
