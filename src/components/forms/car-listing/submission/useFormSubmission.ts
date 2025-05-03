/**
 * Form Submission Logic
 * Created: 2025-07-12
 */

import { useState, useCallback, useContext } from 'react';
import { toast } from 'sonner';
import { useFormContext } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { prepareSubmission } from './utils/submission';
import { supabase } from '@/integrations/supabase/client';
import { FormSubmissionContext } from './FormSubmissionProvider';
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';
import { handleFormValidationError } from './utils/validationHandler';
import { errorFactory } from '@/errors/factory';
import { TransactionStatus } from '../types';
import { ValidationSubmissionError } from './errors';

export const useFormSubmission = (userId: string) => {
  const { formState, form, trigger } = useFormContext<CarListingFormData>();
  const { setTransactionStatus, updateTransactionStatus, setCarId } = useContext(FormSubmissionContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);
  
  const handleSubmit = useCallback(async (data: CarListingFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setTransactionStatus(TransactionStatus.PENDING);
    
    try {
      // Trigger validation before submission
      const isValid = await trigger();
      
      if (!isValid) {
        const error = new ValidationSubmissionError("Form validation failed");
        updateTransactionStatus(TransactionStatus.ERROR, error);
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
        updateTransactionStatus(TransactionStatus.ERROR, dbError);
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
      
      // Update the transaction status to success
      updateTransactionStatus(TransactionStatus.SUCCESS, null);
      
      // Set the car ID
      if (carData?.id) {
        setCarId(carData.id);
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
      
      updateTransactionStatus(TransactionStatus.ERROR, error);
      setSubmissionError(error);
      
      // Show an error toast
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, formState, form, trigger, setTransactionStatus, updateTransactionStatus, setCarId]);
  
  return {
    isSubmitting,
    submissionError,
    handleSubmit,
  };
};
