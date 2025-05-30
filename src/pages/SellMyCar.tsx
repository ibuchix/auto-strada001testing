
/**
 * Updated: 2025-05-30 - Phase 4: Reduced excessive logging and optimized performance
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { PageStateManager } from "./sell-my-car/PageStateManager";
import { useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

const SellMyCar = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const fromValuation = searchParams.get('from') === 'valuation' || location.state?.fromValuation;
  const [initComplete, setInitComplete] = useState(false);

  // Get auth information
  const auth = useAuth();
  const session = auth?.session;
  const isAuthLoading = auth?.isLoading || false;

  // Store initialization state in ref to prevent loops
  const initCompletedRef = useRef(false);
  const renderCountRef = useRef(0);

  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();
  
  // Initialize component once
  const initializeComponent = useCallback(() => {
    renderCountRef.current += 1;
    
    // Limit excessive re-initializations
    if (renderCountRef.current > 2 && initCompletedRef.current) {
      return;
    }
    
    // Only log essential information
    if (renderCountRef.current <= 2) {
      console.log("SellMyCar: Initializing", {
        render: renderCountRef.current,
        fromValuation,
        hasSession: !!session
      });
    }
  }, [fromValuation, session]);
  
  // Run initialization once on mount
  useEffect(() => {
    if (initCompletedRef.current) return;
    
    initializeComponent();
    
    const timer = setTimeout(() => {
      if (!initCompletedRef.current) {
        setInitComplete(true);
        initCompletedRef.current = true;
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [initializeComponent]);

  return (
    <PageStateManager
      isValid={isValid}
      isLoading={isLoading && !initCompletedRef.current}
      error={error}
      errorType={errorType}
      isVerifying={isVerifying}
      handleRetrySellerVerification={handleRetrySellerVerification}
      fromValuation={fromValuation}
      renderCount={renderCountRef.current}
    />
  );
};

export default SellMyCar;
