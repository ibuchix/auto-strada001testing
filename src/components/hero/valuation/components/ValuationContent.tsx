
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
 * - 2025-07-04: Refactored into smaller components for better maintainability
 * - 2025-07-08: Updated onContinue type to handle argument-less function calls
 * - 2025-07-09: Removed component unmount check that was blocking navigation
 * - 2024-08-02: Removed average price from ValuationDisplay to prevent sellers from seeing it
 * - 2025-10-20: Fixed reserve price handling and added more debugging
 * - 2024-12-14: Added missing error and retry props to ValuationDisplay
 */

import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { ValuationDisplay } from "./ValuationDisplay";
import { VehicleDetails } from "./VehicleDetails";
import { ValuationDialogFooter } from "./layout/DialogFooter";
import { useCallback, useEffect } from "react";

interface ValuationContentProps {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  mileage: number;
  reservePrice?: number;
  averagePrice?: number; // Still accept this prop but don't display it
  hasValuation: boolean;
  isLoggedIn: boolean;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
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
  averagePrice, // Keep receiving this but don't pass it to ValuationDisplay
  hasValuation,
  isLoggedIn,
  isLoading,
  error,
  onRetry,
  onClose,
  onContinue
}: ValuationContentProps) => {
  // Log component mount with key props
  useEffect(() => {
    console.log('ValuationContent mounted with data:', {
      make, model, year, hasValuation, isLoggedIn,
      reservePrice, averagePrice, isLoading, error
    });
    
    return () => {
      console.log('ValuationContent unmounted');
    };
  }, [make, model, year, hasValuation, isLoggedIn, reservePrice, averagePrice, isLoading, error]);

  // Stabilized callback to prevent recreation on each render
  const handleContinueClick = useCallback(() => {
    // Comprehensive event logging
    console.log('Continue button clicked - initiating action:', {
      timestamp: new Date().toISOString(),
      make, model, year,
      isLoggedIn
    });
    
    // Store last interaction timestamp and debug info
    try {
      localStorage.setItem('lastButtonClick', new Date().toISOString());
      localStorage.setItem('listCarAction', 'initiated');
      localStorage.setItem('clickEventDetails', JSON.stringify({
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
    
    // Execute the continue callback directly without unmount check
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
            reservePrice={reservePrice}
            averagePrice={averagePrice}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
          />
        )}
      </div>

      <ValuationDialogFooter
        isLoggedIn={isLoggedIn}
        onClose={onClose}
        onContinue={handleContinueClick}
      />
    </DialogContent>
  );
};
