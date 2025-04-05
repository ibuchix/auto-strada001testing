
/**
 * Changes made:
 * - 2025-04-05: Simplified navigation to use a single, reliable approach
 * - Removed multiple fallback mechanisms and redundant state tracking
 * - Improved error handling with better user feedback
 */

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useState } from "react";

interface DirectNavigationButtonProps {
  valuationData: any;
  buttonText: string;
  isDisabled?: boolean;
}

export const DirectNavigationButton = ({
  valuationData,
  buttonText,
  isDisabled = false
}: DirectNavigationButtonProps) => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isOffline } = useOfflineStatus();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const handleNavigation = () => {
    // Prevent multiple clicks
    if (isNavigating) return;
    setIsNavigating(true);
    
    // Check for offline status
    if (isOffline) {
      toast.warning("You appear to be offline", {
        description: "Please connect to the internet to continue.",
        duration: 5000
      });
      setIsNavigating(false);
      return;
    }
    
    try {
      // Store data in localStorage for reliability
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
      localStorage.setItem('tempVIN', valuationData.vin || '');
      localStorage.setItem('tempMileage', valuationData.mileage?.toString() || '');
      localStorage.setItem('tempGearbox', valuationData.transmission || '');
      
      if (!session) {
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
      setIsNavigating(false);
    }
  };
  
  return (
    <Button
      onClick={handleNavigation}
      disabled={isDisabled || isNavigating}
      className="w-full sm:w-auto"
    >
      {isNavigating ? "Processing..." : buttonText}
    </Button>
  );
};
