
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
 * - 2025-08-04: Fixed type issues with draft data
 * - 2025-09-15: Added abort controller for cancellable requests
 * - 2025-09-15: Improved validation with validateDraft function
 * - 2025-09-15: Implemented batched form updates for better performance
 * - 2025-11-02: Fixed Error constructor parameters to avoid using ES2022 features
 */

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CarListingFormData, CarEntity } from "@/types/forms";
import { transformDbToFormData } from "../utils/formDataTransformers";

type DraftData = {
  carId: string;
  updatedAt: Date;
  formData: Partial<CarListingFormData>;
};

export interface LoadDraftOptions {
  form: UseFormReturn<CarListingFormData>;
  userId: string;
  draftId?: string;
  onLoaded?: (data: DraftData) => void;
  onError?: (error: Error) => void;
}

export interface UseLoadDraftResult {
  isLoading: boolean;
  error: Error | null;
}

const validateDraft = (draft: unknown): draft is CarEntity => {
  return !!draft && typeof draft === 'object' && 
         'id' in draft && 
         'seller_id' in draft &&
         'created_at' in draft;
};

// Updated draft loading hook with loading state and callback
export const useLoadDraft = (options: LoadDraftOptions): UseLoadDraftResult => {
  const { form, userId, draftId, onLoaded, onError } = options;
  const [state, setState] = useState<UseLoadDraftResult>({ 
    isLoading: !!draftId, 
    error: null 
  });

  useEffect(() => {
    if (!draftId || !userId) return;

    const abortController = new AbortController();

    const loadDraft = async () => {
      setState({ isLoading: true, error: null });

      try {
        const { data: draft, error } = await supabase
          .from('cars')
          .select<string, CarEntity>('*')
          .eq('id', draftId)
          .eq('seller_id', userId)
          .abortSignal(abortController.signal)
          .single();

        if (error) throw error;
        if (!validateDraft(draft)) throw new Error('Invalid draft data');

        const formData = transformDbToFormData(draft);

        // Batch form updates
        form.reset({
          ...form.getValues(),
          ...formData
        });

        if (onLoaded) {
          onLoaded({
            carId: draft.id,
            updatedAt: new Date(draft.updated_at ?? draft.created_at),
            formData
          });
        }

        toast.success("Draft loaded successfully!");
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const draftError = new Error(`Failed to load draft: ${message}`);
        
        // ES2022 cause compatibility fix - store error reference without using the cause property
        Object.defineProperty(draftError, '_originalError', {
          value: error,
          enumerable: false
        });
        
        setState(prev => ({ ...prev, error: draftError }));
        onError?.(draftError);
        
        // Only show error toast if it's not due to abort
        if (!(error instanceof Error && error.name === 'AbortError')) {
          toast.error("Failed to load draft", {
            description: "Please check your connection and try again.",
          });
        }
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadDraft();
    return () => abortController.abort();
  }, [draftId, userId, form, onLoaded, onError]);

  return state;
};
