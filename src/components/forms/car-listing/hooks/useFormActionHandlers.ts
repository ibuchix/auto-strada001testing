
/**
 * Form Action Handlers Hook
 * - Created 2025-04-09: Extracted from FormContent.tsx to centralize form actions
 * - Handles form actions like save, continue, and submit
 */

import { useCallback } from "react";
import { toast } from "sonner";

interface FormActionHandlersConfig {
  handleSubmit: (data: any, carId?: string) => Promise<any>;
  saveProgress: () => Promise<boolean>;
  showSaveDialog: () => void;
  showSuccessDialog: () => void;
}

export const useFormActionHandlers = ({
  handleSubmit,
  saveProgress,
  showSaveDialog,
  showSuccessDialog
}: FormActionHandlersConfig) => {
  
  // Submit handler
  const onSubmit = useCallback(async (data: any, carId?: string) => {
    try {
      const result = await handleSubmit(data, carId);
      if (result.success) {
        showSuccessDialog();
        return result;
      } else {
        toast.error("Failed to submit listing", {
          description: result.error?.message || "Please try again"
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred during submission");
      return { success: false, error };
    }
  }, [handleSubmit, showSuccessDialog]);
  
  // Save and continue handler
  const handleSaveAndContinue = useCallback(async () => {
    try {
      const saved = await saveProgress();
      if (saved) {
        toast.success("Progress saved successfully");
      } else {
        toast.error("Failed to save progress");
      }
    } catch (error) {
      console.error("Save and continue error:", error);
      toast.error("An error occurred while saving");
    }
  }, [saveProgress]);
  
  // Save handler
  const handleSave = useCallback(async () => {
    try {
      const saved = await saveProgress();
      if (saved) {
        showSaveDialog();
      } else {
        toast.error("Failed to save progress");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving");
    }
  }, [saveProgress, showSaveDialog]);
  
  return {
    onSubmit,
    handleSaveAndContinue,
    handleSave
  };
};
