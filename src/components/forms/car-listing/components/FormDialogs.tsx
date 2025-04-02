
/**
 * Form Dialogs component
 * - Extracted from FormContent.tsx to separate dialog management
 */
import { memo } from "react";
import { FormSaveDialog } from "../FormSaveDialog";
import { FormSuccessDialog } from "../FormSuccessDialog";

interface FormDialogsProps {
  showSuccessDialog: boolean;
  showSaveDialog: boolean;
  onSuccessDialogOpenChange: (open: boolean) => void;
  onSaveDialogOpenChange: (open: boolean) => void;
  lastSaved: Date | null;
  carId?: string;
}

export const FormDialogs = memo(({
  showSuccessDialog,
  showSaveDialog,
  onSuccessDialogOpenChange,
  onSaveDialogOpenChange,
  lastSaved,
  carId
}: FormDialogsProps) => {
  return (
    <>
      <FormSuccessDialog 
        open={showSuccessDialog}
        onOpenChange={onSuccessDialogOpenChange}
        carId={carId}
      />
      
      <FormSaveDialog
        open={showSaveDialog}
        onOpenChange={onSaveDialogOpenChange}
        lastSaved={lastSaved}
      />
    </>
  );
});

FormDialogs.displayName = 'FormDialogs';
