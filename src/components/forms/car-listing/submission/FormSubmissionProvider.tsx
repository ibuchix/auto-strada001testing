
/**
 * Form Submission Provider
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed naming conflict, file name typo, and added isSuccessful flag
 * Updated: 2025-05-26 - Fixed context implementation to use car-listing specific FormStateContext
 * Updated: 2025-05-19 - Fixed throttling issues and enhanced error feedback
 * Updated: 2025-05-20 - Enhanced with cooldown tracking and consolidated throttling logic
 * Updated: 2025-05-31 - Fixed submitForm implementation to provide required submission function 
 * Updated: 2025-06-02 - Added better error handling and improved submission flow
 * Updated: 2025-06-03 - Enhanced throttling logic and improved responsiveness
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { CarListingFormData } from '@/types/forms';
import { useFormSubmission as useFormSubmissionHook } from '@/hooks/useFormSubmission';
import { submitCarListing } from './services/submissionService';
import { toast } from 'sonner';

interface FormSubmissionContextType {
  submissionState: {
    isSubmitting: boolean;
    submitError: string | null;
    isSuccessful?: boolean;
    cooldownTimeRemaining?: number;
  };
  submitForm: (data: CarListingFormData) => Promise<string | null>;
  resetSubmissionState: () => void;
}

export const FormSubmissionContext = createContext<FormSubmissionContextType | undefined>(undefined);

export const useFormSubmission = () => {
  const context = useContext(FormSubmissionContext);
  if (!context) {
    throw new Error('useFormSubmission must be used within a FormSubmissionProvider');
  }
  return context;
};

interface FormSubmissionProviderProps {
  children: ReactNode;
  formId?: string;
  userId: string;
}

export const FormSubmissionProvider = ({ 
  children, 
  formId = 'default',
  userId
}: FormSubmissionProviderProps) => {
  const { 
    submitForm: baseSubmitForm, 
    isSubmitting, 
    submitError, 
    resetSubmitError,
    cooldownTimeRemaining
  } = useFormSubmissionHook(formId);

  const [isSuccessful, setIsSuccessful] = useState(false);
  
  // Submit form with consistent return type
  const submitForm = async (data: CarListingFormData): Promise<string | null> => {
    setIsSuccessful(false);
    
    // Early validation for duplicate submissions during cooldown
    if (typeof cooldownTimeRemaining === 'number' && cooldownTimeRemaining > 0) {
      console.log(`[FormSubmissionProvider] Submission throttled: Cooldown ${cooldownTimeRemaining}s remaining`);
      toast.warning(`Submission throttled`, {
        description: `Please wait ${cooldownTimeRemaining} seconds before trying again.`
      });
      return null;
    }
    
    try {
      console.log('[FormSubmissionProvider] Starting form submission process');
      
      // Provide the second argument - a submission function that handles the actual submission
      const result = await baseSubmitForm(data, async (formData: CarListingFormData) => {
        // This is the actual submission function that will be called by baseSubmitForm
        console.log('[FormSubmissionProvider] Submitting car listing data');
        const response = await submitCarListing(formData, userId);
        
        if (!response?.id) {
          console.error('[FormSubmissionProvider] No ID returned from submission service');
          throw new Error('Failed to create listing: No ID returned from server');
        }
        
        return response.id;
      });
      
      // Set success state based on result
      if (result) {
        console.log(`[FormSubmissionProvider] Submission successful with ID: ${result}`);
        setIsSuccessful(true);
        
        // Notify user of successful submission
        toast.success('Listing submitted successfully', {
          description: 'Your car listing has been created.'
        });
      } else {
        console.warn('[FormSubmissionProvider] Submission completed but no ID returned');
        
        // Only show error if there's an actual error message
        if (submitError) {
          toast.error('Submission failed', {
            description: submitError
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('[FormSubmissionProvider] Submission error:', error);
      
      toast.error('Error submitting listing', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      return null;
    }
  };
  
  // Reset submission state
  const resetSubmissionState = () => {
    resetSubmitError();
    setIsSuccessful(false);
  };
  
  const value = {
    submissionState: {
      isSubmitting,
      submitError,
      isSuccessful,
      cooldownTimeRemaining
    },
    submitForm,
    resetSubmissionState
  };
  
  return (
    <FormSubmissionContext.Provider value={value}>
      {children}
    </FormSubmissionContext.Provider>
  );
};

// Export an alias for backward compatibility
export const useFormSubmissionContext = useFormSubmission;
