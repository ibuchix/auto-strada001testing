
/**
 * Changes made:
 * - Removed diagnostic-related code
 */

import { useState, useEffect } from "react";
import { CarListingFormSection } from "./CarListingFormSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";

interface PageStateManagerProps {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  errorType: 'auth' | 'data' | 'seller' | null;
  isVerifying: boolean;
  handleRetrySellerVerification: () => void;
}

export const PageStateManager = ({
  isValid,
  isLoading,
  error,
  errorType,
  isVerifying,
  handleRetrySellerVerification
}: PageStateManagerProps) => {
  // State to track page rendering and initialization
  const [pageLoadState, setPageLoadState] = useState<{
    initialLoadComplete: boolean;
    loadTime: Date;
    pageId: string;
    renderCount: number;
  }>({
    initialLoadComplete: false,
    loadTime: new Date(),
    pageId: Math.random().toString(36).substring(2, 10),
    renderCount: 0
  });

  // Debug logging
  return (
    <>
      {renderPageContent()}
    </>
  );

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
      return <LoadingIndicator fullscreen message="Loading your data..." />;
    }

    if (!isValid) {
      // This case should be rare - fallback to ensure the UI always shows something meaningful
      return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
    }

    // Valid state - render the form
    return (
      <CarListingFormSection 
        pageId={pageLoadState.pageId}
        renderCount={pageLoadState.renderCount}
      />
    );
  }
};
