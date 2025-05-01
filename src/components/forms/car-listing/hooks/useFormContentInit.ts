
/**
 * Changes made:
 * - 2024-06-10: Extracted initialization logic from FormContent.tsx
 * - Created a specialized hook for form content initialization and setup
 * - 2025-05-31: Added fromValuation prop to initialization options
 */

import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useLoadDraft, LoadDraftOptions } from "./useLoadDraft";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

interface UseFormContentInitProps {
  session: Session;
  form: UseFormReturn<CarListingFormData>;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}

export const useFormContentInit = ({
  session,
  form,
  draftId,
  onDraftError,
  retryCount = 0,
  fromValuation = false
}: UseFormContentInitProps) => {
  const [state, setState] = useState({
    isInitializing: true,
    carId: undefined as string | undefined,
    lastSaved: null as Date | null,
    draftLoadError: null as Error | null
  });

  const handleDraftError = useCallback((error: Error) => {
    console.error("Draft loading error:", error);
    setState(prev => ({ ...prev, draftLoadError: error }));
    
    if (onDraftError) {
      onDraftError(error);
    }
  }, [onDraftError]);

  const loadDraftOptions: LoadDraftOptions = {
    form,
    userId: session.user.id,
    draftId,
    retryCount,
    onLoaded: (draft) => {
      setState(prev => ({ 
        ...prev, 
        carId: draft.carId, 
        lastSaved: draft.updatedAt,
        draftLoadError: null 
      }));
    },
    onError: handleDraftError
  };

  const { isLoading: isLoadingDraft, error } = useLoadDraft(loadDraftOptions);

  const resetDraftError = useCallback(() => {
    setState(prev => ({ ...prev, draftLoadError: null }));
  }, []);

  useEffect(() => {
    if (retryCount > 0) {
      resetDraftError();
    }
  }, [retryCount, resetDraftError]);

  const handleFormError = useCallback((error: Error) => {
    console.error("Form error caught by boundary:", error);
    toast.error("An error occurred while loading the form", {
      description: "Please try refreshing the page"
    });
  }, []);

  // If there's valuation data, we could add code here to pre-populate the form
  // This is where we'd use the fromValuation flag to implement special handling

  return {
    isLoadingDraft,
    draftError: state.draftLoadError,
    carId: state.carId,
    lastSaved: state.lastSaved,
    resetDraftError,
    handleFormError
  };
};
