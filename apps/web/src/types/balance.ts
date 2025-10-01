export interface CoreumBalance {
  available: string;
  staked: string;
  unbonding: string;
  rewards: string;
}

export interface TokenPrice {
  usd: number;
  lastUpdated: Date;
}

export interface USDValues {
  available: number;
  staked: number;
  unbonding: number;
  rewards: number;
  total: number;
}

export interface CoreumTokenData {
  amount: CoreumBalance;
  prices: TokenPrice;
  usdValues: USDValues;
}

export interface OtherToken {
  denom: string;
  symbol: string;
  amount: string;
  decimals: number;
  usdValue?: number;
  usdPrice?: number;
}

export interface ValidatorInfo {
  operatorAddress: string;
  moniker: string;
  delegatedAmount: string;
  rewards: string;
}

export interface UnbondingEntry {
  validatorAddress: string;
  amount: string;
  completionTime: string;
}

export interface StakingInfo {
  validators: ValidatorInfo[];
  totalDelegated: string;
  totalRewards: string;
  unbondingEntries: UnbondingEntry[];
}

export interface WalletBalances {
  balances: {
    coreum: CoreumTokenData;
    tokens: OtherToken[];
  };
  stakingInfo: StakingInfo;
}

export interface BalanceApiResponse {
  success: boolean;
  data: WalletBalances;
}

export interface PriceApiResponse {
  success: boolean;
  data: {
    price: number;
    currency: string;
    lastUpdated: Date;
  };
}
