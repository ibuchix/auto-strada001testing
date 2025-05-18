
/**
 * ValuationActions component for displaying action buttons
 * Created: 2025-04-29
 * Updated: 2025-05-25 - Added processing state and improved button feedback
 * Updated: 2025-05-26 - Enhanced feedback mechanism and improved error logging
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ValuationActionsProps {
  isLoggedIn: boolean;
  onContinue: () => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export const ValuationActions: React.FC<ValuationActionsProps> = ({
  isLoggedIn,
  onContinue,
  onClose,
  isProcessing = false
}) => {
  // Add detailed logging for button clicks to help troubleshoot navigation issues
  const handleContinueClick = () => {
    console.log("ValuationActions: Continue button clicked", {
      isLoggedIn,
      isProcessing,
      timestamp: new Date().toISOString()
    });
    
    // Call the provided continue handler
    onContinue();
  };
  
  const handleCloseClick = () => {
    console.log("ValuationActions: Close button clicked");
    onClose();
  };
  
  return (
    <div className="mt-6">
      <Button 
        onClick={handleContinueClick}
        className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isLoggedIn ? "Processing..." : "Signing In..."}
          </span>
        ) : (
          isLoggedIn ? "Continue to Listing" : "Sign In to Continue"
        )}
      </Button>
      <button
        onClick={handleCloseClick}
        className="w-full mt-3 text-sm text-gray-600 hover:underline"
        disabled={isProcessing}
      >
        Cancel
      </button>
    </div>
  );
};
