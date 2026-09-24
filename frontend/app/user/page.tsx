'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/lib/wallet';
import { findKreditContract, type KreditContractHandle } from '@/lib/providers';
import { generateInitialPrivateState, savePrivateState } from '@/lib/prover';
import { Panel, Field, TextInput, Button, Banner, GateNotice } from '@/components/ui/console';

const CONTRACT_ADDRESS_KEY = 'kredit-contract-address';
const CONTRACT_ADDRESS = '';

export default function UserPage() {
  const { isConnected, connectedApi } = useWallet();
  const [threshold, setThreshold] = useState('');
  const [result, setResult] = useState<{ eligible: boolean; threshold: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateStateInfo, setPrivateStateInfo] = useState<string | null>(null);

  const handleGenerateKeys = useCallback(() => {
    const state = generateInitialPrivateState();
    savePrivateState(state);
    setPrivateStateInfo(`Keys generated. Score: ${state.score} — stored locally only`);
  }, []);

  const handleProve = useCallback(async () => {
    const t = parseInt(threshold, 10);
    if (isNaN(t) || t < 0) {
      setError('Enter a valid threshold');
      return;
    }
    if (!connectedApi) {
      setError('Connect your wallet first');
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
      const { callTx } = found as unknown as KreditContractHandle;
      const eligible = await callTx.proveEligibility(BigInt(t));
      setResult({ eligible: Boolean(eligible), threshold: t });
    } catch (err) {
      console.error('Prove error:', err);
      setError(err instanceof Error ? err.message : 'Proof generation failed');
    } finally {
      setLoading(false);
    }
  }, [threshold, connectedApi]);

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-dim mb-3">holder</p>
      <h1 className="text-3xl font-medium tracking-tight mb-3">
        Prove eligibility, keep the number
      </h1>
      <p className="text-dim mb-10 max-w-lg leading-relaxed">
        Your score and salt live only in this browser. A proof crosses the
        privacy boundary as a single boolean — the value behind it never does.
      </p>

      {!isConnected ? (
        <GateNotice>Connect your wallet to generate a proof.</GateNotice>
      ) : (
        <div className="space-y-4">
          <Panel title="Local keys" index="01">
            <p className="text-sm text-dim mb-4 leading-relaxed">
              Generate a keypair and score. They stay in this browser and are
              never transmitted.
            </p>
            {privateStateInfo ? (
              <Banner tone="pass">{privateStateInfo}</Banner>
            ) : (
              <Button variant="outline" onClick={handleGenerateKeys}>
                Generate local keys
              </Button>
            )}
          </Panel>

          <Panel title="Eligibility proof" index="02">
            <div className="space-y-4">
              <Field
                label="threshold"
                hint={`The verifier will learn only whether your score ≥ ${threshold || '?'}`}
              >
                <TextInput
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="700"
                />
              </Field>
              <Button onClick={handleProve} disabled={loading || !threshold}>
                {loading ? 'Generating proof…' : 'Generate proof'}
              </Button>
            </div>
          </Panel>

          {result && (
            <div
              className={`border rounded-[2px] p-6 ${
                result.eligible ? 'border-pass/30 bg-pass/5' : 'border-fail/30 bg-fail/5'
              }`}
            >
              <h3
                className={`font-mono text-sm mb-2 ${result.eligible ? 'text-pass' : 'text-fail'}`}
              >
                {result.eligible ? 'eligible' : 'not eligible'}
              </h3>
              <p className="text-sm text-dim leading-relaxed">
                score &ge; {result.threshold} was proven on-chain. Your actual
                score was never disclosed.
              </p>
            </div>
          )}

          {error && <Banner tone="fail">{error}</Banner>}

          <div className="border border-line rounded-[2px] p-5 mt-8">
            <h3 className="text-sm font-medium mb-3">What stays local</h3>
            <ul className="text-sm text-dim space-y-1.5">
              <li>Your score is never sent over the network.</li>
              <li>Only the boolean result — eligible or not — reaches the chain.</li>
              <li>The commitment salt is never revealed.</li>
              <li>Proof generation runs locally; private inputs never leave this machine.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
