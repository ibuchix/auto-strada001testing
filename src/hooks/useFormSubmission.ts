
/**
 * Central Form Submission Hook
 * Created: 2025-05-19
 * Updated: 2025-05-19: Added proper throttling with cooldown state exposure
 * Updated: 2025-05-19: Fixed throttling implementation to avoid race conditions
 * Updated: 2025-05-20: Enhanced error handling and state management
 */

import { useState, useCallback, useRef, useEffect } from 'react';

type SubmissionState = {
  isSubmitting: boolean;
  submitError: string | null;
  cooldownTimeRemaining: number;
  lastSubmissionTime: number | null;
};

export const useFormSubmission = (formId: string, cooldownPeriodMs = 5000) => {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    submitError: null,
    cooldownTimeRemaining: 0,
    lastSubmissionTime: null
  });
  
  // Track the cooldown timer using a ref
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);
  
  // Update cooldown timer
  useEffect(() => {
    const updateCooldown = () => {
      const { lastSubmissionTime } = submissionState;
      
      if (!lastSubmissionTime) return;
      
      const now = Date.now();
      const elapsedTime = now - lastSubmissionTime;
      const remainingTime = Math.max(0, Math.ceil((cooldownPeriodMs - elapsedTime) / 1000));
      
      if (remainingTime > 0) {
        setSubmissionState(prev => ({
          ...prev,
          cooldownTimeRemaining: remainingTime
        }));
      } else {
        // Clear cooldown when done
        setSubmissionState(prev => ({
          ...prev,
          cooldownTimeRemaining: 0
        }));
        
        // Clear the interval when cooldown is complete
        if (cooldownTimerRef.current) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
      }
    };
    
    // Set up the cooldown timer
    if (submissionState.lastSubmissionTime && !cooldownTimerRef.current) {
      updateCooldown();
      cooldownTimerRef.current = setInterval(updateCooldown, 1000);
    }
  }, [submissionState.lastSubmissionTime, cooldownPeriodMs]);
  
  const startSubmission = useCallback(() => {
    const now = Date.now();
    const { lastSubmissionTime } = submissionState;
    
    // Check if we're in the cooldown period
    if (lastSubmissionTime && now - lastSubmissionTime < cooldownPeriodMs) {
      console.log(`[useFormSubmission][${formId}] Throttled: Attempted submission too soon`);
      return false;
    }
    
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting: true,
      submitError: null,
      lastSubmissionTime: now
    }));
    
    return true;
  }, [submissionState, cooldownPeriodMs, formId]);
  
  const completeSubmission = useCallback((success: boolean, error?: string) => {
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting: false,
      submitError: success ? null : (error || 'Unknown error')
    }));
  }, []);
  
  const resetSubmitError = useCallback(() => {
    setSubmissionState(prev => ({ ...prev, submitError: null }));
  }, []);
  
  // Generic submit function that handles throttling and state
  const submitForm = useCallback(async <T,>(
    formData: T, 
    submitFn: (data: T) => Promise<any>
  ): Promise<any> => {
    // Don't proceed if we can't start (e.g., throttled)
    if (!startSubmission()) {
      return null;
    }
    
    try {
      console.log(`[useFormSubmission][${formId}] Starting submission`);
      const result = await submitFn(formData);
      
      completeSubmission(true);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown submission error';
      console.error(`[useFormSubmission][${formId}] Submission error:`, error);
      
      completeSubmission(false, errorMessage);
      return null;
    }
  }, [startSubmission, completeSubmission, formId]);
  
  return {
    submissionState,
    submitForm,
    startSubmission,
    completeSubmission,
    resetSubmitError,
    isSubmitting: submissionState.isSubmitting,
    submitError: submissionState.submitError,
    cooldownTimeRemaining: submissionState.cooldownTimeRemaining
  };
};
