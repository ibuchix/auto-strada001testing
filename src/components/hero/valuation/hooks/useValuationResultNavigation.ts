
/**
 * Changes made:
 * - 2027-06-20: Created navigation hook as part of ValuationResult refactoring
 * - 2027-06-22: Enhanced with non-blocking navigation and connection state awareness
 * - 2027-06-22: Added fallback navigation with timeout for maximum reliability
 * - 2027-06-22: Fixed issues with navigation being blocked by WebSocket disconnection
 * - 2027-07-15: Added guaranteed navigation with improved error handling
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
    
    // Pre-store data in localStorage as a safety measure
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
  
  // Enhanced continue handler with multiple fallback mechanisms and detailed logging
  const handleContinueClick = (normalizedResult: ValuationData) => {
    console.log('ValuationResult - handleContinueClick triggered');
    setNavigationAttempts(prev => prev + 1);
    setIsLoading(true);
    
    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    
    // Store all necessary navigation data
    const navigationData = prepareNavigationData(normalizedResult, mileage);
    
    // IMPORTANT: Setup guaranteed fallback navigation that will execute if normal navigation fails
    const fallbackTimeoutId = setTimeout(() => {
      console.log('ValuationResult - Fallback navigation triggered after timeout');
      try {
        // Verify if we're still on the same page before forcing navigation
        if (document.querySelector('#list-car-button')) {
          // Force direct navigation as last resort
          console.log('ValuationResult - Using direct URL navigation fallback');
          window.location.href = isLoggedIn 
            ? '/sell-my-car?fallback=emergency' 
            : '/auth?from=valuation&fallback=emergency';
        } else {
          console.log('ValuationResult - Page already changed, canceling fallback');
        }
      } catch (e) {
        console.error('ValuationResult - Fallback navigation failed:', e);
      }
    }, 1000); // Give the normal navigation 1 second to work
    
    // Pre-create the navigation function to execute
    const executeNavigation = () => {
      console.log('ValuationResult - Executing navigation with stored data');
      try {
        // Attempt to use the handleContinue function from useValuationNavigation
        handleContinue(navigationData, navigationData.mileage);
        console.log('ValuationResult - handleContinue called successfully');
      } catch (navError) {
        console.error('ValuationResult - Error during handleContinue:', navError);
        // Error will be handled by the fallback timeout
      }
    };
    
    // Don't wait for WebSocket operations - execute navigation immediately
    executeNavigation();
    
    // Return the fallback timeout ID so it can be cleared if needed
    return fallbackTimeoutId;
  };

  // Handle retry attempts for valuation
  const handleRetry = (onRetry?: () => void) => {
    console.log('ValuationResult - handleRetry triggered');
    setIsLoading(true);
    
    // Show toast to inform user
    toast.info("Retrying valuation...", {
      id: "valuation-retry",
      duration: 2000
    });
    
    // Call the onRetry prop if provided
    if (onRetry) {
      try {
        onRetry();
      } catch (error) {
        console.error('ValuationResult - Error in retry handler:', error);
        setIsLoading(false);
        toast.error('Failed to retry valuation');
      }
    } else {
      // If no retry function provided, just reset loading state
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
