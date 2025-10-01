import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 120
}) => {
  const { 
    containerRef, 
    isPulling, 
    pullDistance, 
    isRefreshing, 
    pullProgress 
  } = usePullToRefresh({ 
    threshold, 
    onRefresh, 
    disabled 
  });

  // Prevent hydration mismatch by ensuring client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull to Refresh Indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out ${
          isPulling || isRefreshing ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          transform: `translateY(${Math.max(pullDistance - 60, -60)}px)`,
          opacity: isPulling || isRefreshing ? 1 : 0,
          height: '60px'
        }}
      >
        <div className="flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/20 dark:border-gray-700/30">
          <ArrowPathIcon 
            className={`w-5 h-5 text-primary-600 dark:text-primary-400 transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={isClient ? {
              transform: `rotate(${pullProgress * 180}deg)`
            } : undefined}
            suppressHydrationWarning={true}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
