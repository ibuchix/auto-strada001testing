
/**
 * Changes made:
 * - 2027-07-23: Added diagnostic logging to help troubleshoot navigation issues
 * - 2027-07-27: Fixed loading state not showing when button is clicked
 * - 2027-07-27: Enhanced direct navigation with immediate UI feedback
 * - 2027-07-27: Added console logging for better debugging
 */

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { generateDiagnosticId, logDiagnostic, logStorageState } from "@/diagnostics/listingButtonDiagnostics";

// Declare the additional property on Window to fix the TypeScript error
declare global {
  interface Window {
    navigationPerformance?: Record<string, number>;
  }
}

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

export const ContinueButton = ({ isLoggedIn, onClick, isLoading: externalLoading }: ContinueButtonProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [clickTimes, setClickTimes] = useState<{start?: number, processing?: number, end?: number}>({});
  const [diagnosticId, setDiagnosticId] = useState('');
  
  // Reset navigation state when component mounts
  useEffect(() => {
    const buttonId = Math.random().toString(36).substring(2, 8);
    const newDiagnosticId = generateDiagnosticId();
    setDiagnosticId(newDiagnosticId);
    
    logDiagnostic('BUTTON_MOUNT', 'ContinueButton mounted', {
      buttonId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      isLoggedIn
    }, newDiagnosticId);
    
    logStorageState(newDiagnosticId, 'button_mount');
    
    localStorage.setItem('buttonMountTime', new Date().toISOString());
    localStorage.setItem('buttonId', buttonId);
    
    // Check if we previously had a failed click attempt
    const lastAttempt = localStorage.getItem('lastButtonClickTime');
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
      logDiagnostic('BUTTON_MOUNT', 'Previous click attempt detected', {
        lastAttempt,
        timeSinceLastAttempt: `${timeSinceLastAttempt}ms`
      }, newDiagnosticId);
    }
    
    return () => {
      logDiagnostic('BUTTON_UNMOUNT', `ContinueButton unmounted`, {
        buttonId,
        diagnosticId: newDiagnosticId,
        isNavigating
      }, newDiagnosticId);
      localStorage.setItem('buttonUnmountTime', new Date().toISOString());
    };
  }, [isLoggedIn]);
  
  // Advanced click handler with forced loading state and direct URL navigation
  const handleButtonClick = useCallback(() => {
    console.log("ContinueButton: Button clicked");
    
    // CRITICAL: Set loading state IMMEDIATELY to give user feedback
    setIsNavigating(true);
    
    const clickStartTime = performance.now();
    const clickId = Math.random().toString(36).substring(2, 10);
    
    logDiagnostic('BUTTON_CLICK', 'Button clicked', {
      clickId,
      isLoggedIn,
      elapsedSincePageLoad: performance.now(),
      isNavigating: true
    }, diagnosticId);
    
    logStorageState(diagnosticId, 'button_click');
    
    setClickTimes({start: clickStartTime});
    
    // Store click event timestamp and details
    localStorage.setItem('lastButtonClickTime', new Date().toISOString());
    localStorage.setItem('lastButtonClickId', clickId);
    
    // Show loading toast to provide additional user feedback
    toast.loading(isLoggedIn ? "Preparing listing form..." : "Preparing sign in...", {
      id: "navigation-toast",
      duration: 3000
    });
    
    // Capture onClick attempt
    try {
      console.log("ContinueButton: Calling original onClick handler");
      logDiagnostic('ONCLICK_ATTEMPT', 'Calling original onClick handler', { clickId }, diagnosticId);
      onClick();
      logDiagnostic('ONCLICK_SUCCESS', 'Original onClick handler completed', { clickId }, diagnosticId);
      console.log("ContinueButton: Original onClick handler completed");
    } catch (err) {
      console.error("ContinueButton: Error in original onClick handler", err);
      logDiagnostic('ONCLICK_ERROR', 'Error in original onClick handler', { 
        clickId, 
        error: err instanceof Error ? err.message : String(err) 
      }, diagnosticId);
    }
    
    // CRITICAL: Use DIRECT URL NAVIGATION instead of React Router
    // This bypasses any potential React Router or state management issues
    setTimeout(() => {
      console.log("ContinueButton: Starting direct URL navigation");
      logDiagnostic('URL_NAVIGATION', 'Starting direct URL navigation', { 
        clickId,
        destination: isLoggedIn ? '/sell-my-car' : '/auth'
      }, diagnosticId);
      
      if (isLoggedIn) {
        window.location.href = `/sell-my-car?from=valuation&clickId=${clickId}&diagnostic=${diagnosticId}`;
      } else {
        window.location.href = `/auth?from=valuation&clickId=${clickId}&diagnostic=${diagnosticId}`; 
      }
    }, 100); // Increased timeout to ensure onClick completes first
    
    // Secondary fallback (700ms) - if the primary navigation somehow fails
    setTimeout(() => {
      if (document.querySelector('#list-car-button')) {
        console.log("ContinueButton: EMERGENCY NAVIGATION - Button still visible after timeout");
        logDiagnostic('EMERGENCY_NAVIGATION', 'Button still visible after timeout', { clickId }, diagnosticId);
        
        // Force navigation with special flag
        if (isLoggedIn) {
          window.location.href = `/sell-my-car?emergency=true&clickId=${clickId}&diagnostic=${diagnosticId}`;
        } else {
          window.location.href = `/auth?emergency=true&clickId=${clickId}&diagnostic=${diagnosticId}`;
        }
      }
    }, 700); // Increased timeout for more reliable fallback
  }, [onClick, isLoggedIn, diagnosticId]);

  // Use either external loading state or internal navigating state
  const isButtonLoading = externalLoading || isNavigating;

  return (
    <Button 
      onClick={handleButtonClick}
      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
      type="button"
      id="list-car-button"
      data-testid="list-car-button"
      data-diagnostic-id={diagnosticId}
      disabled={isButtonLoading} // Prevent double clicks
    >
      {isButtonLoading ? (
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
