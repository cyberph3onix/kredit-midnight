import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  adminSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  issuerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  credentialScore(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  credentialSalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  holderSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  rotateAdmin(context: __compactRuntime.CircuitContext<PS>,
              newAdmin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unregisterIssuer(context: __compactRuntime.CircuitContext<PS>,
                   issuerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issueCredential(context: __compactRuntime.CircuitContext<PS>,
                  subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  proveNotRevoked(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  rotateAdmin(context: __compactRuntime.CircuitContext<PS>,
              newAdmin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unregisterIssuer(context: __compactRuntime.CircuitContext<PS>,
                   issuerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issueCredential(context: __compactRuntime.CircuitContext<PS>,
                  subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  proveNotRevoked(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
  deriveAdminPk(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  deriveAdminPk(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  rotateAdmin(context: __compactRuntime.CircuitContext<PS>,
              newAdmin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  registerIssuer(context: __compactRuntime.CircuitContext<PS>,
                 issuerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unregisterIssuer(context: __compactRuntime.CircuitContext<PS>,
                   issuerId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issueCredential(context: __compactRuntime.CircuitContext<PS>,
                  subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   subject_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveEligibility(context: __compactRuntime.CircuitContext<PS>,
                   threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  proveNotRevoked(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, boolean>;
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

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               adminId_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
