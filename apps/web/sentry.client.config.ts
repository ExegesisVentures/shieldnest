// This file configures the initialization of Sentry on the browser/client side
import { init } from '@sentry/nextjs';

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Filter out common, non-actionable errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out network errors that aren't actionable
    if (error?.message?.includes('NetworkError') || 
        error?.message?.includes('fetch') ||
        error?.message?.includes('Load failed')) {
      return null;
    }
    
    // Filter out wallet connection rejections (user choice)
    if (error?.message?.includes('User rejected') ||
        error?.message?.includes('User denied') ||
        error?.message?.includes('Request rejected')) {
      return null;
    }
    
    // Filter out extension not found errors
    if (error?.message?.includes('not found') &&
        (error?.message?.includes('keplr') ||
         error?.message?.includes('leap') ||
         error?.message?.includes('cosmostation'))) {
      return null;
    }
    
    return event;
  },

  // Integration configurations
  integrations: [
    // Capture interactions and navigation
    // new Sentry.Integrations.BrowserTracing(),
  ],
});
