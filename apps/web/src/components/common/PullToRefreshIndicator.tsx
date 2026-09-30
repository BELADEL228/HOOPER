import React from 'react';
import { Loader2, Flame } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  thresholdReached: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  thresholdReached,
}) => {
  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-150 ease-out"
      style={{
        transform: `translateY(${Math.max(pullDistance - 15, isRefreshing ? 20 : 0)}px)`,
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-white/20 shadow-2xl backdrop-blur-md text-white text-xs font-bold animate-fade-in">
        {isRefreshing ? (
          <>
            <Loader2 className="w-4 h-4 text-[#FF2A3B] animate-spin" />
            <span>Actualisation des données...</span>
          </>
        ) : (
          <>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `rotate(${pullDistance * 4}deg)`,
              }}
            >
              <Flame
                className={`w-4 h-4 transition-colors ${
                  thresholdReached ? 'text-[#FF2A3B]' : 'text-amber-400'
                }`}
              />
            </div>
            <span className="text-[11px] text-slate-300">
              {thresholdReached ? 'Relâcher pour actualiser' : 'Glisser pour rafraîchir'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
