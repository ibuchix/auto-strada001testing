
/**
 * Changes made:
 * - 2025-07-07: Created hook for navigation handling extracted from ValuationResult
 * - 2026-04-15: Enhanced with improved offline handling and user feedback
 * - 2026-12-20: Fixed useAuth import path
 * - 2027-05-15: Fixed import path for useAuth and updated interface to match AuthProvider
 * - 2027-05-16: Added fallback direct navigation to ensure button always works even with WebSocket issues
 * - 2027-06-08: Added extensive debugging and improved navigation reliability with multiple fallbacks
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
      // Enhanced debugging - log everything
      console.log('NAVIGATION DEBUG - Starting navigation process', {
        timestamp: new Date().toISOString(),
        hasSession: !!session,
        userId: session?.user?.id,
        isOffline,
        hasValuationData: !!valuationData,
        valuationDataType: typeof valuationData,
        mileage,
        hasMileage: !!mileage,
        currentURL: window.location.href
      });
      
      // Save state before navigation
      localStorage.setItem('lastNavigationAttempt', new Date().toISOString());
      localStorage.setItem('navigationDebugInfo', JSON.stringify({
        timestamp: new Date().toISOString(),
        isLoggedIn: !!session,
        hasValuationData: !!valuationData,
        fromPage: window.location.pathname
      }));
      
      if (isOffline) {
        console.log('NAVIGATION DEBUG - User is offline, showing toast');
        toast.warning("You appear to be offline", {
          description: "Your data has been saved. Please reconnect to continue.",
          duration: 5000
        });
        return;
      }
      
      if (!isLoggedIn) {
        // Store data for after authentication
        console.log('NAVIGATION DEBUG - User not logged in, storing data for after auth');
        localStorage.setItem('valuationDataForListing', JSON.stringify(valuationData));
        localStorage.setItem('redirectAfterAuth', '/sell-my-car');
        
        // Navigate to auth
        toast.info("Please sign in to continue", {
          description: "Create an account or sign in to list your car."
        });
        
        // Fallback to direct navigation if needed
        try {
          console.log('NAVIGATION DEBUG - Attempting to navigate to /auth with React Router');
          navigate('/auth');
        } catch (error) {
          console.error('NAVIGATION DEBUG - Navigation error, using fallback:', error);
          
          // Set a flag to track navigation attempt
          localStorage.setItem('navigationFallbackUsed', 'true');
          
          // Try again with a slight delay
          setTimeout(() => {
            try {
              console.log('NAVIGATION DEBUG - Attempting delayed navigation to /auth');
              navigate('/auth');
            } catch (delayedError) {
              console.error('NAVIGATION DEBUG - Delayed navigation failed, using direct URL:', delayedError);
              window.location.href = '/auth';
            }
          }, 100);
        }
        return;
      }
      
      // Add mileage to the valuation data if provided
      const dataToPass = mileage ? { ...valuationData, mileage } : valuationData;
      
      // Store in localStorage as a fallback - be thorough with this
      console.log('NAVIGATION DEBUG - Storing data in localStorage', dataToPass);
      localStorage.setItem("valuationData", JSON.stringify(dataToPass));
      localStorage.setItem("tempVIN", dataToPass.vin || '');
      if (mileage) {
        localStorage.setItem("tempMileage", mileage.toString());
      }
      if (dataToPass.transmission) {
        localStorage.setItem("tempGearbox", dataToPass.transmission);
      }
      
      // Set a navigation marker that can be checked in the target page
      localStorage.setItem('navigationInProgress', 'true');
      localStorage.setItem('navigationStartTime', new Date().toISOString());
      
      // Navigate to the listing form with fallback
      try {
        console.log('NAVIGATION DEBUG - Attempting to navigate to /sell-my-car with state data');
        navigate('/sell-my-car', { 
          state: { 
            fromValuation: true,
            valuationData: dataToPass,
            navigatedAt: new Date().toISOString()
          },
          replace: true // Use replace to avoid history stack issues
        });
        
        // Check if navigation was successful
        setTimeout(() => {
          console.log('NAVIGATION DEBUG - Checking if navigation was successful');
          if (window.location.pathname !== '/sell-my-car') {
            console.warn('NAVIGATION DEBUG - Navigation appears to have failed, using fallback');
            window.location.href = '/sell-my-car';
          }
        }, 300);
      } catch (error) {
        console.error('NAVIGATION DEBUG - Navigation error, using fallback direct navigation:', error);
        
        // Try direct navigation with a query parameter to indicate source
        window.location.href = '/sell-my-car?from=valuation';
      }
      
      console.log('NAVIGATION DEBUG - Navigation process complete');
    } catch (error) {
      console.error('NAVIGATION DEBUG - Unexpected error during navigation:', error);
      toast.error("Navigation failed", {
        description: "Please try again or refresh the page."
      });
      
      // Last resort fallback - direct navigation
      try {
        window.location.href = '/sell-my-car';
      } catch (e) {
        console.error('NAVIGATION DEBUG - Even last resort navigation failed:', e);
        
        // Extreme fallback - reload page and show message
        alert("Navigation failed. Please click OK to refresh and try again.");
        window.location.reload();
      }
    }
  };
  
  return {
    handleContinue,
    isLoggedIn
  };
};
