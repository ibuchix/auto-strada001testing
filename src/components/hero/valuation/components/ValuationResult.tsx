
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation result display
 * - 2024-03-19: Added user authentication checks
 * - 2024-03-19: Implemented seller role validation
 * - 2024-03-19: Updated to pass reserve price to ValuationDisplay
 * - 2024-03-19: Refactored into smaller components
 * - 2024-03-19: Fixed type error in props passed to ValuationContent
 * - 2024-03-19: Added averagePrice to ValuationContent props
 * - 2024-03-19: Fixed valuation data being passed incorrectly
 * - 2024-08-05: Enhanced error handling and improved manual valuation flow
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { ValuationContent } from "./ValuationContent";
import { useValuationContinue } from "../hooks/useValuationContinue";

interface ValuationResultProps {
  valuationResult: {
    make: string;
    model: string;
    year: number;
    vin: string;
    transmission: string;
    valuation?: number;
    averagePrice?: number;
    reservePrice?: number;
    isExisting?: boolean;
    error?: string;
    noData?: boolean;
  };
  onContinue: () => void;
  onClose: () => void;
  onRetry?: () => void;
}

export const ValuationResult = ({ 
  valuationResult, 
  onContinue, 
  onClose,
  onRetry 
}: ValuationResultProps) => {
  const navigate = useNavigate();
  const { handleContinue, isLoggedIn } = useValuationContinue();
  
  if (!valuationResult) return null;

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = !!valuationResult.error;
  const hasValuation = !hasError && !!(valuationResult.valuation || valuationResult.averagePrice);

  if (hasError && valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  if (hasError || valuationResult.noData) {
    // Prepare the error message
    const errorMessage = valuationResult.error || 
      "No data found for this VIN. Would you like to proceed with manual valuation?";
    
    return (
      <ErrorDialog 
        error={errorMessage}
        onClose={onClose}
        onRetry={onRetry}
        showManualOption={true}
        onManualValuation={() => {
          // Store the VIN and other data in localStorage for the manual form
          if (valuationResult.vin) {
            localStorage.setItem('tempVIN', valuationResult.vin);
          }
          if (mileage) {
            localStorage.setItem('tempMileage', mileage.toString());
          }
          if (valuationResult.transmission) {
            localStorage.setItem('tempGearbox', valuationResult.transmission);
          }
          
          if (!isLoggedIn) {
            navigate('/auth');
            toast.info("Please sign in first", {
              description: "Create an account or sign in to continue with manual valuation.",
            });
          } else {
            navigate('/manual-valuation');
          }
        }}
      />
    );
  }

  return (
    <ValuationContent
      make={valuationResult.make}
      model={valuationResult.model}
      year={valuationResult.year}
      vin={valuationResult.vin}
      transmission={valuationResult.transmission}
      mileage={mileage}
      reservePrice={valuationResult.valuation}
      averagePrice={valuationResult.averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={() => handleContinue(valuationResult)}
    />
  );
};
