import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-50 animate-fadeIn transition-all"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wifi className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Connexion rétablie</p>
              <p className="text-[10px] text-emerald-300">Synchronisation live en cours...</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Rafraîchir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-50 animate-fadeIn transition-all"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-950/90 border border-amber-500/40 text-amber-200 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Mode Hors-Ligne Actif</p>
            <p className="text-[10px] text-amber-300">Rosters, scores et données en cache restent accessibles.</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
          CACHE PWA
        </span>
      </div>
    </div>
  );
}
