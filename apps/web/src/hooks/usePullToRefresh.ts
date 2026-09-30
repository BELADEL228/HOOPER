import { useEffect, useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '../pwa/haptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;       // Seuil en pixels pour déclencher (défaut : 75px)
  maxPull?: number;         // Distance d'étirement maximale (défaut : 110px)
  resistance?: number;      // Facteur d'élasticité (défaut : 0.45)
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 75,
  maxPull = 110,
  resistance = 0.45,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const hasVibratedRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;
      // Ne déclencher que si l'utilisateur est tout en haut de la page
      if (window.scrollY > 5) return;

      startYRef.current = e.touches[0].clientY;
      currentYRef.current = e.touches[0].clientY;
      hasVibratedRef.current = false;
      setIsPulling(true);
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      currentYRef.current = e.touches[0].clientY;
      const rawDelta = currentYRef.current - startYRef.current;

      // On ne gère que le tirage vers le bas depuis le sommet
      if (rawDelta > 0 && window.scrollY <= 0) {
        // Formule de résistance logarithmique / élastique
        const elasticDistance = Math.min(rawDelta * resistance, maxPull);
        setPullDistance(elasticDistance);

        // Feedback haptique lorsque le seuil est franchi pour la première fois
        if (elasticDistance >= threshold && !hasVibratedRef.current) {
          triggerHaptic('medium');
          hasVibratedRef.current = true;
        } else if (elasticDistance < threshold && hasVibratedRef.current) {
          hasVibratedRef.current = false;
        }

        // Empêcher le scroll par défaut pour éviter le rechargement natif de Chrome Android
        if (e.cancelable && rawDelta > 10) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    },
    [isPulling, isRefreshing, resistance, maxPull, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      try {
        await Promise.resolve(onRefresh());
      } catch (err) {
        console.warn('[PullToRefresh] Erreur rafraîchissement :', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || disabled) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  const progress = Math.min(pullDistance / threshold, 1);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    progress,
    thresholdReached: pullDistance >= threshold,
  };
}
