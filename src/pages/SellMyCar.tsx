
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - 2025-04-12: Added direct navigation handling from valuation
 * - 2025-04-12: Improved loading performance and reliability
 */

import { useEffect, useState } from "react";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { PageStateManager } from "./sell-my-car/PageStateManager";
import { useSearchParams } from "react-router-dom";

const SellMyCar = () => {
  const [searchParams] = useSearchParams();
  const fromValuation = searchParams.get('from') === 'valuation';
  const directNavigation = searchParams.get('direct') === 'true';
  const [initComplete, setInitComplete] = useState(false);

  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();

  // Log page load and navigation method
  useEffect(() => {
    const pageLoadTime = performance.now();
    
    console.log('SellMyCar page loaded', { 
      isValid, 
      isLoading, 
      fromValuation, 
      directNavigation,
      valuationData: localStorage.getItem('valuationData') ? 'present' : 'missing',
      timestamp: new Date().toISOString(),
      loadTime: `${Math.round(pageLoadTime)}ms`
    });
    
    // Mark initialization as complete after a short delay
    // This helps ensure any loading states have time to update
    const timer = setTimeout(() => {
      setInitComplete(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isValid, isLoading, fromValuation, directNavigation]);

  // Handle case when navigating directly from valuation
  useEffect(() => {
    if (fromValuation && directNavigation) {
      console.log('Direct navigation from valuation detected', {
        timestamp: new Date().toISOString()
      });
      
      // Check for valuation data
      const valuationData = localStorage.getItem('valuationData');
      if (valuationData) {
        console.log('Valuation data found in localStorage', {
          dataSize: valuationData.length
        });
      }
    }
  }, [fromValuation, directNavigation]);

  return (
    <PageStateManager
      isValid={isValid}
      isLoading={isLoading || !initComplete}
      error={error}
      errorType={errorType}
      isVerifying={isVerifying}
      handleRetrySellerVerification={handleRetrySellerVerification}
      fromValuation={fromValuation}
      directNavigation={directNavigation}
    />
  );
};

export default SellMyCar;
