
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for dialog footer buttons
 * - 2025-07-05: Fixed event handling to ensure proper propagation of click events
 * - 2025-07-06: Enhanced click handling for maximum reliability
 * - 2025-07-07: Completely isolated event handling to prevent interference from cache errors
 * - 2025-07-08: Updated type signature to fix TypeScript errors
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
  // Simplified direct handler to ensure click is captured properly
  const handleContinueClick = (e: React.MouseEvent) => {
    console.log('ValuationDialogFooter - handleContinueClick triggered');
    
    // Call onContinue directly, with no additional logic that could fail
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
