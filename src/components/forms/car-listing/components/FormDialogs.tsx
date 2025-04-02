
/**
 * Changes made:
 * - 2024-06-10: Extracted dialog components from FormContent.tsx
 * - Created a dedicated component for form dialogs
 */

import { SuccessDialog } from "../SuccessDialog";
import { SaveProgressDialog } from "../SaveProgressDialog";

interface FormDialogsProps {
  showSuccessDialog: boolean;
  showSaveDialog: boolean;
  onSuccessDialogOpenChange: (open: boolean) => void;
  onSaveDialogOpenChange: (open: boolean) => void;
  lastSaved: Date | null;
  carId?: string;
}

export const FormDialogs = ({
  showSuccessDialog,
  showSaveDialog,
  onSuccessDialogOpenChange,
  onSaveDialogOpenChange,
  lastSaved,
  carId
}: FormDialogsProps) => {
  return (
    <>
      <SuccessDialog 
        open={showSuccessDialog}
        onOpenChange={onSuccessDialogOpenChange}
        lastSaved={lastSaved}
        carId={carId}
      />
      
      <SaveProgressDialog
        open={showSaveDialog}
        onOpenChange={onSaveDialogOpenChange}
        draftId={carId}
      />
    </>
  );
};
