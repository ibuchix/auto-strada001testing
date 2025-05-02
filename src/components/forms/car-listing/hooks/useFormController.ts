
/**
 * Form Controller Hook
 * Centralized control of form initialization, state management, and submission
 * 
 * Changes made:
 * - 2025-06-04: Added auto-save control methods
 * - 2025-06-04: Improved error handling
 * - 2025-06-04: Added timestamp logging for form actions
 * - 2025-06-05: Fixed TypeScript type errors and improved type safety
 * - 2025-06-06: Fixed JSON parsing with safe type handling
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useForm, FormState } from "react-hook-form";
import { CarListingFormData, defaultCarFeatures } from "@/types/forms";
import { defaultValues } from "../constants/defaultValues";
import { Session } from "@supabase/supabase-js";
import { useFormPersistence } from "./useFormPersistence";
import { supabase } from "@/integrations/supabase/client";
import { clearSaveCache } from "../utils/formSaveUtils";

// Helper for safe JSON parsing
const safeJsonParse = (value: any, fallback: any) => {
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
};

interface UseFormControllerProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}

export const useFormController = ({
  session,
  draftId,
  onDraftError,
  retryCount = 0,
  fromValuation = false
}: UseFormControllerProps) => {
  // Form initialization time for tracking
  const initTime = useMemo(() => new Date(), []);
  
  // Initialize form with default values
  const form = useForm<CarListingFormData>({
    defaultValues: {
      ...defaultValues,
      seller_id: session?.user?.id,
    },
  });

  // Form state management
  const [formState, setFormState] = useState({
    isInitializing: true,
    carId: draftId || null,
    currentStep: 0,
    totalSteps: 5,
    lastSaved: null as Date | null,
    valuationData: null as any
  });

  // Loading state for draft data
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId);
  const [draftError, setDraftError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use form persistence hook for auto-saving
  const persistence = useFormPersistence({
    form,
    userId: session.user.id,
    carId: formState.carId || undefined,
    currentStep: formState.currentStep
  });
  
  // Initial data loading
  useEffect(() => {
    // Start loading data
    const loadInitialData = async () => {
      try {
        // Attempt to load the draft if we have a draft ID
        if (draftId) {
          await loadDraftData(draftId);
        } 
        // Check for valuation data if this is a form from valuation
        else if (fromValuation) {
          await loadValuationData();
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setFormState(prev => ({
          ...prev,
          isInitializing: false
        }));
      }
    };

    loadInitialData();
  }, [draftId, fromValuation, retryCount]);

  // Load draft data from Supabase with safer type handling
  const loadDraftData = async (id: string) => {
    try {
      setIsLoadingDraft(true);
      setDraftError(null);
      
      console.log(`Loading draft with ID: ${id}`);
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .eq("seller_id", session.user.id)
        .single();

      if (error) throw new Error(`Failed to load draft: ${error.message}`);
      if (!data) throw new Error("Draft not found");
      
      console.log("Draft loaded successfully", {
        id: data.id,
        make: data.make,
        model: data.model
      });
      
      // Safely extract form metadata
      let currentStep = 0;
      let formMetadata = {};
      
      // Handle form_metadata with safer type checking
      if (data.form_metadata) {
        // Parse it if it's a string
        const metadataObj = safeJsonParse(data.form_metadata, { currentStep: 0 });
        // Extract currentStep with fallback
        currentStep = typeof metadataObj === 'object' && metadataObj !== null && 
                      'currentStep' in metadataObj ? 
                      Number(metadataObj.currentStep) || 0 : 0;
        formMetadata = metadataObj;
      }
      
      // Handle features with safer type checking
      let features = defaultCarFeatures;
      if (data.features) {
        features = safeJsonParse(data.features, defaultCarFeatures);
      }
      
      // Convert database data to form data with proper type handling
      const formData: CarListingFormData = {
        ...data as any,
        features: features,
        form_metadata: formMetadata
      };
      
      // Update form with draft data
      form.reset(formData);
      
      // Check for valuation data with safer handling
      let valuationData = null;
      if (data.valuation_data) {
        valuationData = safeJsonParse(data.valuation_data, null);
      }
      
      // Update form state
      setFormState(prev => ({
        ...prev,
        carId: data.id,
        currentStep: currentStep,
        lastSaved: data.updated_at ? new Date(data.updated_at) : null,
        valuationData: valuationData
      }));
      
    } catch (error) {
      console.error("Error loading draft:", error);
      setDraftError(error instanceof Error ? error : new Error("Failed to load draft"));
      
      if (onDraftError) {
        onDraftError(error instanceof Error ? error : new Error("Failed to load draft"));
      }
    } finally {
      setIsLoadingDraft(false);
    }
  };
  
  // Load valuation data from localStorage if available
  const loadValuationData = async () => {
    try {
      const valuationDataStr = localStorage.getItem("valuationData");
      if (!valuationDataStr) return;
      
      const valuationData = JSON.parse(valuationDataStr);
      console.log("Loading form with valuation data:", valuationData);
      
      // Update form with valuation data
      if (valuationData.vin) form.setValue("vin", valuationData.vin);
      if (valuationData.make) form.setValue("make", valuationData.make);
      if (valuationData.model) form.setValue("model", valuationData.model);
      if (valuationData.year) form.setValue("year", valuationData.year);
      if (valuationData.mileage) form.setValue("mileage", Number(valuationData.mileage));
      
      // Store the valuation data for later use
      form.setValue("valuation_data", valuationData);
      
      setFormState(prev => ({
        ...prev,
        valuationData
      }));
      
    } catch (error) {
      console.error("Error loading valuation data:", error);
    }
  };
  
  // Reset draft error state
  const resetDraftError = useCallback(() => {
    setDraftError(null);
  }, []);

  // Update form state with partial data
  const updateFormState = useCallback((newState: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...newState }));
  }, []);
  
  // Submit the final form data
  const handleSubmit = useCallback(async (data: CarListingFormData, carId?: string) => {
    try {
      setIsSubmitting(true);
      
      // Prepare the final data for submission
      const finalData = {
        ...data,
        is_draft: false, // Mark as not a draft
        submitted_at: new Date().toISOString(),
        form_metadata: {
          ...data.form_metadata,
          submittedAt: new Date().toISOString(),
          completedSteps: Array.from({ length: formState.totalSteps }, (_, i) => i),
        }
      };
      
      console.log("Submitting form data", {
        carId,
        make: finalData.make,
        model: finalData.model
      });
      
      // Save the final data
      const { data: result, error } = await supabase
        .from("cars")
        .upsert({
          ...(carId ? { id: carId } : {}),
          ...finalData,
          seller_id: session.user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Show success message
      toast.success("Listing submitted successfully", {
        description: "Your car listing has been submitted and will be reviewed shortly."
      });
      
      // Clear the save cache after successful submission
      clearSaveCache(session.user.id, carId);
      
      // Remove valuation data from localStorage
      localStorage.removeItem("valuationData");
      
      return { success: true, carId: result.id };
    } catch (error: any) {
      console.error("Error submitting form:", error);
      
      toast.error("Failed to submit listing", {
        description: error.message || "Please try again"
      });
      
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  }, [formState.totalSteps, session.user.id]);
  
  // Handle form errors
  const handleFormError = useCallback((error: Error) => {
    console.error("Form error:", error);
    
    toast.error("An error occurred", {
      description: error.message
    });
  }, []);
  
  // Progress saving that uses the useFormPersistence hook's saveImmediately
  const saveProgress = useCallback(async (): Promise<boolean> => {
    try {
      await persistence.saveImmediately();
      return true;
    } catch (error) {
      console.error("Error saving progress:", error);
      return false;
    }
  }, [persistence]);
  
  // Actions object for exposing functionality
  const actions = useMemo(() => ({
    handleSubmit,
    handleFormError,
    resetDraftError,
    saveProgress,
    updateFormState,
    pauseAutoSave: persistence.pauseAutoSave,
    resumeAutoSave: persistence.resumeAutoSave
  }), [handleSubmit, handleFormError, resetDraftError, saveProgress, updateFormState, 
      persistence.pauseAutoSave, persistence.resumeAutoSave]);
  
  return {
    form,
    formState,
    isLoadingDraft,
    draftError,
    isSubmitting,
    persistence,
    actions
  };
};
