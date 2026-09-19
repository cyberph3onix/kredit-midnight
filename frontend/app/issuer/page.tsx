'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet';
import { deployKreditContract, findKreditContract } from '@/lib/providers';

const CONTRACT_ADDRESS_KEY = 'kredit-contract-address';
const CONTRACT_ADDRESS = '';

function getContractAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONTRACT_ADDRESS_KEY);
}

function setContractAddress(addr: string) {
  localStorage.setItem(CONTRACT_ADDRESS_KEY, addr);
}

export default function IssuerPage() {
  const { isConnected, connectedApi } = useWallet();
  const [subjectAddress, setSubjectAddress] = useState('');
  const [issuerId, setIssuerId] = useState('');
  const [contractAddr, setContractAddr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeploy = useCallback(async () => {
    if (!connectedApi) return;
    setLoading(true);
    setStatus('Deploying contract... (this may take a minute for proof generation)');
    try {
      const adminId = new TextEncoder().encode('kredit-admin-001');
      const deployed = await deployKreditContract(connectedApi, adminId, null);

      const addr = deployed.contractAddress ?? 'unknown';
      setContractAddr(addr);
      setContractAddress(addr);
      setStatus(`Contract deployed at ${addr}`);
    } catch (err) {
      console.error('Deploy error:', err);
      setStatus(`Deploy error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [connectedApi]);

  const handleRegisterIssuer = useCallback(async () => {
    if (!connectedApi || !issuerId.trim()) return;
    setLoading(true);
    setStatus('Registering issuer...');
    try {
      const addr = contractAddr ?? getContractAddress();
      if (!addr) throw new Error('No contract deployed. Click "Deploy Kredit Contract" above first.');
      const found = await findKreditContract(connectedApi, addr);
      const issuerIdBytes = new TextEncoder().encode(issuerId.trim());
      await (found.callTx as any).registerIssuer(issuerIdBytes);
      setStatus(`Issuer "${issuerId}" registered on-chain`);
    } catch (err) {
      console.error('Register issuer error:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [connectedApi, issuerId, contractAddr]);

  const handleIssue = useCallback(async () => {
    if (!connectedApi || !subjectAddress.trim()) return;
    setLoading(true);
    setStatus('Issuing credential...');
    try {
      const addr = contractAddr ?? getContractAddress();
      if (!addr) throw new Error('No contract deployed. Click "Deploy Kredit Contract" above first.');
      const found = await findKreditContract(connectedApi, addr);
      const subjectBytes = new TextEncoder().encode(subjectAddress.trim());
      await (found.callTx as any).issueCredential(subjectBytes);
      setStatus(`Credential issued for ${subjectAddress.slice(0, 16)}... (commitment stored on-chain)`);
    } catch (err) {
      console.error('Issue credential error:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [connectedApi, subjectAddress, contractAddr]);

  const handleRevoke = useCallback(async () => {
    if (!connectedApi || !subjectAddress.trim()) return;
    setLoading(true);
    setStatus('Revoking credential...');
    try {
      const addr = contractAddr ?? getContractAddress();
      if (!addr) throw new Error('No contract deployed. Click "Deploy Kredit Contract" above first.');
      const found = await findKreditContract(connectedApi, addr);
      const subjectBytes = new TextEncoder().encode(subjectAddress.trim());
      await (found.callTx as any).revokeCredential(subjectBytes);
      setStatus(`Credential revoked for ${subjectAddress.slice(0, 16)}...`);
    } catch (err) {
      console.error('Revoke credential error:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [connectedApi, subjectAddress, contractAddr]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Issuer Console</h1>
      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please connect your wallet as an admin/issuer to continue.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Contract Setup</h2>
            {contractAddr ? (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                <p className="text-green-800 text-sm font-mono break-all">
                  Contract: {contractAddr}
                </p>
              </div>
            ) : (
              <button
                onClick={handleDeploy}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors mb-4"
              >
                Deploy Kredit Contract
              </button>
            )}

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer ID
                </label>
                <input
                  type="text"
                  value={issuerId}
                  onChange={(e) => setIssuerId(e.target.value)}
                  placeholder="e.g., bank-acme-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleRegisterIssuer}
                disabled={loading || !issuerId.trim() || !contractAddr}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Register Issuer
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Issue Credential</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the subject&apos;s address to issue a credential. The raw score and salt are kept private — only the commitment hash is stored on-chain.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Address
                </label>
                <input
                  type="text"
                  value={subjectAddress}
                  onChange={(e) => setSubjectAddress(e.target.value)}
                  placeholder="Enter Midnight address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleIssue}
                  disabled={loading || !subjectAddress.trim() || !contractAddr}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Issue Credential
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={loading || !subjectAddress.trim() || !contractAddr}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Revoke Credential
                </button>
              </div>
            </div>
          </div>

          {status && (
            <div className={`border rounded-lg p-4 ${status.includes('error') || status.includes('Error') ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm ${status.includes('error') || status.includes('Error') ? 'text-red-800' : 'text-blue-800'}`}>{status}</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Deploy the Kredit contract (you become admin)</li>
              <li>Register issuer identities</li>
              <li>Issue credentials — commitment = persistentCommit(score, salt) stored on-chain</li>
              <li>Subject receives raw data via secure channel (never touches chain)</li>
              <li>Subject generates ZK proof to prove eligibility without revealing score</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
