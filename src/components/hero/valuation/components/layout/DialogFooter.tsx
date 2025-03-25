
/**
 * Changes made:
 * - 2025-07-04: Created component for valuation dialog footer
 * - 2026-04-15: Enhanced with better action handling and improved feedback
 */

import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ValuationDialogFooterProps {
  isLoggedIn: boolean;
  isProcessing?: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const ValuationDialogFooter = ({
  isLoggedIn,
  isProcessing = false,
  onClose,
  onContinue
}: ValuationDialogFooterProps) => {
  const [clickedContinue, setClickedContinue] = useState(false);
  
  // Reset clicked state when dialog changes
  useEffect(() => {
    return () => setClickedContinue(false);
  }, []);
  
  const handleContinueClick = () => {
    setClickedContinue(true);
    onContinue();
  };
  
  return (
    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
      <Button 
        variant="outline"
        onClick={onClose}
        disabled={isProcessing}
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button 
        onClick={handleContinueClick}
        disabled={isProcessing || clickedContinue}
        className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
      >
        {isLoggedIn ? "List This Car" : "Sign In to Continue"}
      </Button>
    </DialogFooter>
  );
};
