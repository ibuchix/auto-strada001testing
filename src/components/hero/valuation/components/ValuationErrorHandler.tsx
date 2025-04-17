
/**
 * Component for handling valuation errors and recovery
 * Updated: 2025-04-17 - Refactored into smaller components with improved type safety
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useRetryHandler } from "@/hooks/valuation/useRetryHandler";
import { salvagePartialData, hasUsablePartialData } from "@/utils/valuation/dataRecovery";
import { ValuationDialogManager } from "./ValuationDialogManager";
import { ValuationData, TransmissionType } from "@/utils/valuation/valuationDataTypes";

interface ValuationErrorHandlerProps {
  valuationResult: {
    error?: string;
    isExisting?: boolean;
    vin?: string;
    transmission?: string;
    noData?: boolean;
    make?: string;
    model?: string;
    year?: number;
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
  const { isOffline } = useOfflineStatus();
  const { handleRetry, resetRetry, hasReachedMaxRetries } = useRetryHandler();

  const handleManualValuation = () => {
    // Store current data
    if (valuationResult.vin) {
      localStorage.setItem('tempVIN', valuationResult.vin);
    }
    if (mileage) {
      localStorage.setItem('tempMileage', mileage.toString());
    }
    if (valuationResult.transmission) {
      localStorage.setItem('tempGearbox', valuationResult.transmission);
    }
    
    resetRetry();
    
    if (!isLoggedIn) {
      navigate('/auth');
      toast.info("Please sign in first", {
        description: "Create an account or sign in to continue with manual valuation.",
      });
    } else {
      navigate('/manual-valuation');
    }
  };

  // Convert valuationResult to a properly typed object
  const typedValuationResult: Partial<ValuationData> = {
    ...valuationResult,
    // Ensure transmission is properly typed
    transmission: valuationResult.transmission as TransmissionType,
    // Add mileage to the data
    mileage
  };

  // Try to salvage partial data if possible
  if (hasUsablePartialData(typedValuationResult)) {
    const partialData = salvagePartialData(typedValuationResult);

    if (partialData) {
      toast.info("Using partial vehicle data", {
        description: "Some data was found for this vehicle. You can proceed with listing.",
      });
      
      onClose();
      
      if (isLoggedIn) {
        navigate('/sell-my-car?from=valuation');
      } else {
        navigate('/auth');
        toast.info("Please sign in first", {
          description: "Create an account or sign in to proceed with your listing.",
        });
      }
      
      return null;
    }
  }

  const handleRetryAttempt = async () => {
    if (onRetry) {
      if (isOffline) {
        toast.warning("You appear to be offline", {
          description: "Please check your internet connection before retrying.",
        });
        return;
      }

      const success = await handleRetry(async () => {
        await onRetry();
      });

      if (!success && hasReachedMaxRetries) {
        toast.info("Consider manual valuation", {
          description: "Multiple retry attempts failed. You might want to try manual valuation.",
        });
      }
    }
  };

  return (
    <ValuationDialogManager
      error={valuationResult.error}
      errorDetails={valuationResult.noData ? "No data was found for this vehicle identification number." : undefined}
      isExisting={valuationResult.isExisting}
      isOffline={isOffline}
      valuation={typedValuationResult}
      onClose={onClose}
      onRetry={handleRetryAttempt}
      onManualValuation={handleManualValuation}
      showManualOption={!valuationResult.isExisting}
    />
  );
};
