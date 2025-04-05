
/**
 * Form Controller Hook
 * - Created 2025-04-09: Extracted from FormContent.tsx to centralize form state management
 * - Handles initialization, state transitions, and submission logic
 * - 2025-04-10: Fixed TypeScript errors with form submission handling
 * - 2025-04-11: Resolved type issues with handleSubmit return value
 * - 2025-04-12: Fixed initialization issues causing form to get stuck in loading state
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
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initStartTimeRef = useRef<number>(performance.now());
  
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
    // Clean up any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    
    if (formState.isInitializing) {
      console.log('Form is initializing, setting safety timeout...');
      
      // Set new timeout to force ready state after 3 seconds (reduced from 5)
      initTimeoutRef.current = setTimeout(() => {
        const initTime = performance.now() - initStartTimeRef.current;
        console.warn(`Form still initializing after ${Math.round(initTime)}ms, forcing ready state`);
        transitionToReady();
        
        // Log initialization metrics
        console.info('Form initialization metrics:', {
          totalTime: `${Math.round(initTime)}ms`,
          forcedReady: true,
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [formState.isInitializing, transitionToReady]);
  
  // Additional effect to monitor and guarantee exit from initializing state
  useEffect(() => {
    // If both loading draft and initializing are false, ensure we're in ready state
    if (!isLoadingDraft && !formState.isInitializing && formState.hasInitializedHooks) {
      // Nothing more to do, we're ready
      return;
    }
    
    // If loading draft is done but we're still initializing, trigger ready state
    if (!isLoadingDraft && formState.isInitializing && formState.hasInitializedHooks) {
      console.log('Draft loading completed but form still initializing, forcing ready state');
      transitionToReady();
    }
    
    // Additional failsafe - if we've been initializing too long
    const currentInitTime = performance.now() - initStartTimeRef.current;
    if (currentInitTime > 4000 && formState.isInitializing) {
      console.warn(`Form initialization taking too long (${Math.round(currentInitTime)}ms), applying emergency fix`);
      transitionToReady();
    }
  }, [isLoadingDraft, formState.isInitializing, formState.hasInitializedHooks, transitionToReady]);

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
      
      // Then submit it - we need to handle the submission result properly
      await handleFormSubmit(data, formState.carId);
      
      // If we reach here without errors, consider it a success
      toast.success("Listing submitted successfully!");
      return { success: true };
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
