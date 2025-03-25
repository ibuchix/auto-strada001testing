
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
 * - 2027-06-15: Enhanced debugging with detailed page load diagnostics and navigation state tracking
 */

import { useEffect, useState } from "react";
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

  // Enhanced debug logging to track component rendering, navigation state, and data sources
  useEffect(() => {
    setPageLoadState(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1
    }));
    
    const pageId = pageLoadState.pageId;
    const isInitialLoad = !pageLoadState.initialLoadComplete;
    
    // Additional params to track navigation context
    const navId = searchParams.get('navId') || location.state?.navId || 'unknown';
    const fallbackUsed = searchParams.get('fallback') === 'true';
    const emergencyUsed = searchParams.get('emergency') === 'true';
    const fromSource = searchParams.get('from') || (location.state?.fromValuation ? 'valuation_state' : 'unknown');
    
    console.log(`SellMyCar[${pageId}] - ${isInitialLoad ? 'Initial load' : 'Re-render'} #${pageLoadState.renderCount}`, { 
      timestamp: new Date().toISOString(),
      isValid, 
      isLoading, 
      hasError: !!error,
      errorType,
      
      // Navigation tracking
      navId,
      fallbackUsed,
      emergencyUsed,
      fromSource,
      
      // Navigation sources
      hasLocationState: !!location.state,
      locationStateKeys: location.state ? Object.keys(location.state) : [],
      fromValuation: !!location.state?.fromValuation,
      hasNavigationInProgress: localStorage.getItem('navigationInProgress') === 'true',
      navigationStartTime: localStorage.getItem('navigationStartTime'),
      
      // Performance data
      performanceNavigation: performance.navigation ? {
        type: performance.navigation.type,
        redirectCount: performance.navigation.redirectCount
      } : 'Not available',
      performanceNow: performance.now(),
      
      // LocalStorage data tracking
      hasValuationData: !!localStorage.getItem('valuationData'),
      valuationDataType: localStorage.getItem('valuationData') ? typeof localStorage.getItem('valuationData') : 'null',
      hasTempVIN: !!localStorage.getItem('tempVIN'),
      tempVINValue: localStorage.getItem('tempVIN'),
      hasMileage: !!localStorage.getItem('tempMileage'),
      tempMileageValue: localStorage.getItem('tempMileage'),
      
      // Recent navigation attempts
      lastNavigationAttempt: localStorage.getItem('lastNavigationAttempt'),
      navigationAttemptCount: localStorage.getItem('navigationAttemptCount'),
      navigationAttemptId: localStorage.getItem('navigationAttemptId')
    });
    
    // Record detailed page info in localStorage
    try {
      // Record page load in localStorage
      localStorage.setItem('sellMyCarPageLoaded', 'true');
      localStorage.setItem('sellMyCarLoadTime', new Date().toISOString());
      localStorage.setItem('sellMyCarPageId', pageId);
      localStorage.setItem('sellMyCarRenderCount', pageLoadState.renderCount.toString());
      
      // Detailed navigation context
      localStorage.setItem('sellMyCarNavContext', JSON.stringify({
        navId,
        fallbackUsed,
        emergencyUsed,
        fromSource,
        locationState: location.state ? true : false,
        locationStateKeys: location.state ? Object.keys(location.state) : [],
        searchParams: Object.fromEntries(searchParams.entries()),
        timestamp: new Date().toISOString()
      }));
      
      // Clean up navigation tracking
      if (isInitialLoad) {
        localStorage.removeItem('navigationInProgress');
        
        // If we arrived via a navigation process, log completion
        if (localStorage.getItem('navigationStartTime')) {
          const startTime = new Date(localStorage.getItem('navigationStartTime')!);
          const endTime = new Date();
          const duration = endTime.getTime() - startTime.getTime();
          
          console.log(`SellMyCar[${pageId}] - Navigation process completed in ${duration}ms`, {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration,
            navId,
            source: fromSource
          });
          
          localStorage.setItem('navigationCompletionTime', endTime.toISOString());
          localStorage.setItem('navigationDuration', duration.toString());
        }
        
        // Mark initial load as complete
        setPageLoadState(prev => ({
          ...prev,
          initialLoadComplete: true
        }));
      }
    } catch (storageError) {
      console.error(`SellMyCar[${pageId}] - LocalStorage error:`, storageError);
    }
    
    // If this is a direct URL navigation but we have valuation data, show confirmation
    if (isInitialLoad && !location.state?.fromValuation && localStorage.getItem('valuationData')) {
      toast.success("Valuation data loaded successfully", {
        description: "Your vehicle information is ready",
        duration: 3000
      });
    }
    
    // If we have a from=valuation parameter, show notification
    if (isInitialLoad && (searchParams.get('from') === 'valuation' || searchParams.get('fallback') === 'true')) {
      toast.success("Navigation successful", {
        description: fallbackUsed ? "Using fallback navigation method" : "Your vehicle data is loaded",
        duration: 3000
      });
    }
    
    // If emergency navigation was used, show an information toast
    if (isInitialLoad && emergencyUsed) {
      toast.info("Emergency navigation used", {
        description: "Your session has been recovered",
        duration: 3000
      });
    }
    
    return () => {
      console.log(`SellMyCar[${pageId}] - Page unmounting after ${pageLoadState.renderCount} renders`);
      localStorage.setItem('sellMyCarPageUnloaded', 'true');
      localStorage.setItem('sellMyCarUnloadTime', new Date().toISOString());
      localStorage.setItem('sellMyCarFinalRenderCount', pageLoadState.renderCount.toString());
    };
  }, [isValid, isLoading, error, errorType, location.state, searchParams, pageLoadState.renderCount, pageLoadState.pageId, pageLoadState.initialLoadComplete]);

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

  console.log(`SellMyCar[${pageLoadState.pageId}] - Rendering form (valid state) - render #${pageLoadState.renderCount}`);
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
