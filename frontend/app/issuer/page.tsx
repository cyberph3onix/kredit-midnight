'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/lib/wallet';
import { deployKreditContract, findKreditContract, type KreditContractHandle } from '@/lib/providers';
import { Panel, Field, TextInput, Button, Banner, GateNotice } from '@/components/ui/console';

const CONTRACT_ADDRESS_KEY = 'kredit-contract-address';

function getContractAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CONTRACT_ADDRESS_KEY);
}

function setContractAddress(addr: string) {
  localStorage.setItem(CONTRACT_ADDRESS_KEY, addr);
}

function toBytes32(input: string): Uint8Array {
  const raw = new TextEncoder().encode(input);
  const buf = new Uint8Array(32);
  buf.set(raw.slice(0, 32));
  return buf;
}

export default function IssuerPage() {
  const { isConnected, connectedApi } = useWallet();
  const [subjectAddress, setSubjectAddress] = useState('');
  const [issuerId, setIssuerId] = useState('');
  const [contractAddr, setContractAddr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getContractAddress();
    // localStorage cannot be read during render without risking a hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setContractAddr(saved);
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!connectedApi) return;
    setLoading(true);
    setStatus('Deploying contract… this can take a minute for proof generation.');
    try {
      const raw = new TextEncoder().encode('kredit-admin-001');
      const adminId = new Uint8Array(32);
      adminId.set(raw);
      const deployed = await deployKreditContract(connectedApi, adminId);

      const addr = deployed.contractAddress ?? 'unknown';
      setContractAddr(addr);
      setContractAddress(addr);
      setStatus(`Contract deployed at ${addr}`);
    } catch (err) {
      console.error('Deploy error:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [connectedApi]);

  const handleRegisterIssuer = useCallback(async () => {
    if (!connectedApi || !issuerId.trim()) return;
    setLoading(true);
    setStatus('Registering issuer…');
    try {
      const addr = contractAddr ?? getContractAddress();
      if (!addr) throw new Error('No contract deployed. Deploy the Kredit contract above first.');
      const found = await findKreditContract(connectedApi, addr);
      const { callTx } = found as unknown as KreditContractHandle;
      const issuerIdBytes = toBytes32(issuerId.trim());
      await callTx.registerIssuer(issuerIdBytes);
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
    setStatus('Issuing credential…');
    try {
      const addr = contractAddr ?? getContractAddress();
      if (!addr) throw new Error('No contract deployed. Deploy the Kredit contract above first.');
      const found = await findKreditContract(connectedApi, addr);
      const { callTx } = found as unknown as KreditContractHandle;
      const subjectBytes = toBytes32(subjectAddress.trim());
      await callTx.issueCredential(subjectBytes);
      setStatus(`Credential issued for ${subjectAddress.slice(0, 16)}… commitment stored on-chain`);
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
    setStatus('Revoking credential…');
    try {
      const addr = contractAddr ?? getContractAddress();
      if (!addr) throw new Error('No contract deployed. Deploy the Kredit contract above first.');
      const found = await findKreditContract(connectedApi, addr);
      const { callTx } = found as unknown as KreditContractHandle;
      const subjectBytes = toBytes32(subjectAddress.trim());
      await callTx.revokeCredential(subjectBytes);
      setStatus(`Credential revoked for ${subjectAddress.slice(0, 16)}…`);
    } catch (err) {
      console.error('Revoke credential error:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [connectedApi, subjectAddress, contractAddr]);

  const isError = status?.toLowerCase().includes('error');

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-dim mb-3">issuer console</p>
      <h1 className="text-3xl font-medium tracking-tight mb-3">
        Commit credentials without the score
      </h1>
      <p className="text-dim mb-10 max-w-lg leading-relaxed">
        As admin you deploy the contract and register trusted issuers. As an
        issuer, you commit a subject&apos;s score on-chain — the number itself
        stays with you, off-chain.
      </p>

      {!isConnected ? (
        <GateNotice>Connect a wallet with admin or issuer rights to continue.</GateNotice>
      ) : (
        <div className="space-y-4">
          <Panel title="Contract" index="01">
            {contractAddr ? (
              <div className="border border-line rounded-[2px] p-3 mb-5">
                <p className="text-xs text-dim mb-1">Deployed at</p>
                <p className="font-mono text-sm break-all text-paper">{contractAddr}</p>
              </div>
            ) : (
              <Button onClick={handleDeploy} disabled={loading} className="mb-5">
                Deploy Kredit contract
              </Button>
            )}

            <div className="space-y-4">
              <Field label="issuer id" hint="e.g. bank-acme-001">
                <TextInput
                  value={issuerId}
                  onChange={(e) => setIssuerId(e.target.value)}
                  placeholder="bank-acme-001"
                />
              </Field>
              <Button
                variant="outline"
                onClick={handleRegisterIssuer}
                disabled={loading || !issuerId.trim() || !contractAddr}
              >
                Register issuer
              </Button>
            </div>
          </Panel>

          <Panel title="Credential" index="02">
            <div className="space-y-4">
              <Field
                label="subject address"
                hint="The raw score and salt never touch the chain — only their commitment does."
              >
                <TextInput
                  value={subjectAddress}
                  onChange={(e) => setSubjectAddress(e.target.value)}
                  placeholder="mn_addr…"
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleIssue}
                  disabled={loading || !subjectAddress.trim() || !contractAddr}
                >
                  Issue credential
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRevoke}
                  disabled={loading || !subjectAddress.trim() || !contractAddr}
                >
                  Revoke credential
                </Button>
              </div>
            </div>
          </Panel>

          {status && <Banner tone={isError ? 'fail' : 'info'}>{status}</Banner>}

          <div className="border border-line rounded-[2px] p-5 mt-8">
            <h3 className="text-sm font-medium mb-3">Sequence</h3>
            <ol className="text-sm text-dim space-y-1.5">
              <li>1. Deploy the contract — you become admin.</li>
              <li>2. Register issuer identities.</li>
              <li>3. Issue: commitment = persistentCommit(score, salt), stored on-chain.</li>
              <li>4. The subject receives the raw score through a channel off this protocol.</li>
              <li>5. The subject proves eligibility later, without revealing the score.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
