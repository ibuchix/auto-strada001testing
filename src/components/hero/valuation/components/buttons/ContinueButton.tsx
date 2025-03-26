
/**
 * Changes made:
 * - 2025-12-05: Updated props to remove unnecessary values
 */

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

export interface ContinueButtonProps {
  isLoggedIn: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

export const ContinueButton = ({ 
  isLoggedIn, 
  onClick,
  isLoading = false 
}: ContinueButtonProps) => {
  const navigate = useNavigate();
  
  // Create a new diagnostic ID when navigating to sell-my-car
  const handleContinue = () => {
    // Log diagnostic event
    const diagnosticId = crypto.randomUUID();
    try {
      logDiagnostic(
        'CONTINUE_BUTTON_CLICK', 
        'User clicked continue button in valuation dialog',
        {
          isLoggedIn,
          timestamp: new Date().toISOString(),
          storedValuationData: localStorage.getItem('valuationData') ? 'present' : 'missing',
          tempVIN: localStorage.getItem('tempVIN'),
          tempMileage: localStorage.getItem('tempMileage')
        },
        diagnosticId
      );
    } catch (error) {
      console.error('Failed to log diagnostic event:', error);
    }
    
    // Call the provided onClick handler
    onClick();
  };
  
  return (
    <Button 
      onClick={handleContinue}
      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        isLoggedIn ? "Continue to Listing" : "Sign In to Continue"
      )}
    </Button>
  );
};
