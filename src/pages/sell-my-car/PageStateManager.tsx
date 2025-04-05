
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - 2025-04-12: Added support for direct navigation from valuation
 * - 2025-04-12: Enhanced reliability for form loading
 * - 2025-04-05: Simplified state management and removed unnecessary logic
 */

import { useEffect } from "react";
import { CarListingFormSection } from "./CarListingFormSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";
import { toast } from "sonner";

interface PageStateManagerProps {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  errorType: 'auth' | 'data' | 'seller' | null;
  isVerifying: boolean;
  handleRetrySellerVerification: () => void;
  fromValuation?: boolean;
  directNavigation?: boolean;
}

export const PageStateManager = ({
  isValid,
  isLoading,
  error,
  errorType,
  isVerifying,
  handleRetrySellerVerification,
  fromValuation = false,
  directNavigation = false
}: PageStateManagerProps) => {
  // Handle direct navigation from valuation
  useEffect(() => {
    if (fromValuation && directNavigation && !isLoading && !error) {
      // Clear any navigation toasts
      toast.dismiss("navigation-toast");
      
      // Show success toast for seamless experience
      if (isValid) {
        toast.success("Ready to list your car", {
          description: "Your vehicle data has been loaded",
          duration: 3000
        });
      }
    }
  }, [fromValuation, directNavigation, isLoading, isValid, error]);

  // Determine which content to render based on current state
  function renderPageContent() {
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
      return (
        <LoadingIndicator 
          fullscreen 
          message={fromValuation ? "Preparing your vehicle listing..." : "Loading your data..."} 
        />
      );
    }

    if (!isValid) {
      // This case should be rare - fallback to ensure the UI always shows something meaningful
      return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
    }

    // Valid state - render the form
    return (
      <CarListingFormSection 
        pageId="main-listing-form"
        renderCount={1}
        fromValuation={fromValuation}
      />
    );
  }

  return (
    <>
      {renderPageContent()}
    </>
  );
};
