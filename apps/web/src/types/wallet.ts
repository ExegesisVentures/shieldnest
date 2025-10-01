export interface WalletInfo {
  name: string;
  prettyName: string;
  logo: string;
  mode: 'extension' | 'walletconnect' | 'mobile';
  mobileDisabled?: boolean;
  rejectMessage?: string;
  connectEventNamesOnWindow?: string[];
  downloads?: {
    desktop?: string[];
    mobile?: string[];
  };
}

export interface ConnectedWallet {
  name: string;
  address: string;
  isLedger?: boolean;
  source?: string;
  isReadOnly?: boolean;
  connectionType?: 'extension' | 'manual' | 'walletconnect';
}

export interface WalletAccount {
  address: string;
  algo: string;
  pubkey: Uint8Array;
}

export interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  bip44: {
    coinType: number;
  };
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
  currencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    coinGeckoId?: string;
  }>;
  feeCurrencies: Array<{
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    coinGeckoId?: string;
    gasPriceStep?: {
      low: number;
      average: number;
      high: number;
    };
  }>;
  stakeCurrency: {
    coinDenom: string;
    coinMinimalDenom: string;
    coinDecimals: number;
    coinGeckoId?: string;
  };
}

export interface SigningResult {
  signature: string;
  publicKey?: string;
  address: string;
}
