
/**
 * Changes made:
 * - 2025-04-05: Completely refactored to use simplified navigation approach
 * - Removed all complex state tracking and multiple fallback mechanisms
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const useValuationResultNavigation = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isOffline } = useOfflineStatus();
  
  const isLoggedIn = !!session;
  
  const handleNavigation = (valuationData: any) => {
    if (isOffline) {
      toast.warning("You appear to be offline", {
        description: "Please connect to the internet to continue.",
        duration: 5000
      });
      return;
    }
    
    try {
      // Store data in localStorage for reliability
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', valuationData.vin || '');
      localStorage.setItem('tempMileage', valuationData.mileage?.toString() || '');
      localStorage.setItem('tempGearbox', valuationData.transmission || '');
      
      if (!isLoggedIn) {
        // If not logged in, redirect to auth
        localStorage.setItem('redirectAfterAuth', '/sell-my-car');
        navigate('/auth', { 
          state: { fromValuation: true }
        });
        
        toast.info("Please sign in to continue", {
          description: "Create an account or sign in to list your car.",
          duration: 5000
        });
      } else {
        // If logged in, go directly to sell-my-car
        navigate('/sell-my-car', {
          state: { 
            fromValuation: true,
            valuationData
          }
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Navigation error", {
        description: "Please try again or refresh the page.",
        duration: 5000
      });
    }
  };
  
  return {
    handleNavigation,
    isLoggedIn
  };
};
