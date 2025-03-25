
/**
 * Changes made:
 * - 2027-06-20: Created navigation hook as part of ValuationResult refactoring
 * - 2027-06-22: Enhanced with non-blocking navigation and connection state awareness
 * - 2027-06-22: Added fallback navigation with timeout for maximum reliability
 * - 2027-06-22: Fixed issues with navigation being blocked by WebSocket disconnection
 * - 2027-07-15: Added guaranteed navigation with improved error handling
 * - 2027-07-20: Fixed immediate loading feedback and direct URL navigation support
 */

import { useState } from "react";
import { toast } from "sonner";
import { ValuationData } from "../types";
import { useValuationNavigation } from "./useValuationNavigation";
import { useRealtime } from "@/components/RealtimeProvider";

export const useValuationResultNavigation = () => {
  const { handleContinue, isLoggedIn } = useValuationNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  const componentId = Math.random().toString(36).substring(2, 10);
  const { isConnected } = useRealtime();
  
  // Prepare navigation data and store in localStorage
  const prepareNavigationData = (valuationData: ValuationData, mileage: number) => {
    const navigationData = {
      ...valuationData,
      mileage
    };
    
    // Log detailed debug info for the navigation attempt
    console.log('ValuationResult - Navigation attempt details:', {
      attemptNumber: navigationAttempts + 1,
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
      localStorage.setItem("navigationAttemptCount", (navigationAttempts + 1).toString());
      
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
  };
  
  // Enhanced continue handler - now with immediate loading state
  const handleContinueClick = (normalizedResult: ValuationData) => {
    console.log('ValuationResult - handleContinueClick triggered');
    
    // Immediately set loading state for UI feedback
    setIsLoading(true);
    setNavigationAttempts(prev => prev + 1);
    
    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    
    // Store all necessary navigation data
    const navigationData = prepareNavigationData(normalizedResult, mileage);
    
    // IMPORTANT: The ContinueButton component now handles direct URL navigation
    // This function primarily prepares the data needed for navigation
    try {
      // Call the navigation handler from useValuationNavigation
      // Note: Button component will provide a direct URL fallback
      handleContinue(navigationData, navigationData.mileage);
      console.log('ValuationResult - handleContinue called successfully');
    } catch (navError) {
      console.error('ValuationResult - Error during handleContinue:', navError);
      // Error will be handled by the ContinueButton's direct URL navigation
    }
    
    // No need to return anything since ContinueButton handles navigation
  };

  // Handle retry attempts for valuation
  const handleRetry = (onRetry?: () => void) => {
    console.log('ValuationResult - handleRetry triggered');
    setIsLoading(true);
    
    toast.info("Retrying valuation...", {
      id: "valuation-retry",
      duration: 2000
    });
    
    if (onRetry) {
      try {
        onRetry();
      } catch (error) {
        console.error('ValuationResult - Error in retry handler:', error);
        setIsLoading(false);
        toast.error('Failed to retry valuation');
      }
    } else {
      setTimeout(() => setIsLoading(false), 500);
    }
  };
  
  return {
    handleContinueClick,
    handleRetry,
    isLoading,
    setIsLoading,
    navigationAttempts,
    componentId,
    isLoggedIn
  };
};
