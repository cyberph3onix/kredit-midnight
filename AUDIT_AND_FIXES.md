# Kredit Protocol — Rejection Audit & Fix List

Generated 2026-09-26. This audits the repo against the Midnight Moonshots
Level 1 / Level 2 / Level 3 submission requirements and records concrete,
verified defects — not guesses. Each item below was confirmed against the
live repo, live CI, and the live deployment before being listed.

Target level per README/docs: **Level 3**. Level 1/2 items are included
because they're cheap and some reviewers check the full ladder.

---

## BLOCKER 1 — CI is red on every commit at HEAD

`gh run list` shows the last 4 pushes to `main` (including HEAD `3d7f202
final-change`) all **failed**. Last green run was `35894679370` on
2026-09-23, three commits behind HEAD. A reviewer opening the repo today
sees a failing CI badge and a failing "CI/CD pipeline running (workflow
file + passing runs)" requirement (Level 3) even though tests themselves
pass fine locally.

**Root cause (confirmed via `gh run view 36037525848 --log-failed`):**
the `Typecheck` step in `.github/workflows/ci.yml` runs
`cd api && npx tsc --noEmit` before `contract` has ever been built. `api`
depends on `kredit-contract` via `"kredit-contract": "file:../contract"`,
resolved against `contract/dist/index.d.ts` (see `contract/package.json`
`"types"` field). `contract/dist` doesn't exist until the later `Build
contract` step, so typecheck fails with:

```
Cannot find module 'kredit-contract' or its corresponding type declarations.
```

**Fix:** in `.github/workflows/ci.yml`, move (or duplicate) the `Build
contract` step (`cd contract && npm run build`) to run *before* the
`Typecheck` step, so `contract/dist/index.d.ts` exists when `api`'s
`tsc --noEmit` runs. Keep the later full `Build contract` / `Build API` /
`Build frontend` steps as-is (or dedupe if the same command is now run
twice — either works, just don't leave the ordering bug in place).

---

## BLOCKER 2 — the "Live Demo" link in README is not public

`README.md` links to:
```
https://kredit-midnight-frontend-l6vbxxm1q-cyberph3onixs-projects.vercel.app
```
This is a **Vercel preview deployment URL protected by Vercel
Authentication (SSO)**. Confirmed by `curl -L`: it 302s to
`vercel.com/login?next=...`. Any reviewer clicking this link from the
README gets a login wall, not the app. This alone fails the "Live demo
link" requirement at every level.

A working, publicly reachable production alias already exists:
```
https://kredit-midnight-frontend.vercel.app
```
(confirmed 200 OK, serves the actual app, `<title>Kredit Protocol</title>`).

**Fix:**
1. In the Vercel project dashboard, disable "Vercel Authentication /
   Deployment Protection" for the production deployment (or confirm it's
   already off for the production alias and only on for preview URLs).
2. Replace every occurrence of the preview URL in `README.md` (the "Live
   Demo" link and the linked thumbnail image) with the working production
   alias `https://kredit-midnight-frontend.vercel.app` (or whatever the
   project's real custom/production domain is — verify in the Vercel
   dashboard, don't guess).
3. Load that URL in an incognito/logged-out browser and confirm the app
   renders with no login wall, before considering this fixed.

---

## BLOCKER 3 — required screenshot is missing

`docs/SUBMISSION_CHECKLIST.md` (line 20) explicitly flags this as
unresolved: `screenshots/tests-passing.png` — **MISSING, human action
needed.** Only `home.png`, `issuer.png`, `demo.png` exist in
`screenshots/`. The Level 3 checklist requires a **screenshot of test
output (3+ tests passing)**, and Level 1 separately requires a
**screenshot of successful compile output listing circuits**. Neither
exists as an actual screenshot image; only a copy-pasted text block
(`docs/test-output.txt`) exists, which is not a screenshot and won't
satisfy a manual reviewer scanning for image evidence.

**Fix:**
1. Run `npm test` in a terminal, screenshot the terminal showing
   `15 passed (15)`, save as `screenshots/tests-passing.png`.
2. Run `npm run compact` (or `cd contract && npm run compact`),
   screenshot the terminal output showing the compiled circuit list,
   save as `screenshots/compile-output.png`.
3. Embed both images in `README.md` next to the Test Suite / Contract
   Details sections (mirror how `home.png`/`issuer.png` are already
   embedded elsewhere, if they are — check first).
4. Update `docs/SUBMISSION_CHECKLIST.md` to mark item 8 as PASS once the
   file exists, or delete that stale internal checklist doc if it's
   superseded by the README's own checklist (it currently contradicts the
   README: the README claims everything is done while this doc says two
   things are still blocked — a reviewer who finds both will trust
   neither).

---

## HIGH — stale/contradictory internal docs undermine the submission

`docs/SUBMISSION_CHECKLIST.md` is dated 2026-09-20 and says, verbatim:
- Item 1: "**BLOCKER:** No deployed contract on Preprod yet"
- Item 7: "deployment status unverified"
- "Remaining Human Actions" lists 5 unfinished items including funding
  the wallet, setting Vercel env vars, taking the missing screenshot,
  and recording the demo video.

The current `README.md` (newer, dated later) claims all of this is done
— contract deployed, demo video linked, all checklist items checked.
Both files are in the repo simultaneously. A reviewer who opens
`docs/SUBMISSION_CHECKLIST.md` will read it as the more detailed/honest
status doc and conclude the submission is incomplete, contradicting the
README.

**Fix:** Either delete `docs/SUBMISSION_CHECKLIST.md` and
`docs/level3-audit.md` (superseded scratch docs — the README already has
its own "Submission" checklist section), or rewrite
`docs/SUBMISSION_CHECKLIST.md` from scratch to match current, verified
reality (post-fix) with accurate PASS/FAIL per item and no leftover
"BLOCKER"/"human action needed" language. Do not leave stale contradictory
docs in the repo.

---

## HIGH — Level 3 "approved idea from the provided idea list" is unverifiable from the repo

`docs/proposal.md` is a self-authored MVP proposal ("Eligibility Gate via
Selective Disclosure"). The Level 3 requirement is: **"Approved idea
submitted from the provided idea list"**. Nothing in this repo shows the
idea was (a) picked from the program's provided idea list, or (b)
actually approved by the program before/during the build. If the idea
was freely chosen rather than picked from the list and approved, this is
a hard, non-code rejection reason no amount of engineering fixes it.

**This is not something opencode/an engineering pass can fix** — it
requires you personally to confirm with the program whether this idea
was approved, and if not, either get retroactive approval or resubmit
against an approved idea from their list. Flag this to opencode as
informational only; don't have it try to "fix" this in code.

---

## MEDIUM — contract address is asserted but not shown as verifiable on-chain in the repo

README states a Preprod contract ID
(`d7016be782218a515837a816c7e993131a8cc4272ea7ad05d061d4b2b6e39bed`) but
the submission requirement is "**verifiable** on-chain" — i.e. a reviewer
should be able to check it against a Midnight explorer/indexer, not just
trust the README table. No screenshot or explorer link is provided for
this.

**Fix:** Add a link (or screenshot) to wherever the Midnight Preprod
indexer/explorer shows this contract's on-chain existence, next to the
"Deployed Contract" table in `README.md`. If Preprod has no public block
explorer yet, add a screenshot of a `curl`/indexer query result showing
the contract's state instead, so the address isn't just an unverifiable
string.

---

## LOW — Node 20 deprecation warning in CI

Annotation on every CI run: "Node.js 20 is deprecated... forced to run
on Node.js 24" for `actions/cache@v4`, `actions/checkout@v4`,
`actions/setup-node@v4`, `actions/upload-artifact@v4`. Not currently
failing anything, but bump these actions to their latest major/minor to
avoid this becoming a real break later.

**Fix:** bump `actions/checkout`, `actions/setup-node`, `actions/cache`,
`actions/upload-artifact` to their latest tagged versions in
`.github/workflows/ci.yml`.

---

## Verification checklist (opencode must confirm each, not assume)

Re-verified 2026-09-25 after the fixes landed. Each box below was checked by
running the check, not by reasoning about it. Anything I could not verify
myself is left unchecked with the reason stated.

- [x] `.github/workflows/ci.yml`: contract is built before `api` is
      typechecked; a fresh push to `main` produces a **green** run
      (check with `gh run list --limit 1` after pushing, not just "should
      work")
      — Root cause reproduced locally by moving `contract/dist` aside: `api`'s
      `tsc` then fails with the exact CI error. Restored via
      `cd contract && npm run build` and both typechecks exit 0.
      Workflow now runs *Compile contract → Build contract package →
      Typecheck*; the old trailing "Build contract" step was not skipped, it
      moved earlier and the reasoning is in a comment in the YAML.
      Post-fix runs: `36176044750`, `36176713796`, `36176771261`,
      `36177151325` — all success, none red. `gh run list --limit 1` at
      HEAD → `completed success`. Badge SVG now reads `Kredit CI - passing`.
- [x] README's Live Demo link, opened logged-out/incognito, loads the app
      with no Vercel login wall
      — `https://kredit-midnight-frontend.vercel.app` (both the link and the
      thumbnail target). Unauthenticated request, no cookies, no auth
      headers, redirects followed: **200, 0 redirects**, body contains
      `<title>Kredit Protocol</title>` and zero occurrences of
      `vercel.com/login` / `sso-api` / `_vercel_sso_nonce`.
      `/issuer`, `/user`, `/verify` all 200 with 0 redirects.
      The old preview URL was re-confirmed as broken (302 →
      `vercel.com/login?next=…`) and no longer appears in the README.
      Bonus: `NEXT_PUBLIC_CONTRACT_ADDRESS` is in fact set on the deployment —
      the contract ID is present in the client bundles served for all three
      pages, so the live Verify/User pages are not stuck on "No contract
      deployed".
- [x] `screenshots/tests-passing.png` exists and is embedded in README
      — Captured from a real `npm test -- --reporter=verbose` run (exit 0,
      all 15 test names, `Tests 15 passed (15)`), embedded in the README's
      Test Suite section.
      Caveat stated plainly: this machine has no GUI terminal, headless
      browser, ImageMagick or OCR, so the PNG is a rendering of the real
      captured output (Pillow + DejaVu Sans Mono, terminal-window chrome)
      rather than an OS-level screen grab. The text in it is genuine command
      output; the pixels are generated. I could not visually inspect the
      result — no image-input support and no OCR available — so I verified it
      structurally instead (dimensions, palette, no content overflow past the
      window border). **Worth a 5-second human eyeball before submitting.**
- [x] `screenshots/compile-output.png` exists and is embedded in README
      — Same method, from a real `npm run compact` run (exit 0,
      `Compiling 7 circuits:`, compiler 0.31.1 / language 0.23.0 / runtime
      0.16.0, 7 prover + 7 verifier keypairs), embedded in Contract Details.
      Same rendering caveat and same unverified-by-eye caveat as above.
      Also confirmed the compile is idempotent: re-running it left
      `contract/managed/` byte-identical, so no generated artifacts were
      churned into the diff.
- [x] `docs/SUBMISSION_CHECKLIST.md` / `docs/level3-audit.md` either
      deleted or rewritten to match verified current reality — no
      contradictions with README
      — `docs/level3-audit.md` deleted (it was stale by 7 commits: claimed no
      LICENSE, no `proposal.md`, wrong badge URL, 8 tests, CI "never verified
      green"). `docs/SUBMISSION_CHECKLIST.md` rewritten from scratch against
      re-verified reality, with the exact command/endpoint used per row, and
      a "Not verifiable from the repository" section for the idea-approval
      item instead of a false PASS. All "BLOCKER" / "human action needed" /
      "PARTIAL" language is gone. README's own Submission section now links
      to it rather than restating a looser version of the same claims.
      Also swept two adjacent problems: `docs/test-output.txt` was pinned to
      vitest 3.2.7 and contained a leaked `/home/shrinjali/...` path
      (refreshed, paths normalised); the README folder-structure listing had
      drifted from the actual `docs/` contents (corrected).
      Cross-checked the other five docs for the same class of drift — clean.
- [x] README's contract address has a verifiable on-chain link/screenshot
      — `preprod.midnightexplorer.com` does not resolve, so there is no public
      explorer page to link. The Preprod **indexer** is open, so the README
      now carries a copy-pasteable `curl` against
      `https://indexer.preprod.midnight.network/api/v4/graphql`, plus
      deploy-tx/block metadata in the contract table, plus
      `screenshots/contract-verified.png`.
      I ran the exact command as written in the README: it returns tx
      `624845`, hash `ec1e9bc5…d214a`, block `2692270`, 2026-09-24 17:34:54
      UTC, 15,506 bytes of state — and all 7 circuit names are recoverable
      from that state, so the address is the Kredit contract and not an empty
      deployment.
- [x] Commit count on `main` still ≥ 10 meaningful commits after fixes
      (currently 53 — fine, just don't squash it down)
      — 58 commits on `main` after five new fix/chore/docs commits. Nothing
      squashed or force-pushed; history is linear.
- [x] CI action versions bumped, no deprecation annotation on the next run
      — `checkout@v7`, `setup-node@v7`, `cache@v6`, `upload-artifact@v7`.
      Before bumping I checked each new major's `action.yml` to confirm the
      inputs this workflow uses still exist and that `runs.using` is
      `node24`. Run `36176771261` (the bump itself) is green and its only
      remaining annotation is the unrelated `ubuntu-latest` → Ubuntu 26
      migration notice. The Node 20 deprecation warning is gone.

### Still needs your manual action

- [ ] **Open the three new PNGs and look at them.** They are renderings of
      real output, not OS screen grabs, and I have no image-input support on
      this machine to confirm they read cleanly. Low risk, but it is the one
      deliverable in this pass I could not verify with my own eyes.
- [ ] **Optionally turn off Vercel Deployment Protection** for the project in
      the Vercel dashboard. I could not: there is no Vercel CLI installed and
      no `VERCEL_TOKEN` in the environment, and protection settings are not
      reachable over the GitHub or filesystem. This is **not** currently
      blocking the demo link — the production alias already serves publicly
      (verified above), which is why the README now points there. Turning
      protection off only matters if you want the *preview* URLs to be
      reviewable too.
- [ ] **Confirm the idea approval with the programme.** Deliberately
      untouched, per instructions. `docs/proposal.md` is self-authored and
      nothing in the repo or on the public Preprod network can show the idea
      came from the provided list or was approved. Only you can settle this.
