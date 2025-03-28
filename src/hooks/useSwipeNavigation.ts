
/**
 * Custom hook for handling swipe navigation on mobile devices
 * Allows users to navigate between form steps with swipe gestures
 */
import { useEffect, useState } from "react";
import { useIsMobile } from "./use-mobile";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const useSwipeNavigation = ({ 
  onSwipeLeft, 
  onSwipeRight 
}: SwipeHandlers) => {
  const isMobile = useIsMobile();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Minimum required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50;

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null); // Reset touchEnd
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isSwipe = Math.abs(distance) > minSwipeDistance;

      if (isSwipe) {
        if (distance > 0 && onSwipeLeft) {
          // Swiped left
          onSwipeLeft();
        } else if (distance < 0 && onSwipeRight) {
          // Swiped right
          onSwipeRight();
        }
      }
      
      // Reset values
      setTouchStart(null);
      setTouchEnd(null);
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, touchStart, touchEnd, onSwipeLeft, onSwipeRight, minSwipeDistance]);

  return { isMobile };
};
