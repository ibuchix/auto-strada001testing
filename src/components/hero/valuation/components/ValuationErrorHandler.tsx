
/**
 * Changes made:
 * - 2025-04-21: Created component for handling valuation errors extracted from ValuationResult
 * - 2026-04-15: Enhanced error feedback and added resilience for network issues
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useState, useEffect } from "react";

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
  const { isOffline } = useOfflineStatus();
  const [retryCount, setRetryCount] = useState(0);
  
  // Check if the error is related to network connectivity
  const isNetworkError = valuationResult.error?.toLowerCase().includes('network') ||
    valuationResult.error?.toLowerCase().includes('connection') ||
    valuationResult.error?.toLowerCase().includes('timeout') ||
    isOffline;

  // Increment retry count when component mounts
  useEffect(() => {
    const storedCount = Number(sessionStorage.getItem('valuationRetryCount') || '0');
    setRetryCount(storedCount);
    sessionStorage.setItem('valuationRetryCount', (storedCount + 1).toString());
    
    return () => {
      // If component unmounts with successful close, reset the counter
      if (!valuationResult.error) {
        sessionStorage.removeItem('valuationRetryCount');
      }
    };
  }, [valuationResult.error]);
  
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
    
    // Clear retry counter
    sessionStorage.removeItem('valuationRetryCount');
    
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

  // Enhanced retry handler that resets counter on manual option
  const handleRetry = () => {
    if (onRetry) {
      // If offline and trying to retry, warn the user
      if (isOffline) {
        toast.warning("You appear to be offline", {
          description: "Please check your internet connection before retrying.",
          duration: 4000
        });
      }
      
      // After multiple retries, suggest the manual option
      if (retryCount >= 2 && !isOffline) {
        toast.info("Multiple retry attempts detected", {
          description: "You might want to try the manual valuation option if this persists.",
          duration: 5000
        });
      }
      
      onRetry();
    }
  };

  // Prepare the error message for other errors or no data
  let errorMessage = valuationResult.error || 
    "No data found for this VIN. Would you like to proceed with manual valuation?";
    
  // If we're offline, provide a clearer error message
  if (isOffline) {
    errorMessage = "You appear to be offline. Please check your internet connection and try again, or proceed with manual valuation.";
  }
  
  // For repeated retries, suggest manual valuation more strongly
  if (retryCount >= 3) {
    errorMessage = "We're having trouble retrieving the valuation. This could be due to high demand or temporary service issues. We recommend proceeding with manual valuation.";
  }
  
  return (
    <ErrorDialog 
      error={errorMessage}
      onClose={onClose}
      onRetry={handleRetry}
      showManualOption={true}
      onManualValuation={handleManualValuation}
    />
  );
};
