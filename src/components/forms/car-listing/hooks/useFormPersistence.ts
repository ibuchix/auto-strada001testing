import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformFormToDbData, transformDbToFormData } from "../utils/formDataTransformers";

export const useFormPersistence = (
  form: UseFormReturn<CarListingFormData>,
  userId?: string
) => {
  const { watch, setValue } = form;
  const formData = watch();

  // Save progress to both localStorage and backend
  useEffect(() => {
    const saveProgress = async () => {
      // Save to localStorage
      localStorage.setItem('formProgress', JSON.stringify(formData));

      // Save to backend if user is authenticated
      if (userId) {
        try {
          const dbData = transformFormToDbData(formData, userId);
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
    const intervalId = setInterval(saveProgress, 30000);

    // Save on unmount
    return () => {
      clearInterval(intervalId);
      saveProgress();
    };
  }, [formData, userId]);

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