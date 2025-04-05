
/**
 * DirectNavigationButton
 * - Created 2025-04-12: A simplified navigation button for reliable form transitions
 * - Updated 2025-04-05: Consolidated navigation logic to a single approach
 */

import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DirectNavigationButtonProps {
  isLoggedIn: boolean;
  valuationData: any;
  buttonText: string;
  className?: string;
  isDisabled?: boolean;
}

export const DirectNavigationButton = ({ 
  isLoggedIn, 
  valuationData, 
  buttonText,
  className = "w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white",
  isDisabled = false
}: DirectNavigationButtonProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  
  const handleNavigate = useCallback(() => {
    // Prevent multiple clicks
    if (isNavigating) return;
    
    // Set loading state immediately for user feedback
    setIsNavigating(true);
    
    // Store data in localStorage for access in the car listing form
    try {
      // Store the complete valuation data
      localStorage.setItem("valuationData", JSON.stringify(valuationData));
      
      // Store individual fields for maximum compatibility with existing code
      if (valuationData.make) localStorage.setItem("tempMake", valuationData.make);
      if (valuationData.model) localStorage.setItem("tempModel", valuationData.model);
      if (valuationData.year) localStorage.setItem("tempYear", valuationData.year.toString());
      if (valuationData.vin) localStorage.setItem("tempVIN", valuationData.vin);
      if (valuationData.mileage) localStorage.setItem("tempMileage", valuationData.mileage.toString());
      if (valuationData.transmission) localStorage.setItem("tempGearbox", valuationData.transmission);
      
      // Add timestamp
      localStorage.setItem("navigationTimestamp", new Date().toISOString());
    } catch (error) {
      console.error('Failed to store valuation data:', error);
      // Continue anyway - navigation is still possible
    }
    
    // Show a loading toast for user feedback
    toast.loading(
      isLoggedIn ? "Preparing listing form..." : "Redirecting to sign in...", 
      { id: "navigation-toast", duration: 3000 }
    );
    
    // Determine target URL
    const targetUrl = isLoggedIn ? '/sell-my-car' : '/auth';
    
    // Use direct URL navigation for maximum reliability
    window.location.href = `${targetUrl}?from=valuation&direct=true`;
  }, [isNavigating, isLoggedIn, valuationData]);

  return (
    <Button 
      onClick={handleNavigate}
      className={className}
      type="button"
      disabled={isDisabled || isNavigating}
      data-testid="direct-navigation-button"
    >
      {isNavigating ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isLoggedIn ? "Loading..." : "Redirecting..."}
        </span>
      ) : (
        buttonText || (isLoggedIn ? "List This Car" : "Sign Up to List Your Car")
      )}
    </Button>
  );
};
