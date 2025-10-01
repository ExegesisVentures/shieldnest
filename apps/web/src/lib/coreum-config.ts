import { ChainInfo } from '@/types/wallet';

export const COREUM_CHAIN_INFO: ChainInfo = {
  chainId: 'coreum-mainnet-1',
  chainName: 'Coreum',
  rpc: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://full-node.mainnet-1.coreum.dev:26657',
  rest: process.env.NEXT_PUBLIC_REST_ENDPOINT || 'https://full-node.mainnet-1.coreum.dev:1317',
  bip44: {
    coinType: 990,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'core',
    bech32PrefixAccPub: 'corepub',
    bech32PrefixValAddr: 'corevaloper',
    bech32PrefixValPub: 'corevaloperpub',
    bech32PrefixConsAddr: 'corevalcons',
    bech32PrefixConsPub: 'corevalconspub',
  },
  currencies: [
    {
      coinDenom: 'COREUM',
      coinMinimalDenom: 'ucore',
      coinDecimals: 6,
      coinGeckoId: 'coreum',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'COREUM',
      coinMinimalDenom: 'ucore',
      coinDecimals: 6,
      coinGeckoId: 'coreum',
      gasPriceStep: {
        low: 0.0625,
        average: 0.1,
        high: 0.25,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'COREUM',
    coinMinimalDenom: 'ucore',
    coinDecimals: 6,
    coinGeckoId: 'coreum',
  },
};

export async function suggestChain(wallet: any): Promise<void> {
  try {
    await wallet.experimentalSuggestChain(COREUM_CHAIN_INFO);
  } catch (error) {
    console.error('Failed to suggest chain:', error);
    throw new Error('Failed to add Coreum network to wallet');
  }
}

export async function enableChain(wallet: any, chainId: string): Promise<void> {
  try {
    await wallet.enable(chainId);
  } catch (error: any) {
    console.error('Failed to enable chain:', error);
    
    // Check if user denied the connection
    if (error?.message?.includes('User rejected') || 
        error?.message?.includes('rejected') ||
        error?.code === 4001) {
      throw new Error('Connection was denied by user');
    }
    
    throw new Error('Failed to connect to Coreum network');
  }
}
