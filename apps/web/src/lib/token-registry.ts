/**
 * Coreum Token Registry
 * Maps raw token denominations to clean metadata with theme-aware images
 */

import { getThemeAwareImageUrl, normalizeTokenSymbol } from '@/utils/theme-aware-images';

export interface TokenMetadata {
  denom: string;          // Raw denomination (e.g. "ucore", "factory/...")
  symbol: string;         // Clean ticker (e.g. "CORE", "COZY")
  name: string;          // Full name (e.g. "Coreum", "Cozy Token")
  decimals: number;      // Number of decimal places
  imageUrl?: string;     // Token logo URL (base URL, theme variants handled automatically)
  lightImageUrl?: string; // Optional explicit light mode image
  darkImageUrl?: string;  // Optional explicit dark mode image
  description?: string;  // Brief description
  website?: string;      // Official website
  isNative: boolean;     // Is this a native Coreum token?
  category: 'native' | 'fungible' | 'nft' | 'other';
}

/**
 * Known Coreum token metadata registry
 */
export const COREUM_TOKEN_REGISTRY: TokenMetadata[] = [
  // Native CORE token
  {
    denom: 'ucore',
    symbol: 'CORE',
    name: 'Coreum',
    decimals: 6,
    imageUrl: '/tokens/core.svg',
    description: 'Native token of the Coreum blockchain',
    website: 'https://coreum.com',
    isNative: true,
    category: 'native'
  },
  
  // Known fungible tokens on Coreum (based on common tokens)
  {
    denom: 'cozy-ft',
    symbol: 'COZY',
    name: 'Cozy',
    decimals: 6,
    imageUrl: '/tokens/cozy.svg',
    description: 'Cozy ecosystem token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'ucat',
    symbol: 'CAT',
    name: 'Bobcat',
    decimals: 6,
    imageUrl: '/tokens/bobcat.svg',
    description: 'Bobcat themed token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'smart-ft',
    symbol: 'SMART',
    name: 'Smart',
    decimals: 6,
    imageUrl: '/tokens/smart.svg',
    description: 'Smart contract token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'kong-ft',
    symbol: 'KONG',
    name: 'Kong',
    decimals: 6,
    imageUrl: '/tokens/kong.svg',
    description: 'Kong ecosystem token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'solo-ft',
    symbol: 'SOLO',
    name: 'Solo',
    decimals: 6,
    imageUrl: '/tokens/solo.svg',
    lightImageUrl: '/tokens/solo_Light.svg',
    darkImageUrl: '/tokens/solo_Dark.svg',
    description: 'Solo token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'uxrp',
    symbol: 'XRP',
    name: 'XRP',
    decimals: 6,
    imageUrl: '/tokens/xrp.svg',
    description: 'XRP token on Coreum',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'mart-ft',
    symbol: 'MART',
    name: 'Mart',
    decimals: 6,
    imageUrl: '/tokens/mart.svg',
    description: 'Mart token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'lp-ft',
    symbol: 'LP',
    name: 'LP',
    decimals: 6,
    imageUrl: '/tokens/lp.svg',
    description: 'Liquidity Provider token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'roll-ft',
    symbol: 'ROLL',
    name: 'Roll Token',
    decimals: 6,
    imageUrl: '/tokens/roll.svg',
    description: 'Roll ecosystem token',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz',
    symbol: 'ROLL',
    name: 'Roll Token',
    decimals: 6,
    imageUrl: '/tokens/roll.svg',
    description: 'Roll ecosystem token on Coreum',
    isNative: false,
    category: 'fungible'
  },
  {
    denom: 'shield-ft',
    symbol: 'SHIELD',
    name: 'Shield Token',
    decimals: 6,
    imageUrl: '/tokens/ShieldNest.svg',
    lightImageUrl: '/tokens/ShieldNest_light.svg',
    darkImageUrl: '/tokens/ShieldNest_dark.svg',
    description: 'ShieldNest ecosystem token',
    isNative: false,
    category: 'fungible'
  },
  
  // Add more known tokens here as they become available
  // For factory tokens, you might need to map by prefix or fetch from a registry
];

/**
 * Get token metadata with API-first approach and fallback to local registry
 */
export async function getTokenMetadataAsync(denom: string): Promise<TokenMetadata> {
  try {
    // Try to fetch from API first (this uses the Supabase database)
    const response = await fetch(`http://localhost:3001/api/tokens/${encodeURIComponent(denom)}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log(`✅ Fetched ${result.data.symbol} from database:`, result.data.imageUrl);
        return {
          denom: result.data.denom,
          symbol: result.data.symbol,
          name: result.data.name,
          decimals: result.data.decimals,
          imageUrl: result.data.imageUrl || '/tokens/default.svg',
          description: result.data.description,
          website: result.data.website,
          isNative: result.data.isNative,
          category: result.data.category
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch token metadata from API, using fallback:', error);
  }

  // Fallback to local registry
  return getTokenMetadata(denom);
}

/**
 * Utility function to get token metadata by denomination (synchronous fallback)
 */
export function getTokenMetadata(denom: string): TokenMetadata {
  // Try to find exact match first
  const exactMatch = COREUM_TOKEN_REGISTRY.find(token => token.denom === denom);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Handle factory tokens (factory/creator/subdenom)
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    const subdenom = parts[parts.length - 1];
    
    // Clean up subdenom to remove hashes and technical suffixes
    let cleanSubdenom = subdenom;
    
    // Remove common hash patterns and technical suffixes
    cleanSubdenom = cleanSubdenom.replace(/-[a-f0-9]{6,}$/i, ''); // Remove hash suffixes like -abc123
    cleanSubdenom = cleanSubdenom.replace(/[0-9a-f]{8,}/gi, ''); // Remove long hex strings
    cleanSubdenom = cleanSubdenom.replace(/[-_]+/g, ''); // Remove separators
    
    // Try to find by subdenom or cleaned subdenom with more aggressive matching
    console.log(`🔍 Trying to match factory token: subdenom="${subdenom}", cleanSubdenom="${cleanSubdenom}"`);
    
    const factoryMatch = COREUM_TOKEN_REGISTRY.find(token => {
      const match = token.denom.includes(subdenom) || 
                   token.denom.includes(cleanSubdenom) ||
                   token.symbol.toLowerCase() === subdenom.toLowerCase() ||
                   token.symbol.toLowerCase() === cleanSubdenom.toLowerCase() ||
                   subdenom.toLowerCase().includes(token.symbol.toLowerCase()) ||
                   cleanSubdenom.toLowerCase().includes(token.symbol.toLowerCase()) ||
                   // Additional aggressive matching for known patterns
                   (subdenom.toLowerCase().includes('cozy') && token.symbol === 'COZY') ||
                   (subdenom.toLowerCase().includes('kong') && token.symbol === 'KONG') ||
                   (subdenom.toLowerCase().includes('cat') && token.symbol === 'CAT') ||
                   (subdenom.toLowerCase().includes('mart') && token.symbol === 'MART') ||
                   (subdenom.toLowerCase().includes('xrp') && token.symbol === 'XRP') ||
                   (subdenom.toLowerCase().includes('lp') && token.symbol === 'LP') ||
                   (subdenom.toLowerCase().includes('smart') && token.symbol === 'SMART');
      
      if (match) {
        console.log(`✅ Found factory match: ${subdenom} → ${token.symbol}`);
      }
      return match;
    });
    if (factoryMatch) {
      return factoryMatch;
    }
    
    // Generate fallback metadata for unknown factory tokens with aggressive cleaning
    let cleanSymbol = cleanSubdenom || subdenom;
    
    // Remove common suffixes more aggressively
    cleanSymbol = cleanSymbol.replace(/core$/i, ''); // Remove 'core' suffix
    cleanSymbol = cleanSymbol.replace(/1g?$/i, ''); // Remove version numbers like '1', '1g'
    cleanSymbol = cleanSymbol.replace(/ft$/i, ''); // Remove 'ft' suffix
    cleanSymbol = cleanSymbol.replace(/\d+$/g, ''); // Remove any trailing numbers
    
    // If we still don't have a clean symbol, try to extract from known patterns
    let imageUrl = '/tokens/default.svg';
    
    if (cleanSymbol.toLowerCase().includes('cozy')) {
      cleanSymbol = 'COZY';
      imageUrl = '/tokens/cozy.svg';
    } else if (cleanSymbol.toLowerCase().includes('kong')) {
      cleanSymbol = 'KONG';
      imageUrl = '/tokens/kong.svg';
    } else if (cleanSymbol.toLowerCase().includes('cat')) {
      cleanSymbol = 'CAT';
      imageUrl = '/tokens/cat.svg';
    } else if (cleanSymbol.toLowerCase().includes('mart')) {
      cleanSymbol = 'MART';
      imageUrl = '/tokens/mart.svg';
    } else if (cleanSymbol.toLowerCase().includes('xrp')) {
      cleanSymbol = 'XRP';
      imageUrl = '/tokens/xrp.svg';
    } else if (cleanSymbol.toLowerCase().includes('lp')) {
      cleanSymbol = 'LP';
      imageUrl = '/tokens/lp.svg';
    } else if (cleanSymbol.toLowerCase().includes('smart')) {
      cleanSymbol = 'SMART';
      imageUrl = '/tokens/smart.svg';
    } else if (cleanSymbol.toLowerCase().includes('roll') || denom.includes('xrpl11f82115a5')) {
      cleanSymbol = 'ROLL';
      imageUrl = '/tokens/roll.svg';
    } else if (cleanSymbol.toLowerCase().includes('shield')) {
      cleanSymbol = 'SHIELD';
      imageUrl = '/tokens/shield.svg';
    } else {
      cleanSymbol = cleanSymbol.toUpperCase().slice(0, 8);
    }
    
    console.log(`🏭 Fallback factory token: ${subdenom} → ${cleanSymbol} with image: ${imageUrl}`);
    
    return {
      denom,
      symbol: cleanSymbol || 'TOKEN',
      name: cleanSymbol || 'Token',
      decimals: 6, // Default decimals for Coreum tokens
      imageUrl,
      description: `Token: ${cleanSymbol}`,
      isNative: false,
      category: 'fungible'
    };
  }
  
  // Handle IBC tokens (ibc/hash)
  if (denom.startsWith('ibc/')) {
    const hash = denom.slice(4);
    const shortHash = hash.slice(0, 8).toUpperCase();
    
    return {
      denom,
      symbol: `IBC-${shortHash}`,
      name: `IBC Token ${shortHash}`,
      decimals: 6,
      imageUrl: '/tokens/ibc.svg',
      description: 'Inter-Blockchain Communication token',
      isNative: false,
      category: 'other'
    };
  }
  
  // Fallback for unknown tokens with aggressive cleaning
  let cleanSymbol = denom;
  console.log(`🔧 Fallback cleaning for: ${denom}`);
  
  // Remove common prefixes
  cleanSymbol = cleanSymbol.replace(/^u/, ''); // Remove 'u' prefix
  cleanSymbol = cleanSymbol.replace(/^micro/, ''); // Remove 'micro' prefix
  
  // Remove hashes and long identifiers
  cleanSymbol = cleanSymbol.replace(/[0-9a-f]{8,}/gi, ''); // Remove long hex strings
  cleanSymbol = cleanSymbol.replace(/-[a-f0-9]{6,}$/i, ''); // Remove hash suffixes
  cleanSymbol = cleanSymbol.replace(/[-_]+/g, ''); // Remove separators
  
  // Remove common suffixes that might appear
  cleanSymbol = cleanSymbol.replace(/core$/i, ''); // Remove 'core' suffix
  cleanSymbol = cleanSymbol.replace(/1g?$/i, ''); // Remove version numbers
  cleanSymbol = cleanSymbol.replace(/\d+$/g, ''); // Remove any trailing numbers
  
  // Try to match known token patterns and get proper images
  let imageUrl = '/tokens/default.svg';
  
  if (cleanSymbol.toLowerCase().includes('cozy')) {
    cleanSymbol = 'COZY';
    imageUrl = '/tokens/cozy.svg';
  } else if (cleanSymbol.toLowerCase().includes('kong')) {
    cleanSymbol = 'KONG';
    imageUrl = '/tokens/kong.svg';
  } else if (cleanSymbol.toLowerCase().includes('cat')) {
    cleanSymbol = 'CAT';
    imageUrl = '/tokens/cat.svg';
  } else if (cleanSymbol.toLowerCase().includes('mart')) {
    cleanSymbol = 'MART';
    imageUrl = '/tokens/mart.svg';
  } else if (cleanSymbol.toLowerCase().includes('xrp')) {
    cleanSymbol = 'XRP';
    imageUrl = '/tokens/xrp.svg';
  } else if (cleanSymbol.toLowerCase().includes('lp')) {
    cleanSymbol = 'LP';
    imageUrl = '/tokens/lp.svg';
  } else if (cleanSymbol.toLowerCase().includes('smart')) {
    cleanSymbol = 'SMART';
    imageUrl = '/tokens/smart.svg';
  } else {
    cleanSymbol = cleanSymbol.toUpperCase();
    // Take only the first 8 characters if still too long
    if (cleanSymbol.length > 8) {
      cleanSymbol = cleanSymbol.slice(0, 8);
    }
  }
  
  console.log(`🔧 Fallback result: ${denom} → ${cleanSymbol} with image: ${imageUrl}`);
  
  return {
    denom,
    symbol: cleanSymbol || 'TOKEN',
    name: cleanSymbol || 'Token',
    decimals: 6,
    imageUrl,
    description: 'Token',
    isNative: false,
    category: 'other'
  };
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string, metadata: TokenMetadata): string {
  const num = parseFloat(amount) / Math.pow(10, metadata.decimals);
  if (num === 0) return '0';
  if (num < 0.001) return '<0.001';
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: Math.min(metadata.decimals, 6)
  });
}

/**
 * Get token image URL with theme awareness and fallback
 */
export function getTokenImageUrl(metadata: TokenMetadata, isDark?: boolean): string {
  // If explicit theme URLs are provided, use them
  if (isDark && metadata.darkImageUrl) {
    return metadata.darkImageUrl;
  }
  if (!isDark && metadata.lightImageUrl) {
    return metadata.lightImageUrl;
  }
  
  // Use theme-aware URL generation for base image
  if (metadata.imageUrl) {
    return getThemeAwareImageUrl(metadata.imageUrl, isDark);
  }
  
  return '/tokens/default.svg';
}

/**
 * Get the best available image URL for a token symbol with theme support
 */
export function getTokenImageUrlBySymbol(symbol: string, isDark?: boolean): string {
  const normalizedSymbol = normalizeTokenSymbol(symbol);
  
  // Check for explicit theme variants first
  if (isDark) {
    const darkUrl = `/tokens/${normalizedSymbol}_dark.svg`;
    return darkUrl;
  }
  if (isDark === false) {
    const lightUrl = `/tokens/${normalizedSymbol}_light.svg`;
    return lightUrl;
  }
  
  // Fallback to base image
  const baseUrl = `/tokens/${normalizedSymbol}.svg`;
  return baseUrl;
}

/**
 * Clean denomination for display (remove technical prefixes)
 */
export function cleanDenomination(denom: string): string {
  // Remove common prefixes
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    return parts[parts.length - 1];
  }
  
  if (denom.startsWith('ibc/')) {
    return `IBC-${denom.slice(4, 12)}...`;
  }
  
  // Remove 'u' prefix from micro denominations
  if (denom.startsWith('u') && denom.length > 1) {
    return denom.slice(1);
  }
  
  return denom;
}
