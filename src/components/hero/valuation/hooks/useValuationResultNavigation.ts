
/**
 * Changes made:
 * - 2027-06-20: Created navigation hook as part of ValuationResult refactoring
 */

import { useState } from "react";
import { toast } from "sonner";
import { ValuationData } from "../types";
import { useValuationNavigation } from "./useValuationNavigation";

export const useValuationResultNavigation = () => {
  const { handleContinue, isLoggedIn } = useValuationNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  const componentId = Math.random().toString(36).substring(2, 10);
  
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
      mileage
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
    
    // Pre-create the navigation function to execute afterward
    const executeNavigation = () => {
      console.log('ValuationResult - Executing navigation with stored data');
      try {
        handleContinue(navigationData, navigationData.mileage);
        console.log('ValuationResult - handleContinue called successfully');
      } catch (navError) {
        console.error('ValuationResult - Error during handleContinue:', navError);
        // Try direct navigation as fallback
        try {
          console.log('ValuationResult - Attempting direct navigation fallback');
          window.location.href = '/sell-my-car';
        } catch (directNavError) {
          console.error('ValuationResult - Even direct navigation failed:', directNavError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Register a timeout for navigation to happen even if component unmounts
    const timeoutId = window.setTimeout(() => {
      console.log('ValuationResult - Executing navigation via timeout');
      executeNavigation();
    }, 100);
    
    // Also try to execute navigation immediately
    try {
      console.log('ValuationResult - Attempting immediate navigation');
      executeNavigation();
    } catch (error) {
      console.error('ValuationResult - Error during immediate navigation, relying on timeout:', error);
    }
    
    // Return the timeout ID so it can be cleared if needed
    return timeoutId;
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
      onRetry();
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
