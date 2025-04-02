
/**
 * Changes made:
 * - 2028-11-12: Extracted dialog management logic from FormContent.tsx
 */

import { useState } from "react";

interface UseFormDialogsProps {
  initialState?: {
    showSaveDialog: boolean;
    showSuccessDialog: boolean;
  }
}

export const useFormDialogs = (props?: UseFormDialogsProps) => {
  const [dialogState, setDialogState] = useState({
    showSaveDialog: props?.initialState?.showSaveDialog || false,
    showSuccessDialog: props?.initialState?.showSuccessDialog || false
  });

  const showSaveDialog = () => {
    setDialogState(prev => ({ ...prev, showSaveDialog: true }));
  };

  const hideSaveDialog = () => {
    setDialogState(prev => ({ ...prev, showSaveDialog: false }));
  };

  const showSuccessDialog = () => {
    setDialogState(prev => ({ ...prev, showSuccessDialog: true }));
  };

  const hideSuccessDialog = () => {
    setDialogState(prev => ({ ...prev, showSuccessDialog: false }));
  };

  return {
    showSaveDialog: dialogState.showSaveDialog,
    showSuccessDialog: dialogState.showSuccessDialog,
    actions: {
      showSaveDialog,
      hideSaveDialog,
      showSuccessDialog,
      hideSuccessDialog
    }
  };
};
