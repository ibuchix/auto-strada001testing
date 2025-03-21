
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for the continue button with enhanced click handling
 * - 2025-07-05: Fixed button click propagation issues that prevented listing process
 * - 2025-07-05: Added additional debugging and event capturing for maximum reliability
 * - 2025-07-06: Fixed React ref warning and improved click handling
 * - 2025-07-07: Completely refactored click handling to guarantee navigation regardless of cache errors
 * - 2025-07-08: Updated click handler to ensure it works properly with type-safe callbacks
 */

import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const ContinueButton = ({ isLoggedIn, onClick }: ContinueButtonProps) => {
  // Enhanced click handler with maximum reliability
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    // Prevent default behavior to ensure we have full control
    e.preventDefault();
    e.stopPropagation();
    
    console.log('ContinueButton - handleButtonClick triggered', {
      type: e.type,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Call the provided onClick handler directly
      onClick(e);
      
      console.log('ContinueButton - onClick handler completed successfully');
    } catch (error) {
      // If click handler fails, log it but don't block the user
      console.error('ContinueButton - onClick handler error:', error);
      
      // Navigate directly as a fallback mechanism
      const sellMyCarUrl = "/sell-my-car";
      console.log('ContinueButton - Using emergency fallback navigation to:', sellMyCarUrl);
      
      // Force direct navigation as an ultimate fallback
      try {
        window.location.href = sellMyCarUrl;
      } catch (navError) {
        console.error('ContinueButton - Emergency navigation failed:', navError);
        // Last resort - replace location
        window.location.replace(sellMyCarUrl);
      }
    }
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
