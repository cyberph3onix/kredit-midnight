import { describe, it, expect } from 'vitest';
import {
  constructorContext,
  QueryContext,
  dummyContractAddress,
  sampleSigningKey,
  signatureVerifyingKey,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/kredit/contract/index.cjs';

function makeBytes32(seed: number): Uint8Array {
  const arr = new Uint8Array(32);
  arr[0] = seed;
  return arr;
}

function getCoinPublicKey(): string {
  const sk = sampleSigningKey();
  const svk = signatureVerifyingKey(sk);
  return svk.substring(4);
}

function createSimulator(opts: {
  adminSecret?: Uint8Array;
  issuerSecret?: Uint8Array;
  holderSecret?: Uint8Array;
  score?: bigint;
  salt?: Uint8Array;
} = {}) {
  const adminSecret = opts.adminSecret ?? makeBytes32(0xAA);
  const issuerSecret = opts.issuerSecret ?? makeBytes32(0xBB);
  const holderSecret = opts.holderSecret ?? makeBytes32(0xCC);
  const score = opts.score ?? 750n;
  const salt = opts.salt ?? makeBytes32(0xDD);

  const contract = new Contract({
    adminSecret: (ctx) => [ctx, adminSecret],
    issuerSecret: (ctx) => [ctx, issuerSecret],
    credentialScore: (ctx) => [ctx, score],
    credentialSalt: (ctx) => [ctx, salt],
    holderSecret: (ctx) => [ctx, holderSecret],
  });

  const adminId = makeBytes32(0x01);
  const coinPub = getCoinPublicKey();
  const ctx = constructorContext({}, coinPub);
  const initResult = contract.initialState(ctx, adminId);

  const circuitCtx = {
    originalState: initResult.currentContractState,
    currentPrivateState: initResult.currentPrivateState,
    currentZswapLocalState: initResult.currentZswapLocalState,
    transactionContext: new QueryContext(
      initResult.currentContractState.data,
      dummyContractAddress(),
    ),
  };

  return { contract, circuitCtx };
}

describe('Kredit contract', () => {
  it('initializes admin correctly', () => {
    const { circuitCtx } = createSimulator();
    const state = ledger(circuitCtx.transactionContext.state);
    expect(state.contractAdmin).toBeDefined();
    expect(state.contractAdmin.length).toBe(32);
  });

  it('admin can register an issuer', () => {
    let { contract, circuitCtx } = createSimulator();

    const issuerId = makeBytes32(0x01);
    const result = contract.impureCircuits.registerIssuer(circuitCtx, issuerId);
    circuitCtx = result.context;

    const state = ledger(circuitCtx.transactionContext.state);
    expect(state.issuerRegistry.size()).toBe(1n);
  });

  it('issueCredential stores a commitment', () => {
    let { contract, circuitCtx } = createSimulator();

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));

    const subject = makeBytes32(0x10);
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, subject));

    const state = ledger(circuitCtx.transactionContext.state);
    expect(state.credentials.size()).toBe(1n);
  });

  it('proveEligibility returns true for eligible score', () => {
    const holderAddr = makeBytes32(0x10);
    let { contract, circuitCtx } = createSimulator({ score: 750n, holderSecret: holderAddr });

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, holderAddr));

    const result = contract.impureCircuits.proveEligibility(circuitCtx, 700n);
    expect(result.result).toBe(true);
  });

  it('proveEligibility returns false for ineligible score', () => {
    const holderAddr = makeBytes32(0x10);
    let { contract, circuitCtx } = createSimulator({ score: 500n, holderSecret: holderAddr });

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, holderAddr));

    const result = contract.impureCircuits.proveEligibility(circuitCtx, 700n);
    expect(result.result).toBe(false);
  });

  it('revoked credential fails eligibility', () => {
    const holderAddr = makeBytes32(0x10);
    let { contract, circuitCtx } = createSimulator({ score: 750n, holderSecret: holderAddr });

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, holderAddr));
    ({ context: circuitCtx } = contract.impureCircuits.revokeCredential(circuitCtx, holderAddr));

    expect(() => {
      contract.impureCircuits.proveEligibility(circuitCtx, 300n);
    }).toThrow();
  });

  it('only registered issuer can issue credentials', () => {
    let { contract, circuitCtx } = createSimulator();

    const subject = makeBytes32(0x10);
    expect(() => {
      contract.impureCircuits.issueCredential(circuitCtx, subject);
    }).toThrow();
  });

  it('only admin can register issuers', () => {
    const adminA = makeBytes32(0xAA);
    const adminB = makeBytes32(0xFF);

    // Deploy contract with admin A
    const contractA = new Contract({
      adminSecret: (ctx) => [ctx, adminA],
      issuerSecret: (ctx) => [ctx, makeBytes32(0xBB)],
      credentialScore: (ctx) => [ctx, 750n],
      credentialSalt: (ctx) => [ctx, makeBytes32(0xDD)],
      holderSecret: (ctx) => [ctx, makeBytes32(0xCC)],
    });

    const adminId = makeBytes32(0x01);
    const coinPub = getCoinPublicKey();
    const ctx = constructorContext({}, coinPub);
    const initResult = contractA.initialState(ctx, adminId);

    let circuitCtx = {
      originalState: initResult.currentContractState,
      currentPrivateState: initResult.currentPrivateState,
      currentZswapLocalState: initResult.currentZswapLocalState,
      transactionContext: new QueryContext(
        initResult.currentContractState.data,
        dummyContractAddress(),
      ),
    };

    // Create new contract with admin B's witness but reuse state from admin A
    const contractB = new Contract({
      adminSecret: (ctx) => [ctx, adminB],
      issuerSecret: (ctx) => [ctx, makeBytes32(0xBB)],
      credentialScore: (ctx) => [ctx, 750n],
      credentialSalt: (ctx) => [ctx, makeBytes32(0xDD)],
      holderSecret: (ctx) => [ctx, makeBytes32(0xCC)],
    });

    const issuerId = makeBytes32(0x01);
    expect(() => {
      contractB.impureCircuits.registerIssuer(circuitCtx, issuerId);
    }).toThrow();
  });
});
