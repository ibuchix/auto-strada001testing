
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for dialog footer buttons
 * - 2025-07-05: Fixed event handling to ensure proper propagation of click events
 */

import { Button } from "@/components/ui/button";
import { DialogFooter as UIDialogFooter } from "@/components/ui/dialog";
import { ContinueButton } from "../buttons/ContinueButton";

interface FooterProps {
  isLoggedIn: boolean;
  onClose: () => void;
  onContinue: (e: React.MouseEvent) => void;
}

export const ValuationDialogFooter = ({ 
  isLoggedIn, 
  onClose, 
  onContinue 
}: FooterProps) => {
  // Enhanced click handler to ensure proper event handling
  const handleContinueClick = (e: React.MouseEvent) => {
    console.log('ValuationDialogFooter - handleContinueClick triggered');
    // Ensure the event propagates correctly
    onContinue(e);
  };
  
  return (
    <UIDialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
      <Button 
        variant="outline"
        onClick={onClose}
        className="w-full sm:w-auto"
      >
        Close
      </Button>
      <ContinueButton 
        isLoggedIn={isLoggedIn}
        onClick={handleContinueClick}
      />
    </UIDialogFooter>
  );
};
