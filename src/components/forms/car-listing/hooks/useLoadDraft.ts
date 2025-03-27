
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of draft loading functionality
 * - 2024-03-19: Added data validation and form population
 * - 2024-03-19: Implemented error handling for draft loading
 * - 2024-08-25: Fixed TypeScript type errors
 * - 2025-07-02: Fixed parameter types for proper TypeScript checking
 * - 2025-07-04: Updated to use options object pattern for better TypeScript support
 * - 2025-07-06: Added explicit parameter type to useLoadDraft function
 * - 2025-08-01: Added onLoaded callback for draft data
 * - 2025-08-02: Updated interface to match expected shape
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { transformDbToFormData } from "../utils/formDataTransformers";

export interface LoadDraftOptions {
  form: UseFormReturn<CarListingFormData>;
  userId: string;
  draftId?: string;
  onLoaded?: (draft: {
    carId: string;
    updatedAt: Date;
    data: CarListingFormData;
  }) => void;
}

interface UseLoadDraftResult {
  isLoading: boolean;
  error: Error | null;
}

// Updated draft loading hook with loading state and callback
export const useLoadDraft = (options: LoadDraftOptions): UseLoadDraftResult => {
  const { form, userId, draftId, onLoaded } = options;
  const [isLoading, setIsLoading] = useState(!!draftId);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!userId || !draftId) {
      setIsLoading(false);
      return;
    }

    const loadDraft = async () => {
      try {
        setIsLoading(true);
        const { data: draft, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', draftId)
          .eq('seller_id', userId)
          .single();

        if (error) {
          console.error("Error loading draft:", error);
          setError(new Error(error.message));
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

          if (onLoaded) {
            onLoaded({
              carId: draft.id,
              updatedAt: new Date(draft.updated_at || draft.created_at),
              data: formValues
            });
          }
          
          toast.success("Draft loaded successfully!");
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error loading draft:", error);
        setError(error);
        toast.error("Failed to load draft", {
          description: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [form, userId, draftId, onLoaded]);
  
  return { isLoading, error };
};
