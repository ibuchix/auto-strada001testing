
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
  }, [make, model, year, hasValuation, isLoggedIn]);

  // Stabilized callback to prevent recreation on each render
  const handleContinueClick = useCallback((e: React.MouseEvent) => {
    console.log('Continue button clicked - preparing to navigate', {
      timestamp: new Date().toISOString(),
      event: e.type,
      target: e.currentTarget.tagName,
      mounted: isMounted.current
    });
    
    // Prevent default behavior and stop event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent execution if component is unmounted
    if (!isMounted.current) {
      console.log('Ignoring click - component unmounted');
      return;
    }
    
    // Store last interaction timestamp as a debug reference
    try {
      localStorage.setItem('lastButtonClick', new Date().toISOString());
      localStorage.setItem('listCarAction', 'initiated');
    } catch (err) {
      console.warn('Error saving click state to localStorage:', err);
    }
    
    // Execute the continue callback
    console.log('Executing continue action');
    onContinue();
    
    // Update action status
    try {
      localStorage.setItem('listCarAction', 'completed');
    } catch (err) {
      console.warn('Error updating action state:', err);
    }
  }, [onContinue]);

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
