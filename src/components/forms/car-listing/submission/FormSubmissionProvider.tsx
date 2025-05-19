
/**
 * Form Submission Provider
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Fixed naming conflict, file name typo, and added isSuccessful flag
 * Updated: 2025-05-26 - Fixed context implementation to use car-listing specific FormStateContext
 * Updated: 2025-05-19 - Fixed throttling issues and enhanced error feedback
 * 
 * Provides consistent submission handling with proper type handling
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { CarListingFormData } from '@/types/forms';
import { useFormSubmission as useFormSubmissionHook } from '@/hooks/useFormSubmission';

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
    resetSubmitError 
  } = useFormSubmissionHook(formId);

  const [isSuccessful, setIsSuccessful] = useState(false);
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState<number>(0);
  
  // Submit form with consistent return type
  const submitForm = async (data: CarListingFormData): Promise<string | null> => {
    setIsSuccessful(false);
    
    // Reset cooldown counter when attempting a new submission
    setCooldownTimeRemaining(0);
    
    const result = await baseSubmitForm(data);
    
    // Set success state based on result
    if (result) {
      setIsSuccessful(true);
    } 
    // If no result but also no error, it might be throttled
    else if (!submitError) {
      // Start cooldown counter
      setCooldownTimeRemaining(2);
      const timer = setInterval(() => {
        setCooldownTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return result;
  };
  
  // Reset submission state
  const resetSubmissionState = () => {
    resetSubmitError();
    setIsSuccessful(false);
    setCooldownTimeRemaining(0);
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
