'use client';

import type { Configuration, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type KreditCircuitName =
  | 'rotateAdmin'
  | 'registerIssuer'
  | 'unregisterIssuer'
  | 'issueCredential'
  | 'revokeCredential'
  | 'proveEligibility'
  | 'proveNotRevoked';

export async function getConfig(connectedApi: ConnectedAPI): Promise<Configuration> {
  return connectedApi.getConfiguration();
}

export async function deployKreditContract(
  connectedApi: ConnectedAPI,
  adminId: Uint8Array,
  initialPrivateState: any,
) {
  const config = await connectedApi.getConfiguration();
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await connectedApi.getShieldedAddresses();

  const res = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      indexerUri: config.indexerUri,
      indexerWsUri: config.indexerWsUri,
      networkId: config.networkId,
      coinPublicKey: shieldedCoinPublicKey,
      encryptionPublicKey: shieldedEncryptionPublicKey,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Deploy failed');
  }

  return res.json();
}

export async function findKreditContract(
  connectedApi: ConnectedAPI,
  contractAddress: string,
) {
  const config = await connectedApi.getConfiguration();
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await connectedApi.getShieldedAddresses();

  return {
    callTx: new Proxy({} as any, {
      get(_target, circuit: string) {
        return async (...args: any[]) => {
          const body: any = {
            circuit,
            contractAddress,
            indexerUri: config.indexerUri,
            indexerWsUri: config.indexerWsUri,
            networkId: config.networkId,
            coinPublicKey: shieldedCoinPublicKey,
            encryptionPublicKey: shieldedEncryptionPublicKey,
          };

          switch (circuit) {
            case 'registerIssuer':
            case 'unregisterIssuer':
              body.args = { issuerId: Array.from(args[0]) };
              break;
            case 'issueCredential':
            case 'revokeCredential':
              body.args = { subject: Array.from(args[0]) };
              break;
            case 'proveEligibility':
              body.args = { threshold: args[0].toString() };
              break;
            case 'proveNotRevoked':
              body.args = {};
              break;
            case 'rotateAdmin':
              body.args = { newAdmin: Array.from(args[0]) };
              break;
            default:
              throw new Error(`Unknown circuit: ${circuit}`);
          }

          // Load private state from localStorage
          const stored = localStorage.getItem('kredit-private-state');
          if (stored) {
            body.privateState = JSON.parse(stored);
          }

          const res = await fetch('/api/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Circuit call failed');
          }

          const result = await res.json();
          return result.result;
        };
      },
    }),
  };
}
