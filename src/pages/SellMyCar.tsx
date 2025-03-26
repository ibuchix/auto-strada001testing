
/**
 * Changes made:
 * - Removed diagnostic-related code
 */

import { useEffect } from "react";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { PageStateManager } from "./sell-my-car/PageStateManager";

const SellMyCar = () => {
  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();

  // Log page load
  useEffect(() => {
    console.log('SellMyCar page loaded', { isValid, isLoading });
  }, [isValid, isLoading]);

  return (
    <PageStateManager
      isValid={isValid}
      isLoading={isLoading}
      error={error}
      errorType={errorType}
      isVerifying={isVerifying}
      handleRetrySellerVerification={handleRetrySellerVerification}
    />
  );
};

export default SellMyCar;
