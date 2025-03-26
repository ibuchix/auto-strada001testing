
/**
 * Changes made:
 * - 2024-11-11: Fixed unresponsive "List This Car" button by addressing JSON parsing issues
 * - 2024-11-11: Improved data passing to the listing form
 * - 2024-11-11: Fixed button click handler to work on both mobile and desktop devices
 * - 2024-11-12: Implemented direct navigation instead of using React Router for more reliable redirect
 * - 2024-11-14: Enhanced seller status handling to prevent 403 Forbidden errors
 * - 2024-12-05: Completely redesigned navigation flow for maximum reliability with detailed logging
 * - 2024-12-29: Fixed seller verification issues with enhanced error handling and more reliable status checks
 * - 2025-03-21: Enhanced navigation logic with improved logging and more reliable state management
 * - 2025-04-21: Refactored into smaller components for better maintainability
 * - 2025-07-07: Simplified navigation flow to ensure clicks always work
 * - 2025-07-08: Fixed TypeScript error with onContinue handler signature
 * - 2025-07-09: Fixed race condition by preparing navigation before closing dialog
 * - 2024-08-02: Removed average price from UI to prevent sellers from seeing it
 * - 2025-09-18: Added error recovery for missing or invalid valuation data
 * - 2024-12-14: Fixed handling of valuation result properties and improved resilience
 * - 2026-04-10: Added proper null/undefined handling and type checking
 * - 2026-04-16: Added WebSocket connection error handling to ensure navigation works regardless of connection status
 * - 2027-06-04: Added missing handleRetry function for error recovery
 * - 2027-06-08: Added comprehensive diagnostics logging for navigation troubleshooting
 * - 2027-06-20: Refactored component into smaller, more manageable components
 * - 2027-07-01: Fixed TypeScript transmission type error by ensuring proper type casting
 * - 2027-07-22: Fixed TypeScript error with timeoutId return value
 * - 2027-07-27: Fixed loading state propagation for the Continue button
 */

import { useState } from "react";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { ValuationErrorHandler } from "./valuation/components/ValuationErrorHandler";
import { NavigationDebugger } from "./valuation/components/NavigationDebugger";
import { useRealtime } from "@/components/RealtimeProvider";
import { useValuationResultNavigation } from "./valuation/hooks/useValuationResultNavigation";
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
  const { isConnected } = useRealtime();
  const {
    handleContinueClick,
    handleRetry,
    isLoading,
    navigationAttempts,
    componentId,
    isLoggedIn
  } = useValuationResultNavigation();
  
  // Ensure we have valid valuation data
  if (!valuationResult) {
    console.error('No valuation result provided to ValuationResult component');
    return null;
  }

  // Add debugging component for trace logging
  const DebuggerComponent = () => (
    <NavigationDebugger
      componentId={componentId}
      data={valuationResult}
      isLoading={isLoading}
      navigationAttempts={navigationAttempts}
    />
  );
  
  // Show warning about connection status if needed
  if (!isConnected) {
    console.warn(`ValuationResult[${componentId}] - WebSocket connection unavailable - using fallback navigation methods`);
    // Toast to inform user about offline mode
    toast.warning("Connection issue detected", {
      description: "Navigation may be affected. Please be patient.",
      duration: 3000
    });
  }
  
  // Convert transmission string to TransmissionType before normalizing
  const preparedResult = {
    ...valuationResult,
    // Cast to TransmissionType if valid, or use 'manual' as fallback
    transmission: (valuationResult.transmission === 'manual' || valuationResult.transmission === 'automatic')
      ? valuationResult.transmission as TransmissionType
      : 'manual' as TransmissionType
  };
  
  // Normalize and validate data
  const normalizedResult = normalizeValuationData(preparedResult);
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = Boolean(normalizedResult.error || normalizedResult.noData);
  const isValidData = validateValuationData(normalizedResult);
  
  console.log('ValuationResult - Display values:', {
    valuation: normalizedResult.valuation,
    reservePrice: normalizedResult.reservePrice,
    hasValidData: isValidData,
    navigationAttempts,
    isLoading
  });

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
      <>
        <DebuggerComponent />
        <ValuationErrorHandler
          valuationResult={errorResult}
          mileage={mileage}
          isLoggedIn={isLoggedIn}
          onClose={onClose}
          onRetry={onRetry}
        />
      </>
    );
  }

  // Handle explicit error cases with the dedicated component
  if (hasError) {
    return (
      <>
        <DebuggerComponent />
        <ValuationErrorHandler
          valuationResult={normalizedResult}
          mileage={mileage}
          isLoggedIn={isLoggedIn}
          onClose={onClose}
          onRetry={onRetry}
        />
      </>
    );
  }

  // Wrapper for continue button click handling
  const handleContinueWrapper = () => {
    console.log('ValuationResult - handleContinueWrapper triggered');
    
    // Execute the navigation logic first
    handleContinueClick(normalizedResult);
    
    // Then close the dialog
    console.log('ValuationResult - Closing dialog');
    try {
      onClose();
      console.log('ValuationResult - Dialog closed successfully');
    } catch (closeError) {
      console.error('ValuationResult - Error closing dialog:', closeError);
      // If dialog closing fails, still make sure navigation happens via timeout
      console.log('ValuationResult - Relying on timeout for navigation');
    }
  };

  // Wrapper for retry handling
  const handleRetryWrapper = () => {
    handleRetry(onRetry);
  };

  // Render main content for successful valuations
  return (
    <>
      <DebuggerComponent />
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
    </>
  );
};
