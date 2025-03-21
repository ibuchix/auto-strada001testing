
/**
 * Changes made:
 * - 2025-07-04: Created dedicated component for dialog footer buttons
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
        onClick={onContinue}
      />
    </UIDialogFooter>
  );
};
