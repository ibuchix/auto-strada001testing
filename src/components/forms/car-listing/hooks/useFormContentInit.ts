
/**
 * Changes made:
 * - 2024-06-10: Extracted initialization logic from FormContent.tsx
 * - Created a specialized hook for form content initialization and setup
 * - 2025-05-31: Added fromValuation prop to initialization options
 * - 2025-06-01: Implemented loading valuation data during initialization
 * - 2025-06-02: Fixed LoadDraftOptions interface reference
 * - 2025-05-23: Fixed loading draft options to use proper options format
 */

import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useLoadDraft } from "./useLoadDraft";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

interface FormContentInitOptions {
  session: Session;
  form: UseFormReturn<CarListingFormData>;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}

// Interface to match what useLoadDraft accepts
interface LoadDraftOptions {
  userId: string;
  draftId?: string;
  retryCount?: number;
  onLoaded?: (draft: any) => void;
  onError?: (error: Error) => void;
}

export const useFormContentInit = ({
  session,
  form,
  draftId,
  onDraftError,
  retryCount = 0,
  fromValuation = false
}: FormContentInitOptions) => {
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

  // Prepare options for useLoadDraft
  const loadOptions: LoadDraftOptions = {
    userId: session.user.id,
    draftId,
    retryCount,
    onLoaded: (draft: any) => {
      setState(prev => ({ 
        ...prev, 
        carId: draft.carId, 
        lastSaved: draft.updatedAt,
        draftLoadError: null 
      }));
    },
    onError: handleDraftError
  };

  // Pass form separately when calling useLoadDraft
  const { isLoading: isLoadingDraft, error } = useLoadDraft(loadOptions, form);

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

  // Load valuation data into form if coming from valuation
  useEffect(() => {
    if (fromValuation && !draftId) {
      try {
        // Try to get valuation data from localStorage
        const valuationDataStr = localStorage.getItem('valuationData');
        
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          console.log("Loading form with valuation data:", {
            make: valuationData.make,
            model: valuationData.model,
            vin: valuationData.vin ? valuationData.vin.substring(0, 4) + '...' : undefined
          });
          
          // Pre-populate form with valuation data
          if (valuationData.vin) form.setValue('vin', valuationData.vin);
          if (valuationData.make) form.setValue('make', valuationData.make);
          if (valuationData.model) form.setValue('model', valuationData.model);
          if (valuationData.year) form.setValue('year', valuationData.year);
          if (valuationData.mileage) form.setValue('mileage', valuationData.mileage);
          if (valuationData.transmission) form.setValue('transmission', 
            valuationData.transmission === 'manual' || valuationData.transmission === 'automatic' 
              ? valuationData.transmission 
              : undefined
          );
          
          // Show success message
          toast.success("Vehicle data loaded from valuation", {
            description: `${valuationData.year || ''} ${valuationData.make || ''} ${valuationData.model || ''}`.trim()
          });
        }
      } catch (err) {
        console.error("Error loading valuation data:", err);
      }
    }
  }, [fromValuation, form, draftId]);

  return {
    isLoadingDraft,
    draftError: state.draftLoadError,
    carId: state.carId,
    lastSaved: state.lastSaved,
    resetDraftError,
    handleFormError
  };
};
