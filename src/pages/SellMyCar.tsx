
/**
 * Changes made:
 * - 2025-04-05: Simplified navigation handling and removed excessive logging
 * - 2025-04-05: Streamlined data retrieval from valuation flow
 * - 2025-05-28: Enhanced debugging to fix form initialization issues
 */

import { useEffect, useState } from "react";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { PageStateManager } from "./sell-my-car/PageStateManager";
import { useSearchParams, useLocation } from "react-router-dom";

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

  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();
  
  // Debug logging to trace the data flow
  useEffect(() => {
    console.log("SellMyCar: Component mounted with state:", {
      locationState: location.state,
      searchParams: Object.fromEntries(searchParams.entries()),
      fromValuation,
      isValid,
      isLoading
    });
    
    // Store incoming data for debugging
    setDebugInfo({
      locationState: location.state,
      fromValuation,
      timestamp: Date.now()
    });
    
    // Check for valuation data
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
  }, [location.state, searchParams, fromValuation, isValid, isLoading]);

  // Mark initialization as complete after a short delay
  // This helps ensure any loading states have time to update
  useEffect(() => {
    console.log("SellMyCar: Starting initialization timer");
    
    const timer = setTimeout(() => {
      console.log("SellMyCar: Initialization complete");
      setInitComplete(true);
    }, 300);
    
    return () => {
      console.log("SellMyCar: Clearing initialization timer");
      clearTimeout(timer);
    }
  }, []);

  return (
    <PageStateManager
      isValid={isValid}
      isLoading={isLoading || !initComplete}
      error={error}
      errorType={errorType}
      isVerifying={isVerifying}
      handleRetrySellerVerification={handleRetrySellerVerification}
      fromValuation={fromValuation}
    />
  );
};

export default SellMyCar;
