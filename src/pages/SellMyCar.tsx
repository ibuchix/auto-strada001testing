
/**
 * Sell My Car Page
 * Created: 2025-06-22 - Restored this page to enable the car listing flow after valuation.
 * Provides the entry point for listing a car based on valuation data or direct navigation.
 */

import { useLocation } from "react-router-dom";
import { PageStateManager } from "./sell-my-car/PageStateManager";
import { useMemo } from "react";

const SellMyCar = () => {
  const location = useLocation();

  // Determine if the user is coming from a valuation step
  const fromValuation =
    location.state?.fromValuation === true ||
    !!location.state?.valuationData ||
    !!localStorage.getItem("valuationData");

  // PageStateManager orchestrates form, handles loading/errors/valuation integration
  return (
    <PageStateManager
      isValid={true}
      isLoading={false}
      error={null}
      errorType={null}
      isVerifying={false}
      handleRetrySellerVerification={() => {}}
      fromValuation={fromValuation}
    />
  );
};

export default SellMyCar;
