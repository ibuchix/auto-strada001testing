
/**
 * Changes made:
 * - 2027-07-22: Created as part of SellMyCar.tsx refactoring
 * - 2027-07-22: Handles page state management and loading logic
 * - 2027-07-23: Fixed TypeScript error with errorType union type
 * - 2027-07-23: Added diagnostic logging to troubleshoot rendering issues
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PageDebugLogger } from "./PageDebugLogger";
import { CarListingFormSection } from "./CarListingFormSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ErrorDisplay } from "@/components/sellers/ErrorDisplay";
import { logDiagnostic, logStorageState } from "@/diagnostics/listingButtonDiagnostics";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const diagnosticId = searchParams.get('diagnostic') || Math.random().toString(36).substring(2, 10);
  
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

  // Log initial state for diagnostics
  useEffect(() => {
    logDiagnostic('PAGE_LOAD', 'PageStateManager initial load', {
      isValid,
      isLoading,
      error,
      errorType,
      pageId: pageLoadState.pageId,
      url: window.location.href,
      params: Object.fromEntries(searchParams.entries()),
      state: location.state ? 'present' : 'missing',
      stateKeys: location.state ? Object.keys(location.state) : []
    }, diagnosticId);
    
    logStorageState(diagnosticId, 'page_load');
    
    // Log navigation attempt details if present in URL
    const clickId = searchParams.get('clickId');
    const fromValuation = searchParams.get('from') === 'valuation';
    const emergency = searchParams.get('emergency') === 'true';
    
    if (clickId || fromValuation || emergency) {
      logDiagnostic('NAVIGATION_RESULT', 'Navigation completed with details', {
        clickId,
        fromValuation,
        emergency,
        timestamp: new Date().toISOString()
      }, diagnosticId);
    }
    
    // Debug validation state
    logDiagnostic('VALIDATION_STATE', 'Initial validation state', {
      isValid,
      isLoading,
      error,
      errorType,
      isVerifying
    }, diagnosticId);
  }, []);

  // Track changes to validation state
  useEffect(() => {
    logDiagnostic('VALIDATION_UPDATE', 'Validation state updated', {
      isValid,
      isLoading,
      error,
      errorType,
      isVerifying,
      renderCount: pageLoadState.renderCount
    }, diagnosticId);
  }, [isValid, isLoading, error, errorType, isVerifying]);

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
        diagnosticId={diagnosticId}
      />
      
      {renderPageContent()}
    </>
  );

  // Determine which content to render based on current state
  function renderPageContent() {
    // Handle various error states with appropriate UI and actions
    if (error) {
      logDiagnostic('RENDER_ERROR', `Rendering error display: ${error}`, {
        errorType,
        isVerifying
      }, diagnosticId);
      
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
      logDiagnostic('RENDER_LOADING', 'Rendering loading state', null, diagnosticId);
      return <LoadingIndicator fullscreen message="Loading your data..." />;
    }

    if (!isValid) {
      logDiagnostic('RENDER_INVALID', 'Invalid state but no error - redirecting to home', null, diagnosticId);
      // This case should be rare - fallback to ensure the UI always shows something meaningful
      return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
    }

    // Valid state - render the form
    logDiagnostic('RENDER_FORM', 'Rendering CarListingFormSection', {
      pageId: pageLoadState.pageId,
      renderCount: pageLoadState.renderCount
    }, diagnosticId);
    
    return (
      <CarListingFormSection 
        pageId={pageLoadState.pageId}
        renderCount={pageLoadState.renderCount}
        diagnosticId={diagnosticId}
      />
    );
  }
};
