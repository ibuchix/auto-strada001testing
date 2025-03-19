
/**
 * Changes made:
 * - 2024-03-19: Fixed props passed to ValuationDisplay
 * - 2024-03-19: Added vin prop and passed it to VehicleDetails
 * - 2024-03-19: Added averagePrice prop to handle API response data
 * - 2024-03-19: Fixed reserve price prop to use valuation instead of reservePrice
 * - 2024-11-11: Fixed button click handling for mobile devices by improving event handler
 * - 2024-11-12: Enhanced button click handler for better cross-device compatibility
 * - 2024-11-14: Further improved button click handler reliability for all devices
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
  // Super reliable click handler that works consistently across all devices and prevents propagation issues
  const handleContinueClick = (e: React.MouseEvent) => {
    // Prevent any default behavior
    if (e && e.preventDefault) e.preventDefault();
    
    // Stop propagation to prevent event bubbling issues
    if (e && e.stopPropagation) e.stopPropagation();
    
    // Log the click for debugging
    console.log('Continue button clicked - initiating continue action');
    
    // Use setTimeout with 0ms delay to break out of the current event cycle
    // This ensures the dialog close doesn't interfere with the navigation
    setTimeout(() => {
      // Store the click action in sessionStorage as a fallback mechanism
      // in case the direct call fails (rare edge case on some mobile browsers)
      sessionStorage.setItem('pendingContinueAction', 'true');
      sessionStorage.setItem('continueActionTimestamp', Date.now().toString());
      
      // Directly invoke the continue callback
      onContinue();
    }, 0);
  };

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
