
/**
 * Form Controller Hook
 * - Created 2025-04-09: Extracted from FormContent.tsx to centralize form state management
 * - Handles initialization, state transitions, and submission logic
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useCarListingForm } from "./useCarListingForm";
import { useFormPersistence } from "./useFormPersistence";
import { useFormSubmission } from "../submission/useFormSubmission";
import { useFormContentInit } from "./useFormContentInit";
import { useFormState } from "./useFormState";
import { useFormStateTransitions } from "./useFormStateTransitions";
import { toast } from "sonner";

interface UseFormControllerProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
}

export const useFormController = ({
  session,
  draftId,
  onDraftError,
  retryCount = 0
}: UseFormControllerProps) => {
  const navigate = useNavigate();
  
  // Form initialization - must happen first
  const form = useCarListingForm(session.user.id, draftId);
  
  // Form state management
  const { formState, updateFormState } = useFormState();
  
  // Form state transitions management
  const { 
    batchFormStateUpdate,
    transitionToReady,
    transitionToDraftLoaded,
    transitionToErrorState
  } = useFormStateTransitions({ updateFormState });
  
  // Use refs for values that shouldn't trigger effect reruns
  const carIdRef = useRef<string | undefined>(formState.carId);
  const lastSavedRef = useRef<Date | null>(formState.lastSaved);
  
  // Form initialization and draft loading
  const { 
    isLoadingDraft, 
    draftError, 
    carId, 
    lastSaved, 
    resetDraftError, 
    handleFormError 
  } = useFormContentInit({
    session,
    form,
    draftId,
    onDraftError,
    retryCount
  });

  // Update carId and lastSaved from draft loading - use refs to prevent render-time updates
  useEffect(() => {
    if (carId && carId !== carIdRef.current) {
      carIdRef.current = carId;
      batchFormStateUpdate({ carId });
    }
    
    if (lastSaved && (!lastSavedRef.current || lastSaved.getTime() !== lastSavedRef.current.getTime())) {
      lastSavedRef.current = lastSaved;
      batchFormStateUpdate({ lastSaved });
    }
  }, [carId, lastSaved, batchFormStateUpdate]);

  // Force form out of initializing state after a timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formState.isInitializing) {
        console.warn('Form still initializing after timeout, forcing ready state');
        transitionToReady();
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [formState.isInitializing, transitionToReady]);

  // Form submission - must happen after form is initialized
  const { handleSubmit: handleFormSubmit, isSubmitting } = useFormSubmission(session.user.id);
  
  // Create a persistence object with the form
  const persistence = useFormPersistence({
    form,
    userId: session.user.id,
    carId: formState.carId,
    currentStep: formState.currentStep
  });

  // Create a memoized save wrapper function with stable identity
  const saveProgress = useCallback(async () => {
    try {
      await persistence.saveImmediately();
      return true;
    } catch (error) {
      console.error('Error in save wrapper:', error);
      return false;
    }
  }, [persistence]);

  // Submit handler with stable identity
  const handleSubmit = useCallback(async (data: any) => {
    try {
      // First save the form data
      await persistence.saveImmediately();
      
      // Then submit it
      const result = await handleFormSubmit(data, formState.carId);
      
      // Handle successful submission
      if (result.success) {
        toast.success("Listing submitted successfully!");
        return result;
      } else {
        toast.error("Failed to submit listing");
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred during submission");
      return { success: false, error };
    }
  }, [handleFormSubmit, formState.carId, persistence]);

  return {
    form,
    formState,
    isLoadingDraft,
    draftError,
    isSubmitting,
    persistence: {
      isSaving: persistence.isSaving,
      isOffline: persistence.isOffline,
      saveImmediately: persistence.saveImmediately,
      setIsOffline: persistence.setIsOffline
    },
    actions: {
      handleSubmit,
      saveProgress,
      resetDraftError,
      handleFormError,
      updateFormState,
      batchFormStateUpdate,
      transitionToReady
    }
  };
};
