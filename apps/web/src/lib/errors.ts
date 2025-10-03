// apps/web/src/lib/errors.ts
import { randomUUID } from 'crypto';

/**
 * Unified error shape for ShieldNest
 * Always return this format from API routes and error handlers
 */
export interface ShieldError {
  code: string;
  message: string;
  hint?: string;
  causeId?: string;
}

/**
 * Standard error codes used throughout ShieldNest
 */
export const ErrorCodes = {
  // Wallet errors
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_CONNECTION_FAILED: 'WALLET_CONNECTION_FAILED',
  WALLET_SIGNATURE_REJECTED: 'WALLET_SIGNATURE_REJECTED',
  WALLET_CHAIN_NOT_SUPPORTED: 'WALLET_CHAIN_NOT_SUPPORTED',
  
  // Auth errors
  AUTH_INVALID_SIGNATURE: 'AUTH_INVALID_SIGNATURE',
  AUTH_NONCE_EXPIRED: 'AUTH_NONCE_EXPIRED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // API errors
  API_INVALID_REQUEST: 'API_INVALID_REQUEST',
  API_RATE_LIMITED: 'API_RATE_LIMITED',
  API_NETWORK_ERROR: 'API_NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  
  // NFT errors
  NFT_CONTRACT_NOT_FOUND: 'NFT_CONTRACT_NOT_FOUND',
  NFT_BALANCE_CHECK_FAILED: 'NFT_BALANCE_CHECK_FAILED',
  
  // PMA errors
  PMA_ALREADY_SIGNED: 'PMA_ALREADY_SIGNED',
  PMA_INVALID_DOCUMENT: 'PMA_INVALID_DOCUMENT',
  PMA_UPLOAD_FAILED: 'PMA_UPLOAD_FAILED',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
} as const;

/**
 * Create a ShieldError with auto-generated causeId for tracking
 */
export function createError(
  code: string,
  message: string,
  hint?: string
): ShieldError {
  return {
    code,
    message,
    hint,
    causeId: randomUUID(),
  };
}

/**
 * Map common provider/wallet errors to user-friendly messages
 */
export function mapWalletError(error: any): ShieldError {
  const errorStr = error?.message || error?.toString() || '';
  
  if (errorStr.includes('User rejected')) {
    return createError(
      ErrorCodes.WALLET_SIGNATURE_REJECTED,
      'Transaction was rejected by the user',
      'Please approve the transaction in your wallet to continue'
    );
  }
  
  if (errorStr.includes('not found') || errorStr.includes('undefined')) {
    return createError(
      ErrorCodes.WALLET_NOT_FOUND,
      'Wallet extension not found',
      'Please install Keplr, Leap, or Cosmostation wallet extension'
    );
  }
  
  if (errorStr.includes('chain') || errorStr.includes('network')) {
    return createError(
      ErrorCodes.WALLET_CHAIN_NOT_SUPPORTED,
      'Coreum network not added to wallet',
      'Please add Coreum network to your wallet and try again'
    );
  }
  
  return createError(
    ErrorCodes.WALLET_CONNECTION_FAILED,
    'Failed to connect to wallet',
    'Please check your wallet extension and try again'
  );
}

/**
 * Map Supabase errors to user-friendly messages
 */
export function mapSupabaseError(error: any): ShieldError {
  const code = error?.code;
  const message = error?.message || '';
  
  if (code === '23505') { // unique_violation
    return createError(
      ErrorCodes.DB_CONSTRAINT_VIOLATION,
      'This record already exists',
      'The wallet address or email is already registered'
    );
  }
  
  if (code === 'PGRST116') { // not found
    return createError(
      ErrorCodes.DB_RECORD_NOT_FOUND,
      'Record not found',
      'The requested data could not be found'
    );
  }
  
  if (message.includes('JWT')) {
    return createError(
      ErrorCodes.AUTH_UNAUTHORIZED,
      'Authentication failed',
      'Please sign in again to continue'
    );
  }
  
  return createError(
    ErrorCodes.DB_CONNECTION_FAILED,
    'Database operation failed',
    'Please try again in a moment'
  );
}

/**
 * Map CosmJS/Stargate errors to user-friendly messages
 */
export function mapCosmosError(error: any): ShieldError {
  const errorStr = error?.message || error?.toString() || '';
  
  if (errorStr.includes('timeout')) {
    return createError(
      ErrorCodes.API_TIMEOUT,
      'Network request timed out',
      'Please check your connection and try again'
    );
  }
  
  if (errorStr.includes('not found')) {
    return createError(
      ErrorCodes.API_NETWORK_ERROR,
      'Chain data not found',
      'The requested blockchain data could not be retrieved'
    );
  }
  
  return createError(
    ErrorCodes.API_NETWORK_ERROR,
    'Blockchain network error',
    'Please try again in a moment'
  );
}

/**
 * Safe error logger that sanitizes sensitive data
 */
export function logError(error: ShieldError | Error, context?: any) {
  const sanitizedContext = context ? sanitizeForLogging(context) : undefined;
  
  if (process.env.NODE_ENV === 'development') {
    console.error('[ShieldNest Error]', {
      error,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Dynamic import to avoid SSR issues
    import('@/lib/sentry').then(({ reportError }) => {
      reportError(error, sanitizedContext);
    }).catch((err) => {
      console.error('Failed to report error to Sentry:', err);
    });
  }
}

/**
 * Remove sensitive data before logging
 */
function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitive = ['password', 'private', 'secret', 'key', 'token', 'signature'];
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}
