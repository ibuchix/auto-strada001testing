
/**
 * Hook for handling the continuation flow after valuation
 * Created: 2025-05-10
 * Updated: 2025-05-28 - Enhanced with debug logging and improved navigation
 * Updated: 2025-05-29 - Fixed potential re-render loop in navigation handling
 * Updated: 2025-05-30 - Added reliability improvements to prevent stuck states
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCallback, useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useValuationContinue() {
  const navigate = useNavigate();
  const isLoggedIn = !!supabase.auth.getSession;
  // Track if navigation has been triggered to prevent multiple navigations
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Store a navigation ID to ensure we can track each navigation attempt
  const navigationIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));
  
  // Create a safety timer to detect navigation issues
  useEffect(() => {
    // This useEffect only exists to detect potential navigation issues
    const safetyTimer = setTimeout(() => {
      console.log("ValuationContinue: Navigation safety check timer triggered", {
        hasNavigated,
        navigationId: navigationIdRef.current
      });
    }, 8000); // Check after 8 seconds
    
    return () => clearTimeout(safetyTimer);
  }, [hasNavigated]);

  const handleContinue = useCallback((valuationData: any) => {
    // Generate unique navigation ID for this attempt
    const navigationId = Math.random().toString(36).substr(2, 9);
    navigationIdRef.current = navigationId;
    
    // Guard against multiple navigation attempts
    if (hasNavigated) {
      console.log("ValuationContinue: Navigation already in progress, skipping", {
        navigationId
      });
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
      isLoggedIn,
      navigationId
    });
    
    try {
      // Store data in localStorage for the next step - use stringified JSON with error handling
      if (valuationData) {
        try {
          // Clean any previous data
          localStorage.removeItem('valuationData');
          
          // Store the current data
          localStorage.setItem('valuationData', JSON.stringify(valuationData));
          
          // Also store individual values for redundancy
          localStorage.setItem('tempVIN', valuationData.vin || '');
          localStorage.setItem('tempMileage', valuationData.mileage?.toString() || '');
          localStorage.setItem('tempGearbox', valuationData.transmission || '');
          
          console.log("ValuationContinue: Successfully saved valuation data to localStorage", {
            dataSize: JSON.stringify(valuationData).length,
            navigationId
          });
        } catch (error) {
          console.error("ValuationContinue: Error saving to localStorage:", error);
          // Continue anyway as we're also passing state via navigation
        }
      }
      
      // Navigate based on auth status - use random navId to prevent state merges
      if (isLoggedIn) {
        console.log("ValuationContinue: User is logged in, navigating to sell-my-car", {
          navigationId
        });
        
        navigate('/sell-my-car', { 
          state: { 
            fromValuation: true,
            valuationData,
            timestamp: Date.now(),
            navId: navigationId
          },
          replace: true // Use replace to prevent back button issues
        });
        
        toast.success("Preparing your listing", {
          description: "Setting up your car details"
        });
      } else {
        console.log("ValuationContinue: User is not logged in, navigating to auth page", {
          navigationId
        });
        
        toast.info("Please sign in to continue", {
          description: "Create an account or sign in to proceed with listing your vehicle."
        });
        
        navigate('/auth', {
          state: {
            from: 'valuation',
            returnTo: '/sell-my-car',
            valuationData,
            timestamp: Date.now(),
            navId: navigationId
          },
          replace: true // Use replace to prevent back button issues
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
