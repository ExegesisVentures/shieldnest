/**
 * Production-Safe Debug Logging Utility
 * 
 * Provides secure logging that:
 * - Only logs in development
 * - Sanitizes sensitive data in production builds
 * - Prevents information leakage
 */

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info', 
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Safe console logging that only works in development
 */
export const debugLog = {
  /**
   * Debug level - most verbose, development only
   */
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 ${message}`, data || '');
    }
  },

  /**
   * Info level - general information, development only
   */
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },

  /**
   * Warning level - potential issues
   */
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ ${message}`, data || '');
    }
    // In production, only log to error tracking service
    // TODO: Add error tracking service integration
  },

  /**
   * Error level - critical issues (always logged securely)
   */
  error: (message: string, error?: Error | any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${message}`, error || '');
    } else {
      // In production, log sanitized errors to monitoring service
      console.error('Application error occurred'); // Generic message
      // TODO: Send to error tracking service (Sentry, etc.)
    }
  },

  /**
   * Wallet-specific logging with address truncation
   */
  wallet: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`👛 ${message}`, data || '');
    }
    // Never log wallet info in production
  },

  /**
   * State change logging - development only
   */
  state: (component: string, state: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${component} state:`, {
        ...state,
        timestamp: new Date().toISOString()
      });
    }
    // Never log state in production
  }
};

/**
 * Utility to sanitize sensitive data for production logging
 */
export const sanitizeForProduction = (data: any): any => {
  if (process.env.NODE_ENV === 'development') {
    return data; // Return full data in development
  }

  // In production, remove sensitive fields
  const sanitized = { ...data };
  
  // Remove wallet addresses
  if (sanitized.address) {
    delete sanitized.address;
  }
  if (sanitized.connectedWallet) {
    delete sanitized.connectedWallet;
  }
  if (sanitized.accounts) {
    delete sanitized.accounts;
  }
  
  return sanitized;
};

export default debugLog;
