
/**
 * Enhanced Form Submission Logic - Refactored
 * 
 * Changes:
 * - 2025-05-24: Refactored into smaller, more maintainable modules
 * - 2025-05-24: Improved type safety throughout the submission process
 * - 2025-05-24: Fixed null checks and type annotations
 * - 2025-05-19: Fixed arithmetic comparison issues and type casting
 * - 2025-05-19: Fixed void return type issues with lastSubmission time
 */

import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CarListingFormData } from '@/types/forms';
import { useFormState } from '../context/FormStateContext';
import { useSubmissionState } from './submission/useSubmissionState';
import { useSubmissionLogger } from './submission/useSubmissionLogger';
import { useDataProcessing } from './submission/useDataProcessing';
import { useFormSubmitter } from './submission/useFormSubmitter';
import { useImageAssociation } from './submission/useImageAssociation';

export const useFormSubmission = (formId: string) => {
  const { updateFormState } = useFormState();
  const { 
    state: { isSubmitting, submitError, lastSubmissionTime },
    setSubmitting,
    setSubmitError,
    incrementAttempt,
    updateLastSubmissionTime,
    startSubmission,
    resetSubmitError
  } = useSubmissionState(formId);
  
  const { logSubmissionEvent } = useSubmissionLogger();
  const { validateFormData, prepareFormData } = useDataProcessing();
  const { submitToDatabase } = useFormSubmitter();
  const { associateImages } = useImageAssociation();
  
  // Handle form submission
  const submitForm = useCallback(async (formData: CarListingFormData): Promise<string | null> => {
    // Prevent rapid multiple submissions
    const now = Date.now();
    const lastSubmission = updateLastSubmissionTime(); // This now returns the timestamp
    
    if (now - lastSubmission < 2000) {
      logSubmissionEvent('Submission throttled - too frequent', { 
        timeSinceLastAttempt: now - lastSubmission
      });
      return null;
    }
    
    incrementAttempt();
    
    // Generate unique submission ID for tracing
    const submissionId = startSubmission();
    
    logSubmissionEvent('Submission started', { 
      submissionId, 
      formId
    });
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      // Validate form data
      const validationError = validateFormData(formData);
      if (validationError) {
        logSubmissionEvent('Validation failed', { submissionId, error: validationError });
        setSubmitError(validationError);
        return null;
      }
      
      // Prepare data for submission
      logSubmissionEvent('Preparing submission data', { submissionId });
      const submissionData = prepareFormData(formData);
      
      // Log the actual data being submitted (excluding sensitive fields)
      logSubmissionEvent('Submission data prepared', { 
        submissionId,
        dataSnapshot: {
          vin: submissionData.vin,
          make: submissionData.make,
          model: submissionData.model,
          year: submissionData.year,
          mileage: submissionData.mileage,
        }
      });
      
      // Submit to database
      logSubmissionEvent('Sending to database', { submissionId });
      const { data, error } = await submitToDatabase(submissionData);
      
      if (error) {
        logSubmissionEvent('Database error', { submissionId, error: error.message });
        setSubmitError(error.message);
        return null;
      }
      
      // Update form state to reflect successful submission
      updateFormState({
        isSubmitted: true,
        lastSubmitted: new Date().toISOString()
      });
      
      // Now that we have a car ID, associate any temporary uploads with it
      // Extract the car ID from the response or submission data
      const carId = data && data.length > 0 ? data[0]?.id : submissionData?.id;
      
      if (carId) {
        await associateImages(carId, submissionId);
      } else {
        // Log the missing car ID issue
        logSubmissionEvent('No car ID available for association', { 
          submissionId,
          dataReceived: !!data,
          submissionDataHasId: !!submissionData?.id
        });
      }
      
      logSubmissionEvent('Submission successful', { submissionId });
      toast({
        description: "Your car listing has been submitted successfully."
      });
      
      // Return car ID for proper type compatibility
      return carId || null;
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
        description: errorMessage
      });
      
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [
    formId, 
    updateFormState, 
    setSubmitting, 
    setSubmitError, 
    incrementAttempt, 
    updateLastSubmissionTime, 
    startSubmission, 
    logSubmissionEvent,
    validateFormData, 
    prepareFormData, 
    submitToDatabase,
    associateImages
  ]);
  
  return {
    submitForm,
    isSubmitting,
    submitError,
    resetSubmitError
  };
};
