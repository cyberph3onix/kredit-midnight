# Kredit Protocol — 60-Second Demo Video Script

Total runtime: 60 seconds. Shot-by-shot breakdown below.

---

## Shot 1 — Connect Lace Wallet (0:00–0:05)

**On screen:** Browser with the Kredit dApp homepage. A large "Connect Wallet" button is centered. The cursor moves to it and clicks. The Lace wallet popup appears asking for connection approval. The cursor clicks "Approve."

**Narration:**
"Connect your Lace wallet to the Kredit dApp. One click, one approval."

---

## Shot 2 — Deploy Contract from Issuer Console (0:05–0:15)

**On screen:** The view switches to the Issuer Console tab. The user clicks "Deploy New Credential Contract." A loading spinner appears. After a moment, a success toast notification shows the contract address and a green checkmark. The contract details populate a table row below.

**Narration:**
"From the Issuer Console, deploy a credential contract to the Cardano testnet. Instant deployment, confirmed on-chain."

---

## Shot 3 — Register an Issuer Identity (0:15–0:20)

**On screen:** Still in the Issuer Console. The user fills in a short form: issuer name, public key, and optionally a metadata URL. They click "Register Issuer." A transaction is submitted. A second success toast confirms the issuer identity is registered on-chain.

**Narration:**
"Register your issuer identity. Your public key anchors your authority on-chain."

---

## Shot 4 — Issue a Credential for a Subject Address (0:20–0:25)

**On screen:** The user enters a subject wallet address into the "Issue Credential" form, selects a credential type from a dropdown (e.g., "Credit Score"), enters a numeric score value (e.g., 720), and clicks "Issue." A transaction is submitted. The credential appears in the "Issued Credentials" list with a timestamp and the subject's truncated address.

**Narration:**
"Issue a credential to any subject address. Issuer-signed, tamper-evident, fully on-chain."

---

## Shot 5 — Switch to User View — Generate Local Keys (0:25–0:30)

**On screen:** The user clicks "User View" in the navigation bar. A welcome screen appears with a "Generate Wallet Keys" button. They click it. A new Cardano address and private key are generated locally and displayed (private key blurred or shown as masked). The user saves or copies the address.

**Narration:**
"Switch to User View. Generate local keys — no private key ever leaves your device."

---

## Shot 6 — Generate Eligibility Proof at Threshold 700 (0:30–0:40)

**On screen:** In User View, the user selects their credential from a dropdown. They set the eligibility threshold to 700 via a slider or input box. They click "Generate Proof." A brief loading animation plays. Then a proof object is displayed with a cryptographic hash, a timestamp, and the claim: "Score ≥ 700."

**Narration:**
"Set your threshold and generate a zero-knowledge proof. The protocol proves eligibility without revealing your actual score."

---

## Shot 7 — Show Result: ELIGIBLE (0:40–0:45)

**On screen:** A large green banner fills the center of the screen reading "ELIGIBLE." Below it, the proof details are listed: credential hash, threshold met, issuer signature valid. The banner pulses once for emphasis.

**Narration:**
"ELIGIBLE. Proven on-chain. No sensitive data exposed."

---

## Shot 8 — Switch to Verifier View — Verify the Same Address (0:45–0:50)

**On screen:** The user clicks "Verifier View" in the navigation. A verification form appears. They paste or select the same subject address, and click "Verify Credential." The system returns a green checkmark and the text "Verification passed: valid issuer signature, threshold proof confirmed."

**Narration:**
"Switch to Verifier View. Verify any address in one step. The protocol confirms authenticity instantly."

---

## Shot 9 — Show "What the Verifier Sees vs. What Stays Private" Panel (0:50–0:55)

**On screen:** A side-by-side comparison panel slides in. Left column: "What the Verifier Sees" — issuer name, credential type, proof hash, threshold result (green check). Right column: "What Stays Private" — actual credit score, subject identity details, raw credential payload. Items in the right column have lock icons.

**Narration:**
"The verifier sees proof of eligibility — nothing more. Your score, your identity, your data: stay private."

---

## Shot 10 — Flash the Terminal Showing 15 Passing Tests (0:55–1:00)

**On screen:** Quick cut to a terminal window. `cargo test` output scrolls rapidly. Fifteen green "ok" lines flash by. The final line reads: "15 passed; 0 failed; 0 ignored." The screen fades to the Kredit Protocol logo and tagline: "Privacy-first credential verification on Cardano."

**Narration:**
"Fifteen tests. Fifteen passing. Kredit Protocol — privacy-first credential verification on Cardano."

---

*End of script. Total runtime: 60 seconds.*
