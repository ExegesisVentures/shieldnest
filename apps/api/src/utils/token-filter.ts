/**
 * Token Filtering Utilities
 * Modular system for filtering and processing blockchain token data
 */

// Declare fetch for TypeScript (Node.js 18+ has built-in fetch)
declare const fetch: any;

export interface RawTokenBalance {
  denom: string;
  amount: string;
}

export interface ProcessedToken {
  denom: string;
  symbol: string;
  amount: string;
  decimals: number;
  usdValue: number;
  usdPrice?: number; // Price per token
}

export interface TokenFilterOptions {
  excludeZeroBalances?: boolean;
  excludeCore?: boolean;
  excludeTestTokens?: boolean;
  excludeBridgeTokens?: boolean;
  minAmount?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Known token mappings for consistent symbol resolution
 */
export const KNOWN_TOKEN_MAPPINGS = {
  'cozy': 'COZY',
  'cat': 'CAT', 
  'kong': 'KONG',
  'smart': 'SMART',
  'solo': 'SOLO',
  'xrp': 'XRP',
  'mart': 'MART',
  'lp': 'LP'
} as const;

/**
 * Token price mappings for known tokens
 * Maps clean symbol to CoinGecko ID or price source
 */
export const TOKEN_PRICE_MAPPINGS = {
  'CORE': 'coreum',
  'XRP': 'ripple',
  // Add more mappings as tokens get listed on CoinGecko
  // 'COZY': 'cozy-token', // Example when listed
  // 'KONG': 'kong-token', // Example when listed
} as const;

/**
 * Coreum DEX configuration
 */
export const COREUM_DEX_CONFIG = {
  restEndpoint: 'https://full-node.mainnet-1.coreum.dev:1317', // We'll import config in the functions that need it
  baseCurrency: 'ucore', // CORE is the base currency for price calculations
  priceCache: new Map<string, { price: number; timestamp: number }>(),
  cacheTimeout: 60000, // 1 minute cache
} as const;

/**
 * Fetch token price from CoinGecko
 */
async function fetchTokenPrice(coinId: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[coinId]?.usd || 0;
  } catch (error) {
    console.warn(`Failed to fetch price for ${coinId}:`, error);
    return 0;
  }
}

/**
 * Fetch token price from Coreum DEX by finding trading pairs with CORE
 */
async function fetchTokenPriceFromDEX(denom: string): Promise<number> {
  try {
    // Check cache first
    const cacheKey = `dex_${denom}`;
    const cached = COREUM_DEX_CONFIG.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < COREUM_DEX_CONFIG.cacheTimeout) {
      console.log(`📄 Using cached DEX price for ${denom}: $${cached.price}`);
      return cached.price;
    }

    console.log(`🔍 Fetching DEX price for token: ${denom}`);
    
    // First, get available order books to see if there's a trading pair with CORE
    const orderBooksResponse = await fetch(
      `${COREUM_DEX_CONFIG.restEndpoint}/coreum/dex/v1/order-books`
    );
    
    if (!orderBooksResponse.ok) {
      console.warn(`Failed to fetch order books: ${orderBooksResponse.statusText}`);
      return 0;
    }
    
    const orderBooksData = await orderBooksResponse.json();
    const orderBooks = orderBooksData.order_books || [];
    
    // Look for trading pairs where this token is paired with CORE
    const tradingPair = orderBooks.find((book: any) => 
      (book.base_denom === denom && book.quote_denom === COREUM_DEX_CONFIG.baseCurrency) ||
      (book.base_denom === COREUM_DEX_CONFIG.baseCurrency && book.quote_denom === denom)
    );
    
    if (!tradingPair) {
      console.log(`🔍 No direct CORE trading pair found for ${denom}`);
      
      // Try to find indirect pairs (e.g., Token -> USDT -> CORE)
      // For now, return 0 but this could be expanded
      return 0;
    }
    
    console.log(`✅ Found trading pair:`, tradingPair);
    
    // Calculate price from order book data
    // We'll use the mid-market price (average of best bid and ask)
    let price = 0;
    
    try {
      // This is a simplified implementation - in production you'd want more sophisticated pricing
      // like volume-weighted average price (VWAP) or time-weighted average price (TWAP)
      
      // For now, since we can't easily query specific orders due to API complexity,
      // we'll mark that we found a trading pair but price discovery needs more work
      
      // Future enhancements could include:
      // 1. Querying recent trade history
      // 2. Getting order book depth
      // 3. Calculating volume-weighted prices
      // 4. Using multiple trading pairs for indirect pricing
      
      console.log(`📊 Trading pair exists for ${denom}, but price calculation needs implementation`);
      
    } catch (priceError) {
      console.warn(`Error calculating price from order book:`, priceError);
    }
    
    // Cache the result
    COREUM_DEX_CONFIG.priceCache.set(cacheKey, {
      price,
      timestamp: Date.now()
    });
    
    console.log(`💰 DEX price for ${denom}: $${price}`);
    return price;
    
  } catch (error) {
    console.warn(`Failed to fetch DEX price for ${denom}:`, error);
    return 0;
  }
}

/**
 * Get USD price for a token by symbol using hybrid approach
 */
async function getTokenPrice(symbol: string, denom?: string): Promise<number> {
  // First try CoinGecko for well-known tokens
  const coinId = TOKEN_PRICE_MAPPINGS[symbol as keyof typeof TOKEN_PRICE_MAPPINGS];
  if (coinId) {
    console.log(`🥥 Using CoinGecko for ${symbol}`);
    return await fetchTokenPrice(coinId);
  }
  
  // For native Coreum tokens, try DEX if denom is provided
  if (denom && denom !== COREUM_DEX_CONFIG.baseCurrency) {
    console.log(`🔗 Trying Coreum DEX for ${symbol} (${denom})`);
    const dexPrice = await fetchTokenPriceFromDEX(denom);
    if (dexPrice > 0) {
      return dexPrice;
    }
  }
  
  // No price source found
  console.log(`🔍 No price source found for token: ${symbol}`);
  return 0;
}

/**
 * Fetch multiple token prices in parallel
 * @param tokensData Array of tokens with symbol and denom information
 */
export async function fetchMultipleTokenPrices(tokensData: Array<{ symbol: string; denom?: string }>): Promise<Record<string, number>> {
  console.log(`🔄 Fetching prices for ${tokensData.length} tokens:`, tokensData.map(t => t.symbol));
  
  const pricePromises = tokensData.map(async (tokenData) => {
    const price = await getTokenPrice(tokenData.symbol, tokenData.denom);
    return { symbol: tokenData.symbol, price };
  });
  
  const results = await Promise.all(pricePromises);
  const priceMap: Record<string, number> = {};
  
  results.forEach(({ symbol, price }) => {
    priceMap[symbol] = price;
    console.log(`💰 Price for ${symbol}: $${price}`);
  });
  
  return priceMap;
}

/**
 * Legacy function for backward compatibility - fetches prices by symbols only
 */
export async function fetchMultipleTokenPricesBySymbols(symbols: string[]): Promise<Record<string, number>> {
  const tokensData = symbols.map(symbol => ({ symbol }));
  return await fetchMultipleTokenPrices(tokensData);
}

/**
 * Check if a token is a test/invalid token based on its denomination
 */
function isTestOrInvalidToken(denom: string): boolean {
  // Patterns that indicate test or invalid tokens
  const testPatterns = [
    /^xrpl[0-9a-f]+.*core1/i,    // Malformed XRP bridge tokens
    /^test/i,                    // Test tokens
    /^demo/i,                    // Demo tokens
    /fake/i,                     // Fake tokens
    /invalid/i,                  // Invalid tokens
    /[0-9a-f]{32,}/i,           // Very long hex strings (likely hashes)
  ];

  return testPatterns.some(pattern => pattern.test(denom));
}

/**
 * Check if a token is a bridge token based on its denomination
 */
function isBridgeToken(denom: string): boolean {
  // Patterns that indicate bridge tokens
  const bridgePatterns = [
    /^ibc\//i,                   // IBC tokens
    /bridge/i,                   // Bridge tokens
    /wrapped/i,                  // Wrapped tokens
    /^w[a-z]+$/i,               // Wrapped tokens (wETH, wBTC, etc.)
  ];

  return bridgePatterns.some(pattern => pattern.test(denom));
}

/**
 * Filter tokens based on balance and other criteria
 */
export function filterTokensByBalance(
  tokens: RawTokenBalance[], 
  options: TokenFilterOptions = {}
): RawTokenBalance[] {
  const {
    excludeZeroBalances = true,
    excludeCore = true,
    excludeTestTokens = true,
    excludeBridgeTokens = false,
    minAmount = 0,
    logLevel = 'debug'
  } = options;

  const log = (level: string, message: string, data?: any) => {
    if (logLevel === 'none') return;
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = logLevels.indexOf(logLevel);
    const messageLevel = logLevels.indexOf(level);
    
    if (messageLevel >= currentLevel) {
      console.log(`🔍 [${level.toUpperCase()}] ${message}`, data || '');
    }
  };

  log('info', '=== Starting Token Filtering ===');
  log('debug', 'Filter options:', options);
  log('debug', `Total tokens to process: ${tokens.length}`);

  const filtered = tokens.filter((token) => {
    const amount = parseFloat(token.amount || '0');
    
    log('debug', `Checking token: ${token.denom}`, {
      rawAmount: token.amount,
      parsedAmount: amount,
      denom: token.denom
    });

    // Filter out ucore if requested
    if (excludeCore && token.denom === 'ucore') {
      log('debug', `❌ Filtered out CORE token: ${token.denom}`);
      return false;
    }

    // Filter out test/invalid tokens if requested
    if (excludeTestTokens && isTestOrInvalidToken(token.denom)) {
      log('debug', `❌ Filtered out test/invalid token: ${token.denom}`);
      return false;
    }

    // Filter out bridge tokens if requested
    if (excludeBridgeTokens && isBridgeToken(token.denom)) {
      log('debug', `❌ Filtered out bridge token: ${token.denom}`);
      return false;
    }

    // Filter out zero balances if requested
    if (excludeZeroBalances && amount <= minAmount) {
      log('debug', `❌ Filtered out zero/low balance: ${token.denom} (${amount})`);
      return false;
    }

    log('debug', `✅ Token passed filter: ${token.denom} (${amount})`);
    return true;
  });

  log('info', `=== Filtering Complete: ${filtered.length}/${tokens.length} tokens passed ===`);
  
  return filtered;
}

/**
 * Clean token symbol from denomination
 */
export function cleanTokenSymbol(denom: string): string {
  let symbol = denom;
  
  console.log(`🧹 Cleaning symbol: "${denom}"`);
  
  // Handle factory tokens
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    symbol = parts[parts.length - 1];
    console.log(`🏭 Factory token subdenom: "${symbol}"`);
  }
  
  // Handle IBC tokens
  else if (denom.startsWith('ibc/')) {
    symbol = `IBC${denom.slice(4, 8).toUpperCase()}`;
    console.log(`🌐 IBC token: "${symbol}"`);
    return symbol;
  }

  // Aggressive cleaning for all token types
  symbol = symbol.replace(/-[a-f0-9]{6,}$/i, ''); // Remove hash suffixes
  symbol = symbol.replace(/[0-9a-f]{8,}/gi, ''); // Remove long hex strings
  symbol = symbol.replace(/[-_]+/g, ''); // Remove separators
  symbol = symbol.replace(/ft$/i, ''); // Remove 'ft' suffix
  symbol = symbol.replace(/core$/i, ''); // Remove 'core' suffix
  symbol = symbol.replace(/1g?$/i, ''); // Remove version numbers
  symbol = symbol.replace(/\d+$/g, ''); // Remove trailing numbers
  symbol = symbol.replace(/^u/, ''); // Remove 'u' prefix
  symbol = symbol.replace(/^micro/, ''); // Remove 'micro' prefix

  // Check against known token mappings
  const lowerSymbol = symbol.toLowerCase();
  for (const [key, value] of Object.entries(KNOWN_TOKEN_MAPPINGS)) {
    if (lowerSymbol.includes(key)) {
      symbol = value;
      console.log(`✅ Matched known token: ${key} → ${value}`);
      break;
    }
  }

  // Ensure uppercase and length limits
  if (!Object.values(KNOWN_TOKEN_MAPPINGS).includes(symbol as any)) {
    symbol = symbol.toUpperCase();
  }
  
  if (symbol.length > 8) {
    symbol = symbol.slice(0, 8);
  }
  
  if (!symbol) {
    symbol = 'TOKEN';
  }

  console.log(`🏷️ Final cleaned symbol: "${denom}" → "${symbol}"`);
  return symbol;
}

/**
 * Process filtered tokens into final format
 */
export function processTokens(
  filteredTokens: RawTokenBalance[],
  options: { defaultDecimals?: number; prices?: Record<string, number> } = {}
): ProcessedToken[] {
  const { defaultDecimals = 6, prices = {} } = options;
  
  console.log(`🔄 Processing ${filteredTokens.length} filtered tokens`);
  
  return filteredTokens.map((token) => {
    const symbol = cleanTokenSymbol(token.denom);
    const price = prices[symbol] || 0;
    
    // Convert token amount to decimal format
    const tokenAmount = parseFloat(token.amount) / Math.pow(10, defaultDecimals);
    const usdValue = tokenAmount * price;
    
    const processed: ProcessedToken = {
      denom: token.denom,
      symbol,
      amount: token.amount,
      decimals: defaultDecimals,
      usdValue,
      usdPrice: price
    };

    console.log(`✅ Processed token:`, {
      denom: token.denom,
      symbol,
      amount: token.amount,
      tokenAmount: tokenAmount.toFixed(6),
      price: `$${price}`,
      usdValue: `$${usdValue.toFixed(2)}`
    });

    return processed;
  });
}

/**
 * Complete token processing pipeline with price fetching
 */
export async function processTokensPipeline(
  rawTokens: RawTokenBalance[],
  filterOptions: TokenFilterOptions = {},
  processOptions: { defaultDecimals?: number; includePrices?: boolean } = {}
): Promise<ProcessedToken[]> {
  console.log('🚀 Starting token processing pipeline');
  
  // Step 1: Filter tokens
  const filtered = filterTokensByBalance(rawTokens, filterOptions);
  
  // Step 2: Get unique tokens for price lookup with denomination data
  let prices: Record<string, number> = {};
  if (processOptions.includePrices !== false && filtered.length > 0) {
    const tokensData = filtered.map(token => ({
      symbol: cleanTokenSymbol(token.denom),
      denom: token.denom
    }));
    
    // Remove duplicates based on symbol
    const uniqueTokensData = tokensData.filter((token, index, arr) => 
      arr.findIndex(t => t.symbol === token.symbol) === index
    );
    
    console.log(`💰 Fetching prices for tokens:`, uniqueTokensData);
    prices = await fetchMultipleTokenPrices(uniqueTokensData);
  }
  
  // Step 3: Process tokens with prices
  const processed = processTokens(filtered, {
    ...processOptions,
    prices
  });
  
  console.log(`🎯 Pipeline complete: ${processed.length} tokens ready for frontend`);
  
  return processed;
}

/**
 * Legacy synchronous version (without price fetching)
 */
export function processTokensPipelineSync(
  rawTokens: RawTokenBalance[],
  filterOptions: TokenFilterOptions = {},
  processOptions: { defaultDecimals?: number } = {}
): ProcessedToken[] {
  console.log('🚀 Starting synchronous token processing pipeline');
  
  // Step 1: Filter tokens
  const filtered = filterTokensByBalance(rawTokens, filterOptions);
  
  // Step 2: Process tokens without prices
  const processed = processTokens(filtered, processOptions);
  
  console.log(`🎯 Sync pipeline complete: ${processed.length} tokens ready for frontend`);
  
  return processed;
}
