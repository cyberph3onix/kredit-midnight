import Link from "next/link";

const observable = [
  "An address holds a credential",
  "Whether a threshold check passed",
  "Whether a credential has been revoked",
  "Which addresses are registered issuers",
];

const concealed = [
  "The raw score behind the credential",
  "The 32-byte salt used in the commitment",
  "The issuer's private signing key",
  "The holder's domain-separated secret",
];

const steps = [
  {
    n: "01",
    title: "Issue",
    body: "An issuer commits to a holder's score on-chain — persistentCommit(score, salt). The number itself never leaves the issuer's machine.",
  },
  {
    n: "02",
    title: "Hold",
    body: "The holder keeps their score, salt, and keys in local storage. No server, wallet, or contract ever sees the plaintext value.",
  },
  {
    n: "03",
    title: "Prove",
    body: "Asked to clear a threshold, the holder's browser produces a zero-knowledge proof. The verifier learns pass or fail — nothing else.",
  },
];

const roles = [
  {
    href: "/issuer",
    label: "Issuer",
    body: "Deploy the contract, register trusted issuers, and commit credentials for a subject address.",
  },
  {
    href: "/user",
    label: "Holder",
    body: "Generate a local keypair and score, then produce an eligibility proof against a threshold.",
  },
  {
    href: "/verify",
    label: "Verifier",
    body: "Check whether a holder clears a threshold and whether their credential is still valid.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="max-w-xl">
        <p className="font-mono text-xs text-dim mb-5">
          confidential credentials &middot; midnight network
        </p>
        <h1 className="text-[2.75rem] sm:text-6xl font-medium leading-[1.05] tracking-tight mb-6 text-balance">
          Prove you qualify.
          <br />
          Reveal nothing.
        </h1>
        <p className="text-dim text-lg leading-relaxed max-w-md mb-8">
          Kredit lets a holder carry a private score — a credit rating, a
          KYC tier, a reputation index — and prove a claim about it on
          Midnight without ever putting the number on-chain.
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/user"
            className="px-5 py-3 rounded-[2px] bg-signal text-ink text-sm font-medium hover:bg-[#b0a2ff] transition-colors"
          >
            Generate a proof
          </Link>
          <Link
            href="/issuer"
            className="px-5 py-3 rounded-[2px] border border-line text-sm font-medium text-paper hover:border-signal-dim transition-colors"
          >
            Open issuer console
          </Link>
        </div>
        <div className="inline-flex items-center gap-2 font-mono text-xs text-dimmer border border-line rounded-[2px] px-3 py-2">
          score <span className="redacted px-2 py-0.5 mx-1">700</span>
          &ge; 650 &rarr; <span className="text-pass">eligible</span>
        </div>
      </section>

      <section className="mt-28 sm:mt-36">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
          <h2 className="text-2xl font-medium tracking-tight">
            What crosses the boundary
          </h2>
          <p className="text-sm text-dimmer max-w-xs text-right">
            Every circuit is designed around this line.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 border border-line rounded-[2px] divide-y sm:divide-y-0 sm:divide-x divide-line">
          <div className="p-6 sm:p-7">
            <h3 className="font-mono text-xs text-pass mb-4">observable</h3>
            <ul className="space-y-3">
              {observable.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-paper">
                  <span className="text-pass shrink-0">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 sm:p-7">
            <h3 className="font-mono text-xs text-fail mb-4">concealed</h3>
            <ul className="space-y-3">
              {concealed.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-dim">
                  <span className="text-fail shrink-0">&minus;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-28 sm:mt-36">
        <h2 className="text-2xl font-medium tracking-tight mb-10">
          How a credential moves
        </h2>
        <div className="grid sm:grid-cols-3 gap-px bg-line border border-line rounded-[2px] overflow-hidden">
          {steps.map((step) => (
            <div key={step.n} className="bg-ink p-6 sm:p-7">
              <span className="font-mono text-xs text-dimmer">{step.n}</span>
              <h3 className="text-lg font-medium mt-3 mb-2">{step.title}</h3>
              <p className="text-sm text-dim leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-28 sm:mt-36 mb-4">
        <h2 className="text-2xl font-medium tracking-tight mb-10">
          Three ways in
        </h2>
        <div className="divide-y divide-line border-t border-b border-line">
          {roles.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-6"
            >
              <span className="text-lg font-medium w-32 shrink-0 group-hover:text-signal transition-colors">
                {role.label}
              </span>
              <span className="text-sm text-dim leading-relaxed flex-1">
                {role.body}
              </span>
              <span className="font-mono text-xs text-dimmer group-hover:text-signal transition-colors shrink-0">
                enter
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
