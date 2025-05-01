
/**
 * Hook for handling the continuation flow after valuation
 * Created: 2025-05-10
 * Updated: 2025-05-28 - Enhanced with debug logging and improved navigation
 * Updated: 2025-05-29 - Fixed potential re-render loop in navigation handling
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useValuationContinue() {
  const navigate = useNavigate();
  const isLoggedIn = !!supabase.auth.getSession;
  // Track if navigation has been triggered to prevent multiple navigations
  const [hasNavigated, setHasNavigated] = useState(false);

  const handleContinue = useCallback((valuationData: any) => {
    // Guard against multiple navigation attempts
    if (hasNavigated) {
      console.log("ValuationContinue: Navigation already in progress, skipping");
      return;
    }
    
    // Mark as navigated to prevent loops
    setHasNavigated(true);
    
    // Debug logging
    console.log("ValuationContinue: Starting navigation with data:", {
      valuationMake: valuationData?.make,
      valuationModel: valuationData?.model,
      valuationYear: valuationData?.year,
      valuationVin: valuationData?.vin,
      valuationMileage: valuationData?.mileage,
      isLoggedIn
    });
    
    try {
      // Store data in localStorage for the next step - use stringified JSON with error handling
      if (valuationData) {
        try {
          localStorage.setItem('valuationData', JSON.stringify(valuationData));
          console.log("ValuationContinue: Successfully saved valuation data to localStorage");
        } catch (error) {
          console.error("ValuationContinue: Error saving to localStorage:", error);
          // Continue anyway as we're also passing state via navigation
        }
      }
      
      // Navigate based on auth status
      if (isLoggedIn) {
        console.log("ValuationContinue: User is logged in, navigating to sell-my-car");
        navigate('/sell-my-car', { 
          state: { 
            fromValuation: true,
            valuationData,
            timestamp: Date.now(), // Add timestamp to ensure state is recognized as new
            navId: Math.random().toString(36).substr(2, 9) // Add unique navigation ID
          } 
        });
        
        toast.success("Preparing your listing", {
          description: "Setting up your car details"
        });
      } else {
        console.log("ValuationContinue: User is not logged in, navigating to auth page");
        toast.info("Please sign in to continue", {
          description: "Create an account or sign in to proceed with listing your vehicle."
        });
        navigate('/auth', {
          state: {
            from: 'valuation',
            returnTo: '/sell-my-car',
            valuationData,
            timestamp: Date.now(), // Add timestamp to ensure state is recognized as new
            navId: Math.random().toString(36).substr(2, 9) // Add unique navigation ID
          }
        });
      }
    } catch (error) {
      console.error("ValuationContinue: Navigation error:", error);
      
      // Reset navigation state to allow retry
      setHasNavigated(false);
      
      toast.error("Something went wrong", {
        description: "Please try again"
      });
    }
  }, [navigate, isLoggedIn, hasNavigated]);

  return {
    isLoggedIn,
    handleContinue
  };
}
