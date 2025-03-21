
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for the continue button with enhanced click handling
 * - 2025-07-05: Fixed button click propagation issues that prevented listing process
 * - 2025-07-05: Added additional debugging and event capturing for maximum reliability
 */

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef } from "react";

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const ContinueButton = ({ isLoggedIn, onClick }: ContinueButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
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
  
  // Debug function to check if button is visible and properly rendered
  const debugButtonState = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      console.log('Button state:', {
        exists: !!buttonRef.current,
        visible: rect.width > 0 && rect.height > 0,
        position: {x: rect.x, y: rect.y},
        dimensions: {width: rect.width, height: rect.height},
        disabled: buttonRef.current.disabled,
        className: buttonRef.current.className,
        zIndex: window.getComputedStyle(buttonRef.current).zIndex
      });
    } else {
      console.warn('Button reference is null - not mounted or not rendered');
    }
  }, []);
  
  // Log component mount with debug info
  useEffect(() => {
    console.log('ContinueButton mounted with auth state:', { isLoggedIn });
    
    // Debug timeout to check button after render is complete
    setTimeout(() => {
      debugButtonState();
    }, 500);
    
    return () => {
      console.log('ContinueButton - useEffect cleanup executed');
    };
  }, [isLoggedIn, debugButtonState]);

  return (
    <Button 
      ref={buttonRef}
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
