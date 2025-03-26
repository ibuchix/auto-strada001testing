
/**
 * Changes made:
 * - Removed diagnostic-related code
 */

import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

export const ContinueButton = ({ isLoggedIn, onClick, isLoading: externalLoading }: ContinueButtonProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Advanced click handler with forced loading state and direct URL navigation
  const handleButtonClick = useCallback(() => {
    console.log("ContinueButton: Button clicked");
    
    // CRITICAL: Set loading state IMMEDIATELY to give user feedback
    setIsNavigating(true);
    
    // Show loading toast to provide additional user feedback
    toast.loading(isLoggedIn ? "Preparing listing form..." : "Preparing sign in...", {
      id: "navigation-toast",
      duration: 3000
    });
    
    // Capture onClick attempt
    try {
      console.log("ContinueButton: Calling original onClick handler");
      onClick();
      console.log("ContinueButton: Original onClick handler completed");
    } catch (err) {
      console.error("ContinueButton: Error in original onClick handler", err);
    }
    
    // CRITICAL: Use DIRECT URL NAVIGATION instead of React Router
    // This bypasses any potential React Router or state management issues
    setTimeout(() => {
      console.log("ContinueButton: Starting direct URL navigation");
      
      if (isLoggedIn) {
        window.location.href = `/sell-my-car`;
      } else {
        window.location.href = `/auth`; 
      }
    }, 100); // Increased timeout to ensure onClick completes first
  }, [onClick, isLoggedIn]);

  // Use either external loading state or internal navigating state
  const isButtonLoading = externalLoading || isNavigating;

  return (
    <Button 
      onClick={handleButtonClick}
      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
      type="button"
      id="list-car-button"
      data-testid="list-car-button"
      disabled={isButtonLoading} // Prevent double clicks
    >
      {isButtonLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isLoggedIn ? "Loading..." : "Redirecting..."}
        </span>
      ) : (
        !isLoggedIn 
          ? "Sign Up to List Your Car" 
          : "List This Car"
      )}
    </Button>
  );
};
