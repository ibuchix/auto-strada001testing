
/**
 * Changes made:
 * - 2025-07-07: Created hook for navigation handling extracted from ValuationResult
 * - 2026-04-15: Enhanced with improved offline handling and user feedback
 * - 2026-12-20: Fixed useAuth import path
 * - 2027-05-15: Fixed import path for useAuth and updated interface to match AuthProvider
 * - 2027-05-16: Added fallback direct navigation to ensure button always works even with WebSocket issues
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const useValuationNavigation = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isOffline } = useOfflineStatus();
  
  const isLoggedIn = !!session;
  
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
        
        // Fallback to direct navigation if needed
        try {
          navigate('/auth');
        } catch (error) {
          console.error('Navigation error, using fallback:', error);
          window.location.href = '/auth';
        }
        return;
      }
      
      // Add mileage to the valuation data if provided
      const dataToPass = mileage ? { ...valuationData, mileage } : valuationData;
      
      // Store in localStorage as a fallback
      localStorage.setItem("valuationData", JSON.stringify(dataToPass));
      
      // Navigate to the listing form with fallback
      try {
        navigate('/sell-my-car', { 
          state: { 
            fromValuation: true,
            valuationData: dataToPass
          }
        });
      } catch (error) {
        console.error('Navigation error, using fallback direct navigation:', error);
        // Fallback to direct navigation if React Router navigation fails
        window.location.href = '/sell-my-car';
      }
      
      console.log('Navigation complete to /sell-my-car with data:', dataToPass);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error("Navigation failed", {
        description: "Please try again or refresh the page."
      });
      
      // Last resort fallback - direct navigation
      window.location.href = '/sell-my-car';
    }
  };
  
  return {
    handleContinue,
    isLoggedIn
  };
};
