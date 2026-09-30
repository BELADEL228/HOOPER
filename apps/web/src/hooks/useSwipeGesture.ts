import { useEffect, useRef, useCallback } from 'react';
import { triggerHaptic } from '../pwa/haptics';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  minDelta?: number;       // Distance minimale en px (défaut : 50px)
  maxPerpendicular?: number; // Déviation max perpendiculaire autorisée
  disabled?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  onSwipeUp,
  minDelta = 50,
  maxPerpendicular = 60,
  disabled = false,
}: UseSwipeGestureOptions) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      startTimeRef.current = Date.now();
    },
    [disabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startXRef.current;
      const deltaY = endY - startYRef.current;
      const duration = Date.now() - startTimeRef.current;

      // Un swipe doit être dynamique (moins de 600ms)
      if (duration > 600) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Swipe Horizontal
      if (absX >= minDelta && absY <= maxPerpendicular) {
        if (deltaX < 0 && onSwipeLeft) {
          triggerHaptic('selection');
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          triggerHaptic('selection');
          onSwipeRight();
        }
      }

      // Swipe Vertical
      if (absY >= minDelta && absX <= maxPerpendicular) {
        if (deltaY > 0 && onSwipeDown) {
          triggerHaptic('selection');
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          triggerHaptic('selection');
          onSwipeUp();
        }
      }
    },
    [disabled, minDelta, maxPerpendicular, onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || disabled) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, disabled]);
}
