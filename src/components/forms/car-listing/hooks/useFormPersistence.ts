
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of form persistence logic
 * - 2024-03-19: Added support for both local storage and backend persistence
 * - 2024-03-19: Implemented auto-save functionality
 * - 2024-08-08: Updated to save current step information
 */

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormToDbData, transformDbToFormData } from "../utils/formDataTransformers";
import { SAVE_DEBOUNCE_TIME } from "../constants";

export const useFormPersistence = (
  form: UseFormReturn<CarListingFormData>,
  userId?: string,
  currentStep: number = 0
) => {
  const { watch, setValue } = form;
  const formData = watch();

  // Save progress to both localStorage and backend
  useEffect(() => {
    const saveProgress = async () => {
      // Save to localStorage
      localStorage.setItem('formProgress', JSON.stringify(formData));
      localStorage.setItem('formCurrentStep', String(currentStep));

      // Save to backend if user is authenticated
      if (userId) {
        try {
          const dbData = transformFormToDbData(formData, userId);
          
          // Add the current step to the metadata
          dbData.form_metadata = {
            ...(dbData.form_metadata || {}),
            current_step: currentStep
          };

          const { error } = await supabase.from('cars').upsert(dbData);

          if (error) {
            console.error('Error saving draft:', error);
            toast.error("Failed to save draft", {
              description: "Your progress is saved locally but not synced to the cloud.",
              duration: 3000
            });
          }
        } catch (error) {
          console.error('Error saving draft:', error);
        }
      }
    };

    // Save progress every 30 seconds
    const intervalId = setInterval(saveProgress, SAVE_DEBOUNCE_TIME);

    // Save on unmount
    return () => {
      clearInterval(intervalId);
      saveProgress();
    };
  }, [formData, userId, currentStep]);

  // Restore progress on mount
  useEffect(() => {
    const restoreProgress = async () => {
      // First try to restore from backend if user is authenticated
      if (userId) {
        try {
          const { data: draftData, error } = await supabase
            .from('cars')
            .select('*')
            .eq('seller_id', userId)
            .eq('is_draft', true)
            .maybeSingle();

          if (!error && draftData) {
            const formValues = transformDbToFormData(draftData);
            Object.entries(formValues).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                setValue(key as keyof CarListingFormData, value as any, {
                  shouldValidate: false,
                  shouldDirty: false
                });
              }
            });
            
            // Restore the current step if it exists in metadata
            if (draftData.form_metadata?.current_step !== undefined) {
              localStorage.setItem('formCurrentStep', String(draftData.form_metadata.current_step));
            }
            
            return;
          }
        } catch (error) {
          console.error('Error restoring draft:', error);
        }
      }

      // Fallback to localStorage if no backend data or not authenticated
      const savedProgress = localStorage.getItem('formProgress');
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          Object.entries(parsed).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              setValue(key as keyof CarListingFormData, value as any, {
                shouldValidate: false,
                shouldDirty: false
              });
            }
          });
        } catch (error) {
          console.error('Error restoring form progress:', error);
          toast.error("Failed to restore saved progress", {
            description: "Please check if all fields are filled correctly.",
            duration: 5000
          });
        }
      }
    };

    restoreProgress();
  }, [setValue, userId]);
};
