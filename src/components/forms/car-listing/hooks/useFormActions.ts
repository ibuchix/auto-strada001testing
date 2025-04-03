
/**
 * Changes made:
 * - 2024-06-20: Extracted form action handlers from FormContent.tsx
 * - Created a custom hook to manage form actions (save, submit)
 * - 2024-08-10: Enhanced memoization for action handlers
 * - Added stable function references for form actions
 * - 2025-04-03: Fixed return type of handleFormSubmit to be Promise<void> instead of Promise<boolean>
 */

import { useCallback, useMemo } from "react";
import { CarListingFormData } from "@/types/forms";

interface UseFormActionsProps {
  handleFormSubmit: (data: CarListingFormData, carId?: string) => Promise<void>;
  saveImmediately: () => Promise<void>;
  showSaveDialog: () => void;
  showSuccessDialog: () => void;
}

export const useFormActions = ({
  handleFormSubmit,
  saveImmediately,
  showSaveDialog,
  showSuccessDialog
}: UseFormActionsProps) => {
  // Create stable references to input props
  const actionProps = useMemo(() => ({
    handleFormSubmit,
    saveImmediately,
    showSaveDialog,
    showSuccessDialog
  }), [handleFormSubmit, saveImmediately, showSaveDialog, showSuccessDialog]);
  
  // Handle form submission with stable identity
  const onSubmit = useCallback(
    async (data: CarListingFormData, carId?: string) => {
      try {
        await actionProps.handleFormSubmit(data, carId);
        actionProps.showSuccessDialog();
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [actionProps]
  );

  // Handle save and continue action with stable identity
  const handleSaveAndContinue = useCallback(async () => {
    try {
      await actionProps.saveImmediately();
      actionProps.showSaveDialog();
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [actionProps]);

  // Handle save action with stable identity
  const handleSave = useCallback(async () => {
    try {
      await actionProps.saveImmediately();
    } catch (error) {
      console.error("Error saving form:", error);
    }
  }, [actionProps]);
  
  // Return stable object reference
  return useMemo(() => ({
    onSubmit,
    handleSaveAndContinue,
    handleSave
  }), [onSubmit, handleSaveAndContinue, handleSave]);
};
