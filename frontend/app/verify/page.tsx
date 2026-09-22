'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet';
import { findKreditContract, type KreditContractHandle } from '@/lib/providers';

const CONTRACT_ADDRESS_KEY = 'kredit-contract-address';
const CONTRACT_ADDRESS = '';

export default function VerifyPage() {
  const { isConnected, connectedApi } = useWallet();
  const [address, setAddress] = useState('');
  const [threshold, setThreshold] = useState('');
  const [result, setResult] = useState<{ eligible: boolean; revoked: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = useCallback(async () => {
    if (!address.trim() || !threshold.trim() || !connectedApi) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const contractAddr = localStorage.getItem(CONTRACT_ADDRESS_KEY) || CONTRACT_ADDRESS;
      if (!contractAddr) {
        throw new Error('No contract deployed. Deploy the Kredit contract first from the Issuer Console.');
      }

      const found = await findKreditContract(connectedApi, contractAddr);
      const { callTx } = found as unknown as KreditContractHandle;
      const t = BigInt(threshold.trim());

      const eligible = await callTx.proveEligibility(t);
      const notRevoked = await callTx.proveNotRevoked();

      setResult({
        eligible: Boolean(eligible),
        revoked: !Boolean(notRevoked),
      });
    } catch (err) {
      console.error('Verify error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [address, threshold, connectedApi]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Verifier View</h1>
      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please connect your wallet to verify credentials.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Check Eligibility</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter an address and threshold to check if the holder qualifies.
              You will only learn pass/fail — never the raw score.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holder Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter Midnight address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="e.g., 700"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || !address.trim() || !threshold.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Eligibility'}
              </button>
            </div>
          </div>

          {result && (
            <div className={`border rounded-lg p-6 ${result.eligible && !result.revoked ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="text-lg font-semibold mb-2">
                {result.eligible && !result.revoked ? 'PASS' : 'FAIL'}
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>Eligible: {result.eligible ? 'Yes' : 'No'}</p>
                <p>Revoked: {result.revoked ? 'Yes' : 'No'}</p>
                <p className="text-gray-500 italic mt-2">
                  The holder&apos;s actual score was never disclosed to you.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What the Verifier Sees vs. What Stays Private</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-700 mb-1">Verifier CAN see:</p>
                <ul className="text-gray-600 space-y-1 list-disc list-inside">
                  <li>Pass/fail result (boolean)</li>
                  <li>Credential exists on-chain</li>
                  <li>Revocation status</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-700 mb-1">Verifier CANNOT see:</p>
                <ul className="text-gray-600 space-y-1 list-disc list-inside">
                  <li>The actual score value</li>
                  <li>The credential salt</li>
                  <li>The issuer&apos;s private key</li>
                  <li>Which exact tier qualifies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
