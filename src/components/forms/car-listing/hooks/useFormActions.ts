
/**
 * Changes made:
 * - 2024-06-20: Extracted form action handlers from FormContent.tsx
 * - Created a custom hook to manage form actions (save, submit)
 */

import { useCallback } from "react";
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
  
  // Handle form submission
  const onSubmit = useCallback(
    async (data: CarListingFormData, carId?: string) => {
      try {
        await handleFormSubmit(data, carId);
        showSuccessDialog();
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [handleFormSubmit, showSuccessDialog]
  );

  // Handle save and continue action
  const handleSaveAndContinue = useCallback(async () => {
    try {
      await saveImmediately();
      showSaveDialog();
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [saveImmediately, showSaveDialog]);

  // Handle save action
  const handleSave = useCallback(async () => {
    try {
      await saveImmediately();
    } catch (error) {
      console.error("Error saving form:", error);
    }
  }, [saveImmediately]);
  
  return {
    onSubmit,
    handleSaveAndContinue,
    handleSave
  };
};
