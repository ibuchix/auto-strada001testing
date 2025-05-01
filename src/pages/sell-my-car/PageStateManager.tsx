
/**
 * Changes made:
 * - 2025-04-05: Simplified state management and removed unnecessary logic
 * - 2025-04-05: Improved handling of valuation data
 * - 2025-04-27: Updated ValuationResult import path
 * - 2025-05-28: Enhanced debugging and fixed initialization issues
 */

import { useEffect, useState } from "react";
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
  // Debug state to track component lifecycle
  const [debugInfo, setDebugInfo] = useState({
    renderCount: 0,
    lastStateChange: ''
  });
  
  // Track when component is fully mounted
  useEffect(() => {
    setDebugInfo(prev => ({
      renderCount: prev.renderCount + 1,
      lastStateChange: 'component_mounted'
    }));
    
    console.log("PageStateManager: Component mounted with props:", {
      isValid,
      isLoading,
      error,
      fromValuation,
      renderCount: debugInfo.renderCount + 1
    });
    
    return () => {
      console.log("PageStateManager: Component unmounting");
    };
  }, []);
  
  // Handle navigation from valuation
  useEffect(() => {
    if (fromValuation && !isLoading && !error && isValid) {
      console.log("PageStateManager: Ready to render form after valuation", {
        fromValuation,
        isLoading,
        isValid,
        error
      });
      
      setDebugInfo(prev => ({
        ...prev,
        lastStateChange: 'from_valuation_ready'
      }));
      
      // Show success toast for seamless experience
      toast.success("Ready to list your car", {
        description: "Your vehicle data has been loaded",
        duration: 3000
      });
    }
  }, [fromValuation, isLoading, isValid, error]);

  // Determine which content to render based on current state
  function renderPageContent() {
    // Log the rendering decision
    console.log("PageStateManager: Deciding what to render", {
      isLoading,
      isValid,
      error,
      errorType,
      fromValuation,
      debugLastState: debugInfo.lastStateChange
    });
    
    // Handle various error states with appropriate UI and actions
    if (error) {
      setDebugInfo(prev => ({
        ...prev,
        lastStateChange: 'rendering_error'
      }));
      
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
      setDebugInfo(prev => ({
        ...prev,
        lastStateChange: 'rendering_loading'
      }));
      
      return (
        <LoadingIndicator 
          fullscreen 
          message={fromValuation ? "Preparing your vehicle listing..." : "Loading your data..."} 
        />
      );
    }

    if (!isValid) {
      setDebugInfo(prev => ({
        ...prev,
        lastStateChange: 'rendering_invalid'
      }));
      
      // This case should be rare - fallback to ensure the UI always shows something meaningful
      return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
    }

    // Valid state - render the form
    setDebugInfo(prev => ({
      ...prev,
      lastStateChange: 'rendering_form'
    }));
    
    console.log("PageStateManager: Rendering car listing form", {
      fromValuation,
      renderCount: debugInfo.renderCount
    });
    
    return (
      <CarListingFormSection 
        pageId="main-listing-form"
        renderCount={debugInfo.renderCount}
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
