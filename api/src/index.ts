export interface KreditProviders {
  zkConfigProvider: any;
  proofProvider: any;
  publicDataProvider: any;
  walletProvider: any;
  midnightProvider: any;
  privateStateProvider: any;
}

export type KreditPrivateState = {
  adminSecretKey: Uint8Array;
  issuerSecretKey: Uint8Array;
  holderSecretKey: Uint8Array;
  score: bigint;
  salt: Uint8Array;
};

export type NetworkId = 'preprod' | 'preview' | 'undeployed';
