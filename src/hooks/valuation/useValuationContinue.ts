
/**
 * Hook for handling the continuation flow after valuation
 * Created: 2025-05-10
 * Updated: 2025-05-28 - Enhanced with debug logging and improved navigation
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useValuationContinue() {
  const navigate = useNavigate();
  const isLoggedIn = !!supabase.auth.getSession;

  const handleContinue = useCallback((valuationData: any) => {
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
            timestamp: Date.now() // Add timestamp to ensure state is recognized as new
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
            valuationData
          }
        });
      }
    } catch (error) {
      console.error("ValuationContinue: Navigation error:", error);
      toast.error("Something went wrong", {
        description: "Please try again"
      });
    }
  }, [navigate, isLoggedIn]);

  return {
    isLoggedIn,
    handleContinue
  };
}
