/**
 * Changes made:
 * - 2025-04-05: Simplified state management and removed unnecessary logic
 * - 2025-04-05: Improved handling of valuation data
 * - 2025-04-27: Updated ValuationResult import path
 */

import { useEffect } from "react";
import { CarListingFormSection } from "./CarListingFormSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";
import { toast } from "sonner";
import { ValuationResult } from "@/components/hero/ValuationResult";

interface PageStateManagerProps {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  errorType: 'auth' | 'data' | 'seller' | null;
  isVerifying: boolean;
  handleRetrySellerVerification: () => void;
  fromValuation?: boolean;
}

export const PageStateManager = ({
  isValid,
  isLoading,
  error,
  errorType,
  isVerifying,
  handleRetrySellerVerification,
  fromValuation = false
}: PageStateManagerProps) => {
  // Handle navigation from valuation
  useEffect(() => {
    if (fromValuation && !isLoading && !error && isValid) {
      // Show success toast for seamless experience
      toast.success("Ready to list your car", {
        description: "Your vehicle data has been loaded",
        duration: 3000
      });
    }
  }, [fromValuation, isLoading, isValid, error]);

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
