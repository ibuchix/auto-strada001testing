
/**
 * Changes made:
 * - 2025-07-07: Created hook for navigation handling extracted from ValuationResult
 * - 2026-04-15: Enhanced with improved offline handling and user feedback
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const useValuationNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOffline } = useOfflineStatus();
  
  const isLoggedIn = !!user;
  
  const handleContinue = (valuationData: any, mileage?: number) => {
    try {
      // Save state before navigation
      localStorage.setItem('lastNavigationAttempt', new Date().toISOString());
      
      if (isOffline) {
        toast.warning("You appear to be offline", {
          description: "Your data has been saved. Please reconnect to continue.",
          duration: 5000
        });
        return;
      }
      
      if (!isLoggedIn) {
        // Store data for after authentication
        localStorage.setItem('valuationDataForListing', JSON.stringify(valuationData));
        localStorage.setItem('redirectAfterAuth', '/sell-my-car');
        
        // Navigate to auth
        toast.info("Please sign in to continue", {
          description: "Create an account or sign in to list your car."
        });
        navigate('/auth');
        return;
      }
      
      // Add mileage to the valuation data if provided
      const dataToPass = mileage ? { ...valuationData, mileage } : valuationData;
      
      // Navigate to the listing form
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: dataToPass
        }
      });
      
      console.log('Navigation complete to /sell-my-car with data:', dataToPass);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error("Navigation failed", {
        description: "Please try again or refresh the page."
      });
    }
  };
  
  return {
    handleContinue,
    isLoggedIn
  };
};
