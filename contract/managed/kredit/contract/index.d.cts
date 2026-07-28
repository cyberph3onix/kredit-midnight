import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
  adminSecret(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
  issuerSecret(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
  credentialScore(context: __compactRuntime.WitnessContext<Ledger, T>): [T, bigint];
  credentialSalt(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
  holderSecret(context: __compactRuntime.WitnessContext<Ledger, T>): [T, Uint8Array];
}

export type ImpureCircuits<T> = {
  rotateAdmin(context: __compactRuntime.CircuitContext<T>,
              newAdmin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<T>,
                 issuerId_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  unregisterIssuer(context: __compactRuntime.CircuitContext<T>,
                   issuerId_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  issueCredential(context: __compactRuntime.CircuitContext<T>,
                  subject_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<T>,
                   subject_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<T>,
                   threshold_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  proveNotRevoked(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type PureCircuits = {
  deriveAdminPk(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<T> = {
  deriveAdminPk(context: __compactRuntime.CircuitContext<T>, sk_0: Uint8Array): __compactRuntime.CircuitResults<T, Uint8Array>;
  rotateAdmin(context: __compactRuntime.CircuitContext<T>,
              newAdmin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<T>,
                 issuerId_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  unregisterIssuer(context: __compactRuntime.CircuitContext<T>,
                   issuerId_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  issueCredential(context: __compactRuntime.CircuitContext<T>,
                  subject_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<T>,
                   subject_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<T>,
                   threshold_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  proveNotRevoked(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type Ledger = {
  readonly contractAdmin: Uint8Array;
  credentials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  issuerRegistry: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  revoked: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>,
               adminId_0: Uint8Array): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
