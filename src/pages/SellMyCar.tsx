
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - 2025-04-12: Added direct navigation handling from valuation
 * - 2025-04-12: Improved loading performance and reliability
 * - 2025-04-05: Simplified navigation handling and removed excessive logging
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

  // Mark initialization as complete after a short delay
  // This helps ensure any loading states have time to update
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitComplete(true);
    }, 100);
    
    return () => clearTimeout(timer);
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
      directNavigation={directNavigation}
    />
  );
};

export default SellMyCar;
