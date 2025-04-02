
/**
 * Changes made:
 * - 2027-06-20: Created navigation hook as part of ValuationResult refactoring
 * - 2027-06-22: Enhanced with non-blocking navigation and connection state awareness
 * - 2027-06-22: Added fallback navigation with timeout for maximum reliability
 * - 2027-06-22: Fixed issues with navigation being blocked by WebSocket disconnection
 * - 2027-07-15: Added guaranteed navigation with improved error handling
 * - 2027-07-20: Fixed immediate loading feedback and direct URL navigation support
 * - 2027-07-22: Fixed TypeScript error by ensuring no return value used in conditionals
 * - 2027-07-27: Fixed loading state not being properly set and propagated
 * - 2027-11-10: Fixed potential race condition with navigation attempts
 * - 2027-11-15: Enhanced navigation reliability and removed conditional hook calls
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ValuationData } from "../types";
import { useValuationNavigation } from "./useValuationNavigation";
import { useRealtime } from "@/components/RealtimeProvider";
import { useNavigate } from "react-router-dom";

export const useValuationResultNavigation = () => {
  // Always initialize ALL hooks at the top, unconditionally
  const { handleContinue, isLoggedIn } = useValuationNavigation();
  const [state, setState] = useState({
    isLoading: false,
    navigationAttempts: 0
  });
  const componentId = useRef(Math.random().toString(36).substring(2, 10)).current;
  const { isConnected } = useRealtime();
  const navigationInProgress = useRef(false);
  const navigate = useNavigate();
  
  // Prepare navigation data and store in localStorage
  const prepareNavigationData = useCallback((valuationData: ValuationData, mileage: number) => {
    const navigationData = {
      ...valuationData,
      mileage
    };
    
    // Log detailed debug info for the navigation attempt
    console.log('ValuationResult - Navigation attempt details:', {
      attemptNumber: state.navigationAttempts + 1,
      timestamp: new Date().toISOString(),
      dataToStore: navigationData,
      isLoggedIn,
      mileage,
      connectionStatus: isConnected ? 'connected' : 'disconnected'
    });
    
    // Store data in localStorage as a safety measure
    try {
      localStorage.setItem("valuationData", JSON.stringify(navigationData));
      localStorage.setItem("navigationRecentAttempt", new Date().toISOString());
      localStorage.setItem("navigationAttemptCount", (state.navigationAttempts + 1).toString());
      
      // Store individual fields for maximum resilience
      if (navigationData.make) localStorage.setItem("tempMake", navigationData.make);
      if (navigationData.model) localStorage.setItem("tempModel", navigationData.model);
      if (navigationData.year) localStorage.setItem("tempYear", navigationData.year.toString());
      if (navigationData.vin) localStorage.setItem("tempVIN", navigationData.vin);
      if (navigationData.mileage) localStorage.setItem("tempMileage", navigationData.mileage.toString());
      if (navigationData.transmission) localStorage.setItem("tempGearbox", navigationData.transmission);
      
      console.log('ValuationResult - Successfully stored navigation data in localStorage');
      return navigationData;
    } catch (storageError) {
      console.error('ValuationResult - Error storing data in localStorage:', storageError);
      // Continue anyway - this is just a fallback
      return navigationData;
    }
  }, [state.navigationAttempts, isLoggedIn, isConnected]);
  
  // Enhanced continue handler - now with immediate loading state and race condition prevention
  const handleContinueClick = useCallback((normalizedResult: ValuationData) => {
    console.log('ValuationResult - handleContinueClick triggered');
    
    // Prevent multiple navigation attempts
    if (navigationInProgress.current) {
      console.log('ValuationResult - Navigation already in progress, ignoring duplicate click');
      return;
    }
    
    navigationInProgress.current = true;
    
    // Immediately set loading state for UI feedback
    setState(prev => ({
      ...prev,
      isLoading: true,
      navigationAttempts: prev.navigationAttempts + 1
    }));
    
    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    
    // Store all necessary navigation data
    const navigationData = prepareNavigationData(normalizedResult, mileage);
    
    // IMPORTANT: The ContinueButton component now handles direct URL navigation
    // This function primarily prepares the data needed for navigation
    try {
      // Call the navigation handler from useValuationNavigation
      handleContinue(navigationData, navigationData.mileage);
      console.log('ValuationResult - handleContinue called successfully');
      
      // Fallback direct navigation in case the handleContinue doesn't trigger a redirect
      setTimeout(() => {
        if (navigationInProgress.current) {
          console.log('ValuationResult - Fallback direct navigation triggered');
          navigate('/sell-my-car');
          navigationInProgress.current = false;
        }
      }, 1000);
    } catch (navError) {
      console.error('ValuationResult - Error during handleContinue:', navError);
      // Error will be handled by the ContinueButton's direct URL navigation
      navigate('/sell-my-car');
      navigationInProgress.current = false;
    }
  }, [prepareNavigationData, handleContinue, navigate]);

  // Handle retry attempts for valuation
  const handleRetry = useCallback((onRetry?: () => void) => {
    console.log('ValuationResult - handleRetry triggered');
    setState(prev => ({ ...prev, isLoading: true }));
    
    toast.info("Retrying valuation...", {
      id: "valuation-retry",
      duration: 2000
    });
    
    if (onRetry) {
      try {
        onRetry();
      } catch (error) {
        console.error('ValuationResult - Error in retry handler:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        toast.error('Failed to retry valuation');
      }
    } else {
      setTimeout(() => setState(prev => ({ ...prev, isLoading: false })), 500);
    }
  }, []);
  
  // Add a timeout to reset loading state if navigation doesn't happen
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (state.isLoading) {
      timeoutId = setTimeout(() => {
        console.log('ValuationResult - Loading state timeout reached, resetting');
        setState(prev => ({ ...prev, isLoading: false }));
        navigationInProgress.current = false;
      }, 5000); // Reset loading state after 5 seconds if navigation doesn't happen
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state.isLoading]);
  
  return {
    handleContinueClick,
    handleRetry,
    isLoading: state.isLoading,
    setIsLoading: (isLoading: boolean) => setState(prev => ({ ...prev, isLoading })),
    navigationAttempts: state.navigationAttempts,
    componentId,
    isLoggedIn
  };
};
