
/**
 * Changes made:
 * - 2025-04-05: Simplified state management and removed unnecessary logic
 * - 2025-04-05: Improved handling of valuation data
 * - 2025-04-27: Updated ValuationResult import path
 * - 2025-05-28: Enhanced debugging and fixed initialization issues
 * - 2025-05-29: Fixed infinite re-render by using useCallback and proper dependency arrays
 * - 2025-05-30: Added force transition timer to ensure loading state doesn't get stuck
 * - 2025-05-31: Added direct data lookup from storage to bypass navigation issues
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  renderCount?: number;
}

export const PageStateManager = ({
  isValid,
  isLoading,
  error,
  errorType,
  isVerifying,
  handleRetrySellerVerification,
  fromValuation = false,
  renderCount = 0
}: PageStateManagerProps) => {
  // Generate a stable component ID
  const componentId = useMemo(() => Math.random().toString(36).substring(2, 8), []);
  
  // Debug state to track component lifecycle
  const [debugInfo, setDebugInfo] = useState({
    renderCount: 0,
    lastStateChange: '',
    componentId
  });
  
  // State to force transition out of loading state
  const [forceReady, setForceReady] = useState(false);
  
  // Force transition timer ref
  const forceTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);
  const hasLoadedFormRef = useRef(false);
  
  // Track when component is fully mounted - run once only
  useEffect(() => {
    renderCountRef.current += 1;
    
    setDebugInfo(prev => ({
      renderCount: prev.renderCount + 1,
      lastStateChange: 'component_mounted',
      componentId
    }));
    
    console.log(`PageStateManager[${componentId}]: Component mounted with props:`, {
      isValid,
      isLoading,
      error,
      fromValuation,
      renderCount: renderCountRef.current,
      externalRenderCount: renderCount
    });
    
    // Force transition after 3 seconds if still loading
    if ((isLoading || !isValid) && !forceTransitionTimerRef.current) {
      forceTransitionTimerRef.current = setTimeout(() => {
        console.log(`PageStateManager[${componentId}]: Force transition timer triggered, form may be stuck`);
        setForceReady(true);
        
        // This toast will help the user know something is happening
        toast.info("Preparing form", {
          description: "Loading your vehicle data..."
        });
        
        setDebugInfo(prev => ({
          ...prev,
          lastStateChange: 'force_transition_triggered'
        }));
      }, 3000);
    }
    
    // Try to directly access valuation data if navigation state is missing
    if (fromValuation && !hasLoadedFormRef.current) {
      // Check localStorage
      try {
        const storedData = localStorage.getItem('valuationData');
        if (storedData) {
          console.log(`PageStateManager[${componentId}]: Found valuationData in localStorage`);
        } else {
          console.log(`PageStateManager[${componentId}]: No valuationData in localStorage`);
        }
      } catch (e) {
        console.warn(`PageStateManager[${componentId}]: Error checking localStorage:`, e);
      }
    }
    
    return () => {
      console.log(`PageStateManager[${componentId}]: Component unmounting`);
      if (forceTransitionTimerRef.current) {
        clearTimeout(forceTransitionTimerRef.current);
      }
    };
  }, [componentId, isLoading, isValid, fromValuation, renderCount]);
  
  // Determine which content to render - memoize to prevent re-renders
  const renderPageContent = useCallback(() => {
    // Only log on significant state changes or every 5 renders
    if (debugInfo.renderCount <= 2 || debugInfo.renderCount % 5 === 0) {
      console.log(`PageStateManager[${componentId}]: Deciding what to render (render #${debugInfo.renderCount})`, {
        isLoading,
        isValid,
        error,
        errorType,
        fromValuation,
        forceReady,
        debugLastState: debugInfo.lastStateChange
      });
    }
    
    // Force transition if loading took too long
    const shouldForceTransition = forceReady || debugInfo.lastStateChange === 'force_transition_triggered';
    
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

    // Skip loading indicator if force ready is triggered
    if (isLoading && !shouldForceTransition) {
      return (
        <LoadingIndicator 
          fullscreen 
          message={fromValuation ? "Preparing your vehicle listing..." : "Loading your data..."} 
        />
      );
    }

    // Only show loading for invalid state if not forcing transition
    if (!isValid && !shouldForceTransition) {
      return <LoadingIndicator fullscreen message="Preparing vehicle listing form..." />;
    }

    // Valid state or forced transition - render the form
    console.log(`PageStateManager[${componentId}]: Rendering car listing form`, {
      fromValuation,
      forceReady,
      renderCount: debugInfo.renderCount
    });
    
    // Mark that we've loaded the form to prevent duplicate attempts
    hasLoadedFormRef.current = true;
    
    return (
      <CarListingFormSection 
        pageId={`listing-form-${componentId}`}
        renderCount={debugInfo.renderCount}
        fromValuation={fromValuation}
        forceReady={shouldForceTransition}
      />
    );
  }, [
    isValid, isLoading, error, errorType, isVerifying, fromValuation, 
    forceReady, debugInfo.renderCount, debugInfo.lastStateChange, 
    handleRetrySellerVerification, componentId
  ]);

  // Use the memoized rendering function
  return <>{renderPageContent()}</>;
};
