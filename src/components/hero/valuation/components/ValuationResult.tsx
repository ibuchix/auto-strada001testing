
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation result display
 * - 2024-03-19: Added user authentication checks
 * - 2024-03-19: Implemented seller role validation
 * - 2024-03-19: Updated to pass reserve price to ValuationDisplay
 * - 2024-03-19: Refactored into smaller components
 * - 2024-03-19: Fixed type error in hasValuation check
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { ValuationMainContent } from "./ValuationMainContent";
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
  // Fix: Ensure hasValuation is a boolean by using !! to convert numbers to boolean
  const hasValuation = !hasError && !!(valuationResult.averagePrice || valuationResult.valuation);

  if (hasError && valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  if (hasError || valuationResult.noData) {
    return (
      <ErrorDialog 
        error={valuationResult.error || "No data found for this VIN. Would you like to proceed with manual valuation?"}
        onClose={onClose}
        onRetry={onRetry}
        showManualOption={true}
        onManualValuation={() => {
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
    <ValuationMainContent
      make={valuationResult.make}
      model={valuationResult.model}
      year={valuationResult.year}
      vin={valuationResult.vin}
      transmission={valuationResult.transmission}
      mileage={mileage}
      averagePrice={valuationResult.averagePrice}
      valuation={valuationResult.valuation}
      reservePrice={valuationResult.reservePrice}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={() => handleContinue(valuationResult)}
    />
  );
};
