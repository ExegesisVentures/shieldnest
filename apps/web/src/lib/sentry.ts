// apps/web/src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';
import { ShieldError } from './errors';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Filter out common, non-actionable errors
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Filter out network errors that aren't actionable
        if (error?.message?.includes('NetworkError') || 
            error?.message?.includes('fetch')) {
          return null;
        }
        
        // Filter out wallet connection rejections (user choice)
        if (error?.message?.includes('User rejected') ||
            error?.message?.includes('User denied')) {
          return null;
        }
        
        return event;
      },

      // Enhanced error context
      beforeBreadcrumb(breadcrumb) {
        // Sanitize sensitive data from breadcrumbs
        if (breadcrumb.category === 'http' && breadcrumb.data) {
          // Remove sensitive headers/data
          if (breadcrumb.data.url?.includes('auth') ||
              breadcrumb.data.url?.includes('wallet')) {
            breadcrumb.data = { ...breadcrumb.data, body: '[REDACTED]' };
          }
        }
        
        return breadcrumb;
      },
    });
  }
}

/**
 * Report ShieldError to Sentry with proper context
 */
export function reportError(error: ShieldError | Error, context?: any) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return; // Sentry not configured
  }

  Sentry.withScope((scope) => {
    // Add error context
    if (context) {
      scope.setContext('error_context', sanitizeContext(context));
    }

    // Add user context if available
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      scope.setTag('browser', getBrowserName(userAgent));
      scope.setTag('mobile', /Mobile/.test(userAgent));
    }

    // If it's a ShieldError, add structured data
    if ('code' in error && 'causeId' in error) {
      scope.setTag('error_code', error.code);
      scope.setTag('cause_id', error.causeId);
      scope.setLevel('error');
      
      // Create a proper Error object for Sentry
      const sentryError = new Error(error.message);
      sentryError.name = `ShieldError:${error.code}`;
      
      Sentry.captureException(sentryError);
    } else {
      Sentry.captureException(error);
    }
  });
}

/**
 * Report performance issues
 */
export function reportPerformance(name: string, duration: number, context?: any) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message: `Performance: ${name}`,
    category: 'performance',
    level: 'info',
    data: {
      duration_ms: duration,
      ...sanitizeContext(context),
    },
  });

  // Report slow operations as transactions
  if (duration > 2000) { // More than 2 seconds
    const transaction = Sentry.startTransaction({
      name: `slow_operation_${name}`,
      op: 'performance.slow',
    });
    
    transaction.setData('duration', duration);
    transaction.setData('context', sanitizeContext(context));
    transaction.finish();
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  type: 'visitor' | 'public' | 'private';
}) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    user_type: user.type,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category: string, data?: any) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data: sanitizeContext(data),
  });
}

/**
 * Sanitize context data to remove sensitive information
 */
function sanitizeContext(context: any): any {
  if (!context || typeof context !== 'object') {
    return context;
  }

  const sensitive = [
    'password', 'secret', 'key', 'token', 'signature', 
    'private', 'mnemonic', 'seed', 'privateKey'
  ];

  const sanitized = { ...context };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Extract browser name from user agent
 */
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}
