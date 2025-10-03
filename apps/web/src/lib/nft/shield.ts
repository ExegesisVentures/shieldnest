// apps/web/src/lib/nft/shield.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ShieldSettings } from '@/lib/supabase/types';
import { createError, ErrorCodes } from '@/lib/errors';

/**
 * Shield NFT placeholder data for v1
 */
export interface ShieldNftData {
  imageUrl: string;
  estimatedValueUsd: number;
  isOwned: boolean;
  settings: ShieldSettings;
}

/**
 * Generate a seeded random value within min/max range
 * Uses user ID as seed for consistency
 */
function generateSeededValue(userId: string, min: number, max: number): number {
  // Simple hash function to create consistent "random" value
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to 0-1 range
  const normalized = Math.abs(hash) / 2147483647;
  
  // Scale to min-max range
  return min + (normalized * (max - min));
}

/**
 * Get Shield NFT settings from admin configuration
 */
export async function getShieldSettings(): Promise<ShieldSettings | null> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: settings, error } = await supabase
      .from('shield_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Failed to fetch shield settings:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Shield settings fetch error:', error);
    return null;
  }
}

/**
 * Check if user owns Shield NFT (placeholder implementation for v1)
 */
export async function checkShieldNftOwnership(userId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    
    // For v1, we'll check if user is a private member with signed PMA
    const { data: privateUser, error } = await supabase
      .from('private_users')
      .select('pma_status')
      .eq('public_user_id', userId)
      .single();

    if (error || !privateUser) {
      return false;
    }

    // In v1, PMA signed status acts as Shield NFT ownership placeholder
    return privateUser.pma_status === 'signed';
    
    // TODO(v2): Implement actual NFT ownership check via Coreum blockchain
    // const nftBalance = await checkNftBalance(address, SHIELD_NFT_CONTRACT);
    // return nftBalance > 0;
    
  } catch (error) {
    console.error('Shield NFT ownership check failed:', error);
    return false;
  }
}

/**
 * Get Shield NFT data for a user
 */
export async function getShieldNftData(userId: string): Promise<ShieldNftData | null> {
  try {
    const settings = await getShieldSettings();
    if (!settings) {
      return null;
    }

    const isOwned = await checkShieldNftOwnership(userId);
    
    // Generate consistent estimated value for this user
    const estimatedValueUsd = generateSeededValue(
      userId, 
      settings.min_usd, 
      settings.max_usd
    );

    return {
      imageUrl: settings.image_url,
      estimatedValueUsd: Math.round(estimatedValueUsd * 100) / 100, // Round to 2 decimals
      isOwned,
      settings,
    };
  } catch (error) {
    console.error('Failed to get Shield NFT data:', error);
    return null;
  }
}

/**
 * Cache Shield NFT ownership status
 */
export async function cacheShieldNftOwnership(userId: string, isOwned: boolean): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    
    // For v1, we'll use the private_users table
    // In v2, this would go to nft_holdings_cache
    
    const { error } = await supabase
      .from('nft_holdings_cache')
      .upsert({
        user_id: userId,
        contract: 'shield-nft-placeholder',
        token_class: 'shield',
        balance: isOwned ? 1 : 0,
        metadata: {
          isPlaceholder: true,
          version: 'v1',
        },
        last_checked_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to cache Shield NFT ownership:', error);
    }
  } catch (error) {
    console.error('Shield NFT ownership caching error:', error);
  }
}

/**
 * Get Shield NFT buy URL (placeholder for v1)
 */
export function getShieldNftBuyUrl(): string {
  // TODO(v2): Return actual marketplace URL
  return 'https://shieldnest.io/buy-shield-nft';
}

/**
 * Check if sell-back feature is available
 */
export function isShieldNftSellBackAvailable(): boolean {
  // Feature flag: sell-back is coming soon in v1
  return false;
}
