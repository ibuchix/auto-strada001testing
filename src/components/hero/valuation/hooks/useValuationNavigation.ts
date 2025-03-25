
/**
 * Changes made:
 * - 2025-07-07: Created hook for navigation handling extracted from ValuationResult
 * - 2026-04-15: Enhanced with improved offline handling and user feedback
 * - 2026-12-20: Fixed useAuth import path
 * - 2027-05-15: Fixed import path for useAuth and updated interface to match AuthProvider
 * - 2027-05-16: Added fallback direct navigation to ensure button always works even with WebSocket issues
 * - 2027-06-08: Added extensive debugging and improved navigation reliability with multiple fallbacks
 * - 2027-06-15: Enhanced debugging with detailed performance metrics and navigation state tracking
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useCallback, useEffect, useRef } from "react";

export const useValuationNavigation = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isOffline } = useOfflineStatus();
  const navigationAttempts = useRef<{[key: string]: any}>({}); 
  
  const isLoggedIn = !!session;
  
  // Initialize tracking on component mount
  useEffect(() => {
    const hookId = Math.random().toString(36).substring(2, 8);
    console.log(`NAVIGATION HOOK[${hookId}] - Initialized at ${new Date().toISOString()}`, {
      hasNavigator: typeof navigate === 'function',
      navigateType: typeof navigate,
      hasSession: !!session,
      isOffline,
      currentPathname: window.location.pathname,
      currentSearch: window.location.search,
    });
    
    // Store hook init reference
    localStorage.setItem('navigationHookInit', new Date().toISOString());
    localStorage.setItem('navigationHookId', hookId);
    
    // Function to track navigation state changes
    const handleNavigationEvent = () => {
      console.log(`NAVIGATION HOOK[${hookId}] - Detected navigation event`, {
        timestamp: new Date().toISOString(),
        newPathname: window.location.pathname,
        newSearch: window.location.search
      });
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', handleNavigationEvent);
    
    return () => {
      window.removeEventListener('popstate', handleNavigationEvent);
      console.log(`NAVIGATION HOOK[${hookId}] - Unmounted at ${new Date().toISOString()}`);
    };
  }, [navigate, session, isOffline]);
  
  // Helper function to measure and log performance
  const measurePerformance = (operationId: string, marker: string) => {
    const timestamp = performance.now();
    console.log(`NAVIGATION PERFORMANCE [${operationId}] ${marker}: ${timestamp.toFixed(2)}ms`);
    
    try {
      // Store in local navigation attempts ref
      if (!navigationAttempts.current[operationId]) {
        navigationAttempts.current[operationId] = {};
      }
      navigationAttempts.current[operationId][marker] = timestamp;
      
      // Also try localStorage
      localStorage.setItem(`nav_perf_${operationId}_${marker}`, timestamp.toString());
    } catch (e) {
      console.warn(`Failed to store performance metric: ${e}`);
    }
    
    return timestamp;
  };
  
  const handleContinue = useCallback((valuationData: any, mileage?: number) => {
    // Generate unique ID for this navigation attempt
    const navId = Math.random().toString(36).substring(2, 10);
    const startTime = performance.now();
    
    try {
      // Enhanced debugging - log everything
      console.log(`NAVIGATION PROCESS [${navId}] - Starting at ${new Date().toISOString()}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        isOffline,
        hasValuationData: !!valuationData,
        valuationDataType: typeof valuationData,
        valuationKeys: valuationData ? Object.keys(valuationData) : [],
        mileage,
        hasMileage: !!mileage,
        currentURL: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        startTime
      });
      
      measurePerformance(navId, 'start');
      
      // Save state before navigation
      localStorage.setItem('lastNavigationAttempt', new Date().toISOString());
      localStorage.setItem('navigationAttemptId', navId);
      
      // Store detailed navigation attempt info
      const debugInfo = {
        timestamp: new Date().toISOString(),
        navId,
        isLoggedIn: !!session,
        hasValuationData: !!valuationData,
        fromPage: window.location.pathname,
        performanceNow: startTime,
        performanceNavigation: performance.navigation ? {
          type: performance.navigation.type,
          redirectCount: performance.navigation.redirectCount
        } : 'Not available',
        windowHistory: {
          length: window.history.length,
          state: window.history.state
        }
      };
      
      console.log(`NAVIGATION PROCESS [${navId}] - Debug info`, debugInfo);
      localStorage.setItem('navigationDebugInfo', JSON.stringify(debugInfo));
      
      measurePerformance(navId, 'pre_offline_check');
      
      if (isOffline) {
        console.log(`NAVIGATION PROCESS [${navId}] - User is offline, showing toast`);
        toast.warning("You appear to be offline", {
          description: "Your data has been saved. Please reconnect to continue.",
          duration: 5000
        });
        return;
      }
      
      measurePerformance(navId, 'pre_auth_check');
      
      if (!isLoggedIn) {
        // Store data for after authentication
        console.log(`NAVIGATION PROCESS [${navId}] - User not logged in, storing data for after auth`);
        measurePerformance(navId, 'storing_data_for_auth');
        
        try {
          localStorage.setItem('valuationDataForListing', JSON.stringify(valuationData));
          localStorage.setItem('redirectAfterAuth', '/sell-my-car');
          localStorage.setItem('navIdBeforeAuth', navId);
          
          // Set timestamp for tracking
          localStorage.setItem('authRedirectTime', new Date().toISOString());
        } catch (storageError) {
          console.error(`NAVIGATION PROCESS [${navId}] - Error storing auth data:`, storageError);
        }
        
        // Navigate to auth
        toast.info("Please sign in to continue", {
          description: "Create an account or sign in to list your car."
        });
        
        measurePerformance(navId, 'pre_auth_navigation');
        
        // Try React Router navigation first
        try {
          console.log(`NAVIGATION PROCESS [${navId}] - Attempting to navigate to /auth with React Router`);
          navigate('/auth', {
            state: {
              fromValuation: true,
              navId,
              timestamp: new Date().toISOString()
            }
          });
          
          measurePerformance(navId, 'auth_navigation_attempt');
          
          // Check if navigation was successful after a short delay
          setTimeout(() => {
            if (window.location.pathname !== '/auth') {
              console.warn(`NAVIGATION PROCESS [${navId}] - React Router navigation to /auth failed, using direct URL`);
              measurePerformance(navId, 'auth_navigation_fallback');
              window.location.href = `/auth?navId=${navId}&fallback=true`;
            } else {
              console.log(`NAVIGATION PROCESS [${navId}] - React Router navigation to /auth successful`);
              measurePerformance(navId, 'auth_navigation_success');
            }
          }, 100);
        } catch (error) {
          console.error(`NAVIGATION PROCESS [${navId}] - Navigation error, using fallback:`, error);
          measurePerformance(navId, 'auth_navigation_error');
          
          // Set a flag to track navigation attempt
          localStorage.setItem('navigationFallbackUsed', 'true');
          
          // Go straight to direct URL navigation
          window.location.href = `/auth?navId=${navId}&fallback=true`;
        }
        return;
      }
      
      measurePerformance(navId, 'preparing_data');
      
      // Add mileage to the valuation data if provided
      const dataToPass = mileage ? { ...valuationData, mileage } : valuationData;
      
      // Store in localStorage as a fallback - be thorough with this
      console.log(`NAVIGATION PROCESS [${navId}] - Storing data in localStorage`, {
        dataKeys: Object.keys(dataToPass),
        hasMileage: !!mileage,
        vin: dataToPass.vin
      });
      
      try {
        measurePerformance(navId, 'storing_data_start');
        
        localStorage.setItem("valuationData", JSON.stringify(dataToPass));
        localStorage.setItem("tempVIN", dataToPass.vin || '');
        if (mileage) {
          localStorage.setItem("tempMileage", mileage.toString());
        }
        if (dataToPass.transmission) {
          localStorage.setItem("tempGearbox", dataToPass.transmission);
        }
        
        // Store detailed diagnostic info
        localStorage.setItem("valuationDataTimestamp", new Date().toISOString());
        localStorage.setItem("valuationDataNavId", navId);
        
        measurePerformance(navId, 'storing_data_complete');
      } catch (storageError) {
        console.error(`NAVIGATION PROCESS [${navId}] - Error storing data:`, storageError);
        // Continue anyway - we'll try to use the state in the navigation
      }
      
      // Set a navigation marker that can be checked in the target page
      localStorage.setItem('navigationInProgress', 'true');
      localStorage.setItem('navigationStartTime', new Date().toISOString());
      
      measurePerformance(navId, 'pre_navigation');
      
      // Navigate to the listing form with fallback
      try {
        console.log(`NAVIGATION PROCESS [${navId}] - Attempting to navigate to /sell-my-car with state data`);
        
        // Create the state object with all necessary data
        const navigationState = { 
          fromValuation: true,
          valuationData: dataToPass,
          navigatedAt: new Date().toISOString(),
          navId,
          performanceStartTime: startTime
        };
        
        // Log the full state for debugging
        console.log(`NAVIGATION PROCESS [${navId}] - Full navigation state:`, navigationState);
        
        measurePerformance(navId, 'navigation_execution_start');
        
        // Execute the navigation with React Router
        navigate('/sell-my-car', { 
          state: navigationState,
          replace: true // Use replace to avoid history stack issues
        });
        
        measurePerformance(navId, 'navigation_execution_complete');
        
        // Check if navigation was successful
        setTimeout(() => {
          const currentPath = window.location.pathname;
          console.log(`NAVIGATION PROCESS [${navId}] - Checking navigation success after 100ms: currentPath=${currentPath}`);
          
          if (currentPath !== '/sell-my-car') {
            console.warn(`NAVIGATION PROCESS [${navId}] - Navigation appears to have failed (still at ${currentPath}), using fallback`);
            measurePerformance(navId, 'navigation_failure_detected');
            
            toast.info("Using alternative navigation method", {
              description: "Please wait while we redirect you...",
              duration: 2000
            });
            
            window.location.href = `/sell-my-car?from=valuation&navId=${navId}&fallback=true`;
          } else {
            console.log(`NAVIGATION PROCESS [${navId}] - Navigation successful to ${currentPath}`);
            measurePerformance(navId, 'navigation_success_confirmed');
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            console.log(`NAVIGATION PROCESS [${navId}] - Complete: took ${duration.toFixed(2)}ms`);
          }
        }, 100);
      } catch (error) {
        console.error(`NAVIGATION PROCESS [${navId}] - Navigation error, using fallback direct navigation:`, error);
        measurePerformance(navId, 'navigation_error');
        
        // Show toast for error feedback
        toast.error("Navigation issue detected", {
          description: "Using fallback navigation method",
          duration: 3000
        });
        
        // Try direct navigation with a query parameter to indicate source
        window.location.href = `/sell-my-car?from=valuation&navId=${navId}&error=true`;
      }
      
      console.log(`NAVIGATION PROCESS [${navId}] - Navigation process initiated`);
      measurePerformance(navId, 'process_complete');
      
      // Final check after a longer delay
      setTimeout(() => {
        const currentPath = window.location.pathname;
        console.log(`NAVIGATION PROCESS [${navId}] - Final check after 500ms: currentPath=${currentPath}`);
        
        if (currentPath !== '/sell-my-car') {
          console.error(`NAVIGATION PROCESS [${navId}] - Navigation completely failed after 500ms (still at ${currentPath})`);
          measurePerformance(navId, 'complete_failure_detected');
          
          // Last resort emergency navigation
          toast.error("Navigation failed", {
            description: "Using emergency navigation method",
            duration: 3000
          });
          
          window.location.href = `/sell-my-car?emergency=true&navId=${navId}`;
        }
      }, 500);
    } catch (error) {
      console.error(`NAVIGATION PROCESS [${navId}] - Unexpected error during navigation:`, error);
      measurePerformance(navId, 'unexpected_error');
      
      toast.error("Navigation failed", {
        description: "Please try again or refresh the page."
      });
      
      // Last resort fallback - direct navigation
      try {
        window.location.href = '/sell-my-car?emergency=true';
      } catch (e) {
        console.error(`NAVIGATION PROCESS [${navId}] - Even last resort navigation failed:`, e);
        
        // Extreme fallback - reload page and show message
        alert("Navigation failed. Please click OK to refresh and try again.");
        window.location.reload();
      }
    }
  }, [navigate, session, isOffline]);
  
  return {
    handleContinue,
    isLoggedIn,
    navigationAttempts: navigationAttempts.current
  };
};
