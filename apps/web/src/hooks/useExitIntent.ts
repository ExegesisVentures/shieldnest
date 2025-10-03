// apps/web/src/hooks/useExitIntent.ts
'use client';

import { useEffect, useCallback, useState } from 'react';

interface ExitIntentOptions {
  enabled: boolean;
  onExitIntent: () => void;
  sensitivity?: number; // Mouse position threshold
  delay?: number; // Delay before triggering again
}

/**
 * Hook to detect when user is about to leave the page
 * Triggers exit intent modal for visitor upgrades
 */
export function useExitIntent({
  enabled,
  onExitIntent,
  sensitivity = 20,
  delay = 60000, // 1 minute
}: ExitIntentOptions) {
  const [lastTriggered, setLastTriggered] = useState<number>(0);

  const handleMouseLeave = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    // Check if mouse is leaving from the top of the window
    if (event.clientY <= sensitivity) {
      const now = Date.now();
      
      // Prevent triggering too frequently
      if (now - lastTriggered < delay) return;
      
      setLastTriggered(now);
      onExitIntent();
    }
  }, [enabled, onExitIntent, sensitivity, delay, lastTriggered]);

  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!enabled) return;
    
    const now = Date.now();
    
    // Prevent triggering too frequently
    if (now - lastTriggered < delay) return;
    
    setLastTriggered(now);
    onExitIntent();
    
    // Optional: Show browser's default confirmation dialog
    // event.preventDefault();
    // event.returnValue = '';
  }, [enabled, onExitIntent, delay, lastTriggered]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, handleMouseLeave, handleBeforeUnload]);

  return {
    lastTriggered,
    resetTrigger: () => setLastTriggered(0),
  };
}
