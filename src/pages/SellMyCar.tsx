
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of sell my car page
 * - 2024-03-19: Added authentication check
 * - 2024-03-19: Implemented form integration
 * - 2024-06-07: Updated to use refactored form components
 * - 2024-10-19: Added validation to ensure VIN check was performed before accessing page
 * - 2024-11-11: Fixed issue with data validation that prevented form display
 * - 2024-11-11: Improved error handling for inconsistent localStorage data
 * - 2024-11-12: Enhanced page load handling for direct navigation cases
 * - 2024-12-05: Completely redesigned data validation and error handling
 * - 2024-12-29: Improved seller verification with enhanced error handling and better feedback
 * - 2025-07-05: Fixed issues with direct navigation from valuation result
 * - 2025-07-13: Simplified seller verification logic to trust auth metadata
 * - 2025-07-14: Refactored into smaller components for improved maintainability
 * - 2025-07-21: Enhanced error state management to properly reflect validation status
 * - 2027-06-08: Added extensive navigation debugging and improved resilience
 * - 2027-06-15: Enhanced debugging with detailed page load diagnostics and navigation state tracking
 * - 2027-07-22: Refactored into smaller component files for improved maintainability
 */

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
