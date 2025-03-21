
/**
 * Changes made:
 * - 2025-04-21: Created component for handling valuation errors extracted from ValuationResult
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";

interface ValuationErrorHandlerProps {
  valuationResult: {
    error?: string;
    isExisting?: boolean;
    vin?: string;
    transmission?: string;
    noData?: boolean;
  };
  mileage: number;
  isLoggedIn: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const ValuationErrorHandler = ({
  valuationResult,
  mileage,
  isLoggedIn,
  onClose,
  onRetry
}: ValuationErrorHandlerProps) => {
  const navigate = useNavigate();
  
  const handleManualValuation = () => {
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
  };

  // Handle existing vehicle error
  if (valuationResult.isExisting) {
    return <ExistingVehicleDialog onClose={onClose} onRetry={onRetry} />;
  }

  // Prepare the error message for other errors or no data
  const errorMessage = valuationResult.error || 
    "No data found for this VIN. Would you like to proceed with manual valuation?";
  
  return (
    <ErrorDialog 
      error={errorMessage}
      onClose={onClose}
      onRetry={onRetry}
      showManualOption={true}
      onManualValuation={handleManualValuation}
    />
  );
};
