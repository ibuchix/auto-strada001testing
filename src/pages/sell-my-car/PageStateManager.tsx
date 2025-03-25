
/**
 * Changes made:
 * - 2027-07-22: Created as part of SellMyCar.tsx refactoring
 * - 2027-07-22: Handles page state management and loading logic
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageDebugLogger } from "./PageDebugLogger";
import { CarListingFormSection } from "./CarListingFormSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";

interface PageStateManagerProps {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  errorType: string | null;
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
  const location = useLocation();
  const navigate = useNavigate();
  
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
      <PageDebugLogger
        isValid={isValid}
        isLoading={isLoading}
        error={error}
        errorType={errorType}
        pageLoadState={pageLoadState}
        setPageLoadState={setPageLoadState}
      />
      
      {renderPageContent()}
    </>
  );

  // Determine which content to render based on current state
  function renderPageContent() {
    // Handle various error states with appropriate UI and actions
    if (error) {
      console.log(`SellMyCar[${pageLoadState.pageId}] - Rendering error display:`, error);
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
      console.log(`SellMyCar[${pageLoadState.pageId}] - Rendering loading state`);
      return <LoadingIndicator fullscreen message="Loading your data..." />;
    }

    if (!isValid) {
      console.log(`SellMyCar[${pageLoadState.pageId}] - Invalid state but no error - redirecting to home`);
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
