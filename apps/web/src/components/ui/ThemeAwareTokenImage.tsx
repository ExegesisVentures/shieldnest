/**
 * Theme-Aware Token Image Component
 * Automatically switches between light and dark mode token images
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeAwareImage } from '@/utils/theme-aware-images';
import { TokenMetadata, getTokenImageUrl } from '@/lib/token-registry';

interface ThemeAwareTokenImageProps {
  /** Token metadata with image URLs */
  metadata?: TokenMetadata;
  /** Base image URL (if metadata not provided) */
  src?: string;
  /** Token symbol for fallback image generation */
  symbol?: string;
  /** Alt text for the image */
  alt: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** CSS classes */
  className?: string;
  /** Fallback image URL */
  fallback?: string;
  /** Callback when image fails to load */
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Theme-aware token image component that automatically switches between light/dark variants
 */
export default function ThemeAwareTokenImage({
  metadata,
  src,
  symbol,
  alt,
  width,
  height,
  className = '',
  fallback = '/tokens/default.svg',
  onError
}: ThemeAwareTokenImageProps) {
  const { isDark } = useTheme();
  const [hasError, setHasError] = useState(false);
  
  // Determine the base image URL
  let baseImageUrl = src;
  if (metadata) {
    baseImageUrl = getTokenImageUrl(metadata, isDark);
  } else if (symbol && !src) {
    // Generate URL from symbol if no src provided
    const normalizedSymbol = symbol.toLowerCase();
    baseImageUrl = `/tokens/${normalizedSymbol}.svg`;
  }
  
  // Use the theme-aware image hook
  const { imageUrl, isLoading } = useThemeAwareImage(baseImageUrl || fallback);
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true);
      const target = e.target as HTMLImageElement;
      target.src = fallback;
    }
    onError?.(e);
  };
  
  // Show loading placeholder while determining the correct image
  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full ${className}`}
        style={{ width, height }}
      />
    );
  }
  
  return (
    <Image
      src={hasError ? fallback : imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      priority={width >= 40} // Prioritize larger images
    />
  );
}

/**
 * Simplified theme-aware token image for common use cases
 */
export function TokenImage({
  symbol,
  size = 32,
  className = 'rounded-full'
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  return (
    <ThemeAwareTokenImage
      symbol={symbol}
      alt={`${symbol} token`}
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * Token image with explicit light/dark URLs
 */
export function ExplicitThemeTokenImage({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  className = '',
  fallback = '/tokens/default.svg'
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: string;
}) {
  const { isDark } = useTheme();
  const [hasError, setHasError] = useState(false);
  
  const currentSrc = isDark ? darkSrc : lightSrc;
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true);
      const target = e.target as HTMLImageElement;
      target.src = fallback;
    }
  };
  
  return (
    <Image
      src={hasError ? fallback : currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}
