
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
 */

import { useEffect, useState } from "react";
import { ValuationContent } from "./valuation/components/ValuationContent";
import { ValuationErrorHandler } from "./valuation/components/ValuationErrorHandler";
import { useValuationNavigation } from "./valuation/hooks/useValuationNavigation";
import { toast } from "sonner";
import { useRealtime } from "@/components/RealtimeProvider";

interface ValuationResultProps {
  valuationResult: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    transmission?: string;
    valuation?: number | null;
    reservePrice?: number | null; // Added reservePrice as alternative property name
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
  const { isConnected } = useRealtime();
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug log valuation result on component mount
  useEffect(() => {
    console.log('ValuationResult mounted with data:', {
      hasData: !!valuationResult,
      make: valuationResult?.make,
      model: valuationResult?.model,
      valuation: valuationResult?.valuation,
      reservePrice: valuationResult?.reservePrice,
      valuationType: valuationResult?.valuation !== undefined ? typeof valuationResult.valuation : 'undefined',
      reservePriceType: valuationResult?.reservePrice !== undefined ? typeof valuationResult.reservePrice : 'undefined',
      hasError: !!valuationResult?.error,
      authStatus: isLoggedIn ? 'authenticated' : 'unauthenticated',
      realtimeStatus: isConnected ? 'connected' : 'disconnected'
    });
    
    // Check if we have incomplete valuation data
    if (valuationResult && !valuationResult.error && !valuationResult.make) {
      console.warn('Incomplete valuation data detected:', valuationResult);
    }
    
    // Initial loading state
    setIsLoading(false);
  }, [valuationResult, isLoggedIn, isConnected]);
  
  // Ensure we have valid valuation data
  if (!valuationResult) {
    console.error('No valuation result provided to ValuationResult component');
    return null;
  }

  // Normalization function to handle property name variations
  const normalizeResult = () => {
    const normalized = { ...valuationResult };
    
    // Ensure either reservePrice or valuation is available (if one exists without the other)
    if (normalized.valuation !== undefined && normalized.reservePrice === undefined) {
      normalized.reservePrice = normalized.valuation;
    } else if (normalized.reservePrice !== undefined && normalized.valuation === undefined) {
      normalized.valuation = normalized.reservePrice;
    }
    
    // Convert string values to numbers if needed
    if (typeof normalized.valuation === 'string') {
      normalized.valuation = Number(normalized.valuation);
    }
    if (typeof normalized.reservePrice === 'string') {
      normalized.reservePrice = Number(normalized.reservePrice);
    }
    if (typeof normalized.averagePrice === 'string') {
      normalized.averagePrice = Number(normalized.averagePrice);
    }
    
    return normalized;
  };
  
  const normalizedResult = normalizeResult();

  // Validation to prevent rendering with invalid data
  if (!normalizedResult.error && (!normalizedResult.make || !normalizedResult.model)) {
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
        mileage={parseInt(localStorage.getItem('tempMileage') || '0')}
        isLoggedIn={isLoggedIn}
        onClose={onClose}
        onRetry={onRetry}
      />
    );
  }

  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  const hasError = Boolean(normalizedResult.error || normalizedResult.noData);
  const hasValuation = !hasError && (
    normalizedResult.valuation !== undefined && normalizedResult.valuation !== null ||
    normalizedResult.reservePrice !== undefined && normalizedResult.reservePrice !== null
  );
  
  console.log('ValuationResult - Display values:', {
    valuation: normalizedResult.valuation,
    reservePrice: normalizedResult.reservePrice,
    hasValuation
  });

  // Handle error cases with the dedicated component
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

  // Handle retry
  const handleRetry = () => {
    setIsLoading(true);
    if (onRetry) {
      onRetry();
    } else {
      setIsLoading(false);
      toast.error("Retry function not available");
    }
  };

  // Improved continue handler that initiates navigation BEFORE closing the dialog
  const handleContinueClick = () => {
    console.log('ValuationResult - handleContinueClick triggered');
    
    // Store all necessary navigation data in variables first
    const navigationData = {
      ...normalizedResult,
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
      make={normalizedResult.make || 'Unknown'}
      model={normalizedResult.model || 'Vehicle'}
      year={normalizedResult.year || new Date().getFullYear()}
      vin={normalizedResult.vin || ''}
      transmission={normalizedResult.transmission || 'unknown'}
      mileage={mileage}
      reservePrice={normalizedResult.reservePrice || normalizedResult.valuation}
      // Still pass averagePrice in props but it won't be displayed
      averagePrice={normalizedResult.averagePrice}
      hasValuation={hasValuation}
      isLoggedIn={isLoggedIn}
      isLoading={isLoading}
      error={normalizedResult.error}
      onRetry={handleRetry}
      onClose={onClose}
      onContinue={handleContinueClick}
    />
  );
};
