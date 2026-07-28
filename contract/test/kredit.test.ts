import { describe, it, expect } from 'vitest';
import {
  createConstructorContext,
  createCircuitContext,
  dummyContractAddress,
  sampleSigningKey,
  signatureVerifyingKey,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/kredit/contract/index.js';

function makeBytes32(seed: number): Uint8Array {
  const arr = new Uint8Array(32);
  arr[0] = seed;
  return arr;
}

function getCoinPublicKey(): string {
  const sk = sampleSigningKey();
  const svk = signatureVerifyingKey(sk);
  return svk;
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
  const score = opts.score ?? BigInt(750);
  const salt = opts.salt ?? makeBytes32(0xDD);

  const contract = new Contract({
    adminSecret: (ctx: any) => [ctx, adminSecret],
    issuerSecret: (ctx: any) => [ctx, issuerSecret],
    credentialScore: (ctx: any) => [ctx, score],
    credentialSalt: (ctx: any) => [ctx, salt],
    holderSecret: (ctx: any) => [ctx, holderSecret],
  });

  const adminId = makeBytes32(0x01);
  const coinPub = getCoinPublicKey();
  const ctx = createConstructorContext({}, coinPub);
  const initResult = contract.initialState(ctx, adminId);

  const circuitCtx = createCircuitContext(
    dummyContractAddress(),
    coinPub,
    initResult.currentContractState,
    initResult.currentPrivateState,
  );

  return { contract, circuitCtx };
}

describe('Kredit contract', () => {
  it('initializes admin correctly', () => {
    const { circuitCtx } = createSimulator();
    const state = ledger(circuitCtx.currentQueryContext.state);
    expect(state.contractAdmin).toBeDefined();
    expect(state.contractAdmin.length).toBe(32);
  });

  it('admin can register an issuer', () => {
    let { contract, circuitCtx } = createSimulator();

    const issuerId = makeBytes32(0x01);
    const result = contract.impureCircuits.registerIssuer(circuitCtx, issuerId);
    circuitCtx = result.context;

    const state = ledger(circuitCtx.currentQueryContext.state);
    expect(state.issuerRegistry.size()).toBe(BigInt(1));
  });

  it('issueCredential stores a commitment', () => {
    let { contract, circuitCtx } = createSimulator();

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));

    const subject = makeBytes32(0x10);
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, subject));

    const state = ledger(circuitCtx.currentQueryContext.state);
    expect(state.credentials.size()).toBe(BigInt(1));
  });

  it('proveEligibility returns true for eligible score', () => {
    const holderAddr = makeBytes32(0x10);
    let { contract, circuitCtx } = createSimulator({ score: BigInt(750), holderSecret: holderAddr });

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, holderAddr));

    const result = contract.impureCircuits.proveEligibility(circuitCtx, BigInt(700));
    expect(result.result).toBe(true);
  });

  it('proveEligibility returns false for ineligible score', () => {
    const holderAddr = makeBytes32(0x10);
    let { contract, circuitCtx } = createSimulator({ score: BigInt(500), holderSecret: holderAddr });

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, holderAddr));

    const result = contract.impureCircuits.proveEligibility(circuitCtx, BigInt(700));
    expect(result.result).toBe(false);
  });

  it('revoked credential fails eligibility', () => {
    const holderAddr = makeBytes32(0x10);
    let { contract, circuitCtx } = createSimulator({ score: BigInt(750), holderSecret: holderAddr });

    const issuerId = makeBytes32(0x01);
    ({ context: circuitCtx } = contract.impureCircuits.registerIssuer(circuitCtx, issuerId));
    ({ context: circuitCtx } = contract.impureCircuits.issueCredential(circuitCtx, holderAddr));
    ({ context: circuitCtx } = contract.impureCircuits.revokeCredential(circuitCtx, holderAddr));

    expect(() => {
      contract.impureCircuits.proveEligibility(circuitCtx, BigInt(300));
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

    const contractA = new Contract({
      adminSecret: (ctx: any) => [ctx, adminA],
      issuerSecret: (ctx: any) => [ctx, makeBytes32(0xBB)],
      credentialScore: (ctx: any) => [ctx, BigInt(750)],
      credentialSalt: (ctx: any) => [ctx, makeBytes32(0xDD)],
      holderSecret: (ctx: any) => [ctx, makeBytes32(0xCC)],
    });

    const adminId = makeBytes32(0x01);
    const coinPub = getCoinPublicKey();
    const ctorCtx = createConstructorContext({}, coinPub);
    const initResult = contractA.initialState(ctorCtx, adminId);

    let circuitCtx = createCircuitContext(
      dummyContractAddress(),
      coinPub,
      initResult.currentContractState,
      initResult.currentPrivateState,
    );

    const contractB = new Contract({
      adminSecret: (ctx: any) => [ctx, adminB],
      issuerSecret: (ctx: any) => [ctx, makeBytes32(0xBB)],
      credentialScore: (ctx: any) => [ctx, BigInt(750)],
      credentialSalt: (ctx: any) => [ctx, makeBytes32(0xDD)],
      holderSecret: (ctx: any) => [ctx, makeBytes32(0xCC)],
    });

    const issuerId = makeBytes32(0x01);
    expect(() => {
      contractB.impureCircuits.registerIssuer(circuitCtx, issuerId);
    }).toThrow();
  });
});
