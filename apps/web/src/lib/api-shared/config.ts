export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Blockchain
  chainId: process.env.CHAIN_ID || 'coreum-mainnet-1',
  rpcEndpoint: process.env.RPC_ENDPOINT || 'https://full-node.mainnet-1.coreum.dev:26657',
  restEndpoint: process.env.REST_ENDPOINT || 'https://full-node.mainnet-1.coreum.dev:1317',

  // Contract Addresses
  contracts: {
    riseNftCw721: process.env.RISE_NFT_CW721_ADDRESS || '',
    rollNftCw721: process.env.ROLL_NFT_CW721_ADDRESS || '',
    buybackTreasury: process.env.BUYBACK_TREASURY_ADDRESS || '',
    stakingEscrow: process.env.STAKING_ESCROW_ADDRESS || '',
    lpFeeDistributor: process.env.LP_FEE_DISTRIBUTOR_ADDRESS || '',
    oracleVerifier: process.env.ORACLE_VERIFIER_ADDRESS || '',
  },

  // Pricing
  pricing: {
    newRollMintPriceUsd: Number(process.env.NEW_ROLL_MINT_PRICE_USD) || 1000,
    ogMinListPriceUsd: Number(process.env.OG_MIN_LIST_PRICE_USD) || 5000,
    backendBookValueUsd: Number(process.env.BACKEND_BOOK_VALUE_USD) || 10000,
    floorModel: process.env.FLOOR_MODEL || 'bonding_curve',
    floorIncrementUsd: Number(process.env.FLOOR_INCREMENT_USD) || 50,
  },

  // Payouts
  payouts: {
    sellbackPayoutMode: process.env.SELLBACK_PAYOUT_MODE || 'token_amount_locked_at_sale_price',
    stakingWaitDays: Number(process.env.STAKING_WAIT_DAYS) || 14,
    stakeMode: process.env.STAKE_MODE || 'native_delegation',
    validatorAddress: process.env.VALIDATOR_ADDRESS || '',
    priceOracle: process.env.PRICE_ORACLE || 'backend_signed_TWAP',
  },

  // Rewards
  rewards: {
    epochLengthDays: Number(process.env.EPOCH_LENGTH_DAYS) || 7,
    lpFeePoolSharePerNft: Number(process.env.LP_FEE_POOL_SHARE_PER_NFT) || 0.005,
    partnerAirdrops: process.env.PARTNER_AIRDROPS === 'enabled',
  },

  // Supply
  supply: {
    maxSupply: Number(process.env.MAX_SUPPLY) || 100,
    burnOnBuyback: process.env.BURN_ON_BUYBACK === 'true',
  },

  // Access Gating
  accessGating: {
    requireTma: process.env.REQUIRE_TMA === 'true',
  },

  // Marketplace Fees
  marketplaceFees: {
    rollHolderFeeBps: Number(process.env.ROLL_HOLDER_FEE_BPS) || 0,
    nonHolderFeeBps: Number(process.env.NON_HOLDER_FEE_BPS) || 250,
  },

  // Auth
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    magicLinkSecret: process.env.MAGIC_LINK_SECRET!,
  },

  // JWT (legacy support)
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'postmark',
    postmarkApiToken: process.env.POSTMARK_API_TOKEN || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@rollnft.com',
  },

  // Oracle
  oracle: {
    privateKey: process.env.ORACLE_PRIVATE_KEY || '',
    publicKey: process.env.ORACLE_PUBLIC_KEY || '',
  },

  // Observability
  observability: {
    sentryDsn: process.env.SENTRY_DSN || '',
    enableComplianceLogging: process.env.ENABLE_COMPLIANCE_LOGGING === 'true',
  },

  // Server
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3001,
    frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'MAGIC_LINK_SECRET',
];

export function validateConfig() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  return true;
}

