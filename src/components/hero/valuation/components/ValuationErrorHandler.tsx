
/**
 * Changes made:
 * - 2025-04-21: Created component for handling valuation errors extracted from ValuationResult
 * - 2026-04-15: Enhanced error feedback and added resilience for network issues
 * - 2027-06-20: Extracted from ValuationResult component as part of code refactoring
 * - 2024-08-15: Updated with consistent recovery paths and UI patterns
 * - 2026-05-10: Improved offline detection and handling
 * - 2025-04-05: Fixed TypeScript type issues
 * - 2025-04-08: Added fallbacks for partial data to prevent unnecessary errors
 * - 2025-04-10: Improved error message display and retry handling for VIN not found
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ErrorDialog } from "./ErrorDialog";
import { ExistingVehicleDialog } from "./dialogs/ExistingVehicleDialog";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useState, useEffect } from "react";
import { AppError } from "@/errors/classes";

interface ValuationErrorHandlerProps {
  valuationResult: {
    error?: string | AppError;
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
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<number | null>(null);
  
  // Extract error message regardless of error type
  const errorMsg = typeof valuationResult.error === 'string' 
    ? valuationResult.error 
    : valuationResult.error instanceof AppError 
      ? valuationResult.error.message 
      : '';
  
  // Check if the error is related to network connectivity
  const isNetworkError = errorMsg.toLowerCase().includes('network') ||
    errorMsg.toLowerCase().includes('connection') ||
    errorMsg.toLowerCase().includes('timeout') ||
    isOffline;

  // Check if this is a "No data found" error specifically
  const isNoDataError = errorMsg.toLowerCase().includes('no data found') ||
    errorMsg.toLowerCase().includes('no vehicle data') ||
    valuationResult.noData;

  // Check if we have partial but usable data
  const hasPartialData = !!(
    valuationResult.make && 
    valuationResult.model && 
    valuationResult.year
  );

  // Load retry count from session storage when component mounts
  useEffect(() => {
    const storedCount = Number(sessionStorage.getItem('valuationRetryCount') || '0');
    setRetryCount(storedCount);
    
    const storedTime = sessionStorage.getItem('valuationLastRetryTime');
    setLastRetryTime(storedTime ? Number(storedTime) : null);
    
    // If it's been more than 5 minutes since the last retry, reset the counter
    if (storedTime && Date.now() - Number(storedTime) > 5 * 60 * 1000) {
      sessionStorage.removeItem('valuationRetryCount');
      sessionStorage.removeItem('valuationLastRetryTime');
      setRetryCount(0);
      setLastRetryTime(null);
    } else {
      // Otherwise, increment the counter
      const newCount = storedCount + 1;
      sessionStorage.setItem('valuationRetryCount', newCount.toString());
      sessionStorage.setItem('valuationLastRetryTime', Date.now().toString());
    }
    
    // Log the error and retry count
    console.log('Valuation error handled:', {
      error: errorMsg,
      isNoDataError,
      isNetworkError,
      hasPartialData,
      retryCount: storedCount,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      // If component unmounts with successful close, reset the counter
      if (!valuationResult.error) {
        sessionStorage.removeItem('valuationRetryCount');
        sessionStorage.removeItem('valuationLastRetryTime');
      }
    };
  }, [valuationResult.error, errorMsg, isNoDataError, isNetworkError, hasPartialData]);
  
  // If we have partial data that's actually usable, bypass the error and use what we have
  if (hasPartialData && valuationResult.noData && !valuationResult.isExisting) {
    console.log('Salvaging partial data for:', {
      make: valuationResult.make,
      model: valuationResult.model,
      year: valuationResult.year
    });
    
    // Store the partial data
    const partialData = {
      make: valuationResult.make,
      model: valuationResult.model,
      year: valuationResult.year,
      vin: valuationResult.vin || '',
      transmission: valuationResult.transmission || 'manual',
      mileage: mileage
    };
    
    localStorage.setItem('valuationData', JSON.stringify(partialData));
    if (valuationResult.vin) localStorage.setItem('tempVIN', valuationResult.vin);
    localStorage.setItem('tempMileage', mileage.toString());
    if (valuationResult.transmission) localStorage.setItem('tempGearbox', valuationResult.transmission);
    
    // Show toast about using partial data
    toast.info("Using partial vehicle data", {
      description: "Some data was found for this vehicle. You can proceed with listing.",
    });
    
    // Close current dialog
    onClose();
    
    // Redirect to sell page with the partial data
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
    sessionStorage.removeItem('valuationLastRetryTime');
    
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
      
      // Add delay between retries to prevent hammering the service
      if (lastRetryTime && Date.now() - lastRetryTime < 2000) {
        toast.info("Please wait before retrying", {
          description: "We're limiting requests to protect our services.",
          duration: 2000
        });
        
        // Wait a bit, then invoke retry
        setTimeout(() => {
          setLastRetryTime(Date.now());
          sessionStorage.setItem('valuationLastRetryTime', Date.now().toString());
          onRetry();
        }, 2000);
      } else {
        setLastRetryTime(Date.now());
        sessionStorage.setItem('valuationLastRetryTime', Date.now().toString());
        onRetry();
      }
    }
  };

  // Use recovery action from AppError if available
  const getRecoveryAction = () => {
    if (typeof valuationResult.error !== 'string' && 
        valuationResult.error instanceof AppError && 
        valuationResult.error.recovery?.handler) {
      return valuationResult.error.recovery.handler;
    }
    return handleRetry;
  };

  // Prepare the error message based on error type
  let errorMessage = '';
  
  if (isNoDataError) {
    errorMessage = "No data found for this VIN. Would you like to proceed with manual valuation?";
    // For repeated "no data" errors, give more context
    if (retryCount >= 2) {
      errorMessage = "This VIN doesn't appear to be in our database. This could be because the vehicle is rare, very new, or there might be an issue with the VIN format. You can proceed with manual valuation instead.";
    }
  } else if (isNetworkError) {
    errorMessage = "You appear to be offline or we're having trouble connecting to our services. Please check your internet connection and try again, or proceed with manual valuation.";
  } else if (errorMsg) {
    errorMessage = errorMsg;
  } else {
    errorMessage = "An unexpected error occurred. Would you like to try again or proceed with manual valuation?";
  }
  
  // For repeated retries, suggest manual valuation more strongly
  if (retryCount >= 3) {
    errorMessage = "We're having trouble retrieving the valuation after multiple attempts. This could be due to high demand or temporary service issues. We recommend proceeding with manual valuation.";
  }
  
  return (
    <ErrorDialog 
      error={errorMessage}
      onClose={onClose}
      onRetry={getRecoveryAction()}
      showManualOption={true}
      onManualValuation={handleManualValuation}
      isOffline={isOffline}
    />
  );
};
