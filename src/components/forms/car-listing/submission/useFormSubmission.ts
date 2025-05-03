
/**
 * Form Submission Logic
 * Created: 2025-07-12
 * Updated: 2025-07-22: Fixed context usage and added missing properties
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useFormContext } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { prepareSubmission } from './utils/submission';
import { supabase } from '@/integrations/supabase/client';
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';
import { handleFormValidationError } from './utils/validationHandler';
import { errorFactory } from '@/errors/factory';
import { TransactionStatus } from '../types';
import { ValidationSubmissionError } from './errors';

export const useFormSubmission = (userId: string) => {
  const { formState, trigger } = useFormContext<CarListingFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);
  
  const handleSubmit = useCallback(async (data: CarListingFormData, carId?: string) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Trigger validation before submission
      const isValid = await trigger();
      
      if (!isValid) {
        const error = new ValidationSubmissionError("Form validation failed");
        setSubmissionError(error);
        return;
      }
      
      // Prepare the submission data
      const submissionData = prepareSubmission(data);
      
      // Perform the database transaction
      const { data: carData, error: dbError } = await supabase
        .from('cars')
        .upsert([submissionData], { onConflict: 'id' })
        .select()
        .single();
      
      if (dbError) {
        setSubmissionError(dbError);
        return;
      }
      
      // Move temporary files to permanent storage
      if (data.uploadedPhotos && carData?.id) {
        for (const fileId of data.uploadedPhotos) {
          const storedFile = tempFileStorageService.getFile(fileId);
          if (storedFile) {
            const newPath = `cars/${carData.id}/${storedFile.name}`;
            await tempFileStorageService.moveToPermStorage(fileId, newPath);
          }
        }
      }
      
      // Show a success toast
      toast.success("Car listing submitted successfully!");
    } catch (error: any) {
      // Handle any errors that occur during submission
      const formValidationError = errorFactory.createFormError(
        "Please fix form errors before submitting",
        {},
        { fields: Object.keys(formState.errors) } 
      );
      
      setSubmissionError(error);
      
      // Show an error toast
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, trigger]);
  
  return {
    isSubmitting,
    submissionError,
    handleSubmit,
  };
};
