
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for the continue button with enhanced click handling
 * - 2025-07-05: Fixed button click propagation issues that prevented listing process
 * - 2025-07-05: Added additional debugging and event capturing for maximum reliability
 * - 2025-07-06: Fixed React ref warning and improved click handling
 */

import { Button } from "@/components/ui/button";
import { useCallback, useEffect } from "react";

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const ContinueButton = ({ isLoggedIn, onClick }: ContinueButtonProps) => {
  // Enhanced click handler with debugging
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('ContinueButton - handleButtonClick triggered', {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      timestamp: new Date().toISOString()
    });
    
    // Call the provided onClick handler
    onClick(e);
    
    // Log after click for debugging
    console.log('ContinueButton - handleButtonClick completed');
  }, [onClick]);
  
  // Log component mount with debug info
  useEffect(() => {
    console.log('ContinueButton mounted with auth state:', { isLoggedIn });
    
    return () => {
      console.log('ContinueButton - useEffect cleanup executed');
    };
  }, [isLoggedIn]);

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
