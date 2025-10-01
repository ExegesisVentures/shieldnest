/**
 * Theme-Aware Token Image Utilities
 * Handles light/dark mode token images with _light and _dark suffixes
 */

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

/**
 * Get the appropriate token image URL based on current theme
 * @param baseImageUrl - The base image URL (e.g., "/tokens/shield.svg")
 * @param isDark - Whether dark mode is active (optional, will detect if not provided)
 * @returns Theme-appropriate image URL
 */
export function getThemeAwareImageUrl(baseImageUrl: string, isDark?: boolean): string {
  if (!baseImageUrl) return '/tokens/default.svg';
  
  // Extract file parts
  const lastDotIndex = baseImageUrl.lastIndexOf('.');
  const lastSlashIndex = baseImageUrl.lastIndexOf('/');
  
  if (lastDotIndex === -1) return baseImageUrl;
  
  const basePath = baseImageUrl.substring(0, lastDotIndex);
  const extension = baseImageUrl.substring(lastDotIndex);
  const fileName = baseImageUrl.substring(lastSlashIndex + 1, lastDotIndex);
  
  // Check if we already have a theme suffix
  if (fileName.endsWith('_light') || fileName.endsWith('_dark') || fileName.endsWith('_Light') || fileName.endsWith('_Dark')) {
    return baseImageUrl;
  }
  
  // For tokens that we know have theme variants, return the appropriate variant
  // Otherwise, just return the base image
  const hasThemeVariants = ['shld', 'solo'].includes(fileName.toLowerCase());
  
  if (hasThemeVariants) {
    // Determine which theme to use
    const useDark = isDark !== undefined ? isDark : 
      (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Handle special naming conventions
    if (fileName.toLowerCase() === 'solo') {
      return useDark ? `${basePath}_Dark${extension}` : `${basePath}_Light${extension}`;
    } else {
      return useDark ? `${basePath}_dark${extension}` : `${basePath}_light${extension}`;
    }
  }
  
  // For tokens without theme variants, return the base image
  return baseImageUrl;
}

/**
 * Check if a token has theme-specific variants
 * @param baseImageUrl - The base image URL
 * @returns Object indicating which variants exist
 */
export async function checkThemeVariants(baseImageUrl: string): Promise<{
  hasLight: boolean;
  hasDark: boolean;
  baseExists: boolean;
}> {
  if (!baseImageUrl) return { hasLight: false, hasDark: false, baseExists: false };
  
  const lastDotIndex = baseImageUrl.lastIndexOf('.');
  if (lastDotIndex === -1) return { hasLight: false, hasDark: false, baseExists: false };
  
  const basePath = baseImageUrl.substring(0, lastDotIndex);
  const extension = baseImageUrl.substring(lastDotIndex);
  
  const lightUrl = `${basePath}_light${extension}`;
  const darkUrl = `${basePath}_dark${extension}`;
  
  // Check if variants exist (in browser only)
  if (typeof window === 'undefined') {
    return { hasLight: false, hasDark: false, baseExists: true };
  }
  
  try {
    const [lightCheck, darkCheck, baseCheck] = await Promise.all([
      fetch(lightUrl, { method: 'HEAD' }).then(r => r.ok).catch(() => false),
      fetch(darkUrl, { method: 'HEAD' }).then(r => r.ok).catch(() => false),
      fetch(baseImageUrl, { method: 'HEAD' }).then(r => r.ok).catch(() => false)
    ]);
    
    return {
      hasLight: lightCheck,
      hasDark: darkCheck,
      baseExists: baseCheck
    };
  } catch {
    return { hasLight: false, hasDark: false, baseExists: true };
  }
}

/**
 * React hook for theme-aware token images
 * @param baseImageUrl - The base image URL
 * @returns Current theme-appropriate image URL
 */
export function useThemeAwareImage(baseImageUrl: string): {
  imageUrl: string;
  isLoading: boolean;
} {
  const { isDark } = useTheme();
  const [imageUrl, setImageUrl] = useState(baseImageUrl);
  const [isLoading, setIsLoading] = useState(false); // Start as not loading
  
  useEffect(() => {
    if (!baseImageUrl) {
      setImageUrl('/tokens/default.svg');
      return;
    }
    
    // Simply use the theme-aware URL generation without async checking
    // This avoids the 404 errors from checking for files that don't exist
    const finalUrl = getThemeAwareImageUrl(baseImageUrl, isDark);
    setImageUrl(finalUrl);
  }, [baseImageUrl, isDark]);
  
  return { imageUrl, isLoading };
}

/**
 * Get the best available image URL for a token, considering theme variants
 * @param symbol - Token symbol (e.g., 'SHIELD', 'SOLO')
 * @param isDark - Whether dark mode is active
 * @returns Promise resolving to the best image URL
 */
export async function getBestTokenImageUrl(symbol: string, isDark?: boolean): Promise<string> {
  const symbolLower = symbol.toLowerCase();
  
  // Common image extensions to try
  const extensions = ['.svg', '.png', '.jpg', '.jpeg'];
  
  for (const ext of extensions) {
    const baseUrl = `/tokens/${symbolLower}${ext}`;
    const variants = await checkThemeVariants(baseUrl);
    
    // If we have theme variants, use the appropriate one
    if (isDark && variants.hasDark) {
      return getThemeAwareImageUrl(baseUrl, true);
    } else if (!isDark && variants.hasLight) {
      return getThemeAwareImageUrl(baseUrl, false);
    } else if (variants.baseExists) {
      return baseUrl;
    } else if (variants.hasLight || variants.hasDark) {
      // Use any available variant if base doesn't exist
      return variants.hasLight ? 
        getThemeAwareImageUrl(baseUrl, false) : 
        getThemeAwareImageUrl(baseUrl, true);
    }
  }
  
  return '/tokens/default.svg';
}

/**
 * Normalize token symbol for file naming
 * @param symbol - Token symbol
 * @returns Normalized symbol for file names
 */
export function normalizeTokenSymbol(symbol: string): string {
  // Handle special cases with exact file names that exist
  const symbolMap: Record<string, string> = {
    'SHIELD': 'shld',
    'SHLD': 'shld',
    'CORE': 'core', // Use core.svg as base, CoreumLogo.svg for specific cases
    'SOLO': 'solo',
    'CAT': 'cat',
    'ROLL': 'roll',
    'COZY': 'cozy'
  };
  
  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
}
