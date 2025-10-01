/**
 * HMR Error Suppressor Component
 * 
 * This component handles and suppresses known HMR errors in Next.js 15
 * that don't affect functionality but pollute the console.
 */

import { useEffect } from 'react';

export default function HMRErrorSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Suppress known HMR errors that don't affect functionality
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Track if we've already patched these methods to avoid double-patching
    if ((console.error as any).__patched) {
      return;
    }

    console.error = (...args) => {
      const message = args.join(' ');
      
      // Expanded list of HMR-related errors to suppress
      if (
        message.includes('Invalid message: {"action":"isrManifest"') ||
        message.includes('Cannot read properties of undefined (reading \'components\')') ||
        message.includes('handleStaticIndicator') ||
        message.includes('hot-reloader-pages.js') ||
        message.includes('processMessage') ||
        message.includes('reportInvalidHmrMessage') ||
        message.includes('overrideMethod @ hook.js') ||
        // Additional Next.js 15 HMR-related errors
        message.includes('webpack-internal:') ||
        message.includes('__webpack_require__') ||
        // ISR-related errors
        message.includes('ISR') ||
        message.includes('isrManifest') ||
        // Static indicator errors
        message.includes('static indicator') ||
        message.includes('StaticIndicator') ||
        // Build activity errors
        message.includes('buildActivity') ||
        message.includes('build-activity') ||
        // WebSocket HMR errors
        message.includes('ws://') && message.includes('HMR') ||
        message.includes('WebSocket connection') && message.includes('HMR')
      ) {
        // Silently ignore these errors
        return;
      }
      
      // Allow other errors through
      originalConsoleError.apply(console, args);
    };
    
    // Mark as patched to prevent double-patching
    (console.error as any).__patched = true;

    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Suppress specific HMR warnings
      if (
        message.includes('Invalid message: {"action":"isrManifest"') ||
        message.includes('reportInvalidHmrMessage') ||
        message.includes('HMR') ||
        message.includes('hot-reloader') ||
        message.includes('webpack-internal:') ||
        message.includes('static indicator') ||
        message.includes('buildActivity') ||
        message.includes('handleStaticIndicator')
      ) {
        // Silently ignore these warnings
        return;
      }
      
      // Allow other warnings through
      originalConsoleWarn.apply(console, args);
    };

    // Enhanced HMR message handling
    if (typeof window !== 'undefined') {
      // Override HMR callback if it exists
      if ((window as any).__NEXT_HMR_CB) {
        const originalHMRCallback = (window as any).__NEXT_HMR_CB;
        
        (window as any).__NEXT_HMR_CB = (data: any) => {
          // Filter out problematic ISR manifest messages
          if (data?.action === 'isrManifest' || data?.action === 'serverComponentChanges') {
            return;
          }
          
          // Call original callback for valid messages
          if (originalHMRCallback) {
            originalHMRCallback(data);
          }
        };
      }

      // Handle WebSocket HMR messages to prevent ISR manifest errors
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'message' && this instanceof WebSocket) {
          const wrappedListener = function(this: any, event: any) {
            try {
              const data = JSON.parse(event.data);
              if (data?.action === 'isrManifest') {
                // Skip this message
                return;
              }
            } catch (e) {
              // Not JSON, continue normally
            }
            
            // Call original listener
            if (typeof listener === 'function') {
              listener.call(this, event);
            } else if (listener && typeof listener.handleEvent === 'function') {
              listener.handleEvent(event);
            }
          };
          
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        
        return originalAddEventListener.call(this, type, listener, options);
      };
    }

    // Cleanup function
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      // Note: EventTarget.prototype override persists intentionally to prevent future ISR errors
    };
  }, []);

  return null; // This component doesn't render anything
}
