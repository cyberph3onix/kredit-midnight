'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet';
import { findKreditContract, type KreditContractHandle } from '@/lib/providers';
import { Panel, Field, TextInput, Button, Banner, GateNotice } from '@/components/ui/console';

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
        throw new Error('No contract deployed. Deploy the Kredit contract first from the issuer console.');
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

  const passed = result && result.eligible && !result.revoked;

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-dim mb-3">verifier</p>
      <h1 className="text-3xl font-medium tracking-tight mb-3">
        Check the claim, not the score
      </h1>
      <p className="text-dim mb-10 max-w-lg leading-relaxed">
        Enter a holder&apos;s address and a threshold. You&apos;ll learn pass
        or fail and whether the credential is still valid — never the number
        behind it.
      </p>

      {!isConnected ? (
        <GateNotice>Connect your wallet to verify credentials.</GateNotice>
      ) : (
        <div className="space-y-4">
          <Panel title="Verify" index="01">
            <div className="space-y-4">
              <Field label="holder address">
                <TextInput
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="mn_addr…"
                />
              </Field>
              <Field label="threshold">
                <TextInput
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="700"
                />
              </Field>
              <Button
                onClick={handleVerify}
                disabled={loading || !address.trim() || !threshold.trim()}
              >
                {loading ? 'Verifying…' : 'Verify eligibility'}
              </Button>
            </div>
          </Panel>

          {result && (
            <div
              className={`border rounded-[2px] p-6 ${
                passed ? 'border-pass/30 bg-pass/5' : 'border-fail/30 bg-fail/5'
              }`}
            >
              <h3 className={`font-mono text-sm mb-3 ${passed ? 'text-pass' : 'text-fail'}`}>
                {passed ? 'pass' : 'fail'}
              </h3>
              <div className="text-sm text-dim space-y-1">
                <p>eligible: {result.eligible ? 'yes' : 'no'}</p>
                <p>revoked: {result.revoked ? 'yes' : 'no'}</p>
              </div>
              <p className="text-xs text-dimmer mt-3">
                The holder&apos;s actual score was never disclosed to you.
              </p>
            </div>
          )}

          {error && <Banner tone="fail">{error}</Banner>}

          <div className="grid sm:grid-cols-2 border border-line rounded-[2px] divide-y sm:divide-y-0 sm:divide-x divide-line mt-8">
            <div className="p-5">
              <h3 className="font-mono text-xs text-pass mb-3">you can see</h3>
              <ul className="text-sm text-dim space-y-1.5">
                <li>Pass or fail, as a boolean.</li>
                <li>That a credential exists on-chain.</li>
                <li>Revocation status.</li>
              </ul>
            </div>
            <div className="p-5">
              <h3 className="font-mono text-xs text-fail mb-3">you cannot see</h3>
              <ul className="text-sm text-dim space-y-1.5">
                <li>The actual score value.</li>
                <li>The commitment salt.</li>
                <li>The issuer&apos;s private key.</li>
                <li>Which exact tier qualifies.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
