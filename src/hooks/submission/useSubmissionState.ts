
/**
 * Submission State Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Made updateLastSubmissionTime return the timestamp
 * Updated: 2025-05-19 - Fixed throttling issue by keeping lastSubmissionTime in state
 * Updated: 2025-05-20 - Enhanced with cooldown tracking and comprehensive submission state
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
  cooldownTimeRemaining: number;
}

export const useSubmissionState = (formId: string) => {
  const [state, setState] = useState<SubmissionState>({
    isSubmitting: false,
    submitError: null,
    submissionId: null,
    lastSubmissionTime: 0,
    attempts: 0,
    cooldownTimeRemaining: 0
  });
  const submissionAttempts = useRef(0);
  const lastSubmissionTimeRef = useRef(0);
  const cooldownTimerId = useRef<NodeJS.Timeout | null>(null);
  
  // Reset submission state when form ID changes
  useEffect(() => {
    setState({
      isSubmitting: false,
      submitError: null,
      submissionId: null,
      lastSubmissionTime: 0,
      attempts: 0,
      cooldownTimeRemaining: 0
    });
    submissionAttempts.current = 0;
    lastSubmissionTimeRef.current = 0;
    
    // Clear any existing cooldown timer
    if (cooldownTimerId.current) {
      clearInterval(cooldownTimerId.current);
      cooldownTimerId.current = null;
    }
    
    console.log('[SubmissionState] Reset state for form ID:', formId);
  }, [formId]);
  
  // Handle cooldown countdown
  useEffect(() => {
    // Clean up function to be called on unmount
    return () => {
      if (cooldownTimerId.current) {
        clearInterval(cooldownTimerId.current);
      }
    };
  }, []);
  
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
  
  // Check if submission is allowed based on cooldown
  const canSubmit = (): boolean => {
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTimeRef.current;
    const requiredCooldown = 2000; // 2 seconds cooldown
    
    // If there's no cooldown active, we can submit
    if (timeSinceLastSubmission >= requiredCooldown) {
      return true;
    }
    
    // Calculate remaining cooldown time in seconds
    const remainingMs = requiredCooldown - timeSinceLastSubmission;
    const remainingSecs = Math.ceil(remainingMs / 1000);
    
    // Start cooldown countdown if not already started
    if (!cooldownTimerId.current) {
      startCooldownTimer(remainingSecs);
    }
    
    return false;
  };
  
  // Start a countdown for cooldown period
  const startCooldownTimer = (seconds: number) => {
    // Clear any existing timer
    if (cooldownTimerId.current) {
      clearInterval(cooldownTimerId.current);
    }
    
    // Set initial cooldown time
    setState(prev => ({ ...prev, cooldownTimeRemaining: seconds }));
    
    // Start countdown
    cooldownTimerId.current = setInterval(() => {
      setState(prev => {
        const newRemaining = prev.cooldownTimeRemaining - 1;
        
        if (newRemaining <= 0) {
          // Clear timer when countdown reaches zero
          if (cooldownTimerId.current) {
            clearInterval(cooldownTimerId.current);
            cooldownTimerId.current = null;
          }
          return { ...prev, cooldownTimeRemaining: 0 };
        }
        
        return { ...prev, cooldownTimeRemaining: newRemaining };
      });
    }, 1000);
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
    resetSubmitError,
    canSubmit
  };
};
