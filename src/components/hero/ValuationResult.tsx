
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
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  
  // Debug log valuation result on component mount with unique IDs to trace in console
  useEffect(() => {
    const componentId = Math.random().toString(36).substring(2, 10);
    
    console.log(`ValuationResult[${componentId}] - Component mounted with data:`, {
      hasData: !!valuationResult,
      make: valuationResult?.make,
      model: valuationResult?.model,
      valuation: valuationResult?.valuation,
      reservePrice: valuationResult?.reservePrice,
      valuationType: valuationResult?.valuation !== undefined ? typeof valuationResult.valuation : 'undefined',
      reservePriceType: valuationResult?.reservePrice !== undefined ? typeof valuationResult.reservePrice : 'undefined',
      hasError: !!valuationResult?.error,
      authStatus: isLoggedIn ? 'authenticated' : 'unauthenticated',
      realtimeStatus: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      componentId
    });
    
    // Store debug info in localStorage
    localStorage.setItem('valuationResultDebug', JSON.stringify({
      mounted: true,
      timestamp: new Date().toISOString(),
      componentId,
      hasData: !!valuationResult,
      hasAuth: isLoggedIn,
      hasRealtime: isConnected
    }));
    
    // Check if we have incomplete valuation data
    if (valuationResult && !valuationResult.error && !valuationResult.make) {
      console.warn(`ValuationResult[${componentId}] - Incomplete valuation data detected:`, valuationResult);
    }
    
    // Initial loading state
    setIsLoading(false);
    
    // Show warning about connection status if needed
    if (!isConnected) {
      console.warn(`ValuationResult[${componentId}] - WebSocket connection unavailable - using fallback navigation methods`);
      // Toast to inform user about offline mode
      toast.warning("Connection issue detected", {
        description: "Navigation may be affected. Please be patient.",
        duration: 3000
      });
    }
    
    // Cleanup and log on unmount
    return () => {
      console.log(`ValuationResult[${componentId}] - Component unmounting`, {
        navigationAttempts,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('valuationResultDebugUnmount', JSON.stringify({
        unmounted: true,
        timestamp: new Date().toISOString(),
        componentId,
        navigationAttempts
      }));
    };
  }, [valuationResult, isLoggedIn, isConnected, navigationAttempts]);
  
  // Ensure we have valid valuation data
  if (!valuationResult) {
    console.error('No valuation result provided to ValuationResult component');
    return null;
  }

  // Normalization function to handle property name variations
  const normalizeResult = () => {
    console.log('ValuationResult - Normalizing data');
    const normalized = { ...valuationResult };
    
    // Ensure either reservePrice or valuation is available (if one exists without the other)
    if (normalized.valuation !== undefined && normalized.reservePrice === undefined) {
      normalized.reservePrice = normalized.valuation;
      console.log('ValuationResult - Using valuation as reservePrice:', normalized.valuation);
    } else if (normalized.reservePrice !== undefined && normalized.valuation === undefined) {
      normalized.valuation = normalized.reservePrice;
      console.log('ValuationResult - Using reservePrice as valuation:', normalized.reservePrice);
    }
    
    // Convert string values to numbers if needed
    if (typeof normalized.valuation === 'string') {
      normalized.valuation = Number(normalized.valuation);
      console.log('ValuationResult - Converted valuation string to number:', normalized.valuation);
    }
    if (typeof normalized.reservePrice === 'string') {
      normalized.reservePrice = Number(normalized.reservePrice);
      console.log('ValuationResult - Converted reservePrice string to number:', normalized.reservePrice);
    }
    if (typeof normalized.averagePrice === 'string') {
      normalized.averagePrice = Number(normalized.averagePrice);
      console.log('ValuationResult - Converted averagePrice string to number:', normalized.averagePrice);
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
    hasValuation,
    navigationAttempts
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

  // Enhanced continue handler with multiple fallback mechanisms and detailed logging
  const handleContinueClick = () => {
    console.log('ValuationResult - handleContinueClick triggered');
    setNavigationAttempts(prev => prev + 1);
    
    // Store all necessary navigation data in variables first
    const navigationData = {
      ...normalizedResult,
      mileage
    };
    
    // Log detailed debug info for the navigation attempt
    console.log('ValuationResult - Navigation attempt details:', {
      attemptNumber: navigationAttempts + 1,
      timestamp: new Date().toISOString(),
      dataToStore: navigationData,
      isLoggedIn,
      mileage,
      hasValuation
    });
    
    // Pre-store data in localStorage as a safety measure
    try {
      localStorage.setItem("valuationData", JSON.stringify(navigationData));
      localStorage.setItem("navigationRecentAttempt", new Date().toISOString());
      localStorage.setItem("navigationAttemptCount", (navigationAttempts + 1).toString());
      
      // Store individual fields for maximum resilience
      if (navigationData.make) localStorage.setItem("tempMake", navigationData.make);
      if (navigationData.model) localStorage.setItem("tempModel", navigationData.model);
      if (navigationData.year) localStorage.setItem("tempYear", navigationData.year.toString());
      if (navigationData.vin) localStorage.setItem("tempVIN", navigationData.vin);
      if (navigationData.mileage) localStorage.setItem("tempMileage", navigationData.mileage.toString());
      if (navigationData.transmission) localStorage.setItem("tempGearbox", navigationData.transmission);
      
      console.log('ValuationResult - Successfully stored navigation data in localStorage');
    } catch (storageError) {
      console.error('ValuationResult - Error storing data in localStorage:', storageError);
      // Continue anyway - this is just a fallback
    }
    
    // Pre-create the navigation function to execute afterward
    const executeNavigation = () => {
      console.log('ValuationResult - Executing navigation with stored data');
      try {
        handleContinue(navigationData, navigationData.mileage);
        console.log('ValuationResult - handleContinue called successfully');
      } catch (navError) {
        console.error('ValuationResult - Error during handleContinue:', navError);
        // Try direct navigation as fallback
        try {
          console.log('ValuationResult - Attempting direct navigation fallback');
          window.location.href = '/sell-my-car';
        } catch (directNavError) {
          console.error('ValuationResult - Even direct navigation failed:', directNavError);
        }
      }
    };
    
    // First register a timeout for navigation to happen even if component unmounts
    const timeoutId = window.setTimeout(() => {
      console.log('ValuationResult - Executing navigation via timeout');
      executeNavigation();
    }, 100);
    
    // Then close the dialog
    console.log('ValuationResult - Closing dialog');
    try {
      onClose();
      console.log('ValuationResult - Dialog closed successfully');
    } catch (closeError) {
      console.error('ValuationResult - Error closing dialog:', closeError);
      // If dialog closing fails, still try to navigate
      clearTimeout(timeoutId); // Clear the timeout since we'll navigate now
      executeNavigation();
    }
    
    // Also try to execute navigation immediately
    try {
      console.log('ValuationResult - Attempting immediate navigation');
      executeNavigation();
    } catch (error) {
      console.error('ValuationResult - Error during immediate navigation, relying on timeout:', error);
    }
  };

  // Handle retry attempts for valuation
  const handleRetry = () => {
    console.log('ValuationResult - handleRetry triggered');
    setIsLoading(true);
    
    // Show toast to inform user
    toast.info("Retrying valuation...", {
      id: "valuation-retry",
      duration: 2000
    });
    
    // Call the onRetry prop if provided
    if (onRetry) {
      onRetry();
    } else {
      // If no retry function provided, just reset loading state
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
