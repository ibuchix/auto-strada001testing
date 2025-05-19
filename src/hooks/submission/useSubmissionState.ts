
/**
 * Submission State Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Made updateLastSubmissionTime return the timestamp
 * Updated: 2025-05-19 - Fixed throttling issue by keeping lastSubmissionTime in state
 * 
 * Manages submission state including loading status, errors, and reset functionality
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface SubmissionState {
  isSubmitting: boolean;
  submitError: string | null;
  submissionId: string | null;
  lastSubmissionTime: number;
  attempts: number;
}

export const useSubmissionState = (formId: string) => {
  const [state, setState] = useState<SubmissionState>({
    isSubmitting: false,
    submitError: null,
    submissionId: null,
    lastSubmissionTime: 0,
    attempts: 0
  });
  const submissionAttempts = useRef(0);
  const lastSubmissionTimeRef = useRef(0);
  
  // Reset submission state when form ID changes
  useEffect(() => {
    setState({
      isSubmitting: false,
      submitError: null,
      submissionId: null,
      lastSubmissionTime: 0,
      attempts: 0
    });
    submissionAttempts.current = 0;
    lastSubmissionTimeRef.current = 0;
    
    console.log('[SubmissionState] Reset state for form ID:', formId);
  }, [formId]);
  
  const setSubmitting = (isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  };
  
  const setSubmitError = (error: string | null) => {
    setState(prev => ({ ...prev, submitError: error }));
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: error
      });
    }
  };
  
  const incrementAttempt = () => {
    submissionAttempts.current += 1;
    setState(prev => ({ ...prev, attempts: submissionAttempts.current }));
    return submissionAttempts.current;
  };
  
  const updateLastSubmissionTime = () => {
    const now = Date.now();
    lastSubmissionTimeRef.current = now;
    setState(prev => ({ ...prev, lastSubmissionTime: now }));
    return now;
  };
  
  const startSubmission = () => {
    // Generate unique submission ID for tracing
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submitError: null,
      submissionId 
    }));
    return submissionId;
  };
  
  const resetSubmitError = () => {
    setState(prev => ({ ...prev, submitError: null }));
  };
  
  return {
    state,
    setSubmitting,
    setSubmitError,
    incrementAttempt,
    updateLastSubmissionTime,
    startSubmission,
    resetSubmitError
  };
};
