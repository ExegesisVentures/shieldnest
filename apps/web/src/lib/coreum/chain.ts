// apps/web/src/lib/coreum/chain.ts
import { Coin } from '@cosmjs/stargate';

/**
 * Coreum chain configuration
 */
export const COREUM_CHAIN_CONFIG = {
  chainId: process.env.NEXT_PUBLIC_COREUM_CHAIN_ID || 'coreum-mainnet-1',
  chainName: 'Coreum',
  rpc: process.env.NEXT_PUBLIC_COREUM_RPC || 'https://full-node.mainnet-1.coreum.dev:26657',
  rest: process.env.NEXT_PUBLIC_COREUM_REST || 'https://full-node.mainnet-1.coreum.dev:1317',
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
      coinDenom: 'CORE',
      coinMinimalDenom: 'ucore',
      coinDecimals: 6,
      coinGeckoId: 'coreum',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'CORE',
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
    coinDenom: 'CORE',
    coinMinimalDenom: 'ucore',
    coinDecimals: 6,
    coinGeckoId: 'coreum',
  },
  features: ['cosmwasm', 'ibc-transfer', 'ibc-go'],
} as const;

/**
 * Standard Coreum denoms
 */
export const CORE_DENOM = 'ucore';
export const CORE_SYMBOL = 'CORE';
export const CORE_DECIMALS = 6;

/**
 * Helper to validate Coreum address format
 */
export function isValidCoreumAddress(address: string): boolean {
  return /^core1[a-z0-9]{38}$/.test(address);
}

/**
 * Helper to format coin amounts with proper decimals
 */
export function formatCoin(coin: Coin, decimals = 6): string {
  const amount = parseFloat(coin.amount) / Math.pow(10, decimals);
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Helper to convert human readable amount to micro units
 */
export function toMicroAmount(amount: number, decimals = 6): string {
  return Math.floor(amount * Math.pow(10, decimals)).toString();
}

/**
 * Helper to convert micro units to human readable amount
 */
export function fromMicroAmount(microAmount: string, decimals = 6): number {
  return parseFloat(microAmount) / Math.pow(10, decimals);
}

/**
 * Get display name for a denom
 */
export function getDenomDisplayName(denom: string): string {
  if (denom === CORE_DENOM) return CORE_SYMBOL;
  
  // Handle other Coreum tokens - this will be expanded based on token metadata
  if (denom.startsWith('ucore-')) {
    return denom.replace('ucore-', '').toUpperCase();
  }
  
  return denom.toUpperCase();
}

/**
 * Check if a denom is native to Coreum
 */
export function isNativeCoreum(denom: string): boolean {
  return denom === CORE_DENOM || denom.startsWith('ucore-');
}
