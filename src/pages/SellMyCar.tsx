
/**
 * Changes made:
 * - 2025-04-05: Simplified navigation handling and removed excessive logging
 * - 2025-04-05: Streamlined data retrieval from valuation flow
 * - 2025-05-28: Enhanced debugging to fix form initialization issues
 * - 2025-05-29: Fixed infinite re-render issue by adding proper dependency arrays and state guards
 * - 2025-05-30: Added force transition timers and controls to prevent stuck loading
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { PageStateManager } from "./sell-my-car/PageStateManager";
import { useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";

const SellMyCar = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const fromValuation = searchParams.get('from') === 'valuation' || location.state?.fromValuation;
  const [initComplete, setInitComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    locationState: null,
    fromValuation: false,
    timestamp: Date.now()
  });

  // Store initialization state in ref to prevent loops
  const initCompletedRef = useRef(false);
  const forceInitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();
  
  // Initialize debug info once on mount
  const initializeDebugInfo = useCallback(() => {
    console.log("SellMyCar: Component mounted with state:", {
      locationState: location.state,
      searchParams: Object.fromEntries(searchParams.entries()),
      fromValuation,
      isValid,
      isLoading,
      initCompleted: initCompletedRef.current
    });
    
    // Store incoming data for debugging - only do this once
    setDebugInfo({
      locationState: location.state,
      fromValuation,
      timestamp: Date.now()
    });
    
    // Check for valuation data - only log once
    const valuationData = location.state?.valuationData || 
                          localStorage.getItem('valuationData');
    
    if (valuationData) {
      console.log("SellMyCar: Found valuation data", {
        source: location.state?.valuationData ? "location.state" : "localStorage",
        dataType: typeof valuationData,
        hasProperties: typeof valuationData === 'object' ? 
          Object.keys(valuationData).length : 
          (typeof valuationData === 'string' ? valuationData.length : 'N/A')
      });
    } else {
      console.log("SellMyCar: No valuation data found");
    }
    
    // Set up a timer to force initialization after 5 seconds
    if (!initCompletedRef.current && !forceInitTimerRef.current) {
      forceInitTimerRef.current = setTimeout(() => {
        console.log("SellMyCar: Force initialization timer triggered");
        if (!initCompletedRef.current) {
          setInitComplete(true);
          initCompletedRef.current = true;
          toast.info("Listing form ready", {
            description: "Taking longer than expected, but your form is now ready."
          });
        }
      }, 5000);
    }
  }, [location.state, searchParams, fromValuation]);
  
  // Run the initialization exactly once on mount
  useEffect(() => {
    initializeDebugInfo();
    
    // Clean up timer on unmount
    return () => {
      if (forceInitTimerRef.current) {
        clearTimeout(forceInitTimerRef.current);
      }
    };
  }, [initializeDebugInfo]);

  // Mark initialization as complete after a short delay
  // This helps ensure any loading states have time to update
  useEffect(() => {
    console.log("SellMyCar: Starting initialization timer");
    
    const timer = setTimeout(() => {
      console.log("SellMyCar: Initialization complete");
      setInitComplete(true);
      initCompletedRef.current = true;
    }, 300);
    
    return () => {
      console.log("SellMyCar: Clearing initialization timer");
      clearTimeout(timer);
    }
  }, []);

  return (
    <PageStateManager
      isValid={isValid}
      isLoading={isLoading && !initCompletedRef.current}
      error={error}
      errorType={errorType}
      isVerifying={isVerifying}
      handleRetrySellerVerification={handleRetrySellerVerification}
      fromValuation={fromValuation}
    />
  );
};

export default SellMyCar;
