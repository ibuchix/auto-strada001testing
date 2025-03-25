
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
 */

import { useEffect } from "react";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { ValuationErrorHandler } from "./valuation/components/ValuationErrorHandler";
import { useValuationNavigation } from "./valuation/hooks/useValuationNavigation";
import { toast } from "sonner";

interface ValuationResultProps {
  valuationResult: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    transmission?: string;
    valuation?: number | null;
    averagePrice?: number | null; // Keep this in the type but don't display it
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
  const { handleContinue, isLoggedIn } = useValuationNavigation();
  
  // Debug log valuation result on component mount
  useEffect(() => {
    console.log('ValuationResult mounted with data:', {
      hasData: !!valuationResult,
      make: valuationResult?.make,
      model: valuationResult?.model,
      hasError: !!valuationResult?.error,
      authStatus: isLoggedIn ? 'authenticated' : 'unauthenticated'
    });
    
    // Check if we have incomplete valuation data
    if (valuationResult && !valuationResult.error && !valuationResult.make) {
      console.warn('Incomplete valuation data detected:', valuationResult);
    }
  }, [valuationResult, isLoggedIn]);
  
  // Ensure we have valid valuation data
  if (!valuationResult) {
    console.error('No valuation result provided to ValuationResult component');
    return null;
  }

  // Validation to prevent rendering with invalid data
  if (!valuationResult.error && (!valuationResult.make || !valuationResult.model)) {
    console.error('Invalid valuation data detected:', valuationResult);
    
    // Create an error result for the error handler to display
    const errorResult = {
      ...valuationResult,
      error: 'Incomplete valuation data received. Please try again.',
      noData: true
    };
    
    return (
      <ValuationErrorHandler
        valuationResult={errorResult}
        mileage={parseInt(localStorage.getItem('tempMileage') || '0')}
        isLoggedIn={isLoggedIn}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = Boolean(valuationResult.error || valuationResult.noData);
  const hasValuation = !hasError && Boolean(valuationResult.valuation);
  
  console.log('ValuationResult - Display price:', valuationResult.valuation);

  // Handle error cases with the dedicated component
  if (hasError) {
    return (
      <ValuationErrorHandler
        valuationResult={valuationResult}
        mileage={mileage}
        isLoggedIn={isLoggedIn}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  // Improved continue handler that initiates navigation BEFORE closing the dialog
  const handleContinueClick = () => {
    console.log('ValuationResult - handleContinueClick triggered');
    
    // Store all necessary navigation data in variables first
    const navigationData = {
      ...valuationResult,
      mileage
    };
    
    // Pre-create the navigation function to execute afterward
    const executeNavigation = () => {
      console.log('ValuationResult - Executing navigation with stored data');
      handleContinue(navigationData, navigationData.mileage);
    };
    
    // First register a timeout for navigation to happen even if component unmounts
    // This is our safety net
    window.setTimeout(executeNavigation, 100);
    
    // Then close the dialog
    console.log('ValuationResult - Closing dialog');
    onClose();
    
    // Also try to execute navigation immediately
    // One of these approaches should succeed
    try {
      console.log('ValuationResult - Attempting immediate navigation');
      executeNavigation();
    } catch (error) {
      console.error('ValuationResult - Error during immediate navigation, relying on timeout:', error);
      // We already set up the timeout above, so no need to do anything here
    }
  };

  // Render main content for successful valuations
  return (
    <ValuationContent
      make={valuationResult.make || 'Unknown'}
      model={valuationResult.model || 'Vehicle'}
      year={valuationResult.year || new Date().getFullYear()}
      vin={valuationResult.vin || ''}
      transmission={valuationResult.transmission || 'unknown'}
      mileage={mileage}
      reservePrice={valuationResult.valuation}
      // Still pass averagePrice in props but it won't be displayed
      averagePrice={valuationResult.averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      onClose={onClose}
      onContinue={handleContinueClick}
    />
  );
};
