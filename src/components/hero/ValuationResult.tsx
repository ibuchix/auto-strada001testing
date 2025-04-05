
/**
 * Changes made:
 * - 2024-11-11: Fixed unresponsive "List This Car" button by addressing JSON parsing issues
 * - 2024-11-11: Improved data passing to the listing form
 * - 2024-11-12: Implemented direct navigation for more reliable redirect
 * - 2025-04-05: Simplified navigation flow by removing redundant mechanisms
 * - 2025-04-05: Removed excessive debugging and consolidated error handling
 */

import { useState } from "react";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { ValuationErrorHandler } from "./valuation/components/ValuationErrorHandler";
import { normalizeValuationData, validateValuationData } from "./valuation/utils/valuationDataNormalizer";
import { toast } from "sonner";
import { TransmissionType } from "./valuation/types";

interface ValuationResultProps {
  valuationResult: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    transmission?: string;
    valuation?: number | null;
    reservePrice?: number | null;
    averagePrice?: number | null;
    isExisting?: boolean;
    error?: string;
    rawResponse?: any;
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is logged in (simplified)
  const isLoggedIn = !!localStorage.getItem('supabase.auth.token');
  
  // Ensure we have valid valuation data
  if (!valuationResult) {
    console.error('No valuation result provided to ValuationResult component');
    return null;
  }
  
  // Convert transmission string to TransmissionType before normalizing
  const preparedResult = {
    ...valuationResult,
    // Cast to TransmissionType if valid, or use 'manual' as fallback
    transmission: (valuationResult.transmission === 'manual' || valuationResult.transmission === 'automatic')
      ? valuationResult.transmission as TransmissionType
      : 'manual' as TransmissionType
  };
  
  // Normalize and validate data using our utility functions
  const normalizedResult = normalizeValuationData(preparedResult);
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = Boolean(normalizedResult.error || normalizedResult.noData);
  const isValidData = validateValuationData(normalizedResult);

  // Handle validation errors - incomplete data without explicit error
  if (!hasError && !isValidData) {
    console.error('Invalid valuation data detected:', normalizedResult);
    
    // Create an error result for the error handler to display
    const errorResult = {
      ...normalizedResult,
      error: 'Incomplete valuation data received. Please try again.',
      noData: true
    };
    
    return (
      <ValuationErrorHandler
        valuationResult={errorResult}
        mileage={mileage}
        isLoggedIn={isLoggedIn}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  // Handle explicit error cases with the dedicated component
  if (hasError) {
    return (
      <ValuationErrorHandler
        valuationResult={normalizedResult}
        mileage={mileage}
        isLoggedIn={isLoggedIn}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  // Wrapper for continue button click handling
  const handleContinueWrapper = () => {
    setIsLoading(true);
    
    // Then close the dialog
    try {
      onClose();
    } catch (closeError) {
      console.error('Error closing dialog:', closeError);
    }
  };

  // Wrapper for retry handling
  const handleRetryWrapper = () => {
    setIsLoading(true);
    if (onRetry) {
      try {
        onRetry();
      } catch (error) {
        console.error('Error in retry handler:', error);
        setIsLoading(false);
        toast.error('Failed to retry valuation');
      }
    } else {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Render main content for successful valuations
  return (
    <ValuationContent
      make={normalizedResult.make || 'Unknown'}
      model={normalizedResult.model || 'Vehicle'}
      year={normalizedResult.year || new Date().getFullYear()}
      vin={normalizedResult.vin || ''}
      transmission={normalizedResult.transmission || 'manual'}
      mileage={mileage}
      reservePrice={normalizedResult.reservePrice || normalizedResult.valuation}
      // Still pass averagePrice in props but it won't be displayed
      averagePrice={normalizedResult.averagePrice}
      hasValuation={isValidData}
      isLoggedIn={isLoggedIn}
      isLoading={isLoading}
      error={normalizedResult.error}
      onRetry={handleRetryWrapper}
      onClose={onClose}
      onContinue={handleContinueWrapper}
    />
  );
};
