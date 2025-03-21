
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
 */

import { PageLayout } from "@/components/layout/PageLayout";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";

const SellMyCar = () => {
  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();

  // Handle various error states with appropriate UI and actions
  if (error) {
    return (
      <PageLayout>
        <ErrorDisplay
          error={error}
          errorType={errorType}
          onRetryVerification={handleRetrySellerVerification}
          isVerifying={isVerifying}
        />
      </PageLayout>
    );
  }

  if (isLoading) {
    return <LoadingIndicator fullscreen message="Loading..." />;
  }

  if (!isValid) {
    return null;
  }

  return (
    <PageLayout>
      <h1 className="text-5xl font-bold text-center mb-12">
        List Your Car
      </h1>
      <div className="max-w-2xl mx-auto">
        <CarListingForm />
      </div>
    </PageLayout>
  );
};

export default SellMyCar;
