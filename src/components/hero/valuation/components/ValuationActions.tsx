
/**
 * ValuationActions component for displaying action buttons
 * Created: 2025-04-29
 */

import React from "react";
import { Button } from "@/components/ui/button";

interface ValuationActionsProps {
  isLoggedIn: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export const ValuationActions: React.FC<ValuationActionsProps> = ({
  isLoggedIn,
  onContinue,
  onClose
}) => {
  return (
    <div className="mt-6">
      <Button 
        onClick={onContinue}
        className="w-full"
        variant="default"
      >
        {isLoggedIn ? "Continue to Listing" : "Sign In to Continue"}
      </Button>
      <button
        onClick={onClose}
        className="w-full mt-3 text-sm text-gray-600 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
};
