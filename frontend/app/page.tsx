import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-4">Kredit Protocol</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl">
        A Confidential Credential & Eligibility Protocol on Midnight.
        Prove you qualify without revealing your score.
      </p>
      <div className="flex gap-4">
        <Link
          href="/issuer"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Issuer Console
        </Link>
        <Link
          href="/user"
          className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          User View
        </Link>
        <Link
          href="/verify"
          className="px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Verifier View
        </Link>
      </div>
      <div className="mt-12 bg-gray-100 p-6 rounded-lg max-w-xl text-left">
        <h2 className="text-lg font-semibold mb-2">Privacy Model</h2>
        <p className="text-sm text-gray-700 mb-2">
          <strong>Can observe:</strong> That an address holds a credential, whether they passed a specific threshold check.
        </p>
        <p className="text-sm text-gray-700">
          <strong>Cannot observe:</strong> The raw score/value, the salt, the issuer&apos;s private key.
        </p>
      </div>
    </div>
  );
}
