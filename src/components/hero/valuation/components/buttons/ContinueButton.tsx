
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
 * - 2027-07-20: Fixed immediate navigation issues and added guaranteed loading spinner
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [clickTimes, setClickTimes] = useState<{start?: number, processing?: number, end?: number}>({});
  
  // Reset navigation state when component mounts
  useEffect(() => {
    const buttonId = Math.random().toString(36).substring(2, 8);
    console.log(`BUTTON DEBUG - ContinueButton mounted with ID: ${buttonId}`, {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
    });
    
    localStorage.setItem('buttonMountTime', new Date().toISOString());
    localStorage.setItem('buttonId', buttonId);
    
    // Check if we previously had a failed click attempt
    const lastAttempt = localStorage.getItem('lastButtonClickTime');
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
      console.log(`BUTTON DEBUG - Previous click attempt detected ${timeSinceLastAttempt}ms ago`);
    }
    
    return () => {
      console.log(`BUTTON DEBUG - ContinueButton with ID ${buttonId} unmounted at ${new Date().toISOString()}`);
      localStorage.setItem('buttonUnmountTime', new Date().toISOString());
    };
  }, []);
  
  // Advanced click handler with forced loading state and direct URL navigation
  const handleButtonClick = useCallback(() => {
    // CRITICAL: Set loading state IMMEDIATELY to give user feedback
    setIsNavigating(true);
    
    const clickStartTime = performance.now();
    const clickId = Math.random().toString(36).substring(2, 10);
    
    console.log(`BUTTON DEBUG - Button clicked at ${new Date().toISOString()}`, {
      clickId,
      elapsedSincePageLoad: performance.now()
    });
    
    setClickTimes({start: clickStartTime});
    
    // Store click event timestamp and details
    localStorage.setItem('lastButtonClickTime', new Date().toISOString());
    localStorage.setItem('lastButtonClickId', clickId);
    
    // Show loading toast to provide additional user feedback
    toast.loading(isLoggedIn ? "Preparing listing form..." : "Preparing sign in...", {
      id: "navigation-toast",
      duration: 3000
    });
    
    // CRITICAL: Use DIRECT URL NAVIGATION instead of React Router
    // This bypasses any potential React Router or state management issues
    setTimeout(() => {
      if (isLoggedIn) {
        window.location.href = "/sell-my-car?from=valuation&clickId=" + clickId;
      } else {
        window.location.href = "/auth?from=valuation&clickId=" + clickId; 
      }
    }, 50); // Small delay to ensure the loading state is shown first
    
    // Secondary fallback (500ms) - if the primary navigation somehow fails
    setTimeout(() => {
      if (document.querySelector('#list-car-button')) {
        console.log(`BUTTON DEBUG - Button still visible 500ms after click ${clickId}, using emergency navigation`);
        
        // Force navigation with special flag
        if (isLoggedIn) {
          window.location.href = "/sell-my-car?emergency=true&clickId=" + clickId;
        } else {
          window.location.href = "/auth?emergency=true&clickId=" + clickId;
        }
      }
    }, 500);
    
    // Call the original onClick handler
    try {
      onClick();
    } catch (err) {
      console.error(`BUTTON DEBUG - Original callback error for click ${clickId}:`, err);
      // Error in the callback shouldn't prevent navigation since we're using direct URL
    }
  }, [onClick, isLoggedIn]);

  return (
    <Button 
      onClick={handleButtonClick}
      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
      type="button"
      id="list-car-button"
      data-testid="list-car-button"
      disabled={isNavigating} // Prevent double clicks
    >
      {isNavigating ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isLoggedIn ? "Loading..." : "Redirecting..."}
        </span>
      ) : (
        !isLoggedIn 
          ? "Sign Up to List Your Car" 
          : "List This Car"
      )}
    </Button>
  );
};
