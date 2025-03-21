
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for the continue button with enhanced click handling
 * - 2025-07-05: Fixed button click propagation issues that prevented listing process
 * - 2025-07-05: Added additional debugging and event capturing for maximum reliability
 * - 2025-07-06: Fixed React ref warning and improved click handling
 * - 2025-07-07: Completely refactored click handling to guarantee navigation regardless of cache errors
 * - 2025-07-08: Updated click handler to ensure it works properly with type-safe callbacks
 * - 2025-07-09: Simplified click handling to avoid complex event handling that might be blocking navigation
 */

import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: () => void;
}

export const ContinueButton = ({ isLoggedIn, onClick }: ContinueButtonProps) => {
  // Simple direct click handler with minimal event interference
  const handleButtonClick = useCallback(() => {
    console.log('ContinueButton - Direct click handler executing');
    
    // Call the onClick handler directly
    onClick();
    
    // Add a fallback for maximum reliability
    // If the original handler didn't navigate for some reason,
    // this will ensure the user can still proceed
    setTimeout(() => {
      try {
        // Check if we're still on the same page and navigation didn't happen
        if (document.querySelector('#list-car-button')) {
          console.log('ContinueButton - Using fallback navigation');
          window.location.href = "/sell-my-car";
        }
      } catch (err) {
        console.error('ContinueButton - Fallback error:', err);
      }
    }, 300);
  }, [onClick]);

  return (
    <Button 
      onClick={handleButtonClick}
      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
      type="button"
      id="list-car-button"
      data-testid="list-car-button"
    >
      {!isLoggedIn 
        ? "Sign Up to List Your Car" 
        : "List This Car"
      }
    </Button>
  );
};
