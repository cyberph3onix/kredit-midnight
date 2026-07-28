import type { KreditPrivateState } from 'kredit-contract';

const STORAGE_KEY = 'kredit-private-state';

export function buildProverInputs(privateState: KreditPrivateState, threshold: number) {
  return {
    witnesses: {
      adminSecret: (ctx: any) => [ctx, privateState.adminSecretKey],
      issuerSecret: (ctx: any) => [ctx, privateState.issuerSecretKey],
      credentialScore: (ctx: any) => [ctx, privateState.score],
      credentialSalt: (ctx: any) => [ctx, privateState.salt],
      holderSecret: (ctx: any) => [ctx, privateState.holderSecretKey],
    },
    threshold: BigInt(threshold),
  };
}

export function loadPrivateState(): KreditPrivateState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      adminSecretKey: Uint8Array.from(parsed.adminSecretKey),
      issuerSecretKey: Uint8Array.from(parsed.issuerSecretKey),
      holderSecretKey: Uint8Array.from(parsed.holderSecretKey),
      score: BigInt(parsed.score),
      salt: Uint8Array.from(parsed.salt),
    };
  } catch {
    return null;
  }
}

export function savePrivateState(state: KreditPrivateState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    adminSecretKey: Array.from(state.adminSecretKey),
    issuerSecretKey: Array.from(state.issuerSecretKey),
    holderSecretKey: Array.from(state.holderSecretKey),
    score: state.score.toString(),
    salt: Array.from(state.salt),
  }));
}

export function generateRandomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

export function generateInitialPrivateState(): KreditPrivateState {
  return {
    adminSecretKey: generateRandomBytes(32),
    issuerSecretKey: generateRandomBytes(32),
    holderSecretKey: generateRandomBytes(32),
    score: BigInt(750),
    salt: generateRandomBytes(32),
  };
}
