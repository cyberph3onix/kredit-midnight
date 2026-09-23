'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet';
import { findKreditContract } from '@/lib/providers';
import { loadPrivateState, generateInitialPrivateState, savePrivateState } from '@/lib/prover';

const CONTRACT_ADDRESS_KEY = 'kredit-contract-address-preview';
const CONTRACT_ADDRESS = '';

export default function UserPage() {
  const { isConnected, connectedApi } = useWallet();
  const [threshold, setThreshold] = useState('');
  const [result, setResult] = useState<{ eligible: boolean; threshold: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateStateInfo, setPrivateStateInfo] = useState<string | null>(null);

  const handleGenerateKeys = useCallback(() => {
    // Reuse existing keys: regenerating would replace the admin/issuer secrets and orphan the issued credential.
    const existing = loadPrivateState();
    if (existing) {
      setPrivateStateInfo(`Local keys loaded. Score: ${existing.score} (stored locally only)`);
      return;
    }
    const state = generateInitialPrivateState();
    savePrivateState(state);
    setPrivateStateInfo(`Keys generated. Score: ${state.score} (stored locally only)`);
  }, []);

  const handleProve = useCallback(async () => {
    const t = parseInt(threshold, 10);
    if (isNaN(t) || t < 0) {
      setError('Please enter a valid threshold');
      return;
    }
    if (!connectedApi) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const contractAddr = localStorage.getItem(CONTRACT_ADDRESS_KEY) || CONTRACT_ADDRESS;
      if (!contractAddr) {
        throw new Error('No contract deployed. Ask the admin to deploy the Kredit contract first.');
      }

      const found = await findKreditContract(connectedApi, contractAddr);
      const eligible = await (found.callTx as any).proveEligibility(BigInt(t));
      setResult({ eligible: Boolean(eligible), threshold: t });
    } catch (err) {
      console.error('Prove error:', err);
      setError(err instanceof Error ? err.message : 'Proof generation failed');
    } finally {
      setLoading(false);
    }
  }, [threshold, connectedApi]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User View</h1>
      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please connect your wallet to generate a proof.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Keys</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate a local keypair and score. These are stored only in your browser — never transmitted.
            </p>
            {privateStateInfo ? (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-800 text-sm">{privateStateInfo}</p>
              </div>
            ) : (
              <button
                onClick={handleGenerateKeys}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Generate Local Keys
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generate Eligibility Proof</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your private score and salt are stored locally in your browser.
              They are never transmitted in plaintext. Only the boolean result of the proof crosses the privacy boundary.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold to check against
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="e.g., 700"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The verifier will only learn whether your score &gt;= {threshold || '?'}
                </p>
              </div>
              <button
                onClick={handleProve}
                disabled={loading || !threshold}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Generating proof...' : 'Generate Proof'}
              </button>
            </div>
          </div>

          {result && (
            <div className={`border rounded-lg p-6 ${result.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="text-lg font-semibold mb-2">
                {result.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
              </h3>
              <p className="text-sm text-gray-700">
                Your score &gt;= {result.threshold} was proven on-chain.
                Your actual score was never disclosed.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Privacy Guarantee</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Your score is never sent over the network</li>
              <li>Only the boolean result (eligible/not eligible) appears on-chain</li>
              <li>The salt used in the commitment is never revealed</li>
              <li>The proof server processes data locally — private inputs never leave your machine</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
