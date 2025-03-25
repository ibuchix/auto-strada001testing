
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for the continue button with enhanced click handling
 * - 2025-07-05: Fixed button click propagation issues that prevented listing process
 * - 2025-07-05: Added additional debugging and event capturing for maximum reliability
 * - 2025-07-06: Fixed React ref warning and improved click handling
 * - 2025-07-07: Completely refactored click handling to guarantee navigation regardless of cache errors
 * - 2025-07-08: Updated click handler to ensure it works properly with type-safe callbacks
 * - 2025-07-09: Simplified click handling to avoid complex event handling that might be blocking navigation
 * - 2025-07-10: Added WebSocket error resilience to ensure button always works
 * - 2027-06-08: Added comprehensive debugging with multiple fallbacks and visual feedback
 * - 2027-06-15: Enhanced debugging with more detailed click tracking and performance metrics
 * - 2027-07-01: Fixed TypeScript error by properly declaring the window.navigationPerformance property
 * - 2027-07-15: Enhanced loading state with improved visual feedback and guaranteed navigation
 */

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Declare the additional property on Window to fix the TypeScript error
declare global {
  interface Window {
    navigationPerformance?: Record<string, number>;
  }
}

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: () => void;
}

export const ContinueButton = ({ isLoggedIn, onClick }: ContinueButtonProps) => {
  const [hasAttemptedClick, setHasAttemptedClick] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [clickTimes, setClickTimes] = useState<{start?: number, processing?: number, end?: number}>({});
  
  // Reset navigation state when component mounts
  useEffect(() => {
    const buttonId = Math.random().toString(36).substring(2, 8);
    console.log(`BUTTON DEBUG - ContinueButton mounted with ID: ${buttonId}`, {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      hasLocalStorageAccess: (() => {
        try {
          localStorage.setItem("buttonAccessTest", "1");
          localStorage.removeItem("buttonAccessTest");
          return true;
        } catch (e) {
          return false;
        }
      })(),
    });
    
    localStorage.setItem('buttonMountTime', new Date().toISOString());
    localStorage.setItem('buttonId', buttonId);
    
    // Check if we previously had a failed click attempt
    const lastAttempt = localStorage.getItem('lastButtonClickTime');
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
      console.log(`BUTTON DEBUG - Previous click attempt detected ${timeSinceLastAttempt}ms ago`);
    }
    
    // Clean up any stale navigation flags
    return () => {
      console.log(`BUTTON DEBUG - ContinueButton with ID ${buttonId} unmounted at ${new Date().toISOString()}`);
      localStorage.setItem('buttonUnmountTime', new Date().toISOString());
      localStorage.setItem('buttonUnmountReason', document.visibilityState);
    };
  }, []);
  
  // Performance monitoring function
  const measurePerformance = (marker: string) => {
    const timestamp = performance.now();
    console.log(`PERFORMANCE ${marker}: ${timestamp.toFixed(2)}ms`);
    
    // Record in window for debugging
    if (!window.navigationPerformance) {
      window.navigationPerformance = {};
    }
    window.navigationPerformance[marker] = timestamp;
    
    // Also attempt to store in localStorage
    try {
      localStorage.setItem(`perf_${marker}`, timestamp.toString());
    } catch (e) {
      console.error('Failed to store performance metric:', e);
    }
    
    return timestamp;
  };
  
  // Advanced click handler with detailed logging and performance tracking
  const handleButtonClick = useCallback(() => {
    const clickStartTime = performance.now();
    const clickId = Math.random().toString(36).substring(2, 10);
    
    console.log(`BUTTON DEBUG - Button clicked at ${new Date().toISOString()}`, {
      clickId,
      elapsedSincePageLoad: performance.now(),
      buttonState: {
        hasAttemptedClick,
        isNavigating,
      }
    });
    
    setClickTimes({start: clickStartTime});
    measurePerformance(`click_start_${clickId}`);
    
    // Visual feedback - important to show user something is happening
    setIsNavigating(true);
    setHasAttemptedClick(true);
    
    // Store click event timestamp and details
    const clickTimestamp = new Date().toISOString();
    localStorage.setItem('lastButtonClickTime', clickTimestamp);
    localStorage.setItem('lastButtonClickId', clickId);
    
    // Mark navigation start in localStorage for debugging
    try {
      localStorage.setItem('navigationInProgress', 'true');
      localStorage.setItem('navigationStartTime', clickTimestamp);
      localStorage.setItem('navigationAttemptId', clickId);
    } catch (e) {
      console.error('Failed to store navigation state:', e);
    }
    
    // Show loading toast to provide user feedback
    const toastId = toast.loading(isLoggedIn ? "Preparing listing form..." : "Preparing sign in...");
    
    console.log(`BUTTON DEBUG - Starting navigation process for click ${clickId}`);
    measurePerformance(`pre_callback_${clickId}`);
    
    // First approach: Direct callback
    try {
      console.log(`BUTTON DEBUG - Executing primary onClick callback for click ${clickId}`);
      measurePerformance(`callback_start_${clickId}`);
      
      // Execute the callback
      onClick();
      
      const callbackCompleteTime = performance.now();
      const callbackDuration = callbackCompleteTime - clickStartTime;
      console.log(`BUTTON DEBUG - Primary callback complete for click ${clickId} (took ${callbackDuration.toFixed(2)}ms)`);
      measurePerformance(`callback_complete_${clickId}`);
      
      setClickTimes(prev => ({...prev, processing: callbackCompleteTime}));
    } catch (err) {
      console.error(`BUTTON DEBUG - Primary callback error for click ${clickId}:`, err);
      measurePerformance(`callback_error_${clickId}`);
    }
    
    // GUARANTEED NAVIGATION: Set a short delay (200ms) to ensure the callback had time to work
    setTimeout(() => {
      // Verify if we're still on the same page
      if (document.querySelector('#list-car-button')) {
        console.log(`BUTTON DEBUG - Still on same page 200ms after click ${clickId}, using direct navigation`);
        
        // Force direct navigation since the callback didn't work or was too slow
        if (!isLoggedIn) {
          window.location.href = "/auth?from=valuation&navId=" + clickId;
        } else {
          window.location.href = "/sell-my-car?from=valuation&navId=" + clickId;
        }
      } else {
        console.log(`BUTTON DEBUG - Page already changing 200ms after click ${clickId}`);
      }
      
      // Dismiss the loading toast after a delay
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 1000);
    }, 200);
    
    // FAIL-SAFE: Ultimate fallback (500ms) - even if all else fails, this will navigate
    setTimeout(() => {
      if (document.querySelector('#list-car-button')) {
        console.log(`BUTTON DEBUG - Button still visible 500ms after click ${clickId}, using emergency navigation`);
        
        // Emergency direct navigation with special flag
        if (!isLoggedIn) {
          window.location.href = "/auth?emergency=true&navId=" + clickId;
        } else {
          window.location.href = "/sell-my-car?emergency=true&navId=" + clickId;
        }
      }
    }, 500);
  }, [onClick, isLoggedIn, hasAttemptedClick, isNavigating]);

  return (
    <Button 
      onClick={handleButtonClick}
      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
      type="button"
      id="list-car-button"
      data-testid="list-car-button"
      data-click-tracked="true"
      disabled={isNavigating} // Prevent double clicks
    >
      {isNavigating ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isLoggedIn ? "Preparing..." : "Redirecting..."}
        </span>
      ) : (
        !isLoggedIn 
          ? "Sign Up to List Your Car" 
          : "List This Car"
      )}
    </Button>
  );
};
