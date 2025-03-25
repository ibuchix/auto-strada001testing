
/**
 * Changes made:
 * - 2027-07-22: Extracted from SellMyCar.tsx as part of component refactoring
 * - 2027-07-22: Enhanced with better logging organization
 * - 2027-07-23: Fixed TypeScript error with errorType union type
 * - 2027-07-23: Integrated with diagnostic system for better troubleshooting
 */

import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface PageDebugLoggerProps {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  errorType: 'auth' | 'data' | 'seller' | null;
  pageLoadState: {
    initialLoadComplete: boolean;
    loadTime: Date;
    pageId: string;
    renderCount: number;
  };
  setPageLoadState: (state: any) => void;
  diagnosticId?: string;
}

export const PageDebugLogger = ({
  isValid,
  isLoading,
  error,
  errorType,
  pageLoadState,
  setPageLoadState,
  diagnosticId
}: PageDebugLoggerProps) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionDiagnosticId = diagnosticId || searchParams.get('diagnostic') || pageLoadState.pageId;

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
    
    logDiagnostic(
      'DEBUG_LOGGER', 
      `${isInitialLoad ? 'Initial load' : 'Re-render'} #${pageLoadState.renderCount}`,
      { 
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
      },
      sessionDiagnosticId
    );
    
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
          
          logDiagnostic('NAVIGATION_COMPLETE', `Navigation process completed in ${duration}ms`, {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration,
            navId,
            source: fromSource
          }, sessionDiagnosticId);
          
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
      logDiagnostic('STORAGE_ERROR', 'LocalStorage error', storageError, sessionDiagnosticId);
    }
    
    // If this is a direct URL navigation but we have valuation data, show confirmation
    if (isInitialLoad && !location.state?.fromValuation && localStorage.getItem('valuationData')) {
      showValuationToast();
    }
    
    // If we have a from=valuation parameter, show notification
    if (isInitialLoad && (searchParams.get('from') === 'valuation' || searchParams.get('fallback') === 'true')) {
      showNavigationToast(fallbackUsed);
    }
    
    // If emergency navigation was used, show an information toast
    if (isInitialLoad && emergencyUsed) {
      showEmergencyToast();
    }
    
    return () => {
      logDiagnostic('PAGE_UNMOUNT', `Page unmounting after ${pageLoadState.renderCount} renders`, {
        diagnosticId: sessionDiagnosticId
      }, sessionDiagnosticId);
      localStorage.setItem('sellMyCarPageUnloaded', 'true');
      localStorage.setItem('sellMyCarUnloadTime', new Date().toISOString());
      localStorage.setItem('sellMyCarFinalRenderCount', pageLoadState.renderCount.toString());
    };
  }, [isValid, isLoading, error, errorType, location.state, searchParams, pageLoadState.renderCount, pageLoadState.pageId, pageLoadState.initialLoadComplete, setPageLoadState, sessionDiagnosticId]);
  
  return null; // This is a purely functional component with no UI
};

// Toast helper functions
const showValuationToast = () => {
  import('sonner').then(({ toast }) => {
    toast.success("Valuation data loaded successfully", {
      description: "Your vehicle information is ready",
      duration: 3000
    });
  });
};

const showNavigationToast = (fallbackUsed: boolean) => {
  import('sonner').then(({ toast }) => {
    toast.success("Navigation successful", {
      description: fallbackUsed ? "Using fallback navigation method" : "Your vehicle data is loaded",
      duration: 3000
    });
  });
};

const showEmergencyToast = () => {
  import('sonner').then(({ toast }) => {
    toast.info("Emergency navigation used", {
      description: "Your session has been recovered",
      duration: 3000
    });
  });
};
