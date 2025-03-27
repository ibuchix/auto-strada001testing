
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of draft loading functionality
 * - 2024-03-19: Added data validation and form population
 * - 2024-03-19: Implemented error handling for draft loading
 * - 2024-08-25: Fixed TypeScript type errors
 * - 2025-07-02: Fixed parameter types for proper TypeScript checking
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { transformDbToFormData } from "../utils/formDataTransformers";

type SetStateFunction<T> = (value: T) => void;

export const useLoadDraft = (
  form: UseFormReturn<CarListingFormData>,
  setCarId: SetStateFunction<string | undefined>,
  setLastSaved: SetStateFunction<Date | null>,
  userId: string,
  draftId?: string
) => {
  useEffect(() => {
    if (!userId || !draftId) return;

    const loadDraft = async () => {
      try {
        const { data: draft, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', draftId)
          .eq('seller_id', userId)
          .single();

        if (error) {
          console.error("Error loading draft:", error);
          toast.error("Failed to load draft", {
            description: "Please check your connection and try again.",
          });
          return;
        }

        if (draft) {
          const formValues = transformDbToFormData(draft);
          Object.keys(formValues).forEach((key) => {
            const value = formValues[key as keyof CarListingFormData];
            if (value !== undefined) {
              form.setValue(key as any, value as any, {
                shouldValidate: false,
                shouldDirty: true,
                shouldTouch: false,
              });
            }
          });

          setCarId(draft.id);
          setLastSaved(new Date(draft.updated_at || draft.created_at));
          toast.success("Draft loaded successfully!");
        }
      } catch (error) {
        console.error("Error loading draft:", error);
        toast.error("Failed to load draft", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    };

    loadDraft();
  }, [form, userId, draftId, setCarId, setLastSaved]);
};
