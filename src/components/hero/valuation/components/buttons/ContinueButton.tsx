
/**
 * Fixed import for diagnostic utilities
 */

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ValuationData } from "../../types";
import { generateDiagnosticId, logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface ContinueButtonProps {
  valuationResult: ValuationData;
  mileage: number;
  isLoggedIn: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

export const ContinueButton = ({
  valuationResult,
  mileage,
  isLoggedIn,
  onClick,
  isLoading = false
}: ContinueButtonProps) => {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);
  
  const handleClick = () => {
    // Already clicked, just waiting
    if (isClicked) return;
    
    setIsClicked(true);
    const diagnosticId = generateDiagnosticId();
    
    // Log the start of navigation
    logDiagnostic('CONTINUE_CLICK', 'User clicked continue', {
      valuationResult,
      mileage,
      isLoggedIn,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }, diagnosticId);
    
    // Call the onClick handler
    onClick();
    
    // Set up a fallback direct URL navigation in case the onClick handler doesn't navigate
    setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        logDiagnostic('FALLBACK_NAVIGATION', 'Using fallback direct URL navigation', {
          timestamp: new Date().toISOString()
        }, diagnosticId);
        
        // If logged in, go to sell-my-car, otherwise go to auth
        const targetUrl = isLoggedIn
          ? `/sell-my-car?diagnostic=${diagnosticId}&from=valuation&emergency=true`
          : `/auth?diagnostic=${diagnosticId}&from=valuation&redirect=sell-my-car`;
          
        navigate(targetUrl);
      }
    }, 2000);
  };
  
  return (
    <Button
      onClick={handleClick}
      className="bg-primary text-white font-bold w-full py-3 text-base"
      disabled={isLoading || isClicked}
    >
      {isLoading || isClicked ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isLoggedIn ? "Preparing Listing..." : "Redirecting..."}
        </>
      ) : (
        isLoggedIn ? "List This Car" : "Continue to Sign In"
      )}
    </Button>
  );
};
