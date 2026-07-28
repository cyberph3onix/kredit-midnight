import type { Witnesses } from '../managed/kredit/contract/index.cjs';

export interface KreditPrivateState {
  adminSecretKey: Uint8Array;
  issuerSecretKey: Uint8Array;
  holderSecretKey: Uint8Array;
  score: bigint;
  salt: Uint8Array;
}

export function createKreditPrivateState(
  adminSecret: Uint8Array,
  issuerSecret: Uint8Array,
  holderSecret: Uint8Array,
  score: bigint,
  salt: Uint8Array,
): KreditPrivateState {
  return {
    adminSecretKey: adminSecret,
    issuerSecretKey: issuerSecret,
    holderSecretKey: holderSecret,
    score,
    salt,
  };
}

export function generateRandomBytes(len: number): Uint8Array {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return arr;
}

export const witnesses: Witnesses<KreditPrivateState> = {
  adminSecret: ({ privateState }) => {
    return [privateState, privateState.adminSecretKey];
  },
  issuerSecret: ({ privateState }) => {
    return [privateState, privateState.issuerSecretKey];
  },
  credentialScore: ({ privateState }) => {
    return [privateState, privateState.score];
  },
  credentialSalt: ({ privateState }) => {
    return [privateState, privateState.salt];
  },
  holderSecret: ({ privateState }) => {
    return [privateState, privateState.holderSecretKey];
  },
};
