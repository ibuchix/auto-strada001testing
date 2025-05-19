
/**
 * Enhanced Form Submission Logic
 * 
 * Changes:
 * - Fixed event handling in form submission flow
 * - Added explicit console logging at key points
 * - Improved error handling and reporting
 * - Fixed state management issues
 * - Fixed TypeScript error with Supabase upsert options
 * - 2025-05-20: Added image upload association with car ID
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { prepareSubmission } from '../utils/submission';
import { supabase } from '@/integrations/supabase/client';
import { useFormState } from '../context/FormStateContext';
import { CarListingFormData } from '@/types/forms';
import { associateTempUploadsWithCar } from '@/services/supabase/uploadService';

// Diagnostic logging utility
const logSubmissionEvent = (event: string, data = {}) => {
  console.log(`[FormSubmission][${new Date().toISOString()}] ${event}`, {
    ...data,
    timestamp: performance.now()
  });
};

export const useFormSubmission = (formId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { updateFormState } = useFormState();
  const submissionAttempts = useRef(0);
  const lastSubmissionTime = useRef(0);
  
  // Reset submission state when form ID changes
  useEffect(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    submissionAttempts.current = 0;
    lastSubmissionTime.current = 0;
    
    logSubmissionEvent('Form ID changed, reset submission state', { formId });
  }, [formId]);
  
  // Handle form submission
  const submitForm = useCallback(async (formData: CarListingFormData) => {
    // Prevent rapid multiple submissions
    const now = Date.now();
    if (now - lastSubmissionTime.current < 2000) {
      logSubmissionEvent('Submission throttled - too frequent', { 
        timeSinceLastSubmission: now - lastSubmissionTime.current 
      });
      return { success: false, error: 'Please wait before submitting again' };
    }
    
    lastSubmissionTime.current = now;
    submissionAttempts.current += 1;
    
    // Generate unique submission ID for tracing
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    logSubmissionEvent('Submission started', { 
      submissionId, 
      formId, 
      attempt: submissionAttempts.current 
    });
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Validate form data before submission
      if (!formData.vin || !formData.make || !formData.model) {
        const error = 'Missing required vehicle information';
        logSubmissionEvent('Validation failed', { submissionId, error });
        setSubmitError(error);
        toast({
          variant: "destructive",
          title: "Submission Error",
          description: error
        });
        return { success: false, error };
      }
      
      // Prepare data for submission
      logSubmissionEvent('Preparing submission data', { submissionId });
      const submissionData = prepareSubmission(formData);
      
      // Log the actual data being submitted (excluding sensitive fields)
      logSubmissionEvent('Submission data prepared', { 
        submissionId,
        dataSnapshot: {
          vin: submissionData.vin,
          make: submissionData.make,
          model: submissionData.model,
          year: submissionData.year,
          mileage: submissionData.mileage,
          // Exclude potentially sensitive fields
        }
      });
      
      // Submit to database - Fixed TypeScript error by removing returning option 
      // which is not supported in this Supabase client version
      logSubmissionEvent('Sending to database', { submissionId });
      const { data, error } = await supabase
        .from('cars')
        .upsert(submissionData, { 
          onConflict: 'id'
        });
      
      if (error) {
        logSubmissionEvent('Database error', { submissionId, error: error.message });
        setSubmitError(error.message);
        toast({
          variant: "destructive",
          title: "Submission Error",
          description: error.message
        });
        return { success: false, error: error.message };
      }
      
      // Update form state to reflect successful submission
      updateFormState({
        isSubmitted: true,
        lastSubmitted: new Date().toISOString()
      });
      
      // Now that we have a car ID, associate any temporary uploads with it
      if (submissionData?.id) {
        logSubmissionEvent('Associating temporary uploads with car ID', { 
          submissionId, 
          carId: submissionData.id 
        });
        
        try {
          const associatedCount = await associateTempUploadsWithCar(submissionData.id);
          if (associatedCount > 0) {
            logSubmissionEvent('Successfully associated temp uploads', { 
              submissionId, 
              count: associatedCount 
            });
          }
        } catch (associationError) {
          // Non-fatal error - log but continue
          console.error('Error associating uploads:', associationError);
          logSubmissionEvent('Error associating uploads', { 
            submissionId, 
            error: associationError instanceof Error ? associationError.message : String(associationError)
          });
        }
      }
      
      logSubmissionEvent('Submission successful', { submissionId });
      toast({
        title: "Success!",
        description: "Your car listing has been submitted successfully."
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown submission error';
      
      logSubmissionEvent('Submission exception', { 
        submissionId, 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setSubmitError(errorMessage);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: errorMessage
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [formId, updateFormState]);
  
  return {
    submitForm,
    isSubmitting,
    submitError,
    resetSubmitError: () => setSubmitError(null)
  };
};
