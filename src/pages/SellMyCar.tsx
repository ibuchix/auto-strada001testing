
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
 */

import { useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CarListingForm } from "@/components/forms/CarListingForm";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";
import { toast } from "sonner";
import { useLocation, useSearchParams } from "react-router-dom";

const SellMyCar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();

  // Enhanced debug logging to track component rendering, navigation state, and data sources
  useEffect(() => {
    const pageId = Math.random().toString(36).substring(2, 8);
    console.log(`SellMyCar[${pageId}] - Page initializing`, { 
      timestamp: new Date().toISOString(),
      isValid, 
      isLoading, 
      hasError: !!error,
      errorType,
      // Navigation sources tracking
      hasLocationState: !!location.state,
      fromValuation: !!location.state?.fromValuation,
      fromFallback: searchParams.get('fallback') === 'true',
      fromUrl: searchParams.get('from'),
      hasNavigationInProgress: localStorage.getItem('navigationInProgress') === 'true',
      navigationStartTime: localStorage.getItem('navigationStartTime'),
      // LocalStorage data tracking
      hasValuationData: !!localStorage.getItem('valuationData'),
      hasTempVIN: !!localStorage.getItem('tempVIN'),
      hasMileage: !!localStorage.getItem('tempMileage'),
      // Recent navigation attempts
      lastNavigationAttempt: localStorage.getItem('lastNavigationAttempt'),
      navigationAttemptCount: localStorage.getItem('navigationAttemptCount')
    });
    
    // Record page load in localStorage
    localStorage.setItem('sellMyCarPageLoaded', 'true');
    localStorage.setItem('sellMyCarLoadTime', new Date().toISOString());
    localStorage.setItem('sellMyCarPageId', pageId);
    
    // Clean up navigation tracking
    localStorage.removeItem('navigationInProgress');
    
    // If we have a from=valuation parameter, show notification
    if (searchParams.get('from') === 'valuation' || searchParams.get('fallback') === 'true') {
      toast.success("Navigation successful", {
        description: "Using fallback navigation method",
        duration: 3000
      });
    }
    
    // If this is a direct URL navigation but we have valuation data, show confirmation
    if (!location.state?.fromValuation && localStorage.getItem('valuationData')) {
      toast.success("Valuation data loaded successfully", {
        description: "Your vehicle information is ready",
        duration: 3000
      });
    }
    
    return () => {
      console.log(`SellMyCar[${pageId}] - Page unmounting`);
      localStorage.setItem('sellMyCarPageUnloaded', 'true');
      localStorage.setItem('sellMyCarUnloadTime', new Date().toISOString());
    };
  }, [isValid, isLoading, error, errorType, location.state, searchParams]);

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
    return <LoadingIndicator fullscreen message="Loading your data..." />;
  }

  if (!isValid) {
    console.log('SellMyCar: Invalid state but no error - redirecting to home');
    // This case should be rare - fallback to ensure the UI always shows something meaningful
    return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
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
