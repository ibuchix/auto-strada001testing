
/**
 * Changes made:
 * - 2025-04-05: Simplified navigation handling and removed excessive logging
 * - 2025-04-05: Streamlined data retrieval from valuation flow
 * - 2025-05-28: Enhanced debugging to fix form initialization issues
 * - 2025-05-29: Fixed infinite re-render issue by adding proper dependency arrays and state guards
 * - 2025-05-30: Added force transition timers and controls to prevent stuck loading
 * - 2025-05-31: Fixed cross-origin messaging issues and reduced render count
 * - 2025-05-13: Added explicit null check for auth session and error logging
 * - 2025-05-17: Added better error handling for cross-origin messaging
 * - 2025-06-20: Fixed destructuring error by directly accessing auth properties
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSellerCarListingValidation } from "@/hooks/seller/useSellerCarListingValidation";
import { PageStateManager } from "./sell-my-car/PageStateManager";
import { useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

// Helper function to safely post messages, ignoring SecurityError exceptions
const safePostMessage = (message: any, target: string = '*') => {
  try {
    if (window !== window.parent) {
      window.parent.postMessage(message, target);
    }
  } catch (err) {
    // Silently suppress SecurityError from cross-origin messaging
    if (!(err instanceof DOMException) || err.name !== 'SecurityError') {
      console.error('Error in postMessage (not SecurityError):', err);
    }
  }
};

const SellMyCar = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const fromValuation = searchParams.get('from') === 'valuation' || location.state?.fromValuation;
  const [initComplete, setInitComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    locationState: null,
    fromValuation: false,
    timestamp: Date.now()
  });

  // Get auth information - use null check pattern
  const auth = useAuth();
  const session = auth?.session;
  const isAuthLoading = auth?.isLoading || false;

  // Store initialization state in ref to prevent loops
  const initCompletedRef = useRef(false);
  const forceInitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef(0);

  const {
    isValid,
    isLoading,
    error,
    errorType,
    isVerifying,
    handleRetrySellerVerification
  } = useSellerCarListingValidation();
  
  // Initialize debug info once on mount
  const initializeDebugInfo = useCallback(() => {
    // Increment render count
    renderCountRef.current += 1;
    
    // Only perform full initialization on first or forced renders
    if (renderCountRef.current > 3 && initCompletedRef.current) {
      return; // Skip excessive re-initializations
    }
    
    try {
      // Try to log to console safely (this always works)
      console.log("SellMyCar: Component mounting/updating", {
        render: renderCountRef.current,
        initCompleted: initCompletedRef.current,
        fromValuation,
        isValid,
        hasSession: !!session,
        sessionLoading: isAuthLoading
      });
      
      // Try to post messages safely (will be suppressed if cross-origin issues occur)
      safePostMessage({
        type: 'DEBUG_SELL_MY_CAR',
        render: renderCountRef.current,
        initCompleted: initCompletedRef.current,
        fromValuation,
        isValid,
        hasSession: !!session
      });
    } catch (err) {
      // Last resort error handling
      console.warn('Error in debug logging (suppressed)');
    }
    
    // Store incoming data for debugging - only do this once
    setDebugInfo({
      locationState: location.state,
      fromValuation,
      timestamp: Date.now()
    });
    
    // Set up a timer to force initialization after 2.5 seconds
    if (!initCompletedRef.current && !forceInitTimerRef.current) {
      forceInitTimerRef.current = setTimeout(() => {
        console.log("SellMyCar: Force initialization timer triggered");
        if (!initCompletedRef.current) {
          setInitComplete(true);
          initCompletedRef.current = true;
          toast.info("Loading your car listing form", {
            description: "Please wait while we prepare your form."
          });
        }
      }, 2500);
    }
  }, [location.state, fromValuation, isValid, session, isAuthLoading]);
  
  // Run the initialization exactly once on mount
  useEffect(() => {
    try {
      initializeDebugInfo();
    } catch (err) {
      // Failsafe for any initialization errors
      console.error('SellMyCar initialization error (suppressed):', err);
      
      // Force complete initialization if something failed
      if (!initCompletedRef.current) {
        setInitComplete(true);
        initCompletedRef.current = true;
      }
    }
    
    // Clean up timer on unmount
    return () => {
      if (forceInitTimerRef.current) {
        clearTimeout(forceInitTimerRef.current);
      }
    };
  }, [initializeDebugInfo]);

  // Mark initialization as complete after a short delay
  // This helps ensure any loading states have time to update
  useEffect(() => {
    if (initCompletedRef.current) {
      return; // Already initialized, skip
    }
    
    const timer = setTimeout(() => {
      try {
        console.log("SellMyCar: Initialization complete");
        setInitComplete(true);
        initCompletedRef.current = true;
        
        // Try to post message safely
        safePostMessage({
          type: 'SELL_MY_CAR_INITIALIZED',
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn('Error in initialization completion (suppressed)');
      }
    }, 200);
    
    return () => {
      clearTimeout(timer);
    }
  }, []);

  return (
    <PageStateManager
      isValid={isValid}
      isLoading={isLoading && !initCompletedRef.current}
      error={error}
      errorType={errorType}
      isVerifying={isVerifying}
      handleRetrySellerVerification={handleRetrySellerVerification}
      fromValuation={fromValuation}
      renderCount={renderCountRef.current}
    />
  );
};

export default SellMyCar;
