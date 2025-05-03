
/**
 * Form Submission Hook
 * Created: 2025-07-23
 * Handle form submission logic
 */

import { useState, useCallback } from "react";
import { FieldErrors } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { ValidationSubmissionError, NetworkSubmissionError, DatabaseSubmissionError } from "./errors";
import { prepareSubmission } from './utils/submission';
import { supabase } from '@/integrations/supabase/client';
import { useFormSubmission } from './FormSubmissionProvider';
import { tempFileStorage } from '@/services/temp-storage/tempFileStorageService';
import { handleFormValidationError } from './utils/validationHandler';

export const useFormSubmission = () => {
  const { 
    submissionState, 
    setSubmitting, 
    setSubmitSuccess, 
    setSubmitError,
    userId 
  } = useFormSubmission();
  
  // Submit form data to API
  const submitForm = useCallback(async (formData: CarListingFormData) => {
    try {
      setSubmitting(true);
      
      // Prepare submission data
      const submissionData = prepareSubmission(formData, userId);
      
      // Submit to Supabase
      const { data, error } = await supabase
        .from('cars')
        .upsert(submissionData, { onConflict: 'id' })
        .select('id')
        .single();
      
      if (error) {
        throw new DatabaseSubmissionError(error.message);
      }
      
      if (!data?.id) {
        throw new DatabaseSubmissionError('Failed to retrieve submitted car ID');
      }
      
      console.log("Form submitted successfully", data);
      
      // Clear temporary storage
      tempFileStorage.clearAll();
      
      // Set submission success
      setSubmitSuccess(data.id);
      return data.id;
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setSubmitError(error);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [userId, setSubmitting, setSubmitSuccess, setSubmitError]);
  
  // Handle validation errors
  const handleValidationErrors = useCallback((errors: FieldErrors<CarListingFormData>) => {
    return handleFormValidationError(errors);
  }, []);
  
  return {
    ...submissionState,
    submitForm,
    handleValidationErrors
  };
};
