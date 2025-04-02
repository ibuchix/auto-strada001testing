
/**
 * SwipeNavigation Component
 * Provides gesture-based navigation between form steps on mobile
 * Wraps form content and handles swipe gestures
 * - 2027-11-21: Updated props interface for better type safety
 */
import React from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeNavigationProps {
  children: React.ReactNode;
  onNext?: () => Promise<void>;
  onPrevious?: () => Promise<void>;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  disabled?: boolean;
}

export const SwipeNavigation = ({
  children,
  onNext,
  onPrevious,
  isFirstStep = false,
  isLastStep = false,
  disabled = false
}: SwipeNavigationProps) => {
  const isMobile = useIsMobile();
  
  useSwipeNavigation({
    onSwipeLeft: !disabled && !isLastStep ? onNext : undefined,
    onSwipeRight: !disabled && !isFirstStep ? onPrevious : undefined,
  });

  // Add a subtle indicator for swipe functionality when on mobile
  const renderSwipeIndicators = () => {
    if (!isMobile) return null;
    
    return (
      <div className="swipe-indicators fixed top-1/2 -translate-y-1/2 w-full pointer-events-none">
        {!isFirstStep && (
          <div className="absolute left-2 bg-gray-200/60 rounded-full p-1 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </div>
        )}
        {!isLastStep && (
          <div className="absolute right-2 bg-gray-200/60 rounded-full p-1 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {children}
      {renderSwipeIndicators()}
    </div>
  );
};
