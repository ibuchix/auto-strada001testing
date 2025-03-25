
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
  
  // Reset navigation state when component mounts
  useEffect(() => {
    console.log('BUTTON DEBUG - ContinueButton mounted');
    localStorage.setItem('buttonMountTime', new Date().toISOString());
    
    // Clean up any stale navigation flags
    return () => {
      console.log('BUTTON DEBUG - ContinueButton unmounted');
      localStorage.setItem('buttonUnmountTime', new Date().toISOString());
    };
  }, []);
  
  // Advanced click handler with multiple fallbacks for maximum reliability
  const handleButtonClick = useCallback(() => {
    console.log('BUTTON DEBUG - Button clicked at', new Date().toISOString());
    
    // Visual feedback - important to show user something is happening
    setIsNavigating(true);
    setHasAttemptedClick(true);
    
    // Store click event timestamp
    localStorage.setItem('lastButtonClickTime', new Date().toISOString());
    
    // Show loading toast to provide user feedback
    const toastId = toast.loading(isLoggedIn ? "Preparing listing form..." : "Preparing sign in...");
    
    // Attempt callback with multiple approaches
    let hasSucceeded = false;
    
    // First approach: Direct callback
    try {
      console.log('BUTTON DEBUG - First attempt: Direct callback');
      onClick();
      hasSucceeded = true;
      console.log('BUTTON DEBUG - First attempt succeeded');
    } catch (err) {
      console.error('BUTTON DEBUG - First attempt failed:', err);
    }
    
    // Second approach: Delayed callback with timeout
    if (!hasSucceeded) {
      setTimeout(() => {
        try {
          console.log('BUTTON DEBUG - Second attempt: Delayed callback');
          onClick();
          hasSucceeded = true;
          console.log('BUTTON DEBUG - Second attempt succeeded');
        } catch (innerErr) {
          console.error('BUTTON DEBUG - Second attempt failed:', innerErr);
        }
      }, 100);
    }
    
    // Third approach: Direct URL navigation as fallback
    setTimeout(() => {
      // Check if we're still on the same page after 300ms
      // This likely means navigation failed
      if (!hasSucceeded || document.querySelector('#list-car-button')) {
        console.log('BUTTON DEBUG - Navigation appears unsuccessful, using direct URL fallback');
        
        try {
          if (!isLoggedIn) {
            window.location.href = "/auth";
          } else {
            window.location.href = "/sell-my-car?fallback=true";
          }
          console.log('BUTTON DEBUG - Direct URL navigation initiated');
        } catch (directErr) {
          console.error('BUTTON DEBUG - Direct URL navigation failed:', directErr);
        }
      }
      
      // Dismiss the loading toast after a delay
      setTimeout(() => toast.dismiss(toastId), 1000);
    }, 300);
    
    // Last resort: If button is still visible after 500ms, show retry message
    setTimeout(() => {
      if (document.querySelector('#list-car-button')) {
        console.log('BUTTON DEBUG - Button still visible after 500ms, showing retry message');
        toast.error("Navigation failed", {
          description: "Please try clicking again or refresh the page",
          duration: 5000
        });
        setIsNavigating(false);
      }
    }, 500);
  }, [onClick, isLoggedIn]);

  return (
    <Button 
      onClick={handleButtonClick}
      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
      type="button"
      id="list-car-button"
      data-testid="list-car-button"
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
