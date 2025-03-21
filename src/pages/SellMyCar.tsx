
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
 */

import { useEffect } from "react";
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

  // Debug logging to track component rendering and state
  useEffect(() => {
    console.log('SellMyCar component rendering with states:', { 
      isValid, 
      isLoading, 
      hasError: !!error,
      errorType 
    });
  }, [isValid, isLoading, error, errorType]);

  // Handle various error states with appropriate UI and actions
  if (error) {
    console.log('SellMyCar: Rendering error display:', error);
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
    console.log('SellMyCar: Rendering loading state');
    return <LoadingIndicator fullscreen message="Loading..." />;
  }

  if (!isValid) {
    console.log('SellMyCar: Invalid state but no error - redirecting to home');
    // This case should be rare - fallback to ensure the UI always shows something meaningful
    return <LoadingIndicator fullscreen message="Preparing form..." />;
  }

  console.log('SellMyCar: Rendering form (valid state)');
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
