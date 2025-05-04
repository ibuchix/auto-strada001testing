
/**
 * Hook for handling the continuation flow after valuation
 * Created: 2025-05-10
 * Updated: 2025-05-28 - Enhanced with debug logging and improved navigation
 * Updated: 2025-05-29 - Fixed potential re-render loop in navigation handling
 * Updated: 2025-05-30 - Added reliability improvements to prevent stuck states
 * Updated: 2025-05-31 - Added data filtering to limit transmission to essential fields only
 * Updated: 2025-05-04 - Added automatic VIN reservation before navigation
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCallback, useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reserveVin } from "@/services/vinReservationService";

// Essential fields to include in the valuation data
const ESSENTIAL_FIELDS = ['vin', 'make', 'model', 'year', 'mileage', 'transmission', 'reservePrice'];

/**
 * Filters the valuation data to include only essential fields
 */
const getFilteredValuationData = (valuationData: any) => {
  if (!valuationData) return null;
  
  const filtered: Record<string, any> = {};
  
  // Extract only the essential fields
  ESSENTIAL_FIELDS.forEach(field => {
    if (valuationData[field] !== undefined) {
      filtered[field] = valuationData[field];
    }
  });
  
  // Always ensure reservePrice exists (use valuation as fallback)
  if (!filtered.reservePrice && valuationData.valuation) {
    filtered.reservePrice = valuationData.valuation;
  }
  
  return filtered;
};

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

  const handleContinue = useCallback(async (valuationData: any) => {
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
    
    // Filter to include only essential data
    const filteredData = getFilteredValuationData(valuationData);
    
    // Debug logging
    console.log("ValuationContinue: Starting navigation with filtered data:", {
      valuationMake: filteredData?.make,
      valuationModel: filteredData?.model,
      valuationYear: filteredData?.year,
      valuationVin: filteredData?.vin,
      valuationMileage: filteredData?.mileage,
      valuationReservePrice: filteredData?.reservePrice,
      isLoggedIn,
      navigationId
    });
    
    try {
      // Store data in localStorage for the next step - use stringified JSON with error handling
      if (filteredData) {
        try {
          // Clean any previous data
          localStorage.removeItem('valuationData');
          
          // Store the filtered data
          localStorage.setItem('valuationData', JSON.stringify(filteredData));
          
          // Also store individual values for redundancy
          localStorage.setItem('tempVIN', filteredData.vin || '');
          localStorage.setItem('tempMileage', filteredData.mileage?.toString() || '');
          localStorage.setItem('tempGearbox', filteredData.transmission || '');
          
          console.log("ValuationContinue: Successfully saved filtered valuation data to localStorage", {
            dataSize: JSON.stringify(filteredData).length,
            navigationId
          });
        } catch (error) {
          console.error("ValuationContinue: Error saving to localStorage:", error);
          // Continue anyway as we're also passing state via navigation
        }
      }
      
      if (isLoggedIn && filteredData?.vin) {
        // Get user ID from localStorage for reservation
        const userId = localStorage.getItem('userId');
        
        if (userId) {
          try {
            console.log("ValuationContinue: Creating VIN reservation", {
              vin: filteredData.vin,
              userId,
              navigationId
            });
            
            // Reserve the VIN before navigation
            const reservationResult = await reserveVin(
              filteredData.vin,
              userId,
              valuationData  // Pass complete valuation data for backend processing
            );
            
            if (reservationResult.success && reservationResult.data?.reservationId) {
              // Store the reservation ID in localStorage
              localStorage.setItem('vinReservationId', reservationResult.data.reservationId);
              console.log("ValuationContinue: VIN reservation created successfully", {
                reservationId: reservationResult.data.reservationId,
                navigationId
              });
              
              // Show success toast for reservation
              toast.success("VIN reserved successfully", {
                description: "Your VIN is now reserved for this listing"
              });
            } else {
              console.warn("ValuationContinue: VIN reservation failed", {
                error: reservationResult.error,
                navigationId
              });
              
              toast.error("VIN reservation issue", {
                description: "Unable to reserve this VIN. You may need to try again later."
              });
            }
          } catch (error) {
            console.error("ValuationContinue: Error creating VIN reservation:", error);
          }
        } else {
          console.warn("ValuationContinue: No user ID found, skipping VIN reservation", {
            navigationId
          });
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
            valuationData: filteredData, // Pass the filtered data
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
            valuationData: filteredData, // Pass the filtered data
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
