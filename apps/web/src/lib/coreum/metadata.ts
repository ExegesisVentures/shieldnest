// apps/web/src/lib/coreum/metadata.ts
import { StargateClient } from '@cosmjs/stargate';
import { COREUM_CHAIN_CONFIG, CORE_DENOM, fromMicroAmount } from './chain';
import { createError, ErrorCodes, mapCosmosError } from '../errors';

/**
 * Token metadata interface
 */
export interface TokenMetadata {
  symbol: string;
  denom: string;
  decimals: number;
  logoUrl?: string;
  source: string;
}

/**
 * Portfolio balance with metadata
 */
export interface PortfolioBalance {
  denom: string;
  symbol: string;
  amount: string;
  microAmount: string;
  decimals: number;
  logoUrl?: string;
  valueUsd?: number;
}

/**
 * Cached client instance to avoid reconnections
 */
let stargateClient: StargateClient | null = null;

/**
 * Get or create Stargate client for Coreum
 */
async function getStargateClient(): Promise<StargateClient> {
  if (!stargateClient) {
    try {
      stargateClient = await StargateClient.connect(COREUM_CHAIN_CONFIG.rpc);
    } catch (error) {
      throw mapCosmosError(error);
    }
  }
  return stargateClient;
}

/**
 * Fetch balance for a given address
 */
export async function fetchAddressBalances(address: string): Promise<PortfolioBalance[]> {
  try {
    const client = await getStargateClient();
    const balances = await client.getAllBalances(address);
    
    const portfolioBalances: PortfolioBalance[] = [];
    
    for (const balance of balances) {
      const metadata = await getTokenMetadata(balance.denom);
      
      portfolioBalances.push({
        denom: balance.denom,
        symbol: metadata.symbol,
        amount: fromMicroAmount(balance.amount, metadata.decimals).toString(),
        microAmount: balance.amount,
        decimals: metadata.decimals,
        logoUrl: metadata.logoUrl,
        // TODO(v2): Add price fetching for USD values
        valueUsd: undefined,
      });
    }
    
    return portfolioBalances;
  } catch (error) {
    throw mapCosmosError(error);
  }
}

/**
 * Get token metadata from various sources
 */
export async function getTokenMetadata(denom: string): Promise<TokenMetadata> {
  // Handle native CORE token
  if (denom === CORE_DENOM) {
    return {
      symbol: 'CORE',
      denom: CORE_DENOM,
      decimals: 6,
      logoUrl: '/tokens/core.svg',
      source: 'native',
    };
  }
  
  // TODO(v1): Implement CoreDEX token metadata fetching
  // For now, return basic metadata for unknown tokens
  return {
    symbol: denom.replace('u', '').toUpperCase(),
    denom,
    decimals: 6,
    logoUrl: '/tokens/default.svg',
    source: 'unknown',
  };
}

/**
 * Validate if an address has any balance
 */
export async function hasBalance(address: string): Promise<boolean> {
  try {
    const balances = await fetchAddressBalances(address);
    return balances.length > 0 && balances.some(b => parseFloat(b.amount) > 0);
  } catch (error) {
    // If we can't fetch balances, assume address is valid but empty
    return false;
  }
}

/**
 * Get account info for an address (useful for validation)
 */
export async function getAccountInfo(address: string) {
  try {
    const client = await getStargateClient();
    const account = await client.getAccount(address);
    return account;
  } catch (error) {
    // Account not found is not an error - just means no transactions yet
    if (error.message?.includes('not found')) {
      return null;
    }
    throw mapCosmosError(error);
  }
}

/**
 * Calculate total portfolio value in USD
 * TODO(v2): Implement price fetching from price oracle
 */
export async function calculatePortfolioValue(balances: PortfolioBalance[]): Promise<number> {
  // For v1, we'll return 0 as price fetching is not implemented
  // TODO(v2): Integrate with price oracle (CoinGecko, etc.)
  return 0;
}

/**
 * Clean up client connection
 */
export function disconnectClient() {
  if (stargateClient) {
    stargateClient.disconnect();
    stargateClient = null;
  }
}
