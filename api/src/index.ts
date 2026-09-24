import type {
  MidnightProvider,
  PrivateStateProvider,
  ProofProvider,
  PublicDataProvider,
  WalletProvider,
  ZKConfigProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { KreditPrivateState } from 'kredit-contract';

export type { KreditPrivateState } from 'kredit-contract';

export type KreditCircuitName =
  | 'rotateAdmin'
  | 'registerIssuer'
  | 'unregisterIssuer'
  | 'issueCredential'
  | 'revokeCredential'
  | 'proveEligibility'
  | 'proveNotRevoked';

export type KreditProviders = {
  zkConfigProvider: ZKConfigProvider<KreditCircuitName>;
  proofProvider: ProofProvider;
  publicDataProvider: PublicDataProvider;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
  privateStateProvider: PrivateStateProvider<string, KreditPrivateState>;
};

export type NetworkId = 'preprod' | 'preview' | 'undeployed';