// This file configures the initialization of Sentry on the server side
import { init } from '@sentry/nextjs';

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Server-specific configuration
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out common database connection issues during startup
    if (error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('Connection terminated')) {
      return null;
    }
    
    // Filter out Supabase auth token expiration (normal)
    if (error?.message?.includes('JWT') && 
        error?.message?.includes('expired')) {
      return null;
    }
    
    return event;
  },

  // Enhanced error context for server
  beforeBreadcrumb(breadcrumb) {
    // Sanitize sensitive data from server breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      // Remove sensitive request data
      if (breadcrumb.data.url?.includes('auth') ||
          breadcrumb.data.url?.includes('wallet') ||
          breadcrumb.data.url?.includes('admin')) {
        breadcrumb.data = { 
          ...breadcrumb.data, 
          body: '[REDACTED]',
          headers: '[REDACTED]'
        };
      }
    }
    
    return breadcrumb;
  },
});
