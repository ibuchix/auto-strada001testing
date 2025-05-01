
/**
 * Changes made:
 * - 2025-04-05: Simplified state management and removed unnecessary logic
 * - 2025-04-05: Improved handling of valuation data
 * - 2025-04-27: Updated ValuationResult import path
 * - 2025-05-28: Enhanced debugging and fixed initialization issues
 * - 2025-05-29: Fixed infinite re-render by using useCallback and proper dependency arrays
 * - 2025-05-30: Added force transition timer to ensure loading state doesn't get stuck
 */

import { useEffect, useState, useCallback, useRef } from "react";
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
  
  // Force transition timer ref
  const forceTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track when component is fully mounted - run once only
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
    
    // Force transition after 5 seconds if still loading
    if (isLoading) {
      forceTransitionTimerRef.current = setTimeout(() => {
        console.log("PageStateManager: Force transition timer triggered, form may be stuck");
        // This doesn't actually change props, but it forces a re-render
        setDebugInfo(prev => ({
          ...prev,
          lastStateChange: 'force_transition_triggered'
        }));
      }, 5000);
    }
    
    return () => {
      console.log("PageStateManager: Component unmounting");
      if (forceTransitionTimerRef.current) {
        clearTimeout(forceTransitionTimerRef.current);
      }
    };
  }, []);
  
  // Handle navigation from valuation - prevent re-render loop with proper dependencies
  useEffect(() => {
    if (fromValuation && !isLoading && !error && isValid && debugInfo.lastStateChange !== 'from_valuation_ready') {
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
      
      // Show success toast for seamless experience - only once
      toast.success("Ready to list your car", {
        description: "Your vehicle data has been loaded",
        duration: 3000
      });
    }
  }, [fromValuation, isLoading, isValid, error, debugInfo.lastStateChange]);

  // Determine which content to render based on current state - memoize to prevent re-renders
  const renderPageContent = useCallback(() => {
    // Log the rendering decision only when dependencies change
    console.log("PageStateManager: Deciding what to render", {
      isLoading,
      isValid,
      error,
      errorType,
      fromValuation,
      debugLastState: debugInfo.lastStateChange
    });
    
    // Force transition if loading took too long and we have valid status
    const shouldForceTransition = debugInfo.lastStateChange === 'force_transition_triggered' && isValid;
    
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

    if (isLoading && !shouldForceTransition) {
      return (
        <LoadingIndicator 
          fullscreen 
          message={fromValuation ? "Preparing your vehicle listing..." : "Loading your data..."} 
        />
      );
    }

    if (!isValid && !shouldForceTransition) {
      // This case should be rare - fallback to ensure the UI always shows something meaningful
      return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
    }

    // Valid state - render the form
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
  }, [isValid, isLoading, error, errorType, isVerifying, fromValuation, debugInfo.renderCount, debugInfo.lastStateChange, handleRetrySellerVerification]);

  // Use the memoized rendering function
  return <>{renderPageContent()}</>;
};
