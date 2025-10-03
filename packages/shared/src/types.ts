// Common types used across ShieldNest applications

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  icon?: string;
}

export interface Pool {
  id: string;
  tokens: Token[];
  liquidity: string;
  apr: number;
  volume24h: string;
}

export interface UserPosition {
  poolId: string;
  tokens: {
    token: Token;
    amount: string;
  }[];
  value: string;
}

export interface Transaction {
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'unstake';
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  amount?: string;
  token?: Token;
}
