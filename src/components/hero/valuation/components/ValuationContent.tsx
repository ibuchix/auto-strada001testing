
/**
 * Changes made:
 * - 2024-03-19: Fixed props passed to ValuationDisplay
 * - 2024-03-19: Added vin prop and passed it to VehicleDetails
 * - 2024-03-19: Added averagePrice prop to handle API response data
 * - 2024-03-19: Fixed reserve price prop to use valuation instead of reservePrice
 * - 2024-11-11: Fixed button click handling for mobile devices by improving event handler
 * - 2024-11-12: Enhanced button click handler for better cross-device compatibility
 * - 2024-11-14: Further improved button click handler reliability for all devices
 * - 2024-12-05: Completely redesigned button click handler for maximum reliability
 * - 2025-03-21: Added logging and improved event handling for more reliable navigation
 * - 2025-06-12: Added comprehensive debugging for button click interactions
 */

import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ValuationDisplay } from "./ValuationDisplay";
import { VehicleDetails } from "./VehicleDetails";
import { useCallback, useEffect, useRef } from "react";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  reservePrice?: number;
  averagePrice?: number;
  hasValuation: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationContent = ({
  make,
  model,
  year,
  vin,
  transmission,
  mileage,
  reservePrice,
  averagePrice,
  hasValuation,
  isLoggedIn,
  onClose,
  onContinue
}: ValuationContentProps) => {
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Debug function to check if button is visible and properly rendered
  const debugButtonState = () => {
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
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      console.log('ValuationContent unmounted');
    };
  }, []);
  
  // Log component mount with key props
  useEffect(() => {
    console.log('ValuationContent mounted with data:', {
      make, model, year, hasValuation, isLoggedIn
    });
    
    // Debug timeout to check button after render is complete
    setTimeout(() => {
      debugButtonState();
    }, 500);
    
    return () => {
      console.log('ValuationContent - useEffect cleanup executed');
    };
  }, [make, model, year, hasValuation, isLoggedIn]);

  // Stabilized callback to prevent recreation on each render
  const handleContinueClick = useCallback((e: React.MouseEvent) => {
    // Comprehensive event logging
    console.log('Continue button clicked - detailed event info:', {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target instanceof HTMLElement ? e.target.tagName : 'Unknown',
      currentTarget: e.currentTarget instanceof HTMLElement ? e.currentTarget.tagName : 'Unknown',
      isTrusted: e.isTrusted,
      buttonId: buttonRef.current?.id,
      buttonTestId: buttonRef.current?.getAttribute('data-testid'),
      eventPhase: e.eventPhase,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      defaultPrevented: e.defaultPrevented,
      timeStamp: e.timeStamp,
      mounted: isMounted.current
    });
    
    // Capture button state at time of click
    debugButtonState();
    
    // Prevent default behavior and stop event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Event default behavior prevented and propagation stopped');
    }
    
    // Prevent execution if component is unmounted
    if (!isMounted.current) {
      console.log('Ignoring click - component unmounted');
      return;
    }
    
    // Store last interaction timestamp and debug info
    try {
      localStorage.setItem('lastButtonClick', new Date().toISOString());
      localStorage.setItem('listCarAction', 'initiated');
      localStorage.setItem('clickEventDetails', JSON.stringify({
        buttonText: buttonRef.current?.textContent,
        isLoggedIn,
        make,
        model,
        year,
        timestamp: new Date().toISOString()
      }));
      console.log('Click state stored in localStorage');
    } catch (err) {
      console.error('Error saving click state to localStorage:', err);
    }
    
    // Execute the continue callback - wrapped in try/catch for debugging
    console.log('Executing continue action...');
    try {
      onContinue();
      console.log('Continue callback executed successfully');
    } catch (error) {
      console.error('Error in continue callback execution:', error);
    }
    
    // Update action status
    try {
      localStorage.setItem('listCarAction', 'completed');
      console.log('Action marked as completed in localStorage');
    } catch (err) {
      console.warn('Error updating action state:', err);
    }
  }, [onContinue, isLoggedIn, make, model, year]);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6">
          Vehicle Valuation Result
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <VehicleDetails
          make={make}
          model={model}
          year={year}
          vin={vin}
          transmission={transmission}
          mileage={mileage}
        />
        
        {hasValuation && (
          <ValuationDisplay 
            reservePrice={reservePrice || 0}
            averagePrice={averagePrice}
          />
        )}
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        <Button 
          ref={buttonRef}
          onClick={handleContinueClick}
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
      </DialogFooter>
    </DialogContent>
  );
};
