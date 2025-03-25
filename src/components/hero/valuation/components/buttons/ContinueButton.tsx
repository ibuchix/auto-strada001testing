
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
 */

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
      (window as any).navigationPerformance = {};
    }
    (window as any).navigationPerformance[marker] = timestamp;
    
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
    
    // Detailed browser environment info for debugging
    console.log(`BUTTON DEBUG - Browser environment for click ${clickId}`, {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memoryInfo: (performance as any).memory ? {
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize
      } : 'Not available',
      timing: performance.timing ? {
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
        domComplete: performance.timing.domComplete
      } : 'Not available'
    });
    
    // Show loading toast to provide user feedback
    const toastId = toast.loading(isLoggedIn ? "Preparing listing form..." : "Preparing sign in...");
    
    console.log(`BUTTON DEBUG - Starting navigation process for click ${clickId}`);
    measurePerformance(`pre_callback_${clickId}`);
    
    // Store current page state before navigation
    try {
      const pageState = {
        url: window.location.href,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString(),
        clickId,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        }
      };
      localStorage.setItem('navigationSourceState', JSON.stringify(pageState));
      console.log(`BUTTON DEBUG - Stored page state for click ${clickId}`, pageState);
    } catch (e) {
      console.error(`BUTTON DEBUG - Failed to store page state: ${e}`);
    }
    
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
    
    // Second approach: Delayed callback with timeout if still on the same page
    setTimeout(() => {
      // Check if we're still on the same page
      if (document.querySelector('#list-car-button')) {
        console.log(`BUTTON DEBUG - Still on same page 200ms after click ${clickId}, trying delayed callback`);
        measurePerformance(`delayed_callback_start_${clickId}`);
        
        try {
          onClick();
          console.log(`BUTTON DEBUG - Delayed callback executed for click ${clickId}`);
          measurePerformance(`delayed_callback_complete_${clickId}`);
        } catch (innerErr) {
          console.error(`BUTTON DEBUG - Delayed callback error for click ${clickId}:`, innerErr);
          measurePerformance(`delayed_callback_error_${clickId}`);
          
          // Try direct navigation as a last resort
          console.log(`BUTTON DEBUG - Attempting direct URL navigation for click ${clickId}`);
          measurePerformance(`direct_navigation_start_${clickId}`);
          
          if (!isLoggedIn) {
            window.location.href = "/auth";
          } else {
            window.location.href = "/sell-my-car?fallback=true&clickId=" + clickId;
          }
        }
      } else {
        console.log(`BUTTON DEBUG - Page changed after 200ms from click ${clickId}, navigation appears successful`);
        measurePerformance(`page_changed_200ms_${clickId}`);
      }
      
      // Dismiss the loading toast after a delay
      setTimeout(() => {
        toast.dismiss(toastId);
        console.log(`BUTTON DEBUG - Dismissed loading toast for click ${clickId}`);
        measurePerformance(`toast_dismissed_${clickId}`);
      }, 1000);
    }, 200);
    
    // Final check to verify navigation or provide feedback
    setTimeout(() => {
      if (document.querySelector('#list-car-button')) {
        console.log(`BUTTON DEBUG - Button still visible 500ms after click ${clickId}, navigation appears FAILED`);
        measurePerformance(`navigation_failed_500ms_${clickId}`);
        
        // Show error toast with debugging info
        toast.error("Navigation issue detected", {
          description: "Using emergency navigation. Please wait...",
          duration: 3000
        });
        
        // Last resort emergency navigation
        console.log(`BUTTON DEBUG - Executing emergency direct navigation for click ${clickId}`);
        measurePerformance(`emergency_navigation_${clickId}`);
        
        try {
          if (!isLoggedIn) {
            window.location.href = "/auth?emergency=true&clickId=" + clickId;
          } else {
            window.location.href = "/sell-my-car?emergency=true&clickId=" + clickId;
          }
        } catch (emergencyError) {
          console.error(`BUTTON DEBUG - Even emergency navigation failed for click ${clickId}:`, emergencyError);
          toast.error("Critical navigation failure", {
            description: "Please refresh the page and try again",
            duration: 5000
          });
        }
        
        // Reset state in case of failure
        setIsNavigating(false);
      } else {
        console.log(`BUTTON DEBUG - Button not found 500ms after click ${clickId}, navigation appears successful`);
        measurePerformance(`navigation_success_500ms_${clickId}`);
        
        const clickEndTime = performance.now();
        const totalDuration = clickEndTime - clickStartTime;
        setClickTimes(prev => ({...prev, end: clickEndTime}));
        
        console.log(`BUTTON DEBUG - Total navigation process for click ${clickId} took ${totalDuration.toFixed(2)}ms`);
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
      disabled={hasAttemptedClick} // Prevent double clicks
    >
      {isNavigating ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
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
